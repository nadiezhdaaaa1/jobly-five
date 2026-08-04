// Server-side Turnstile verification. Server-only by filename.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** False when no secret is configured — captcha steps are then skipped. */
export function captchaEnforced(): boolean {
  return Boolean(process.env['TURNSTILE_SECRET_KEY']);
}

export async function verifyCaptcha(
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  const secret = process.env['TURNSTILE_SECRET_KEY'];
  if (!secret) return true; // not configured: nothing to verify
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    // Cloudflare unreachable: do not lock real users out of their account.
    return true;
  }
}
