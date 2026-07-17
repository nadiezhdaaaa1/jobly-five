// Simple in-memory + sessionStorage store shared across quiz → matches → auth.
// No backend yet; this survives client-side navigation and refresh.

export type QuizAnswers = {
  role?: string;
  stack?: string[];
  level?: string;
  years?: number;
  languages?: string[];
  remote?: boolean;
  location?: string;
  locations?: string[];
  salaryMin?: number;
  salaryMax?: number;
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