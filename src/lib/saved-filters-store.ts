import { useSyncExternalStore } from "react";

export type SavedFilter<T = unknown> = {
  id: string;
  name: string;
  filters: T;
};

const KEY = "jobly.savedFilters.v1";

export const SAVED_FILTER_LIMIT = 10;

function load(): SavedFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedFilter[]) : [];
  } catch {
    return [];
  }
}

let state: SavedFilter[] = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
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
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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