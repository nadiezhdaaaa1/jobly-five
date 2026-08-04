import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dropLegacyCache, readUserCache, writeUserCache } from "@/lib/user-cache";

export type SavedFilter<T = unknown> = {
  id: string;
  name: string;
  filters: T;
};

const LEGACY_KEY = "jobly.savedFilters.v1";
const CACHE = "savedFilters";

export const SAVED_FILTER_LIMIT = 10;

// Starts empty: the per-account cache is read on hydrate.
let state: SavedFilter[] = [];
const listeners = new Set<() => void>();

function persist() {
  writeUserCache(CACHE, filtersUserId, state);
}

function emit() {
  persist();
  scheduleFiltersSync();
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const SERVER_STATE: SavedFilter[] = [];
function getSnapshot() {
  return state;
}
function getServerSnapshot() {
  return SERVER_STATE;
}

export function useSavedFilters<T = unknown>(): SavedFilter<T>[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) as SavedFilter<T>[];
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // uuid-shaped fallback so rows keep a stable primary key on the account
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, hex);
}

export function addSavedFilter<T>(name: string, filters: T): SavedFilter<T> | null {
  if (state.length >= SAVED_FILTER_LIMIT) return null;
  const entry: SavedFilter<T> = { id: uid(), name, filters };
  state = [...state, entry as SavedFilter];
  emit();
  return entry;
}

export function renameSavedFilter(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  state = state.map((f) => (f.id === id ? { ...f, name: trimmed } : f));
  emit();
}

export function deleteSavedFilter(id: string) {
  state = state.filter((f) => f.id !== id);
  emit();
}

export function getSavedFilter<T = unknown>(id: string): SavedFilter<T> | undefined {
  return state.find((f) => f.id === id) as SavedFilter<T> | undefined;
}
// ---------- Account sync ----------

let filtersUserId: string | null = null;
let filtersTimer: ReturnType<typeof setTimeout> | null = null;

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function scheduleFiltersSync() {
  if (!filtersUserId) return;
  if (filtersTimer) clearTimeout(filtersTimer);
  filtersTimer = setTimeout(() => {
    filtersTimer = null;
    void pushFilters();
  }, 300);
}

async function pushFilters() {
  const userId = filtersUserId;
  if (!userId) return;
  const rows = state
    .filter((f) => isUuid(f.id))
    .map((f) => ({ id: f.id, user_id: userId, name: f.name, filters: f.filters as never }));
  if (rows.length) {
    const { error } = await supabase.from("saved_filters").upsert(rows, { onConflict: "id" });
    if (error) return;
  }
  const keep = rows.map((r) => `"${r.id}"`).join(",");
  let del = supabase.from("saved_filters").delete().eq("user_id", userId);
  if (keep) del = del.not("id", "in", `(${keep})`);
  await del;
}

export async function hydrateSavedFiltersFromDb(userId: string) {
  filtersUserId = userId;
  const { data, error } = await supabase
    .from("saved_filters")
    .select("id, name, filters")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) return;
  if (data && data.length) {
    state = data.map((r) => ({ id: r.id, name: r.name, filters: r.filters }));
    persist();
    for (const l of listeners) l();
  } else if (state.length) {
    // First sign-in on this account: keep what the browser already had.
    scheduleFiltersSync();
  }
}

export function resetSavedFiltersForSignOut() {
  filtersUserId = null;
  if (filtersTimer) {
    clearTimeout(filtersTimer);
    filtersTimer = null;
  }
}
