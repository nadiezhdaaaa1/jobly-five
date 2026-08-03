/**
 * Server-only consent writer. Consent is append-only evidence: every call
 * inserts a new row, nothing is ever updated or deleted. The client cannot
 * reach this table directly (no INSERT/UPDATE/DELETE grant), so all writes
 * funnel through here.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  CONSENT_CHANNELS,
  CONSENT_SOURCES,
  POLICY_VERSION,
  type ConsentChannelName,
  type ConsentSource,
} from "@/config/consent";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT_PER_MINUTE = 10;

export type ConsentWriteInput = {
  email: string;
  channel: string;
  granted: boolean;
  source: string;
  consentText: string;
  policyVersion?: string;
  lawfulBasis?: string;
};

export type ConsentWriteMeta = {
  ip: string | null;
  userAgent: string | null;
  userId: string | null;
};

export type ConsentWriteResult =
  | { ok: true; inserted: number }
  | { ok: false; code: "bad_email" | "bad_channel" | "bad_source" | "bad_text" | "rate_limited" | "server"; message?: string };

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 320 || !EMAIL_RE.test(email)) return null;
  return email;
}

function isChannel(value: string): value is ConsentChannelName {
  return (CONSENT_CHANNELS as readonly string[]).includes(value);
}

function isSource(value: string): value is ConsentSource {
  return (CONSENT_SOURCES as readonly string[]).includes(value);
}

/** Anonymous endpoint guard: count writes from this IP in the last minute. */
async function overRateLimit(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabaseAdmin
    .from("consent_records")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);
  return (count ?? 0) >= RATE_LIMIT_PER_MINUTE;
}

/** Creates the contact row on demand; never touches confirmed_at. */
export async function ensureEmailContact(email: string, userId: string | null) {
  const { data: existing } = await supabaseAdmin
    .from("email_contacts")
    .select("email, user_id")
    .eq("email", email)
    .maybeSingle();
  if (!existing) {
    await supabaseAdmin.from("email_contacts").insert({ email, user_id: userId }).select("email");
    return;
  }
  if (userId && !existing.user_id) {
    await supabaseAdmin.from("email_contacts").update({ user_id: userId }).eq("email", email);
  }
}

export async function writeConsent(
  input: ConsentWriteInput,
  meta: ConsentWriteMeta,
): Promise<ConsentWriteResult> {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, code: "bad_email" };
  if (!isChannel(input.channel)) return { ok: false, code: "bad_channel" };
  if (!isSource(input.source)) return { ok: false, code: "bad_source" };
  const consentText = (input.consentText ?? "").trim().slice(0, 2000);
  if (!consentText) return { ok: false, code: "bad_text" };
  if (await overRateLimit(meta.ip)) return { ok: false, code: "rate_limited" };

  await ensureEmailContact(email, meta.userId);

  const { error } = await supabaseAdmin.from("consent_records").insert({
    user_id: meta.userId,
    email,
    channel: input.channel,
    granted: Boolean(input.granted),
    lawful_basis: input.lawfulBasis ?? "consent",
    source: input.source,
    consent_text: consentText,
    policy_version: input.policyVersion ?? POLICY_VERSION,
    ip_address: meta.ip,
    user_agent: meta.userAgent?.slice(0, 500) ?? null,
  });
  if (error) return { ok: false, code: "server", message: error.message };
  return { ok: true, inserted: 1 };
}

/** Resolves the caller's verified identity from a bearer token, if present. */
export async function verifiedCaller(
  authHeader: string | null,
): Promise<{ userId: string; email: string | null } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (token.split(".").length !== 3) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { userId: data.user.id, email: data.user.email ?? null };
}
