// What plan the visitor decided on, kept as a flat SKU (never a boolean, never a
// tier x cycle pair) so it survives the registration modal, an OAuth redirect,
// and plain abandonment. Nothing here grants access — the server owns that.

import { TRIAL_SKU, isSkuId, type SkuId } from "@/config/pricing";

export type PlanIntent = {
  sku: SkuId;
  /** True when the visitor chose the free trial, which only pro_monthly has. */
  trial: boolean;
  /** True when the decision came from Settings -> Plan on an existing account:
   *  the only case allowed to change the SKU of a live subscription. */
  manage?: boolean;
  savedAt: number;
};

const INTENT_KEY = "jobly.plan.intent";

export function savePlanIntent(intent: { sku: SkuId; trial?: boolean; manage?: boolean }) {
  if (typeof window === "undefined") return;
  try {
    // A trial can only ever attach to the one SKU that has one.
    const trial = intent.trial === true && intent.sku === TRIAL_SKU;
    window.localStorage.setItem(
      INTENT_KEY,
      JSON.stringify({
        sku: intent.sku,
        trial,
        manage: intent.manage === true,
        savedAt: Date.now(),
      } satisfies PlanIntent),
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
    if (!isSkuId(parsed.sku)) return null;
    return {
      sku: parsed.sku,
      trial: parsed.trial === true && parsed.sku === TRIAL_SKU,
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
