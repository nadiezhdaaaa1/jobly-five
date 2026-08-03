import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RecordConsentInput = {
  email: string;
  channel: string;
  granted: boolean;
  source: string;
  consentText: string;
  policyVersion?: string;
  /** Honeypot — must stay empty, matching the other public forms. */
  hp?: string;
};

export type CurrentConsentRow = {
  channel: string;
  granted: boolean;
  source: string;
  policyVersion: string;
  createdAt: string;
};

/**
 * Anonymous-callable: the quiz email gate runs pre-account. IP and user agent
 * are derived from the request; any values in the body are ignored.
 */
export const recordConsent = createServerFn({ method: "POST" })
  .inputValidator((input: RecordConsentInput) => input)
  .handler(async ({ data }) => {
    if (data.hp) return { ok: true as const, inserted: 0 };
    const { getRequestHeader, getRequestIP } = await import("@tanstack/react-start/server");
    const { writeConsent, verifiedCaller } = await import("./consent.server");
    const caller = await verifiedCaller(getRequestHeader("authorization") ?? null);
    return await writeConsent(data, {
      ip: getRequestIP({ xForwardedFor: true }) ?? null,
      userAgent: getRequestHeader("user-agent") ?? null,
      userId: caller?.userId ?? null,
    });
  });

/** Current consent state for the signed-in user, latest row per channel. */
export const listMyConsent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CurrentConsentRow[]> => {
    const { data } = await context.supabase
      .from("current_consent")
      .select("channel, granted, source, policy_version, created_at")
      .eq("user_id", context.userId);
    return (data ?? []).map((r) => ({
      channel: String(r.channel),
      granted: r.granted === true,
      source: String(r.source),
      policyVersion: String(r.policy_version),
      createdAt: String(r.created_at),
    }));
  });

/**
 * Post-auth linking: backfills user_id onto contact and consent rows created
 * before the account existed (quiz email gate, unsubscribe link).
 */
export const linkConsentToAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { normalizeEmail, ensureEmailContact } = await import("./consent.server");
    const email = normalizeEmail(context.claims["email"]);
    if (!email) return { ok: false as const, linked: 0 };
    await ensureEmailContact(email, context.userId);
    const { data } = await supabaseAdmin
      .from("consent_records")
      .update({ user_id: context.userId })
      .eq("email", email)
      .is("user_id", null)
      .select("id");
    return { ok: true as const, linked: data?.length ?? 0 };
  });
