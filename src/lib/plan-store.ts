import { useSyncExternalStore } from "react";
import { SKUS, TRIAL_SKU, periodDays, type SkuId, type Tier } from "@/config/pricing";
import { applySubscriptionAction, type SubscriptionAction } from "@/lib/subscription.functions";

/** `watch` and `pro` are tiers; `paused` is a state that grants nothing. */
export type Plan = "free" | "watch" | "pro" | "paused";

// Subscription lifecycle status.
// `canceling` = cancellation scheduled at period end, entitlements still live.
export type SubStatus = "none" | "active" | "trialing" | "canceling" | "canceled" | "paused";

export type Subscription = {
  status: SubStatus;
  /** The purchased SKU. NULL on rows written before SKUs existed. */
  sku: SkuId | null;
  cancelAtPeriodEnd: boolean;
  /** ISO date — access lasts until this moment. */
  currentPeriodEnd: string;
  /** ISO date the pause ends, when the server knows it. */
  pauseEndsAt?: string | null;
  /** Days frozen by pausing a prepaid plan. */
  bankedDays?: number;
  bankedDaysExpireAt?: string | null;
  /** How the plan was turned on: "manual_preview" today, "provider" once billing is live. */
  activationSource?: string;
};

const DAY = 86_400_000;
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();

/**
 * True while the subscription is inside a paid or trial period.
 * A paused subscription is NOT live: a pause suspends access, matching
 * `get_entitlements()` on the server.
 */
export function resolveIsLive(sub: Subscription, now: number = Date.now()): boolean {
  if (sub.status === "active" || sub.status === "trialing") return true;
  if (sub.status === "canceling") return now < new Date(sub.currentPeriodEnd).getTime();
  return false;
}

/** Which tier the account currently has, if any. */
export function resolveTier(sub: Subscription, now: number = Date.now()): Tier | "none" {
  if (!resolveIsLive(sub, now)) return "none";
  return sub.sku ? SKUS[sub.sku].tier : "pro";
}

/** Pure entitlement resolver — the single source of truth for Pro access. */
export function resolveIsPro(sub: Subscription, now: number = Date.now()): boolean {
  return resolveTier(sub, now) === "pro";
}

export function resolvePlan(sub: Subscription, now: number = Date.now()): Plan {
  if (sub.status === "paused") return "paused";
  const tier = resolveTier(sub, now);
  return tier === "none" ? "free" : tier;
}

function defaultSub(): Subscription {
  // Unknown state must resolve to Free — never a paid tier.
  return {
    status: "none",
    sku: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: new Date(0).toISOString(),
    pauseEndsAt: null,
    bankedDays: 0,
    bankedDaysExpireAt: null,
    activationSource: "none",
  };
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

function commit(next: Subscription) {
  sub = next;
  if (resolveIsLive(sub)) hadPro = true;
  emit();
}

// Server is the record of truth. Mutators commit optimistically for instant UI,
// then reconcile with whatever the account actually stores.
let onServerSync: (() => void) | null = null;

/** Lets the entitlement provider refetch after a persisted change. */
export function setSubscriptionSyncHandler(fn: (() => void) | null) {
  onServerSync = fn;
}

function persist(
  action: SubscriptionAction,
  extra?: { sku?: SkuId; everSubscribed?: boolean; allowSkuChange?: boolean },
) {
  void applySubscriptionAction({ data: { action, ...extra } })
    .then((row) => {
      sub = {
        status: (row.cancelAtPeriodEnd ? "canceling" : row.status) as SubStatus,
        sku: row.sku,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        currentPeriodEnd: row.currentPeriodEnd ?? row.trialEndsAt ?? new Date(0).toISOString(),
        pauseEndsAt: row.pauseEndsAt,
        bankedDays: row.bankedDays,
        bankedDaysExpireAt: row.bankedDaysExpireAt,
        activationSource: row.activationSource,
      };
      hadPro = row.everSubscribed || resolveIsLive(sub);
      emit();
      onServerSync?.();
    })
    .catch(() => {
      // Keep the optimistic state; the next entitlement load reconciles it.
    });
}

/** Server is the source of truth — called by the entitlement provider only. */
export function hydrateSubscription(next: Subscription, everSubscribed: boolean) {
  sub = next;
  hadPro = everSubscribed || resolveIsLive(next);
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

/** Turn a specific SKU on. The server still decides whether it may. */
export function activateSku(skuId: SkuId, options?: { allowSkuChange?: boolean }) {
  const end = new Date(sub.currentPeriodEnd).getTime();
  persist("activate", { sku: skuId, allowSkuChange: options?.allowSkuChange });
  commit({
    ...sub,
    status: "active",
    sku: skuId,
    cancelAtPeriodEnd: false,
    pauseEndsAt: null,
    currentPeriodEnd:
      sub.sku === skuId && end > Date.now()
        ? sub.currentPeriodEnd
        : isoIn(periodDays(skuId) * DAY),
  });
}

/** Pause suspends access and banks prepaid days. Watch cannot pause. */
export function pausePlan() {
  // Re-pausing must never extend a pause or double-credit days.
  if (sub.status === "paused") return;
  persist("pause");
  commit({
    ...sub,
    status: "paused",
    cancelAtPeriodEnd: false,
    pauseEndsAt: null,
    currentPeriodEnd: new Date().toISOString(),
  });
}

/** Come back from a pause, spending banked days before the next charge. */
export function unpausePlan() {
  const banked = sub.bankedDays ?? 0;
  const skuId = sub.sku ?? TRIAL_SKU;
  persist("unpause");
  commit({
    ...sub,
    status: "active",
    cancelAtPeriodEnd: false,
    pauseEndsAt: null,
    bankedDays: 0,
    bankedDaysExpireAt: null,
    currentPeriodEnd: isoIn((banked > 0 ? banked : periodDays(skuId)) * DAY),
  });
}

/** End the plan immediately. */
export function cancelPlanNow() {
  persist("cancel_now");
  commit({
    ...sub,
    status: "canceled",
    cancelAtPeriodEnd: false,
    pauseEndsAt: null,
    currentPeriodEnd: new Date().toISOString(),
  });
}

/** Cancel = schedule termination at period end. Entitlements stay live. */
export function scheduleCancelAtPeriodEnd() {
  const end = new Date(sub.currentPeriodEnd).getTime();
  persist("cancel_at_period_end");
  commit({
    ...sub,
    status: "canceling",
    cancelAtPeriodEnd: true,
    currentPeriodEnd:
      end > Date.now() ? sub.currentPeriodEnd : isoIn(periodDays(sub.sku ?? TRIAL_SKU) * DAY),
  });
}

/** Undo a scheduled cancellation — no new charge, no new period. */
export function resumeSubscription() {
  persist("resume");
  commit({ ...sub, status: "active", cancelAtPeriodEnd: false });
}

/** DEV ONLY — local-state override, never touches the billing provider. */
export function devDowngradeNow() {
  cancelPlanNow();
}

/** DEV ONLY — local-state override, never touches the billing provider. */
export function devRestorePro() {
  activateSku(TRIAL_SKU, { allowSkuChange: true });
}

export function getHasHadPro(): boolean {
  return hadPro;
}

export function setHasHadPro(next: boolean) {
  if (next === hadPro) return;
  hadPro = next;
  persist("set_ever_subscribed", { everSubscribed: next });
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

/** A pause grants nothing, so `paused` is deliberately not Pro. */
export function isPro(p: Plan) {
  return p === "pro";
}
