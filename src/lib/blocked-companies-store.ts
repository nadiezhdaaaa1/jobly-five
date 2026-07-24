import { useSyncExternalStore } from "react";

const KEY = "jobly.blockedCompanies";
const SEED = ["Acme Staffing", "OldCo Inc"];

let current: string[] = readInitial();
const listeners = new Set<() => void>();

function readInitial(): string[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string");
    }
  } catch {
    /* ignore */
  }
  return SEED;
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getBlockedCompanies(): string[] {
  return current;
}

export function blockCompany(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
  current = [...current, trimmed];
  persist();
  emit();
}

export function unblockCompany(name: string) {
  const next = current.filter((c) => c !== name);
  if (next.length === current.length) return;
  current = next;
  persist();
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useBlockedCompanies(): string[] {
  return useSyncExternalStore(subscribe, () => current, () => SEED);
}

export function isBlocked(company: string): boolean {
  const c = company.toLowerCase();
  return current.some((b) => b.toLowerCase() === c);
}