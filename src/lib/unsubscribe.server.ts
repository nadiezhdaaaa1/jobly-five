/**
 * Shared token-based suppression, used by the one-click email link (GET) and
 * the first-party preferences page (POST). No auth: the unsubscribe_token is
 * the credential. Idempotent — a repeat call must not 500.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SuppressResult = { ok: true } | { ok: false; reason: "invalid_token" | "not_found" };

export async function suppressByToken(
  token: string,
  opts?: { channel?: string | null; userAgent?: string | null },
): Promise<SuppressResult> {
  if (!UUID_RE.test(token)) return { ok: false, reason: "invalid_token" };

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { CONSENT_CHANNELS, POLICY_VERSION } = await import("@/config/consent");
    const { data: contact } = await supabaseAdmin
      .from("email_contacts")
      .select("email, user_id, suppressed_at")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (!contact) return { ok: false, reason: "not_found" };

    const channel = opts?.channel ?? null;
    const requested =
      channel && (CONSENT_CHANNELS as readonly string[]).includes(channel)
        ? [channel]
        : [...CONSENT_CHANNELS].filter((c) => c !== "resume_storage" && c !== "billing_terms");

    // Withdrawal is a new row per channel; history is never rewritten.
    await supabaseAdmin.from("consent_records").insert(
      requested.map((c) => ({
        user_id: contact.user_id,
        email: contact.email,
        channel: c as never,
        granted: false,
        lawful_basis: "consent",
        source: "unsubscribe_link",
        consent_text: `Unsubscribed via one-click email link (${c})`,
        policy_version: POLICY_VERSION,
        user_agent: opts?.userAgent?.slice(0, 500) ?? null,
      })),
    );

    if (!contact.suppressed_at) {
      await supabaseAdmin
        .from("email_contacts")
        .update({ suppressed_at: new Date().toISOString(), suppression_reason: "unsubscribe" })
        .eq("email", contact.email);
    }
    return { ok: true };
  } catch (e) {
    // Deliberate: an unexpected failure is still reported as success so the
    // recipient never sees an error on a compliance surface.
    console.error("[unsubscribe]", e instanceof Error ? e.message : e);
    return { ok: true };
  }
}
