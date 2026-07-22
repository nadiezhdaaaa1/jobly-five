import { useSyncExternalStore } from "react";

export type Plan = "free" | "pro" | "paused";

const KEY = "jobly.plan";
let current: Plan = readInitial();
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

export function isPro(p: Plan) {
  return p === "pro" || p === "paused";
}