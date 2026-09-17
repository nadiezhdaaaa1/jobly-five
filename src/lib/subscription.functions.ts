import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  SKUS,
  TRIAL_DAYS,
  TRIAL_SKU,
  creditDays,
  isDowngrade,
  isPrepaid,
  isSkuId,
  periodDays,
  skuTotal,
  type SkuId,
} from "@/config/pricing";

/**
 * Placeholder billing writes. No provider is wired yet, so the app owns the
 * `subscriptions` row directly. When Stripe lands, the webhook writes the same
 * columns and these actions shrink to checkout/portal redirects.
 *
 * This is the ONLY write path to `subscriptions`. Client roles have no write
 * grant on the table; the service-role client is loaded inside the handler and
 * scoped to `context.userId`.
 */
export type SubscriptionAction =
  | "start_trial"
  | "activate"
  | "schedule_plan_change"
  | "clear_pending_plan_change"
  | "pause"
  | "unpause"
  | "cancel_at_period_end"
  | "resume"
  | "cancel_now"
  | "set_ever_subscribed";

export type SubscriptionRow = {
  status: string;
  /** The purchased SKU. NULL on rows written before SKUs existed. */
  sku: SkuId | null;
  /** What the account actually paid. Renewal charges this, not the list price. */
  purchasePrice: number | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  pauseEndsAt: string | null;
  /** Days frozen by pausing a prepaid plan, spent before the next charge. */
  bankedDays: number;
  bankedDaysExpireAt: string | null;
  /** A downgrade scheduled for the end of the period already paid for (§5). */
  pendingSku: SkuId | null;
  pendingSkuEffectiveAt: string | null;
  everSubscribed: boolean;
  /** "provider" once a real billing provider owns the row; "manual_preview" today. */
  activationSource: string;
};

const DAY = 86_400_000;
/** How long banked days survive before they expire. */
export const BANKED_DAYS_TTL_DAYS = 365;
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();
const COLS =
  "status, sku, purchase_price, cancel_at_period_end, current_period_end, trial_ends_at, pause_ends_at, banked_days, banked_days_expire_at, pending_sku, pending_sku_effective_at, ever_subscribed, activation_source";


function shape(row: Record<string, unknown> | null): SubscriptionRow {
  const sku = row?.["sku"];
  const price = row?.["purchase_price"];
  return {
    status: (row?.["status"] as string) ?? "none",
    sku: isSkuId(sku) ? sku : null,
    purchasePrice: price === null || price === undefined ? null : Number(price),
    cancelAtPeriodEnd: Boolean(row?.["cancel_at_period_end"]),
    currentPeriodEnd: (row?.["current_period_end"] as string | null) ?? null,
    trialEndsAt: (row?.["trial_ends_at"] as string | null) ?? null,
    pauseEndsAt: (row?.["pause_ends_at"] as string | null) ?? null,
    bankedDays: Number(row?.["banked_days"] ?? 0) || 0,
    bankedDaysExpireAt: (row?.["banked_days_expire_at"] as string | null) ?? null,
    everSubscribed: Boolean(row?.["ever_subscribed"]),
    activationSource: (row?.["activation_source"] as string | null) ?? "none",
  };
}

/** Whole days left on a period, floored at zero. */
function daysLeft(periodEnd: string | null): number {
  if (!periodEnd) return 0;
  const ms = new Date(periodEnd).getTime() - Date.now();
  return ms > 0 ? Math.floor(ms / DAY) : 0;
}

/** Banked days are only spendable while unexpired. */
function spendableBankedDays(row: SubscriptionRow): number {
  if (row.bankedDays <= 0) return 0;
  if (row.bankedDaysExpireAt && new Date(row.bankedDaysExpireAt).getTime() <= Date.now()) return 0;
  return row.bankedDays;
}

/** Read the caller's own subscription row (details `get_entitlements` omits). */
export const getSubscriptionRow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionRow> => {
    const { data } = await context.supabase
      .from("subscriptions")
      .select(COLS)
      .eq("user_id", context.userId)
      .maybeSingle();
    return shape(data as Record<string, unknown> | null);
  });

export const applySubscriptionAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      action: SubscriptionAction;
      sku?: SkuId;
      everSubscribed?: boolean;
      /** Only Settings -> Plan sets this: an explicit SKU change on a live subscription. */
      allowSkuChange?: boolean;
    }) => {
      const allowed: SubscriptionAction[] = [
        "start_trial",
        "activate",
        "pause",
        "unpause",
        "cancel_at_period_end",
        "resume",
        "cancel_now",
        "set_ever_subscribed",
      ];
      if (!allowed.includes(input.action)) throw new Error("Unknown subscription action");
      if (input.sku !== undefined && !isSkuId(input.sku)) throw new Error("Unknown plan");
      return input;
    },
  )
  .handler(async ({ data, context }): Promise<SubscriptionRow> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select(COLS)
      .eq("user_id", context.userId)
      .maybeSingle();
    const current = shape(existing as Record<string, unknown> | null);
    const keepEnd =
      current.currentPeriodEnd && new Date(current.currentPeriodEnd).getTime() > Date.now()
        ? current.currentPeriodEnd
        : null;

    let patch: Record<string, unknown>;
    switch (data.action) {
      case "start_trial": {
        // pro_monthly is the only SKU with a trial. Every other one is refused.
        if (data.sku !== undefined && data.sku !== TRIAL_SKU) {
          throw new Error("That plan has no free trial");
        }
        // One trial per account, and re-clicking can never extend a live one.
        if (current.status === "trialing" || current.everSubscribed) return current;
        const trialEnd = isoIn(TRIAL_DAYS * DAY);
        patch = {
          status: "trialing",
          plan: "pro",
          sku: TRIAL_SKU,
          // The price the trial converts at, locked in now.
          purchase_price: skuTotal(TRIAL_SKU),
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: null,
          pause_ends_at: null,
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEnd,
          current_period_end: trialEnd,
          ever_subscribed: true,
          activation_source: "manual_preview",
        };
        break;
      }
      case "activate": {
        const sku: SkuId = data.sku ?? TRIAL_SKU;
        const span = periodDays(sku) * DAY;
        // A live subscription is never silently re-activated, and a stale saved
        // intent can never switch its SKU. Only an explicit request from the
        // account's own plan settings may change a live one.
        const live =
          current.status === "active" ||
          current.status === "trialing" ||
          current.status === "past_due";
        if (live && (!data.allowSkuChange || current.sku === sku)) return current;
        // Keep the paid period when the SKU is unchanged. Rows written before
        // `sku` existed carry NULL and count as matching, so re-activating them
        // must not reset the period they already paid for.
        const keepSame = current.sku === null || current.sku === sku ? keepEnd : null;
        // Banked days are spent before the next charge.
        const banked = current.sku === sku || current.sku === null ? spendableBankedDays(current) : 0;
        const base = keepSame ?? isoIn(span);
        const end = banked > 0 ? new Date(new Date(base).getTime() + banked * DAY).toISOString() : base;
        patch = {
          status: "active",
          plan: SKUS[sku].tier,
          sku,
          // Renewal charges what was paid, never the current list price. A row
          // that already holds a price for this SKU keeps it: no step-up.
          purchase_price:
            current.sku === sku && current.purchasePrice !== null
              ? current.purchasePrice
              : skuTotal(sku),
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: null,
          pause_ends_at: null,
          current_period_end: end,
          banked_days: banked > 0 ? 0 : current.bankedDays,
          banked_days_expire_at: banked > 0 ? null : current.bankedDaysExpireAt,
          ever_subscribed: true,
          activation_source: "manual_preview",
        };
        break;
      }
      case "pause": {
        // Already paused: no-op, so re-clicking can never extend a pause or
        // credit the same days twice.
        if (current.status === "paused") return current;
        // Watch has no pause at all.
        if (current.sku === "watch_monthly" || current.sku === "watch_annual") {
          throw new Error("Watch plans cannot be paused");
        }
        // Prepaid plans freeze their remaining days onto the account. pro_monthly
        // may pause but banks nothing — it simply stops at period end.
        const bankable = current.sku && isPrepaid(current.sku) ? daysLeft(current.currentPeriodEnd) : 0;
        const carried = spendableBankedDays(current);
        patch = {
          status: "paused",
          plan: current.sku ? SKUS[current.sku].tier : "pro",
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: new Date().toISOString(),
          pause_ends_at: null,
          // A pause suspends access and stops billing: the paid period ends now.
          current_period_end: new Date().toISOString(),
          banked_days: carried + bankable,
          banked_days_expire_at:
            carried + bankable > 0 ? isoIn(BANKED_DAYS_TTL_DAYS * DAY) : null,
          ever_subscribed: true,
          activation_source:
            current.activationSource === "none" ? "manual_preview" : current.activationSource,
        };
        break;
      }
      case "unpause": {
        // Resuming spends the banked days before the next charge.
        const sku = current.sku ?? TRIAL_SKU;
        const banked = spendableBankedDays(current);
        const span = banked > 0 ? banked * DAY : periodDays(sku) * DAY;
        patch = {
          status: "active",
          plan: SKUS[sku].tier,
          sku,
          purchase_price: current.purchasePrice ?? skuTotal(sku),
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: null,
          pause_ends_at: null,
          current_period_end: isoIn(span),
          banked_days: 0,
          banked_days_expire_at: null,
          ever_subscribed: true,
          activation_source:
            current.activationSource === "none" ? "manual_preview" : current.activationSource,
        };
        break;
      }
      case "resume":
        // Undo a scheduled cancellation: no new charge, no new period.
        patch = {
          status: "active",
          plan: current.sku ? SKUS[current.sku].tier : "pro",
          cancel_at_period_end: false,
          canceled_at: null,
          current_period_end: keepEnd ?? isoIn(periodDays(current.sku ?? TRIAL_SKU) * DAY),
          ever_subscribed: true,
          activation_source:
            current.activationSource === "none" ? "manual_preview" : current.activationSource,
        };
        break;
      case "cancel_at_period_end":
        patch = {
          status: "active",
          plan: current.sku ? SKUS[current.sku].tier : "pro",
          cancel_at_period_end: true,
          current_period_end: keepEnd ?? isoIn(periodDays(current.sku ?? TRIAL_SKU) * DAY),
          ever_subscribed: true,
        };
        break;
      case "cancel_now":
        patch = {
          status: "canceled",
          plan: "free",
          cancel_at_period_end: false,
          canceled_at: new Date().toISOString(),
          paused_at: null,
          pause_ends_at: null,
          current_period_end: new Date().toISOString(),
        };
        break;
      case "set_ever_subscribed":
        patch = { ever_subscribed: Boolean(data.everSubscribed) };
        break;
    }

    const { data: saved, error } = await supabaseAdmin
      .from("subscriptions")
      .upsert({ user_id: context.userId, ...patch }, { onConflict: "user_id" })
      .select(COLS)
      .maybeSingle();
    if (error) throw error;
    return shape(saved as Record<string, unknown> | null);
  });

/** Persist why a user canceled, on the account rather than the browser. */
export const saveCancelFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reason: string; details?: string }) => input)
  .handler(async ({ data, context }) => {
    const reason = data.reason.trim().slice(0, 200);
    if (!reason) return { ok: false };
    const { error } = await context.supabase.from("cancel_feedback").insert({
      user_id: context.userId,
      reason,
      details: data.details?.trim() ? data.details.trim().slice(0, 2000) : null,
    });
    if (error) throw error;
    return { ok: true };
  });
