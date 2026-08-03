import { supabase } from "@/integrations/supabase/client";
import type { Plan, SubStatus, Subscription } from "@/lib/plan-store";

export type Features = {
  match_score: boolean;
  daily_digest: boolean;
  tracker: boolean;
  follow_up_reminders: boolean;
  found_a_job_pause: boolean;
};

export type Entitlements = {
  plan: Plan;
  status: SubStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  pause_ends_at: string | null;
  features: Features;
};

export const FREE_ENTITLEMENTS: Entitlements = {
  plan: "free",
  status: "none",
  trial_ends_at: null,
  current_period_end: null,
  pause_ends_at: null,
  features: {
    match_score: false,
    daily_digest: false,
    tracker: false,
    follow_up_reminders: false,
    found_a_job_pause: false,
  },
};

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
  status: "active",
  features: {
    match_score: true,
    daily_digest: true,
    tracker: true,
    follow_up_reminders: true,
    found_a_job_pause: true,
  },
};

/** Single round trip, single contract. Anything unexpected resolves to Free. */
export async function fetchEntitlements(): Promise<Entitlements> {
  const { data, error } = await supabase.rpc("get_entitlements");
  if (error || !data || typeof data !== "object") throw error ?? new Error("No entitlements");
  const e = data as unknown as Entitlements;
  return {
    plan: e.plan === "pro" ? "pro" : e.status === "paused" ? "paused" : "free",
    status: e.status ?? "none",
    trial_ends_at: e.trial_ends_at ?? null,
    current_period_end: e.current_period_end ?? null,
    pause_ends_at: e.pause_ends_at ?? null,
    features: { ...FREE_ENTITLEMENTS.features, ...(e.features ?? {}) },
  };
}

/** Shape the existing Settings UI already consumes. Derived, never client-written. */
export function toSubscription(e: Entitlements): Subscription {
  return {
    status: e.status === "canceled" && e.current_period_end ? "canceled" : (e.status as SubStatus),
    cancelAtPeriodEnd: e.status === "active" && Boolean(e.current_period_end) ? false : false,
    currentPeriodEnd: e.current_period_end ?? e.trial_ends_at ?? new Date(0).toISOString(),
  };
}
