// Server-only draft logic. Shared by the quiz server functions and the
// sendBeacon HTTP route so both paths behave identically.
import type { Json } from "@/integrations/supabase/types";
import type { QuizAnswers } from "./quiz-store";

export const QUIZ_SCHEMA_VERSION = 1;

/** Top-level keys a draft may carry. Anything else is dropped, not an error. */
const ALLOWED_KEYS = new Set([
  "field", "role", "roles", "stack", "stackSkills", "stackCustom",
  "hardSkills", "hardCustom", "softSkills", "softCustom", "tools", "toolsCustom",
  "level", "track", "years", "languages", "primaryLanguage", "additionalLanguages",
  "workMode", "remote", "location", "locations", "salaryMin", "salaryMax",
  "openToRelocate", "openToTravel", "scope", "segment", "motion",
  "visitedOptional",
]);

const MAX_ANSWERS_BYTES = 16 * 1024;
const MAX_ROLES = 3;
const MAX_CHIPS = 50;
const CHIP_KEYS = [
  "stack", "stackSkills", "stackCustom", "hardSkills", "hardCustom",
  "softSkills", "softCustom", "tools", "toolsCustom", "locations", "languages",
] as const;

export function sha256Hex(input: string): Promise<string> {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(input))
    .then((buf) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );
}

/** Drops unknown keys and caps array fields. Partial/empty values stay valid. */
export function sanitizeAnswersPatch(patch: unknown): Record<string, unknown> {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    out[k] = v;
  }
  if (Array.isArray(out["roles"])) out["roles"] = (out["roles"] as unknown[]).slice(0, MAX_ROLES);
  for (const k of CHIP_KEYS) {
    if (Array.isArray(out[k])) out[k] = (out[k] as unknown[]).slice(0, MAX_CHIPS);
  }
  return out;
}

export function withinSizeCap(answers: unknown): boolean {
  return new TextEncoder().encode(JSON.stringify(answers ?? {})).length <= MAX_ANSWERS_BYTES;
}

export function sanitizeSteps(steps: unknown): string[] {
  if (!Array.isArray(steps)) return [];
  return steps.filter((s): s is string => typeof s === "string").slice(0, 40);
}

// Coarse per-IP write limiter: 60 writes / 5 min. Worker-local by design —
// it blunts hammering without a round trip on the conversion path.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_WRITES = 60;
const hits = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_WRITES) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

export type SaveDraftInput = {
  token: string;
  answers_patch?: unknown;
  current_step?: string | null;
  completed_steps?: unknown;
  schema_version?: number;
};

/** Creates or shallow-merges a draft. Never throws for validation reasons. */
export async function saveDraft(input: SaveDraftInput): Promise<{ ok: boolean }> {
  if (!input?.token || typeof input.token !== "string" || input.token.length < 32) {
    return { ok: false };
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const tokenHash = await sha256Hex(input.token);
  const patch = sanitizeAnswersPatch(input.answers_patch);
  const completed = sanitizeSteps(input.completed_steps);
  const version = input.schema_version === QUIZ_SCHEMA_VERSION ? QUIZ_SCHEMA_VERSION : QUIZ_SCHEMA_VERSION;

  const { data: existing } = await supabaseAdmin
    .from("quiz_drafts")
    .select("id, answers, status, completed_steps")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  const merged = {
    ...(((existing?.answers as Record<string, unknown>) ?? {}) as Record<string, unknown>),
    ...patch,
  };
  if (!withinSizeCap(merged)) return { ok: false };

  // Drafts never carry an email address: an unverified address on an anonymous
  // draft is not proof of anything, and matching by it would let one person's
  // answers land on another person's account. Recovery is token-only.
  const email = null;
  const status = existing?.status === "claimed" ? "claimed" : "in_progress";

  const row = {
    answers: merged as Json,
    completed_steps: completed.length ? completed : (existing?.completed_steps ?? []),
    current_step: typeof input.current_step === "string" ? input.current_step : null,
    email,
    status,
    schema_version: version,
    last_seen_at: new Date().toISOString(),
  };

  if (existing) {
    if (existing.status === "claimed") return { ok: true };
    const { error } = await supabaseAdmin.from("quiz_drafts").update(row).eq("id", existing.id);
    return { ok: !error };
  }
  const { error } = await supabaseAdmin.from("quiz_drafts").insert({ ...row, token_hash: tokenHash });
  return { ok: !error };
}

export type DraftPayload = {
  answers: QuizAnswers;
  completedSteps: string[];
  currentStep: string | null;
};

export async function getDraft(token: string): Promise<DraftPayload | null> {
  if (!token || typeof token !== "string") return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const tokenHash = await sha256Hex(token);
  const { data } = await supabaseAdmin
    .from("quiz_drafts")
    .select("answers, completed_steps, current_step, status, schema_version")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  // A stale-schema or already-claimed draft is never rehydrated.
  if (!data || data.status !== "in_progress" || data.schema_version !== QUIZ_SCHEMA_VERSION) {
    return null;
  }
  return {
    answers: (data.answers ?? {}) as QuizAnswers,
    completedSteps: data.completed_steps ?? [],
    currentStep: data.current_step ?? null,
  };
}
