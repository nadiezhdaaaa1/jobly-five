import { useSyncExternalStore } from "react";

export type Plan = "free" | "pro" | "paused";

const KEY = "jobly.plan";
const HAD_PRO_KEY = "jobly.hasHadPro";
let current: Plan = readInitial();
let hadPro: boolean = readHadProInitial();
const listeners = new Set<() => void>();

function readInitial(): Plan {
  if (typeof window === "undefined") return "pro";
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "free" || v === "pro" || v === "paused") return v;
  } catch {
    /* ignore */
  }
  return "pro";
}

function readHadProInitial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HAD_PRO_KEY) === "1";
  } catch {
    return false;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getPlan(): Plan {
  return current;
}

export function setPlan(next: Plan) {
  if (next === current) return;
  current = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  // Trial is consumed the moment Pro is ever active.
  if ((next === "pro" || next === "paused") && !hadPro) {
    hadPro = true;
    try {
      window.localStorage.setItem(HAD_PRO_KEY, "1");
    } catch {
      /* ignore */
    }
  }
  emit();
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
  return useSyncExternalStore(subscribe, () => current, () => "pro");
}

export function useHasHadPro(): boolean {
  return useSyncExternalStore(subscribe, () => hadPro, () => false);
}

export function isPro(p: Plan) {
  return p === "pro" || p === "paused";
}