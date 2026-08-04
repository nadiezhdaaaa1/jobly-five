import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dropLegacyCache, readUserCache, writeUserCache } from "@/lib/user-cache";

/**
 * Manual work-history store (Experience / Education tabs).
 *
 * Resume FILES no longer live here — they are in Supabase Storage +
 * `resume_documents`, see `resume-documents-store.ts`. This store keeps only the
 * structured history the user types in themselves; nothing is parsed from a file
 * yet.
 */

export type ResumeContact = {
  name: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  portfolio: string;
  linkedin: string;
};

export type ResumeExperience = {
  id: string;
  role: string;
  company: string;
  dates: string;
  bullets: string[];
  description?: string;
};

export type ResumeEducation = {
  id: string;
  degree: string;
  school: string;
  years: string;
  degreeType?: string;
  field?: string;
};

export type ResumeLanguage = { lang: string; level: string };

export type ResumeData = {
  contact: ResumeContact;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  languages: ResumeLanguage[];
};

export type ResumeState = { data: ResumeData };

export const EMPTY_RESUME: ResumeData = {
  contact: { name: "", email: "", phone: "", location: "", github: "", portfolio: "", linkedin: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
};

const LEGACY_KEY = "jobly.experience";
const CACHE = "experience";

// Starts empty: the cache is only read once we know which account is signed in.
let state: ResumeState = { data: EMPTY_RESUME };
const listeners = new Set<() => void>();

function emit() {
  writeUserCache(CACHE, historyUserId, state.data);
  scheduleHistorySync();
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return state;
}

const SERVER_STATE: ResumeState = { data: EMPTY_RESUME };
function getServerSnapshot() {
  return SERVER_STATE;
}

export function useResumeState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateResumeData(patch: Partial<ResumeData>) {
  state = { data: { ...state.data, ...patch } };
  emit();
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function addExperience() {
  const entry: ResumeExperience = { id: uid(), role: "", company: "", dates: "", bullets: [], description: "" };
  state = { data: { ...state.data, experience: [...state.data.experience, entry] } };
  emit();
  return entry.id;
}

export function updateExperience(id: string, patch: Partial<ResumeExperience>) {
  state = {
    data: {
      ...state.data,
      experience: state.data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    },
  };
  emit();
}

export function removeExperience(id: string) {
  state = { data: { ...state.data, experience: state.data.experience.filter((e) => e.id !== id) } };
  emit();
}

export function reorderExperience(id: string, dir: -1 | 1) {
  const list = [...state.data.experience];
  const i = list.findIndex((e) => e.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  state = { data: { ...state.data, experience: list } };
  emit();
}

export function addEducation() {
  const entry: ResumeEducation = { id: uid(), degree: "", school: "", years: "", degreeType: "", field: "" };
  state = { data: { ...state.data, education: [...state.data.education, entry] } };
  emit();
  return entry.id;
}

export function updateEducation(id: string, patch: Partial<ResumeEducation>) {
  state = {
    data: {
      ...state.data,
      education: state.data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    },
  };
  emit();
}

export function removeEducation(id: string) {
  state = { data: { ...state.data, education: state.data.education.filter((e) => e.id !== id) } };
  emit();
}

// ---------- Account sync ----------
// Work history belongs to the account; localStorage is only an offline cache.

let historyUserId: string | null = null;
let historyTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleHistorySync() {
  if (!historyUserId) return;
  if (historyTimer) clearTimeout(historyTimer);
  historyTimer = setTimeout(() => {
    historyTimer = null;
    const userId = historyUserId;
    if (!userId) return;
    void supabase.from("profiles").update({ work_history: state.data }).eq("id", userId);
  }, 400);
}

/** Loads this account's history. The server is the only source of truth. */
export async function hydrateWorkHistoryFromDb(userId: string) {
  historyUserId = userId;
  dropLegacyCache(LEGACY_KEY);
  // Paint this account's own cached copy first, if it has one.
  const cached = readUserCache<Partial<ResumeData>>(CACHE, userId);
  if (cached && Object.keys(cached).length) {
    state = { data: { ...EMPTY_RESUME, ...cached } };
    for (const l of listeners) l();
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("work_history")
    .eq("id", userId)
    .maybeSingle();
  if (error) return;
  const remote = (data?.work_history ?? {}) as Partial<ResumeData>;
  state = { data: { ...EMPTY_RESUME, ...remote } };
  writeUserCache(CACHE, userId, state.data);
  for (const l of listeners) l();
}

export function resetWorkHistoryForSignOut() {
  historyUserId = null;
  state = { data: EMPTY_RESUME };
  if (historyTimer) {
    clearTimeout(historyTimer);
    historyTimer = null;
  }
  for (const l of listeners) l();
}
