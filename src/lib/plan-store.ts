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

// In-memory only: entitlements come from the server (get_entitlements) and are
// never read from or written to browser storage.
let sub: Subscription = defaultSub();
let hadPro = false;
let ready = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function markHadPro() {
  if (hadPro) return;
  hadPro = true;
}

function commit(next: Subscription) {
  sub = next;
  if (resolveIsPro(sub)) markHadPro();
  emit();
}

/** Server is the source of truth — called by the entitlement provider only. */
export function hydrateSubscription(next: Subscription, everSubscribed: boolean) {
  sub = next;
  hadPro = everSubscribed || resolveIsPro(next);
  ready = true;
  emit();
}

export function setEntitlementsReady(next: boolean) {
  if (ready === next) return;
  ready = next;
  emit();
}

/** False while entitlements are loading or errored — callers must render Free. */
export function useEntitlementsReady(): boolean {
  return useSyncExternalStore(subscribe, () => ready, () => false);
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
