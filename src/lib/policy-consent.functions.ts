import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Only these policy documents map onto a consent channel we can record. */
export const RECONSENT_CHANNELS = ["terms", "privacy", "billing_terms"] as const;
export type ReconsentChannel = (typeof RECONSENT_CHANNELS)[number];

export type ReconsentItem = {
  documentKey: ReconsentChannel;
  version: string;
  changeSummary: string;
};

function isReconsentChannel(value: string): value is ReconsentChannel {
  return (RECONSENT_CHANNELS as readonly string[]).includes(value);
}

/** Documents whose current version this user has not affirmatively accepted. */
export const listReconsentNeeded = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReconsentItem[]> => {
    const { data } = await context.supabase.rpc("policies_needing_reconsent", {
      p_user_id: context.userId,
    });
    return (data ?? [])
      .filter((r) => isReconsentChannel(String(r.document_key)))
      .map((r) => ({
        documentKey: String(r.document_key) as ReconsentChannel,
        version: String(r.version),
        changeSummary: String(r.change_summary),
      }));
  });

export type AcceptPoliciesInput = {
  documentKeys: string[];
  consentText: string;
  source?: "settings" | "signup" | "checkout";
};

/**
 * Records affirmative acceptance of one or more policy documents at their
 * currently published version. Append-only evidence, same as every consent.
 */
export const acceptPolicies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AcceptPoliciesInput) => input)
  .handler(async ({ data, context }) => {
    const keys = data.documentKeys.filter(isReconsentChannel);
    if (keys.length === 0) return { ok: false as const, inserted: 0 };
    const { getRequestHeader, getRequestIP } = await import("@tanstack/react-start/server");
    const { writeConsent, normalizeEmail } = await import("./consent.server");
    const email = normalizeEmail(context.claims["email"]);
    if (!email) return { ok: false as const, inserted: 0 };

    // Stamp the version that is published right now, per document.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: versions } = await supabaseAdmin
      .from("current_policy_version")
      .select("document_key, version")
      .in("document_key", keys);
    const versionByKey = new Map(
      (versions ?? []).map((v) => [String(v.document_key), String(v.version)]),
    );

    const meta = {
      ip: getRequestIP({ xForwardedFor: true }) ?? null,
      userAgent: getRequestHeader("user-agent") ?? null,
      userId: context.userId,
    };
    let inserted = 0;
    for (const key of keys) {
      const res = await writeConsent(
        {
          email,
          channel: key,
          granted: true,
          source: data.source ?? "settings",
          consentText: data.consentText,
          policyVersion: versionByKey.get(key),
          lawfulBasis: key === "billing_terms" ? "contract" : "consent",
        },
        meta,
      );
      if (res.ok) inserted += res.inserted;
    }
    return { ok: true as const, inserted };
  });

/**
 * True when the signed-in user has affirmatively accepted the currently
 * published Billing Terms. Gates the paid path, nothing else.
 */
export const billingTermsAccepted = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ accepted: boolean; version: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current } = await supabaseAdmin
      .from("current_policy_version")
      .select("version")
      .eq("document_key", "billing_terms")
      .maybeSingle();
    const version = current?.version ? String(current.version) : null;
    if (!version) return { accepted: true, version: null };
    const { data: rows } = await supabaseAdmin
      .from("consent_records")
      .select("id")
      .eq("user_id", context.userId)
      .eq("channel", "billing_terms")
      .eq("policy_version", version)
      .eq("granted", true)
      .limit(1);
    return { accepted: (rows?.length ?? 0) > 0, version };
  });
