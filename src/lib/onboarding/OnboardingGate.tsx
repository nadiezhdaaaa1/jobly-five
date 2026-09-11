// First-run gate for the signed-in app. Both paid plans include everything, so
// an account without a subscription has nothing to see behind here yet.
//
// Order matters: preferences first (the app is meaningless without them), then
// the plan. The server still decides what the account may read — this only
// stops a signed-in user landing on an empty app.

import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { useEntitlements } from "@/lib/entitlements-provider";
import { readPlanIntent } from "@/lib/onboarding/planIntent";
import { CHECKOUT_PATH } from "@/lib/onboarding/usePlanFlow";
import { getDraftToken } from "@/lib/quiz-draft-store";

/** States that mean "this account is with us right now". */
const SETTLED = ["trialing", "active", "past_due", "paused"];
/** How many times we re-read entitlements while a draft is still being claimed. */
const CLAIM_RETRIES = 6;

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { entitlements, loading, error, refetch } = useEntitlements();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const claimWaits = useRef(0);

  useEffect(() => {
    // Never redirect on an unknown answer: a failed read must not eject someone
    // who is actually paying.
    if (loading || error) return;
    // Settings stays reachable so a paused or past-due account can fix itself.
    if (pathname.startsWith("/settings")) return;

    if (!entitlements.onboarded) {
      // S1: the answers were given anonymously and are still in an unclaimed
      // draft. The claim runs alongside this on entering the app, so wait for
      // it rather than sending the user back through the quiz.
      if (getDraftToken() && claimWaits.current < CLAIM_RETRIES) {
        claimWaits.current += 1;
        const t = window.setTimeout(() => void refetch(), 500);
        return () => window.clearTimeout(t);
      }
      void navigate({ to: "/quiz", replace: true });
      return;
    }
    if (!SETTLED.includes(entitlements.status)) {
      // A saved decision resumes at checkout; otherwise pick a plan first.
      void navigate({ to: readPlanIntent() ? CHECKOUT_PATH : "/", replace: true });
    }
    return;
  }, [entitlements, loading, error, navigate, pathname, refetch]);

  return <>{children}</>;
}
