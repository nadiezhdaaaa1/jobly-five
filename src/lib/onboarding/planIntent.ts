// What plan the visitor decided on, kept as an enum plan + cycle (never a
// boolean) so it survives the registration modal, an OAuth redirect, and plain
// abandonment. Nothing here grants access — the server owns that.

import type { BillingCycle } from "@/lib/subscription.functions";

export type IntentPlan = "trial" | "pro";

export type PlanIntent = {
  plan: IntentPlan;
  cycle: BillingCycle;
  /** True when the decision came from Settings -> Plan on an existing account:
   *  the only case allowed to change the billing cycle of a live subscription. */
  manage?: boolean;
  savedAt: number;
};

const INTENT_KEY = "jobly.plan.intent";

export function savePlanIntent(intent: {
  plan: IntentPlan;
  cycle: BillingCycle;
  manage?: boolean;
}) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      INTENT_KEY,
      JSON.stringify({ ...intent, savedAt: Date.now() } satisfies PlanIntent),
    );
  } catch {
    // A blocked storage must never stop the flow.
  }
}

export function readPlanIntent(): PlanIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlanIntent>;
    const plan = parsed.plan === "trial" || parsed.plan === "pro" ? parsed.plan : null;
    const cycle = parsed.cycle === "monthly" || parsed.cycle === "annual" ? parsed.cycle : null;
    if (!plan || !cycle) return null;
    return {
      plan,
      cycle,
      manage: parsed.manage === true,
      savedAt: Number(parsed.savedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearPlanIntent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(INTENT_KEY);
  } catch {
    // ignore
  }
}
