/**
 * Cloudflare Turnstile — public configuration.
 *
 * The site key is publishable, so it may live in the codebase / VITE env. The
 * matching secret key is server-only (TURNSTILE_SECRET_KEY) and is used to
 * verify tokens inside the auth guard server functions.
 *
 * With no site key set, every captcha step is skipped and the forms behave
 * exactly as before — the IP throttle still applies.
 */
export const TURNSTILE_SITE_KEY: string =
  (import.meta.env['VITE_TURNSTILE_SITE_KEY'] as string | undefined) ?? "";

export const captchaConfigured = TURNSTILE_SITE_KEY.length > 0;
