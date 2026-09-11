import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DraftPayload, SaveDraftInput } from "./quiz-draft.server";

/** Anonymous: the quiz runs before an account exists. */
export const saveQuizDraft = createServerFn({ method: "POST" })
  .inputValidator((input: SaveDraftInput) => input)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { rateLimited, saveDraft } = await import("./quiz-draft.server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    if (rateLimited(ip)) return { ok: false };
    return saveDraft(data);
  });

export const getQuizDraft = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }): Promise<{ draft: DraftPayload | null }> => {
    const { getDraft } = await import("./quiz-draft.server");
    return { draft: await getDraft(data.token) };
  });

/**
 * Claims a draft for the signed-in user and copies the answers onto their
 * profile row. Idempotent — a second claim is a no-op.
 * Recovery is token-only: nothing may be claimed by email address, because an
 * address on a draft is never proof that the person holding the draft controls
 * it. Anyone could otherwise push their own answers into someone else's profile.
 */
export const claimQuizDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { token?: string | null }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; claimed: boolean }> => {
    const { sha256Hex, QUIZ_SCHEMA_VERSION } = await import("./quiz-draft.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const email =
      typeof context.claims["email"] === "string" ? (context.claims["email"] as string) : null;

    let draft: {
      id: string;
      answers: unknown;
      schema_version: number;
      status: string;
      user_id: string | null;
      email: string | null;
    } | null = null;

    if (data.token) {
      const { data: byToken } = await supabaseAdmin
        .from("quiz_drafts")
        .select("id, answers, schema_version, status, user_id, email")
        .eq("token_hash", await sha256Hex(data.token))
        .maybeSingle();
      draft = byToken ?? null;
    }

    if (!draft) return { ok: true, claimed: false };
    // A draft already bound to another account is never re-bound, whoever holds
    // the token: it carries that person's answers.
    if (draft.user_id && draft.user_id !== userId) return { ok: true, claimed: false };
    // Same rule by address: if the draft names an email, it must be this account's.
    if (draft.email && email && draft.email.toLowerCase() !== email.toLowerCase()) {
      return { ok: true, claimed: false };
    }
    if (draft.status === "claimed") return { ok: true, claimed: draft.user_id === userId };
    if (draft.schema_version !== QUIZ_SCHEMA_VERSION) return { ok: true, claimed: false };

    const { error: claimError } = await supabaseAdmin
      .from("quiz_drafts")
      .update({ user_id: userId, status: "claimed", claimed_at: new Date().toISOString() })
      .eq("id", draft.id);
    if (claimError) return { ok: false, claimed: false };

    // Draft answers land verbatim on the existing profiles row.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        quiz_answers: (draft.answers ?? {}) as never,
        quiz_schema_version: QUIZ_SCHEMA_VERSION,
      })
      .eq("id", userId);
    if (profileError) return { ok: false, claimed: false };

    return { ok: true, claimed: true };
  });

/** Discards a draft when the user chooses to start fresh. */
export const discardQuizDraft = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { sha256Hex } = await import("./quiz-draft.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("quiz_drafts")
      .update({ status: "abandoned" })
      .eq("token_hash", await sha256Hex(data.token));
    return { ok: !error };
  });
