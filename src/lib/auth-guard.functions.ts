import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Gate for the public auth forms: IP throttle + captcha verification +
 * disposable-address rejection. Verdicts are identical whether or not the
 * address exists, so nothing here reveals account existence.
 */

export type AuthGateReason = "rate_limited" | "captcha" | "disposable";

export type AuthGateResult = {
  ok: boolean;
  reason?: AuthGateReason;
  /** True when the next attempt from this IP must solve a captcha. */
  needCaptcha: boolean;
};

type GateKind = "signup" | "reset" | "signin";

function parseInput(input: { kind: GateKind; email?: string; captchaToken?: string }) {
  if (input.kind !== "signup" && input.kind !== "reset" && input.kind !== "signin") {
    throw new Error("Unknown gate kind");
  }
  return {
    kind: input.kind,
    email: typeof input.email === "string" ? input.email.slice(0, 320) : undefined,
    captchaToken: typeof input.captchaToken === "string" ? input.captchaToken.slice(0, 4096) : undefined,
  };
}

/** Read-only: does this IP already owe us a captcha on sign-in? */
export const getSigninGate = createServerFn({ method: "POST" }).handler(async () => {
  const { clientIp, evaluateGate } = await import("@/lib/auth-guard.server");
  const ip = clientIp(getRequestHeader("x-forwarded-for"));
  const verdict = await evaluateGate("signin_fail", ip);
  return { needCaptcha: verdict.needCaptcha, blocked: verdict.blocked };
});

/**
 * Called immediately before a signup / password-reset / sign-in attempt.
 * Records the attempt for the throttled kinds so bursts are visible.
 */
export const guardAuthAttempt = createServerFn({ method: "POST" })
  .inputValidator(parseInput)
  .handler(async ({ data }): Promise<AuthGateResult> => {
    const { clientIp, evaluateGate, recordAttempt } = await import("@/lib/auth-guard.server");
    const { verifyCaptcha, captchaEnforced } = await import("@/lib/captcha.server");
    const ip = clientIp(getRequestHeader("x-forwarded-for"));

    if (data.kind === "signin") {
      const gate = await evaluateGate("signin_fail", ip);
      if (gate.blocked) return { ok: false, reason: "rate_limited", needCaptcha: true };
      // The widget only appears once this IP has failed enough times.
      if (gate.needCaptcha && captchaEnforced()) {
        const passed = await verifyCaptcha(data.captchaToken, ip);
        if (!passed) return { ok: false, reason: "captcha", needCaptcha: true };
      }
      return { ok: true, needCaptcha: gate.needCaptcha };
    }

    const kind = data.kind === "signup" ? "signup" : "reset";
    const gate = await evaluateGate(kind, ip);
    if (gate.blocked) return { ok: false, reason: "rate_limited", needCaptcha: false };

    if (captchaEnforced()) {
      const passed = await verifyCaptcha(data.captchaToken, ip);
      if (!passed) return { ok: false, reason: "captcha", needCaptcha: false };
    }

    if (kind === "signup" && data.email) {
      const { isDisposableEmail } = await import("@/lib/disposable-domains");
      if (isDisposableEmail(data.email)) {
        return { ok: false, reason: "disposable", needCaptcha: false };
      }
    }

    await recordAttempt(kind, ip, data.email);
    return { ok: true, needCaptcha: false };
  });

/** Records a failed sign-in and reports whether the next one needs a captcha. */
export const reportSigninFailure = createServerFn({ method: "POST" })
  .inputValidator((input: { email?: string }) => ({
    email: typeof input?.email === "string" ? input.email.slice(0, 320) : undefined,
  }))
  .handler(async ({ data }) => {
    const { clientIp, recordAttempt } = await import("@/lib/auth-guard.server");
    const ip = clientIp(getRequestHeader("x-forwarded-for"));
    const verdict = await recordAttempt("signin_fail", ip, data.email);
    return { needCaptcha: verdict.needCaptcha, blocked: verdict.blocked };
  });
