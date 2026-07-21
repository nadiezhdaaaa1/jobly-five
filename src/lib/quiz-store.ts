// Simple in-memory + sessionStorage store shared across quiz → matches → auth.
// No backend yet; this survives client-side navigation and refresh.

export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Native";
export type WorkMode = "remote" | "onsite";
export type AdditionalLanguage = { lang: string; level: ProficiencyLevel };

export type QuizAnswers = {
  field?: string;
  role?: string; // legacy, kept for backward-compat
  roles?: string[];
  stack?: string[]; // legacy — replaced by hardSkills/softSkills/tools
  hardSkills?: string[];
  softSkills?: string[];
  tools?: string[];
  level?: string;
  years?: number;
  languages?: string[]; // legacy
  primaryLanguage?: string;
  additionalLanguages?: AdditionalLanguage[];
  workMode?: WorkMode;
  remote?: boolean;
  location?: string;
  locations?: string[];
  salaryMin?: number;
  salaryMax?: number;
  openToRelocate?: boolean;
  openToTravel?: boolean;
  email?: string;
};

const KEY = "jobly.quiz";

export function loadQuiz(): QuizAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuizAnswers) : {};
  } catch {
    return {};
  }
}

export function saveQuiz(a: QuizAnswers) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // ignore
  }
}

export function clearQuiz() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function updateQuiz(patch: Partial<QuizAnswers>) {
  const next = { ...loadQuiz(), ...patch };
  saveQuiz(next);
}