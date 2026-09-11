// What plan the visitor decided on, kept as an enum plan + cycle (never a
// boolean) so it survives the registration modal, an OAuth redirect, and plain
// abandonment. Nothing here grants access — the server owns that.

import type { BillingCycle } from "@/lib/subscription.functions";

export type IntentPlan = "trial" | "pro";

export type PlanIntent = {
  plan: IntentPlan;
  cycle: BillingCycle;
  savedAt: number;
};

const INTENT_KEY = "jobly.plan.intent";
/** Where to land after an OAuth round trip. Session-scoped on purpose. */
const POST_AUTH_KEY = "jobly.postAuthPath";

export function savePlanIntent(intent: { plan: IntentPlan; cycle: BillingCycle }) {
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
    const cycle =
      parsed.cycle === "monthly" || parsed.cycle === "annual" ? parsed.cycle : null;
    if (!plan || !cycle) return null;
    return { plan, cycle, savedAt: Number(parsed.savedAt) || Date.now() };
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

export function setPostAuthPath(path: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(POST_AUTH_KEY, path);
  } catch {
    // ignore
  }
}

export function readPostAuthPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(POST_AUTH_KEY);
    // Same-origin paths only — never follow an absolute URL from storage.
    return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
  } catch {
    return null;
  }
}

export function clearPostAuthPath() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(POST_AUTH_KEY);
  } catch {
    // ignore
  }
}
