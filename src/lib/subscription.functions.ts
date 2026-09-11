import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TRIAL_DAYS } from "@/config/pricing";

/**
 * Placeholder billing writes. No provider is wired yet, so the app owns the
 * `subscriptions` row directly. When Stripe lands, the webhook writes the same
 * columns and these actions shrink to checkout/portal redirects.
 *
 * Client roles have no write grant on `subscriptions`; the service-role client
 * is loaded inside the handler and scoped to `context.userId`.
 */
export type SubscriptionAction =
  | "start_trial"
  | "activate"
  | "pause"
  | "unpause"
  | "cancel_at_period_end"
  | "resume"
  | "cancel_now"
  | "set_ever_subscribed";

/** Billed period. Access still comes from `plan`; this never gates a feature. */
export type BillingCycle = "monthly" | "annual";

export type SubscriptionRow = {
  status: string;
  cycle: BillingCycle | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  pauseEndsAt: string | null;
  everSubscribed: boolean;
  /** "provider" once a real billing provider owns the row; "manual_preview" today. */
  activationSource: string;
};

const DAY = 86_400_000;
/** Canonical pause length. Never hardcode a pause duration anywhere else. */
export const PAUSE_DAYS = 180;
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();
const COLS =
  "status, cycle, cancel_at_period_end, current_period_end, trial_ends_at, pause_ends_at, ever_subscribed, activation_source";

function shape(row: Record<string, unknown> | null): SubscriptionRow {
  const cycle = row?.["cycle"];
  return {
    status: (row?.["status"] as string) ?? "none",
    cycle: cycle === "annual" || cycle === "monthly" ? cycle : null,
    cancelAtPeriodEnd: Boolean(row?.["cancel_at_period_end"]),
    currentPeriodEnd: (row?.["current_period_end"] as string | null) ?? null,
    trialEndsAt: (row?.["trial_ends_at"] as string | null) ?? null,
    pauseEndsAt: (row?.["pause_ends_at"] as string | null) ?? null,
    everSubscribed: Boolean(row?.["ever_subscribed"]),
    activationSource: (row?.["activation_source"] as string | null) ?? "none",
  };
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
    (input: { action: SubscriptionAction; cycle?: BillingCycle; everSubscribed?: boolean }) => {
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
      if (input.cycle && input.cycle !== "monthly" && input.cycle !== "annual") {
        throw new Error("Unknown billing cycle");
      }
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
        // One trial per account, and re-clicking can never extend a live one.
        if (current.status === "trialing" || current.everSubscribed) return current;
        const trialEnd = isoIn(TRIAL_DAYS * DAY);
        patch = {
          status: "trialing",
          plan: "pro",
          // The trial only ever converts to monthly.
          cycle: "monthly",
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
        const cycle: BillingCycle = data.cycle === "annual" ? "annual" : "monthly";
        const span = cycle === "annual" ? 365 * DAY : 30 * DAY;
        // Keep a paid period only when the same cycle is simply being renewed.
        const keepSame = current.status === "active" && current.cycle === cycle ? keepEnd : null;
        patch = {
          status: "active",
          plan: "pro",
          cycle,
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: null,
          pause_ends_at: null,
          current_period_end: keepSame ?? isoIn(span),
          ever_subscribed: true,
          activation_source: "manual_preview",
        };
        break;
      }
      case "pause": {
        // Already paused: no-op, so re-clicking can never extend the pause.
        if (current.status === "paused") return current;
        patch = {
          status: "paused",
          plan: "pro",
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: new Date().toISOString(),
          pause_ends_at: isoIn(PAUSE_DAYS * DAY),
          current_period_end: keepEnd ?? isoIn(PAUSE_DAYS * DAY),
          ever_subscribed: true,
          activation_source: current.activationSource === "none" ? "manual_preview" : current.activationSource,
        };
        break;
      }
      case "unpause":
      case "resume":
        patch = {
          status: "active",
          plan: "pro",
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: null,
          pause_ends_at: null,
          current_period_end: keepEnd ?? isoIn(30 * DAY),
          ever_subscribed: true,
          activation_source: current.activationSource === "none" ? "manual_preview" : current.activationSource,
        };
        break;
      case "cancel_at_period_end":
        patch = {
          status: "active",
          plan: "pro",
          cancel_at_period_end: true,
          current_period_end: keepEnd ?? isoIn(30 * DAY),
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