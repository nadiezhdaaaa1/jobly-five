import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { GoogleMark } from "@/components/site/GoogleMark";
import { Wordmark } from "@/components/site/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { TurnstileWidget } from "@/components/site/TurnstileWidget";
import { captchaConfigured } from "@/config/turnstile";
import { guardAuthAttempt } from "@/lib/auth-guard.functions";
import { isDisposableEmail } from "@/lib/disposable-domains";
import {
  markPendingSignupAcceptance,
  recordSignupAcceptance,
} from "@/lib/policy-acceptance";

/** Neutral copy: identical whether or not the address already has an account. */
const SIGNUP_NEUTRAL_NOTICE =
  "If that email isn't already registered, we've sent a confirmation link. Check your inbox.";
const RATE_LIMIT_COPY = "Too many attempts. Try again in a few minutes.";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Jobly" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  // Invisible bot checks: a field humans never see, and a floor on fill time.
  const [honeypot, setHoneypot] = useState("");
  const mountedAt = useRef(Date.now());

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleGoogle() {
    setError(null);
    if (!acceptedPolicies) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    // No email until the callback returns; park the tick and record on boot.
    markPendingSignupAcceptance();
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message || "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail) return setError("Enter a valid email address.");
    if (!acceptedPolicies)
      return setError("Please accept the Terms of Service and Privacy Policy to continue.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (isDisposableEmail(email)) return setError("Please use a permanent email address.");
    // Bots fill the hidden field or submit instantly. Same neutral outcome, no signup.
    if (honeypot.trim() !== "" || Date.now() - mountedAt.current < 1500) {
      setError(null);
      setNotice(SIGNUP_NEUTRAL_NOTICE);
      return;
    }
    setError(null);
    setSubmitting(true);

    const gate = await guardAuthAttempt({
      data: { kind: "signup", email: email.trim(), captchaToken: captchaToken ?? undefined },
    });
    if (!gate.ok) {
      setSubmitting(false);
      setError(
        gate.reason === "disposable"
          ? "Please use a permanent email address."
          : gate.reason === "captcha"
            ? "Please complete the verification and try again."
            : RATE_LIMIT_COPY,
      );
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.trim() || undefined },
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
    setSubmitting(false);
    if (err) {
      // Never disclose that an address is taken.
      const enumerating = /already|registered|exists/i.test(err.message);
      if (enumerating) setNotice(SIGNUP_NEUTRAL_NOTICE);
      else setError(err.message);
      return;
    }
    if (data.session) {
      void recordSignupAcceptance(email.trim());
      navigate({ to: "/dashboard" });
    } else {
      void recordSignupAcceptance(email.trim());
      setNotice(SIGNUP_NEUTRAL_NOTICE);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="pt-6 pb-6">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link to="/" aria-label="Jobly home" className="flex items-center">
            <Wordmark className="!text-current" />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl">Create your account</h1>
        <p className="mt-2 text-[color:var(--color-text-secondary)]">
          Start getting five matches a day.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting || googleLoading}
            className="secondary_button secondary_button--on-light w-full justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="my-2 flex items-center gap-3 text-xs uppercase tracking-widest text-[color:var(--color-text-muted)]">
            <span className="h-px flex-1 bg-[color:var(--color-border)]" />
            or
            <span className="h-px flex-1 bg-[color:var(--color-border)]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <label className="block">
              <span className="text-sm font-light text-[#090B0C]">Full name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className={cn(
                  "mt-1.5 h-12 w-full rounded-[12px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  "border-[color:var(--color-border)]"
                )}
              />
            </label>
            <label className="block">
              <span className="text-sm font-light text-[#090B0C]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={cn(
                  "mt-1.5 h-12 w-full rounded-[12px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]"
                )}
              />
            </label>
            <label className="block">
              <span className="text-sm font-light text-[#090B0C]">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={cn(
                  "mt-1.5 h-12 w-full rounded-[12px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]"
                )}
              />
            </label>
            {error && <span className="text-sm text-[color:var(--color-danger)]">{error}</span>}
            {notice && <span className="text-sm text-[color:var(--color-green)]">{notice}</span>}

            {/* Hidden from people and assistive tech; only bots fill it in. */}
            <input
              type="text"
              name="company_website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {captchaConfigured && <TurnstileWidget onToken={setCaptchaToken} className="mt-1" />}

            <label className="mt-1 flex items-start gap-2.5 text-sm text-[color:var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={acceptedPolicies}
                onChange={(e) => setAcceptedPolicies(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-[4px]"
              />
              <span>
                I agree to the{" "}
                <Link to="/legal/terms" className="text-[color:var(--color-green)] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/legal/privacy" className="text-[color:var(--color-green)] hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !acceptedPolicies}
              className="main_accent_button main_accent_button--on-light w-full justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-sm text-[color:var(--color-text-secondary)]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[color:var(--color-green)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 rounded-[12px]"
          >
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}
