/**
 * Server-only throttling for the public auth forms.
 *
 * Counts recent attempts per client IP in `auth_attempts` (a table no client
 * role can read or write) and answers two questions:
 *   - is this IP over the limit for this kind of attempt?
 *   - has it failed sign-in often enough to owe us a captcha?
 *
 * The answer never depends on whether the email exists, so nothing here can be
 * used to enumerate accounts.
 */

export type AuthAttemptKind = "signup" | "reset" | "signin_fail";

export type AuthGateVerdict = {
  /** Over the limit — refuse the action and show the neutral wait copy. */
  blocked: boolean;
  /** Enough recent sign-in failures that the next attempt must solve a captcha. */
  needCaptcha: boolean;
};

/** Window and ceilings per kind. Deliberately generous for humans. */
const WINDOW_MINUTES = 15;
const LIMITS: Record<AuthAttemptKind, number> = {
  signup: 5,
  reset: 5,
  signin_fail: 10,
};
/** Failed sign-ins from one IP before the widget appears (4th attempt). */
const CAPTCHA_AFTER_FAILURES = 3;

export async function hashEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** First hop of x-forwarded-for; null when we cannot tell (never throws). */
export function clientIp(forwardedFor: string | null | undefined): string | null {
  const first = (forwardedFor ?? "").split(",")[0]?.trim();
  if (!first) return null;
  // inet column: reject anything that is not a plausible address.
  const ok = /^[0-9a-fA-F:.]+$/.test(first);
  return ok ? first : null;
}

function windowStart() {
  return new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
}

async function countAttempts(kind: AuthAttemptKind, ip: string | null): Promise<number> {
  if (!ip) return 0;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("auth_attempts")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("ip", ip)
    .gte("created_at", windowStart());
  if (error) return 0; // Never lock a real user out because the counter failed.
  return count ?? 0;
}

/** Read-only: how the next attempt from this IP should be treated. */
export async function evaluateGate(
  kind: AuthAttemptKind,
  ip: string | null,
): Promise<AuthGateVerdict> {
  const used = await countAttempts(kind, ip);
  return {
    blocked: used >= LIMITS[kind],
    needCaptcha: kind === "signin_fail" && used >= CAPTCHA_AFTER_FAILURES,
  };
}

/** Logs one attempt, then reports how the following one should be treated. */
export async function recordAttempt(
  kind: AuthAttemptKind,
  ip: string | null,
  email: string | undefined,
): Promise<AuthGateVerdict> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("auth_attempts").insert({
    kind,
    ip,
    email_hash: email ? await hashEmail(email) : null,
  });
  return evaluateGate(kind, ip);
}
