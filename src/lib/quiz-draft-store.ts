// Client side of the quiz draft: token handling plus a background writer.
// Saving never blocks the user — failures retry quietly and are then dropped.
import { getQuizDraft, saveQuizDraft, discardQuizDraft } from "./quiz-draft.functions";
import type { QuizAnswers } from "./quiz-store";

const TOKEN_KEY = "jobly.quiz.draft";
export const QUIZ_SCHEMA_VERSION = 1;

/**
 * The token is a bearer credential for a draft holding role, location and
 * salary expectations: never put it in a URL, an event, or a log line.
 * localStorage (not sessionStorage) is the point — it survives tab close.
 */
export function getDraftToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function ensureDraftToken(): string | null {
  if (typeof window === "undefined") return null;
  const existing = getDraftToken();
  if (existing) return existing;
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    return null;
  }
  return token;
}

export function clearDraftToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export type DraftSnapshot = {
  answers: QuizAnswers;
  completedSteps: string[];
  currentStep: string | null;
};

export async function fetchDraft(): Promise<DraftSnapshot | null> {
  const token = getDraftToken();
  if (!token) return null;
  try {
    const res = await getQuizDraft({ data: { token } });
    return res.draft ?? null;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fire-and-forget save: two retries with backoff, then give up silently.
 * A network blip must never cost a conversion, so nothing here surfaces to UI.
 */
export function queueDraftSave(input: {
  answers: QuizAnswers;
  completedSteps: string[];
  currentStep: string | null;
}) {
  const token = ensureDraftToken();
  if (!token) return;
  void (async () => {
    const payload = {
      token,
      answers_patch: input.answers,
      completed_steps: input.completedSteps,
      current_step: input.currentStep,
      schema_version: QUIZ_SCHEMA_VERSION,
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await saveQuizDraft({ data: payload });
        if (res.ok) return;
      } catch {
        // fall through to retry
      }
      if (attempt < 2) await sleep(400 * 2 ** attempt);
    }
  })();
}

/** Catches the in-progress step when the tab goes away mid-answer. */
export function beaconDraftSave(input: {
  answers: QuizAnswers;
  completedSteps: string[];
  currentStep: string | null;
}) {
  const token = getDraftToken();
  if (!token || typeof navigator === "undefined" || !navigator.sendBeacon) return;
  const body = JSON.stringify({
    token,
    answers_patch: input.answers,
    completed_steps: input.completedSteps,
    current_step: input.currentStep,
    schema_version: QUIZ_SCHEMA_VERSION,
  });
  try {
    navigator.sendBeacon(
      "/api/public/hooks/quiz-draft-save",
      new Blob([body], { type: "application/json" }),
    );
  } catch {
    // ignore
  }
}

export async function abandonDraft(): Promise<void> {
  const token = getDraftToken();
  clearDraftToken();
  if (!token) return;
  try {
    await discardQuizDraft({ data: { token } });
  } catch {
    // ignore
  }
}
