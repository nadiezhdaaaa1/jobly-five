// Shared quiz answers store: in-memory working copy, persisted server-side.
// Anonymous visitors are backed by a quiz_drafts row (see quiz-draft-store.ts);
// signed-in users are backed by profiles.quiz_answers. Nothing lives in
// sessionStorage any more — a closed tab used to destroy the whole onboarding.

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
  track?: "IC" | "Mgmt" | "Exec";
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
  // Match-weighting axes (conditional per role/level; see quiz.tsx AxesStep).
  scope?: { orgSize?: string; budget?: string; stage?: string };
  segment?: string;
  motion?: string;
  // Tracks skill sections the user has explicitly continued past.
  // Used to treat 'optional' sections as complete even when empty.
  visitedOptional?: ("stack" | "hard" | "tools" | "soft")[];
};

const LEGACY_KEY = "jobly.quiz";

let answers: QuizAnswers = {};
const listeners = new Set<() => void>();

export function loadQuiz(): QuizAnswers {
  return answers;
}

export function saveQuiz(a: QuizAnswers) {
  answers = a ?? {};
  for (const l of listeners) l();
}

export function clearQuiz() {
  saveQuiz({});
}

export function updateQuiz(patch: Partial<QuizAnswers>) {
  saveQuiz({ ...answers, ...patch });
  void persistQuizToProfile();
}

export function subscribeQuiz(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Reads legacy sessionStorage answers once, then removes them. */
export function takeLegacyQuiz(): QuizAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LEGACY_KEY);
    window.sessionStorage.removeItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizAnswers;
    return parsed && Object.keys(parsed).length ? parsed : null;
  } catch {
    return null;
  }
}

/** Hydrates from profiles.quiz_answers after sign-in. */
export async function hydrateQuizFromProfile(): Promise<void> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data } = await supabase
      .from("profiles")
      .select("quiz_answers")
      .eq("id", auth.user.id)
      .maybeSingle();
    const stored = (data?.quiz_answers ?? {}) as QuizAnswers;
    if (stored && Object.keys(stored).length) saveQuiz(stored);
  } catch {
    // Preferences stay empty rather than blocking the app.
  }
}

/** Writes the working copy back to the profile. Silent on failure. */
export async function persistQuizToProfile(): Promise<void> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase
      .from("profiles")
      .update({ quiz_answers: answers as never })
      .eq("id", auth.user.id);
  } catch {
    // ignore
  }
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