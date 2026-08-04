/**
 * Signup-time policy acceptance. The email path records evidence immediately;
 * the Google path cannot (no email yet), so the tick is parked in sessionStorage
 * and flushed on the first authenticated boot.
 */
import { POLICY_VERSION } from "@/config/consent";
import { recordConsent } from "@/lib/consent.functions";
import { acceptPolicies } from "@/lib/policy-consent.functions";

const PENDING_KEY = "jobly.pendingPolicyAcceptance";

export const SIGNUP_CONSENT_TEXT = `I agree to the Jobly Terms of Service and Privacy Policy (version ${POLICY_VERSION}).`;

export function markPendingSignupAcceptance() {
  try {
    sessionStorage.setItem(PENDING_KEY, SIGNUP_CONSENT_TEXT);
  } catch {
    // Private mode: the acceptance checkbox still gated the click.
  }
}

/** Records the parked acceptance once the account exists. Idempotent enough. */
export async function flushPendingSignupAcceptance() {
  let text: string | null = null;
  try {
    text = sessionStorage.getItem(PENDING_KEY);
  } catch {
    return;
  }
  if (!text) return;
  try {
    await acceptPolicies({
      data: { documentKeys: ["terms", "privacy"], consentText: text, source: "signup" },
    });
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Leave it parked; the next boot retries.
  }
}

/** Email/password path: the address is known, so record it straight away. */
export async function recordSignupAcceptance(email: string) {
  for (const channel of ["terms", "privacy"] as const) {
    await recordConsent({
      data: {
        email,
        channel,
        granted: true,
        source: "signup",
        consentText: SIGNUP_CONSENT_TEXT,
        policyVersion: POLICY_VERSION,
      },
    }).catch(() => undefined);
  }
}
