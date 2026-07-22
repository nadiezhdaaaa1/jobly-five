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
  stackSkills?: string[];
  stackCustom?: string[];
  hardSkills?: string[];
  hardCustom?: string[];
  softSkills?: string[];
  softCustom?: string[];
  tools?: string[];
  toolsCustom?: string[];
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
  // Tracks skill sections the user has explicitly continued past.
  // Used to treat 'optional' sections as complete even when empty.
  visitedOptional?: ("stack" | "hard" | "tools" | "soft")[];
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

// Shared summary derived strictly from the quiz answers.
// Used by the Digest parameters card and the Profile match card so
// both surfaces always show identical information.
export type QuizSummary = {
  roles: string;
  stack: string;
  stackList: string[];
  experience: string;
  locationAndSalary: string;
  level: string;
  years: string;
  languages: string;
  locations: string;
  salary: string;
};

const DASH = "—";

export function quizSummary(q: QuizAnswers = loadQuiz()): QuizSummary {
  const rolesArr = q.roles?.length ? q.roles : q.role ? [q.role] : [];
  const roles = rolesArr.length ? rolesArr.join(", ") : DASH;

  const stackList = [...(q.hardSkills ?? []), ...(q.tools ?? [])];
  const stack = stackList.length ? stackList.join(", ") : DASH;

  const level = q.level ?? "";
  const years = typeof q.years === "number" ? `${q.years}y` : "";
  const langsArr = [
    q.primaryLanguage,
    ...((q.additionalLanguages ?? []).map((l) => l.lang)),
  ].filter(Boolean) as string[];
  const languages = langsArr.length ? langsArr.join(" · ") : "";
  const expParts = [level, years, languages].filter(Boolean);
  const experience = expParts.length ? expParts.join(" · ") : DASH;

  const locs = q.locations?.length ? q.locations : [];
  const locations = locs.length ? locs.join(" · ") : "";
  const salary =
    typeof q.salaryMin === "number" && typeof q.salaryMax === "number"
      ? `$${Math.round((q.salaryMin >= 1000 ? q.salaryMin / 1000 : q.salaryMin))}k–$${Math.round((q.salaryMax >= 1000 ? q.salaryMax / 1000 : q.salaryMax))}k`
      : "";
  const locSalParts = [locations, salary].filter(Boolean);
  const locationAndSalary = locSalParts.length ? locSalParts.join(" · ") : DASH;

  return {
    roles,
    stack,
    stackList,
    experience,
    locationAndSalary,
    level: level || DASH,
    years: years || DASH,
    languages: languages || DASH,
    locations: locations || DASH,
    salary: salary || DASH,
  };
}