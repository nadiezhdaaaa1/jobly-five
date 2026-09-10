import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { GoogleMark } from "@/components/site/GoogleMark";
import { Wordmark } from "@/components/site/Wordmark";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [resetOpen, setResetOpen] = useState(false);

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
        <h1 className="text-3xl sm:text-4xl">Log in</h1>
        <p className="mt-2 text-[color:var(--color-text-secondary)]">
          Welcome back. Pick up where you left off.
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
              <span className="text-sm font-light text-[#090B0C]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
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
                placeholder="Your password"
                className={cn(
                  "mt-1.5 h-12 w-full rounded-[12px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]"
                )}
              />
            </label>
            {error && (
              <span className="text-sm text-[color:var(--color-danger)]">{error}</span>
            )}
            {captchaConfigured && needCaptcha && (
              <TurnstileWidget onToken={setCaptchaToken} className="mt-1" />
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="text-sm text-[color:var(--color-green)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 rounded-[12px]"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="main_accent_button main_accent_button--on-light w-full justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
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
            className="text-[color:var(--color-green)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 rounded-[12px]"
          >
            Create an account
          </Link>
        </p>
      </main>

      <ForgotPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        initialEmail={email}
      />
    </div>
  );
}

function ForgotPasswordDialog({
  open,
  onOpenChange,
  initialEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialEmail: string;
}) {
  const [value, setValue] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialEmail);
      setError(null);
      setSent(false);
      setSending(false);
    }
  }, [open, initialEmail]);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSending(true);

    const gate = await guardAuthAttempt({
      data: { kind: "reset", email: value.trim(), captchaToken: token ?? undefined },
    });
    if (!gate.ok) {
      setSending(false);
      setError(
        gate.reason === "captcha"
          ? "Please complete the verification and try again."
          : RATE_LIMIT_COPY,
      );
      return;
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(value.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
      ...(token ? { captchaToken: token } : {}),
    });
    setSending(false);
    if (err && !/rate|limit/i.test(err.message)) {
      setError(err.message);
      return;
    }
    // Same outcome whether or not the address has an account — the link is only
    // ever delivered to a registered one, and we never say which it was.
    setSent(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] sm:rounded-[20px]">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            Enter the email address for your account and we will send you a recovery link.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              If an account exists for <span className="font-semibold">{value.trim()}</span>, a
              recovery link is on its way. Check your inbox, and your spam folder just in case.
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="main_accent_button main_accent_button--on-light w-full justify-center"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-3" noValidate>
            <label className="block">
              <span className="text-sm font-light text-[color:var(--color-foreground)]">Email</span>
              <input
                type="email"
                autoFocus
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder="Your email"
                className={cn(
                  "mt-1.5 h-12 w-full rounded-[12px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]",
                )}
              />
            </label>
            {error && <span className="text-sm text-[color:var(--color-danger)]">{error}</span>}
            {captchaConfigured && <TurnstileWidget onToken={setToken} className="mt-1" />}
            <button
              type="submit"
              disabled={sending}
              className="main_accent_button main_accent_button--on-light mt-1 w-full justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send recovery link"
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
