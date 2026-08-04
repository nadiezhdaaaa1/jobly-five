import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dropLegacyCache, readUserCache, writeUserCache } from "@/lib/user-cache";

const LEGACY_KEY = "jobly.blockedCompanies";
const CACHE = "blockedCompanies";

// Starts empty: the per-account cache is read on hydrate.
let current: string[] = [];
const listeners = new Set<() => void>();

function persist() {
  writeUserCache(CACHE, blockedUserId, current);
}

function emit() {
  listeners.forEach((l) => l());
}

export function getBlockedCompanies(): string[] {
  return current;
}

async function pushBlock(userId: string, company: string) {
  // The call MUST be awaited: an unawaited PostgREST builder is never sent.
  const { error } = await supabase
    .from("blocked_companies")
    .upsert({ user_id: userId, company }, { onConflict: "user_id,company" });
  if (error) console.error("hide-company sync failed", error);
}

async function pushUnblock(userId: string, company: string) {
  const { error } = await supabase
    .from("blocked_companies")
    .delete()
    .eq("user_id", userId)
    .eq("company", company);
  if (error) console.error("unhide-company sync failed", error);
}

export function blockCompany(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
  current = [...current, trimmed];
  persist();
  if (blockedUserId) {
    void pushBlock(blockedUserId, trimmed);
  }
  emit();
}

export function unblockCompany(name: string) {
  const next = current.filter((c) => c !== name);
  if (next.length === current.length) return;
  current = next;
  persist();
  if (blockedUserId) {
    void pushUnblock(blockedUserId, name);
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
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => EMPTY,
  );
}

const EMPTY: string[] = [];

export function isBlocked(company: string): boolean {
  const c = company.toLowerCase();
  return current.some((b) => b.toLowerCase() === c);
}

// ---------- Account sync ----------

let blockedUserId: string | null = null;

/** Loads this account's hidden companies. The server is authoritative. */
export async function hydrateBlockedCompaniesFromDb(userId: string) {
  blockedUserId = userId;
  dropLegacyCache(LEGACY_KEY);
  const cached = readUserCache<string[]>(CACHE, userId);
  if (Array.isArray(cached) && cached.length) {
    current = cached.filter((v) => typeof v === "string");
    emit();
  }
  const { data, error } = await supabase
    .from("blocked_companies")
    .select("company")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) return;
  current = (data ?? []).map((r) => r.company);
  persist();
  emit();
}

export function resetBlockedCompaniesForSignOut() {
  blockedUserId = null;
  current = [];
  emit();
}