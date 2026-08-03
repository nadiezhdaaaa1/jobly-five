import { useSyncExternalStore } from "react";

export type Plan = "free" | "pro" | "paused";

// Subscription lifecycle status.
// `canceling` = cancellation scheduled at period end, entitlements still live.
export type SubStatus = "none" | "active" | "trialing" | "canceling" | "canceled" | "paused";

export type Subscription = {
  status: SubStatus;
  cancelAtPeriodEnd: boolean;
  /** ISO date — access lasts until this moment. */
  currentPeriodEnd: string;
};

const KEY = "jobly.plan"; // legacy key, still read for migration
const SUB_KEY = "jobly.subscription";
const HAD_PRO_KEY = "jobly.hasHadPro";

const DAY = 86_400_000;
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();

/** Pure entitlement resolver — the single source of truth for Pro access. */
export function resolveIsPro(sub: Subscription, now: number = Date.now()): boolean {
  if (sub.status === "active" || sub.status === "trialing" || sub.status === "paused") return true;
  if (sub.status === "canceling") return now < new Date(sub.currentPeriodEnd).getTime();
  return false;
}

export function resolvePlan(sub: Subscription, now: number = Date.now()): Plan {
  if (sub.status === "paused") return "paused";
  return resolveIsPro(sub, now) ? "pro" : "free";
}

function defaultSub(): Subscription {
  // Unknown state must resolve to Free — never Pro.
  return { status: "none", cancelAtPeriodEnd: false, currentPeriodEnd: new Date(0).toISOString() };
}

function readSub(): Subscription {
  if (typeof window === "undefined") return defaultSub();
  try {
    const raw = window.localStorage.getItem(SUB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Subscription>;
      if (parsed && typeof parsed.status === "string") {
        return {
          status: parsed.status as SubStatus,
          cancelAtPeriodEnd: Boolean(parsed.cancelAtPeriodEnd),
          currentPeriodEnd: parsed.currentPeriodEnd ?? isoIn(30 * DAY),
        };
      }
    }
    // Migrate the legacy plan-only value.
    const legacy = window.localStorage.getItem(KEY);
    if (legacy === "free") return { status: "canceled", cancelAtPeriodEnd: false, currentPeriodEnd: new Date().toISOString() };
    if (legacy === "paused") return { status: "paused", cancelAtPeriodEnd: false, currentPeriodEnd: isoIn(180 * DAY) };
  } catch {
    /* ignore */
  }
  return defaultSub();
}

let sub: Subscription = readSub();
let hadPro: boolean = readHadProInitial();
const listeners = new Set<() => void>();

function readHadProInitial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HAD_PRO_KEY) === "1";
  } catch {
    return false;
  }
}

function persist() {
  try {
    window.localStorage.setItem(SUB_KEY, JSON.stringify(sub));
    window.localStorage.setItem(KEY, resolvePlan(sub));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function markHadPro() {
  if (hadPro) return;
  hadPro = true;
  try {
    window.localStorage.setItem(HAD_PRO_KEY, "1");
  } catch {
    /* ignore */
  }
}

function commit(next: Subscription) {
  sub = next;
  if (resolveIsPro(sub)) markHadPro();
  persist();
  emit();
}

export function getSubscription(): Subscription {
  return sub;
}

export function getPlan(): Plan {
  return resolvePlan(sub);
}

export function setPlan(next: Plan) {
  if (next === getPlan() && !(next === "pro" && sub.cancelAtPeriodEnd)) return;
  if (next === "pro") {
    const end = new Date(sub.currentPeriodEnd).getTime();
    commit({
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: end > Date.now() ? sub.currentPeriodEnd : isoIn(30 * DAY),
    });
  } else if (next === "paused") {
    commit({ status: "paused", cancelAtPeriodEnd: false, currentPeriodEnd: isoIn(180 * DAY) });
  } else {
    commit({ status: "canceled", cancelAtPeriodEnd: false, currentPeriodEnd: new Date().toISOString() });
  }
}

/** Cancel = schedule termination at period end. Entitlements stay live. */
export function scheduleCancelAtPeriodEnd() {
  const end = new Date(sub.currentPeriodEnd).getTime();
  commit({
    status: "canceling",
    cancelAtPeriodEnd: true,
    currentPeriodEnd: end > Date.now() ? sub.currentPeriodEnd : isoIn(30 * DAY),
  });
}

/** Undo a scheduled cancellation — no new charge, no new trial. */
export function resumeSubscription() {
  commit({ ...sub, status: "active", cancelAtPeriodEnd: false });
}

/** DEV ONLY — local-state override, never touches the billing provider. */
export function devDowngradeNow() {
  commit({ status: "canceled", cancelAtPeriodEnd: false, currentPeriodEnd: new Date().toISOString() });
}

/** DEV ONLY — local-state override, never touches the billing provider. */
export function devRestorePro() {
  commit({ status: "active", cancelAtPeriodEnd: false, currentPeriodEnd: isoIn(30 * DAY) });
}

export function getHasHadPro(): boolean {
  return hadPro;
}

export function setHasHadPro(next: boolean) {
  if (next === hadPro) return;
  hadPro = next;
  try {
    window.localStorage.setItem(HAD_PRO_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function usePlan(): Plan {
  return useSyncExternalStore(subscribe, () => resolvePlan(sub), () => "free");
}

export function useSubscription(): Subscription {
  return useSyncExternalStore(subscribe, () => sub, () => sub);
}

export function useHasHadPro(): boolean {
  return useSyncExternalStore(subscribe, () => hadPro, () => false);
}

export function isPro(p: Plan) {
  return p === "pro" || p === "paused";
}
