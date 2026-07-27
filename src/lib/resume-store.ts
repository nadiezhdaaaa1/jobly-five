import { useSyncExternalStore } from "react";

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

export type ResumeState = {
  files: ResumeFile[];
  primaryId: string | null;
  consented: boolean;
  // derived / legacy fields kept for cross-screen consumers
  hasResume: boolean;
  filename: string | null;
  addedDate: string | null;
  data: ResumeData;
};

export type ResumeFileExt = "pdf" | "docx";

export type ResumeFile = {
  id: string;
  name: string; // filename without extension
  ext: ResumeFileExt;
  size: number; // bytes
  uploadedAt: string; // ISO
};

export const DEFAULT_RESUME: ResumeData = {
  contact: {
    name: "Serhii Kovalenko",
    email: "serhii@example.com",
    phone: "+1 (212) 555-0143",
    location: "New York City, NY",
    github: "github.com/serhii",
    portfolio: "serhii.dev",
    linkedin: "linkedin.com/in/serhii",
  },
  summary:
    "Senior Frontend Engineer with 13 years shipping React and Vue apps at scale. Comfortable owning design systems, performance budgets, and mentoring mid-level engineers. Recent focus on TypeScript, accessible UI, and edge-rendered React frameworks.",
  experience: [
    {
      id: "e1",
      role: "Senior Frontend Engineer",
      company: "Nimbus Corp",
      dates: "2021 — Present",
      bullets: [
        "Led migration of the customer console from Vue 2 to React 18 + TypeScript.",
        "Built the internal design system used by 40+ engineers across 6 product teams.",
        "Cut initial JS payload 38% by introducing route-level code splitting and lazy hydration.",
        "Mentored 4 mid-level engineers; ran the frontend hiring loop.",
      ],
    },
    {
      id: "e2",
      role: "Frontend Engineer",
      company: "Orion Tech",
      dates: "2017 — 2021",
      bullets: [
        "Owned the checkout surface — React, Redux, and a bespoke A/B framework.",
        "Shipped accessibility fixes bringing the app to WCAG 2.1 AA.",
        "Built the component library adopted across three product lines.",
      ],
    },
    {
      id: "e3",
      role: "Web Developer",
      company: "Vertex Solutions",
      dates: "2012 — 2017",
      bullets: [
        "Built marketing sites and dashboards in Vue and vanilla JS.",
        "Introduced automated visual regression tests to the frontend pipeline.",
      ],
    },
  ],
  education: [
    {
      id: "ed1",
      degree: "B.S. Computer Science",
      school: "Temple University",
      years: "2008 — 2012",
    },
  ],
  skills: [
    "React",
    "Vue",
    "TypeScript",
    "Next.js",
    "Node.js",
    "GraphQL",
    "Tailwind CSS",
    "Vite",
    "Storybook",
    "Playwright",
    "Figma",
  ],
  languages: [
    { lang: "English", level: "Fluent" },
    { lang: "Spanish", level: "B2" },
    { lang: "Dutch", level: "B1" },
  ],
};

const KEY = "jobly.resume";

function formatAdded(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function derive(base: {
  files: ResumeFile[];
  primaryId: string | null;
  consented: boolean;
  data: ResumeData;
}): ResumeState {
  const primary = base.files.find((f) => f.id === base.primaryId) ?? null;
  return {
    ...base,
    hasResume: base.files.length > 0,
    filename: primary ? `${primary.name}.${primary.ext}` : null,
    addedDate: primary ? formatAdded(primary.uploadedAt) : null,
  };
}

function initialState(): ResumeState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ResumeState>;
        return derive({
          files: parsed.files ?? [],
          primaryId: parsed.primaryId ?? null,
          consented: parsed.consented ?? false,
          data: parsed.data ?? DEFAULT_RESUME,
        });
      }
    } catch {
      // ignore
    }
  }
  return derive({ files: [], primaryId: null, consented: false, data: DEFAULT_RESUME });
}

let state: ResumeState = initialState();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
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

function getSnapshot() {
  return state;
}

const SERVER_STATE: ResumeState = derive({
  files: [],
  primaryId: null,
  consented: false,
  data: DEFAULT_RESUME,
});
function getServerSnapshot() {
  return SERVER_STATE;
}

export function useResumeState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function commit(next: {
  files: ResumeFile[];
  primaryId: string | null;
  consented: boolean;
  data: ResumeData;
}) {
  state = derive(next);
  emit();
}

export function addResumeFile(input: { name: string; ext: ResumeFileExt; size: number }): ResumeFile {
  const file: ResumeFile = {
    id: uid(),
    name: input.name,
    ext: input.ext,
    size: input.size,
    uploadedAt: new Date().toISOString(),
  };
  const files = [...state.files, file];
  const primaryId = state.primaryId ?? file.id;
  commit({ files, primaryId, consented: state.consented, data: state.data });
  return file;
}

export function renameResumeFile(id: string, name: string) {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return;
  const files = state.files.map((f) => (f.id === id ? { ...f, name: trimmed } : f));
  commit({ files, primaryId: state.primaryId, consented: state.consented, data: state.data });
}

export function setPrimaryResumeFile(id: string) {
  if (!state.files.some((f) => f.id === id)) return;
  commit({ files: state.files, primaryId: id, consented: state.consented, data: state.data });
}

/**
 * Deletes a file. If it was primary, promotes the next most recently uploaded
 * file. Returns the new primary file (or null) so callers can toast.
 */
export function deleteResumeFile(id: string): { promoted: ResumeFile | null; wasPrimary: boolean } {
  const wasPrimary = state.primaryId === id;
  const files = state.files.filter((f) => f.id !== id);
  let primaryId = state.primaryId;
  let promoted: ResumeFile | null = null;
  if (wasPrimary) {
    const next = [...files].sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))[0] ?? null;
    primaryId = next?.id ?? null;
    promoted = next;
  }
  commit({ files, primaryId, consented: state.consented, data: state.data });
  return { promoted, wasPrimary };
}

export function setResumeConsent(v: boolean) {
  if (state.consented === v) return;
  commit({ files: state.files, primaryId: state.primaryId, consented: v, data: state.data });
}

export function updateResumeData(patch: Partial<ResumeData>) {
  state = { ...state, data: { ...state.data, ...patch } };
  emit();
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function addExperience() {
  const entry: ResumeExperience = { id: uid(), role: "", company: "", dates: "", bullets: [], description: "" };
  state = { ...state, data: { ...state.data, experience: [...state.data.experience, entry] } };
  emit();
  return entry.id;
}

export function updateExperience(id: string, patch: Partial<ResumeExperience>) {
  state = {
    ...state,
    data: {
      ...state.data,
      experience: state.data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    },
  };
  emit();
}

export function removeExperience(id: string) {
  state = { ...state, data: { ...state.data, experience: state.data.experience.filter((e) => e.id !== id) } };
  emit();
}

export function reorderExperience(id: string, dir: -1 | 1) {
  const list = [...state.data.experience];
  const i = list.findIndex((e) => e.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  state = { ...state, data: { ...state.data, experience: list } };
  emit();
}

export function addEducation() {
  const entry: ResumeEducation = { id: uid(), degree: "", school: "", years: "", degreeType: "", field: "" };
  state = { ...state, data: { ...state.data, education: [...state.data.education, entry] } };
  emit();
  return entry.id;
}

export function updateEducation(id: string, patch: Partial<ResumeEducation>) {
  state = {
    ...state,
    data: {
      ...state.data,
      education: state.data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    },
  };
  emit();
}

export function removeEducation(id: string) {
  state = { ...state, data: { ...state.data, education: state.data.education.filter((e) => e.id !== id) } };
  emit();
}