// First-run gate for the signed-in app. Both paid plans include everything, so
// an account without a subscription has nothing to see behind here yet.
//
// Order matters: preferences first (the app is meaningless without them), then
// the plan. The server still decides what the account may read — this only
// stops a signed-in user landing on an empty app.
//
// Nothing renders until the decision resolves, and an unreadable entitlement is
// treated as no access: showing the app shell first and redirecting after would
// leave an unpaid account inside it whenever that read fails.

import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { useEntitlements } from "@/lib/entitlements-provider";
import { hasPlanStatus } from "@/lib/entitlements";
import { readPlanIntent } from "@/lib/onboarding/planIntent";
import { CHECKOUT_PATH } from "@/lib/onboarding/usePlanFlow";
import { getDraftToken } from "@/lib/quiz-draft-store";

// "This account is with us right now" — the shared list in @/lib/entitlements.
/** How many times we re-read entitlements while a draft is still being claimed. */
const CLAIM_RETRIES = 6;
/** Where an account with no access goes to pay. */
const PLAN_PATH = "/settings";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { entitlements, loading, error, refetch } = useEntitlements();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const claimWaits = useRef(0);

  // Settings stays reachable so a paused, past-due or unpaid account can fix
  // itself — it is where the plan is bought.
  const onPlanPage = pathname.startsWith(PLAN_PATH);
  const claiming =
    !loading &&
    !error &&
    !entitlements.onboarded &&
    Boolean(getDraftToken()) &&
    claimWaits.current < CLAIM_RETRIES;
  const settled =
    !loading && !error && entitlements.onboarded && SETTLED.includes(entitlements.status);

  useEffect(() => {
    if (loading) return;
    if (error) {
      // Unknown state is no access, never access.
      if (!onPlanPage) void navigate({ to: PLAN_PATH, replace: true });
      return;
    }
    if (onPlanPage) return;

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
      // A saved decision resumes at checkout; otherwise the plan card in
      // Settings is where they pay.
      void navigate({ to: readPlanIntent() ? CHECKOUT_PATH : PLAN_PATH, replace: true });
    }
    return;
  }, [entitlements, loading, error, navigate, onPlanPage, refetch]);

  if (onPlanPage && !loading) return <>{children}</>;
  if (settled && !claiming) return <>{children}</>;

  return (
    <main className="grid min-h-screen place-items-center" aria-busy="true">
      <Loader2 className="h-5 w-5 animate-spin text-[color:var(--color-text-muted)]" />
      <span className="sr-only">Checking your account…</span>
    </main>
  );
}
