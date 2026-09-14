import { supabase } from "@/integrations/supabase/client";
import { isSkuId, type SkuId, type Tier } from "@/config/pricing";
import type { Plan, SubStatus, Subscription } from "@/lib/plan-store";

/**
 * Per-feature granularity, driven by tier on the server. `saved_searches` is a
 * limit, not a flag: 0 = none, 1 = Watch, null = unlimited (Pro).
 */
export type Features = {
  match_score: boolean;
  ghost_filtering: boolean;
  daily_digest: boolean;
  high_match_alerts: boolean;
  tracker: boolean;
  follow_up_reminders: boolean;
  found_a_job_pause: boolean;
  saved_searches: number | null;
};

export type Entitlements = {
  plan: Plan;
  tier: Tier | "none";
  status: SubStatus;
  /** The purchased SKU. NULL on rows written before SKUs existed. */
  sku: SkuId | null;
  /** What the account actually paid — what a renewal charges. */
  purchase_price: number | null;
  /** True once the quiz answers have landed on the profile. */
  onboarded: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  pause_ends_at: string | null
  /** Days frozen by pausing a prepaid plan, and when they expire. */
  banked_days: number;
  banked_days_expire_at: string | null;
  features: Features;
};

export const NO_FEATURES: Features = {
  match_score: false,
  ghost_filtering: false,
  daily_digest: false,
  high_match_alerts: false,
  tracker: false,
  follow_up_reminders: false,
  found_a_job_pause: false,
  saved_searches: 0,
};

export const FREE_ENTITLEMENTS: Entitlements = {
  plan: "free",
  tier: "none",
  status: "none",
  sku: null,
  purchase_price: null,
  onboarded: false,
  trial_ends_at: null,
  current_period_end: null,
  pause_ends_at: null,
  banked_days: 0,
  banked_days_expire_at: null,
  features: NO_FEATURES,
};

/**
 * The one list meaning "this account has a plan with us right now".
 * `paused` counts: a paused account still has a plan and must never be re-sold.
 * Shared so the first-run gate and the /matches paywall check cannot drift.
 * Note: /thank-you deliberately uses its own narrower list (no `paused`) —
 * that divergence is intentional and left alone.
 */
export const PLAN_PRESENT_STATUSES = ["trialing", "active", "past_due", "paused"] as const;

export function hasPlanStatus(status: string | null | undefined): boolean {
  return !!status && (PLAN_PRESENT_STATUSES as readonly string[]).includes(status);
}

/** Legacy client-side plan keys. A browser value is not evidence of a subscription. */
const LEGACY_PLAN_KEYS = ["jobly.plan", "jobly.subscription", "jobly.hasHadPro"];

export function clearLegacyPlanKeys() {
  if (typeof window === "undefined") return;
  for (const k of LEGACY_PLAN_KEYS) {
    try {
      window.localStorage.removeItem(k);
      window.sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/** DEV-only demo override. Impossible to enable in a production build. */
export function demoForcePro(): boolean {
  return import.meta.env.DEV && import.meta.env["VITE_DEMO_FORCE_PRO"] === "true";
}

export const PRO_DEMO_ENTITLEMENTS: Entitlements = {
  ...FREE_ENTITLEMENTS,
  plan: "pro",
  tier: "pro",
  status: "active",
  sku: "pro_monthly",
  features: {
    match_score: true,
    ghost_filtering: true,
    daily_digest: true,
    high_match_alerts: true,
    tracker: true,
    follow_up_reminders: true,
    found_a_job_pause: true,
    saved_searches: null,
  },
};

/** Single round trip, single contract. Anything unexpected resolves to Free. */
export async function fetchEntitlements(): Promise<Entitlements> {
  const { data, error } = await supabase.rpc("get_entitlements");
  if (error || !data || typeof data !== "object") throw error ?? new Error("No entitlements");
  const e = data as unknown as Entitlements;
  const tier: Tier | "none" = e.tier === "pro" || e.tier === "watch" ? e.tier : "none";
  return {
    plan:
      e.status === "paused"
        ? "paused"
        : tier === "pro"
          ? "pro"
          : tier === "watch"
            ? "watch"
            : "free",
    tier,
    status: e.status ?? "none",
    sku: isSkuId(e.sku) ? e.sku : null,
    purchase_price: e.purchase_price === null || e.purchase_price === undefined ? null : Number(e.purchase_price),
    onboarded: Boolean(e.onboarded),
    trial_ends_at: e.trial_ends_at ?? null,
    current_period_end: e.current_period_end ?? null,
    pause_ends_at: e.pause_ends_at ?? null,
    banked_days: Number(e.banked_days ?? 0) || 0,
    banked_days_expire_at: e.banked_days_expire_at ?? null,
    features: { ...NO_FEATURES, ...(e.features ?? {}) },
  };
}

/** Shape the existing Settings UI already consumes. Derived, never client-written. */
export function toSubscription(
  e: Entitlements,
  row?: {
    status: string;
    sku: SkuId | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    pauseEndsAt?: string | null;
    bankedDays?: number;
    bankedDaysExpireAt?: string | null;
    activationSource?: string;
  } | null,
): Subscription {
  if (row) {
    return {
      status: (row.cancelAtPeriodEnd ? "canceling" : row.status) as SubStatus,
      sku: row.sku ?? e.sku,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      currentPeriodEnd: row.currentPeriodEnd ?? e.trial_ends_at ?? new Date(0).toISOString(),
      pauseEndsAt: row.pauseEndsAt ?? e.pause_ends_at ?? null,
      bankedDays: row.bankedDays ?? e.banked_days,
      bankedDaysExpireAt: row.bankedDaysExpireAt ?? e.banked_days_expire_at,
      activationSource: row.activationSource ?? "none",
    };
  }
  return {
    status: e.status ?? "none",
    sku: e.sku,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: e.current_period_end ?? e.trial_ends_at ?? new Date(0).toISOString(),
    pauseEndsAt: e.pause_ends_at ?? null,
    bankedDays: e.banked_days,
    bankedDaysExpireAt: e.banked_days_expire_at,
    activationSource: "none",
  };
}
