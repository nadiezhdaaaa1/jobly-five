// One registration surface for every plan decision. The full /signup and
// /login pages still exist for direct navigation; both they and this modal call
// src/lib/auth/authActions.ts, so the security controls can never drift.

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconCheck as Check, IconLoader2 as Loader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { GoogleMark } from "@/components/site/GoogleMark";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TurnstileWidget } from "@/components/site/TurnstileWidget";
import { captchaConfigured } from "@/config/turnstile";
import {
  fetchSigninGate,
  signInWithEmail,
  signUpWithEmail,
  startGoogleAuth,
} from "@/lib/auth/authActions";
import { stampDraftEmail } from "@/lib/quiz-draft-store";
import { EVENTS, track } from "@/lib/analytics";

export type RegistrationSource = "landing_card" | "pricing_section" | "matches_plan_step";

const inputClass = (invalid: boolean) =>
  cn(
    "mt-1.5 h-12 w-full rounded-[12px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
    invalid ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]",
  );

export function RegistrationModal({
  open,
  onOpenChange,
  onAuthed,
  /** Where Google should come back to; the opener owns the continuation. */
  googleRedirectPath,
  source,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAuthed: () => void;
  googleRedirectPath?: string;
  source: RegistrationSource;
}) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [needCaptcha, setNeedCaptcha] = useState(false);
  // Invisible bot checks: a field humans never see, and a floor on fill time.
  const [honeypot, setHoneypot] = useState("");
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (!open) return;
    mountedAt.current = Date.now();
    setError(null);
    setNotice(null);
    setSubmitting(false);
    setGoogleLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "signin" || !captchaConfigured) return;
    void fetchSigninGate().then(setNeedCaptcha);
  }, [open, mode]);

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const result = await startGoogleAuth({
      mode,
      acceptedPolicies,
      ...(googleRedirectPath ? { redirectPath: googleRedirectPath } : {}),
    });
    if ("kind" in result) {
      setError(result.error);
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return;
    track(EVENTS.authSucceeded, { method: "google", mode, source });
    onAuthed();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const result =
      mode === "signup"
        ? await signUpWithEmail({
            name,
            email,
            password,
            acceptedPolicies,
            captchaToken,
            honeypot,
            mountedAt: mountedAt.current,
          })
        : await signInWithEmail({ email, password, captchaToken });
    setSubmitting(false);

    if (result.kind === "error") {
      if (result.needCaptcha) setNeedCaptcha(true);
      setError(result.error);
      return;
    }
    if (mode === "signup") {
      // Keeps draft recovery alive now that the quiz no longer asks for an email:
      // a token lost between sign-up and the confirmation link can still be
      // matched by address.
      void stampDraftEmail(email);
    }
    if (result.kind === "notice") {
      setNotice(result.notice);
      return;
    }
    track(EVENTS.authSucceeded, { method: "password", mode, source });
    onAuthed();
  }

  const isSignup = mode === "signup";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] sm:rounded-[20px]">
        <DialogHeader>
          <DialogTitle>{isSignup ? "Create your account" : "Log in"}</DialogTitle>
          <DialogDescription>
            {isSignup
              ? "Your matches and preferences stay with your account."
              : "Welcome back. Pick up where you left off."}
          </DialogDescription>
        </DialogHeader>

        {notice ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[color:var(--color-green)]">{notice}</p>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Open the link in that email to finish setting up your account. You can close this
              window — your plan choice is saved.
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
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting || googleLoading}
              className="secondary_button secondary_button--on-light w-full justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>

            <div className="my-1 flex items-center gap-3 text-xs uppercase tracking-widest text-[color:var(--color-text-muted)]">
              <span className="h-px flex-1 bg-[color:var(--color-border)]" />
              or
              <span className="h-px flex-1 bg-[color:var(--color-border)]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              {isSignup && (
                <label className="block">
                  <span className="text-sm font-light text-[color:var(--color-foreground)]">
                    Full name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className={inputClass(false)}
                  />
                </label>
              )}
              <label className="block">
                <span className="text-sm font-light text-[color:var(--color-foreground)]">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputClass(Boolean(error))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-light text-[color:var(--color-foreground)]">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? "At least 8 characters" : "Your password"}
                  className={inputClass(Boolean(error))}
                />
              </label>
              {error && <span className="text-sm text-[color:var(--color-danger)]">{error}</span>}

              {/* Hidden from people and assistive tech; only bots fill it in. */}
              {isSignup && (
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
              )}

              {captchaConfigured && (isSignup || needCaptcha) && (
                <TurnstileWidget onToken={setCaptchaToken} className="mt-1" />
              )}

              {isSignup && (
                <label className="mt-1 flex items-start gap-2.5 text-sm text-[color:var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={acceptedPolicies}
                    onChange={(e) => setAcceptedPolicies(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[6px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--color-ring)] peer-focus-visible:ring-offset-2",
                      acceptedPolicies
                        ? "border-[color:var(--color-green)] bg-[color:var(--color-green)]"
                        : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)]",
                    )}
                  >
                    {acceptedPolicies && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <span>
                    I agree to the{" "}
                    <Link
                      to="/legal/terms"
                      className="text-[color:var(--color-green)] hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/legal/privacy"
                      className="text-[color:var(--color-green)] hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={submitting || (isSignup && !acceptedPolicies)}
                className="main_accent_button main_accent_button--on-light w-full justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isSignup ? "Creating account…" : "Logging in…"}
                  </>
                ) : isSignup ? (
                  "Create account"
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            <p className="text-sm text-[color:var(--color-text-secondary)]">
              {isSignup ? "Already have an account? " : "New to Jobly? "}
              <button
                type="button"
                onClick={() => {
                  setMode(isSignup ? "signin" : "signup");
                  setError(null);
                }}
                className="rounded-[12px] font-light text-[color:var(--color-green)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
              >
                {isSignup ? "Log in" : "Create an account"}
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
