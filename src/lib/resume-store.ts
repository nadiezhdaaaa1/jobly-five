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
  hasResume: boolean;
  filename: string | null;
  addedDate: string | null;
  data: ResumeData;
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
      dates: "2021 — Present · New York City",
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
      dates: "2017 — 2021 · Baltimore",
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
      dates: "2012 — 2017 · Philadelphia",
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

function initialState(): ResumeState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as ResumeState;
    } catch {
      // ignore
    }
  }
  return { hasResume: false, filename: null, addedDate: null, data: DEFAULT_RESUME };
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

const SERVER_STATE: ResumeState = { hasResume: false, filename: null, addedDate: null, data: DEFAULT_RESUME };
function getServerSnapshot() {
  return SERVER_STATE;
}

export function useResumeState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setResume(filename: string, data: ResumeData = DEFAULT_RESUME) {
  const now = new Date();
  const added = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  state = { hasResume: true, filename, addedDate: added, data };
  emit();
}

export function clearResume() {
  state = { hasResume: false, filename: null, addedDate: null, data: DEFAULT_RESUME };
  emit();
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