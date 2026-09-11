// The one implementation of Jobly's auth actions.
// The full pages (/signup, /login) and the registration modal both call in
// here, so they can never drift apart — and every protection below is a
// security control, not boilerplate: Turnstile, the server-side attempt guard,
// the sign-in gate, the honeypot, the fill-time floor, the disposable-domain
// check, and enumeration-neutral copy.

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { guardAuthAttempt, getSigninGate, reportSigninFailure } from "@/lib/auth-guard.functions";
import { isDisposableEmail } from "@/lib/disposable-domains";
import { markPendingSignupAcceptance, recordSignupAcceptance } from "@/lib/policy-acceptance";

/** Neutral copy: identical whether or not the address already has an account. */
export const SIGNUP_NEUTRAL_NOTICE =
  "If that email isn't already registered, we've sent a confirmation link. Check your inbox.";
export const RATE_LIMIT_COPY = "Too many attempts. Try again in a few minutes.";

/** Bots submit instantly; humans do not. */
export const MIN_FILL_MS = 1500;

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export type AuthResult =
  /** A session exists now — the caller decides where to go next. */
  | { kind: "session" }
  /** Confirmation link sent, or the neutral equivalent. Nothing to navigate to. */
  | { kind: "notice"; notice: string }
  | { kind: "error"; error: string; needCaptcha?: boolean };

function gateError(reason: string | undefined): string {
  if (reason === "disposable") return "Please use a permanent email address.";
  if (reason === "captcha") return "Please complete the verification and try again.";
  return RATE_LIMIT_COPY;
}

export async function fetchSigninGate(): Promise<boolean> {
  try {
    const gate = await getSigninGate();
    return gate.needCaptcha;
  } catch {
    return false;
  }
}

export type SignUpInput = {
  name?: string;
  email: string;
  password: string;
  acceptedPolicies: boolean;
  captchaToken?: string | null;
  honeypot: string;
  /** Timestamp the form mounted at, for the fill-time floor. */
  mountedAt: number;
};

export async function signUpWithEmail(input: SignUpInput): Promise<AuthResult> {
  const email = input.email.trim();
  if (!isValidEmail(email)) return { kind: "error", error: "Enter a valid email address." };
  if (!input.acceptedPolicies)
    return {
      kind: "error",
      error: "Please accept the Terms of Service and Privacy Policy to continue.",
    };
  if (input.password.length < 8)
    return { kind: "error", error: "Password must be at least 8 characters." };
  if (isDisposableEmail(email))
    return { kind: "error", error: "Please use a permanent email address." };
  // Bots fill the hidden field or submit instantly. Same neutral outcome, no signup.
  if (input.honeypot.trim() !== "" || Date.now() - input.mountedAt < MIN_FILL_MS) {
    return { kind: "notice", notice: SIGNUP_NEUTRAL_NOTICE };
  }

  const gate = await guardAuthAttempt({
    data: { kind: "signup", email, captchaToken: input.captchaToken ?? undefined },
  });
  if (!gate.ok) return { kind: "error", error: gateError(gate.reason) };

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { full_name: input.name?.trim() || undefined },
      ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
    },
  });
  if (error) {
    // Never disclose that an address is taken.
    if (/already|registered|exists/i.test(error.message)) {
      return { kind: "notice", notice: SIGNUP_NEUTRAL_NOTICE };
    }
    return { kind: "error", error: error.message };
  }
  void recordSignupAcceptance(email);
  if (data.session) return { kind: "session" };
  return { kind: "notice", notice: SIGNUP_NEUTRAL_NOTICE };
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
  captchaToken?: string | null;
}): Promise<AuthResult> {
  const email = input.email.trim();
  if (!isValidEmail(email)) return { kind: "error", error: "Enter a valid email address." };
  if (input.password.length < 1) return { kind: "error", error: "Enter your password." };

  const gate = await guardAuthAttempt({
    data: { kind: "signin", captchaToken: input.captchaToken ?? undefined },
  });
  if (!gate.ok) {
    return { kind: "error", error: gateError(gate.reason), needCaptcha: true };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
    ...(input.captchaToken ? { options: { captchaToken: input.captchaToken } } : {}),
  });
  if (error) {
    const failure = await reportSigninFailure({ data: { email } }).catch(() => null);
    if (failure?.blocked) {
      return { kind: "error", error: RATE_LIMIT_COPY, needCaptcha: failure?.needCaptcha };
    }
    return {
      kind: "error",
      error:
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message,
      needCaptcha: failure?.needCaptcha,
    };
  }
  return { kind: "session" };
}

/**
 * Google via the Lovable broker. `redirect_uri` stays a public same-origin URL;
 * where to go afterwards is the caller's business (see `postAuthPath`).
 */
export async function startGoogleAuth(opts: {
  mode: "signup" | "signin";
  acceptedPolicies?: boolean;
  redirectPath?: string;
}): Promise<{ redirected: boolean } | { kind: "error"; error: string }> {
  if (opts.mode === "signup") {
    if (!opts.acceptedPolicies) {
      return {
        kind: "error",
        error: "Please accept the Terms of Service and Privacy Policy to continue.",
      };
    }
    // No email until the callback returns; park the tick and record on boot.
    markPendingSignupAcceptance();
  }
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: opts.redirectPath
      ? `${window.location.origin}${opts.redirectPath}`
      : window.location.origin,
  });
  if (result.error) {
    return {
      kind: "error",
      error: result.error.message || "Google sign-in failed. Please try again.",
    };
  }
  return { redirected: Boolean(result.redirected) };
}
