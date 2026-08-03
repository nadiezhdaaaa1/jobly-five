import { useSyncExternalStore } from "react";

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

const KEY = "jobly.experience";

function initialState(): ResumeState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ResumeData>;
        return { data: { ...EMPTY_RESUME, ...parsed } };
      }
    } catch {
      // ignore
    }
  }
  return { data: EMPTY_RESUME };
}

let state: ResumeState = initialState();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state.data));
    } catch {
      // ignore
    }
  }
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
