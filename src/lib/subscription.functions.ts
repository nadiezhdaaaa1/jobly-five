import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Placeholder billing writes. No provider is wired yet, so the app owns the
 * `subscriptions` row directly. When Stripe lands, the webhook writes the same
 * columns and these actions shrink to checkout/portal redirects.
 *
 * Client roles have no write grant on `subscriptions`; the service-role client
 * is loaded inside the handler and scoped to `context.userId`.
 */
export type SubscriptionAction =
  | "activate"
  | "pause"
  | "unpause"
  | "cancel_at_period_end"
  | "resume"
  | "cancel_now"
  | "set_ever_subscribed";

export type SubscriptionRow = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  pauseEndsAt: string | null;
  everSubscribed: boolean;
};

const DAY = 86_400_000;
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();

function shape(row: Record<string, unknown> | null): SubscriptionRow {
  return {
    status: (row?.["status"] as string) ?? "none",
    cancelAtPeriodEnd: Boolean(row?.["cancel_at_period_end"]),
    currentPeriodEnd: (row?.["current_period_end"] as string | null) ?? null,
    trialEndsAt: (row?.["trial_ends_at"] as string | null) ?? null,
    pauseEndsAt: (row?.["pause_ends_at"] as string | null) ?? null,
    everSubscribed: Boolean(row?.["ever_subscribed"]),
  };
}

/** Read the caller's own subscription row (details `get_entitlements` omits). */
export const getSubscriptionRow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionRow> => {
    const { data } = await context.supabase
      .from("subscriptions")
      .select("status, cancel_at_period_end, current_period_end, trial_ends_at, pause_ends_at, ever_subscribed")
      .eq("user_id", context.userId)
      .maybeSingle();
    return shape(data as Record<string, unknown> | null);
  });

export const applySubscriptionAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: SubscriptionAction; everSubscribed?: boolean }) => {
    const allowed: SubscriptionAction[] = [
      "activate",
      "pause",
      "unpause",
      "cancel_at_period_end",
      "resume",
      "cancel_now",
      "set_ever_subscribed",
    ];
    if (!allowed.includes(input.action)) throw new Error("Unknown subscription action");
    return input;
  })
  .handler(async ({ data, context }): Promise<SubscriptionRow> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("status, cancel_at_period_end, current_period_end, trial_ends_at, pause_ends_at, ever_subscribed")
      .eq("user_id", context.userId)
      .maybeSingle();
    const current = shape(existing as Record<string, unknown> | null);
    const keepEnd =
      current.currentPeriodEnd && new Date(current.currentPeriodEnd).getTime() > Date.now()
        ? current.currentPeriodEnd
        : null;

    let patch: Record<string, unknown>;
    switch (data.action) {
      case "activate":
        patch = {
          status: "active",
          plan: "pro",
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: null,
          pause_ends_at: null,
          current_period_end: keepEnd ?? isoIn(30 * DAY),
          ever_subscribed: true,
        };
        break;
      case "pause":
        patch = {
          status: "paused",
          plan: "pro",
          cancel_at_period_end: false,
          canceled_at: null,
          paused_at: new Date().toISOString(),
          pause_ends_at: isoIn(180 * DAY),
          current_period_end: keepEnd ?? isoIn(180 * DAY),
          ever_subscribed: true,
        };
        break;
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
      .select("status, cancel_at_period_end, current_period_end, trial_ends_at, pause_ends_at, ever_subscribed")
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