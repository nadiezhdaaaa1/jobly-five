import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { TurnstileWidget } from "@/components/site/TurnstileWidget";
import { captchaConfigured } from "@/config/turnstile";
import {
  guardAuthAttempt,
  getSigninGate,
  reportSigninFailure,
} from "@/lib/auth-guard.functions";

const RATE_LIMIT_COPY = "Too many attempts. Try again in a few minutes.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Jobly" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  /** Set by the server once this IP has failed sign-in three times. */
  const [needCaptcha, setNeedCaptcha] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    // If already signed in, skip login.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  useEffect(() => {
    // Ask the server whether this IP already owes us a verification.
    if (!captchaConfigured) return;
    getSigninGate()
      .then((gate) => setNeedCaptcha(gate.needCaptcha))
      .catch(() => setNeedCaptcha(false));
  }, []);

  async function handleGoogle() {
    setError(null);
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
    // Session already set — navigate.
    navigate({ to: "/dashboard" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 1) {
      setError("Enter your password.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const gate = await guardAuthAttempt({
      data: { kind: "signin", captchaToken: captchaToken ?? undefined },
    });
    if (!gate.ok) {
      setSubmitting(false);
      setNeedCaptcha(true);
      setError(
        gate.reason === "captcha"
          ? "Please complete the verification and try again."
          : RATE_LIMIT_COPY,
      );
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    });
    setSubmitting(false);
    if (err) {
      const failure = await reportSigninFailure({ data: { email: email.trim() } }).catch(() => null);
      if (failure?.needCaptcha) setNeedCaptcha(true);
      if (failure?.blocked) {
        setError(RATE_LIMIT_COPY);
        return;
      }
      setError(err.message === "Invalid login credentials" ? "Incorrect email or password." : err.message);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function handleForgotPassword() {
    if (!validEmail) {
      setError("Enter your email above first, then click Forgot password.");
      return;
    }
    setError(null);
    setResetRequested(true);

    const gate = await guardAuthAttempt({
      data: { kind: "reset", email: email.trim(), captchaToken: captchaToken ?? undefined },
    });
    if (!gate.ok) {
      setError(
        gate.reason === "captcha"
          ? "Please complete the verification and try again."
          : RATE_LIMIT_COPY,
      );
      return;
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
      ...(captchaToken ? { captchaToken } : {}),
    });
    // Same message either way — never reveal whether the address is registered.
    setError(err && !/rate|limit/i.test(err.message) ? err.message : "Check your inbox for a password reset link.");
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="pt-6 pb-6">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link to="/" className="text-[30px] font-bold text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-logo)" }}>
            jobly
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl">Log in</h1>
        <p className="mt-2 text-[color:var(--color-text-secondary)]">
          Welcome back. Pick up where you left off.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting || googleLoading}
            className="button-medium inline-flex h-12 items-center justify-center gap-3 rounded-button border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-5 transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="my-2 flex items-center gap-3 text-xs uppercase tracking-widest text-[color:var(--color-text-muted)]">
            <span className="h-px flex-1 bg-[color:var(--color-border)]" />
            or
            <span className="h-px flex-1 bg-[color:var(--color-border)]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <label className="block">
              <span className="text-sm font-light text-[#090B0C]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className={cn(
                  "mt-1.5 h-12 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
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
                placeholder="Your password"
                className={cn(
                  "mt-1.5 h-12 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]"
                )}
              />
            </label>
            {error && (
              <span className="text-sm text-[color:var(--color-danger)]">{error}</span>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[color:var(--color-green)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 rounded"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="button-medium inline-flex h-12 items-center justify-center gap-2 rounded-button px-5 transition-colors bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-sm text-[color:var(--color-text-secondary)]">
          New to Jobly?{" "}
          <Link
            to="/signup"
            className="text-[color:var(--color-green)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 rounded"
          >
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.4-4.4 2.2-7.1 2.2-5.4 0-9.9-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.8-3.7 5l6.2 5.1c-.4.4 6.7-4.9 6.7-14.1 0-1.2-.1-2.3-.3-3.5z" />
    </svg>
  );
}