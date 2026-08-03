import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  if (blockedUserId) {
    void supabase
      .from("blocked_companies")
      .upsert({ user_id: blockedUserId, company: trimmed }, { onConflict: "user_id,company" });
  }
  emit();
}

export function unblockCompany(name: string) {
  const next = current.filter((c) => c !== name);
  if (next.length === current.length) return;
  current = next;
  persist();
  if (blockedUserId) {
    void supabase.from("blocked_companies").delete().eq("user_id", blockedUserId).eq("company", name);
  }
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

// ---------- Account sync ----------

let blockedUserId: string | null = null;

/** Loads the account's hidden companies; seeds it from the browser copy once. */
export async function hydrateBlockedCompaniesFromDb(userId: string) {
  blockedUserId = userId;
  const { data, error } = await supabase
    .from("blocked_companies")
    .select("company")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) return;
  if (data && data.length) {
    current = data.map((r) => r.company);
    persist();
    emit();
  } else if (current.length) {
    await supabase
      .from("blocked_companies")
      .upsert(
        current.map((company) => ({ user_id: userId, company })),
        { onConflict: "user_id,company" },
      );
  }
}

export function resetBlockedCompaniesForSignOut() {
  blockedUserId = null;
}