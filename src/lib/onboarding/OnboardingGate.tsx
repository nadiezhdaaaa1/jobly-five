// First-run gate for the signed-in app. This gate has ONE job: making sure the
// account has answered the quiz, because the app is meaningless without those
// answers. It is deliberately NOT a paywall.
//
// Having no plan is not a reason to be bounced out of a page. An account without
// a subscription still gets the weekly digest under our published Subscription
// and Billing Terms, so each page decides for itself what it withholds and
// shows its own in-page upsell where an entitlement really says no
// (see /tracker). Keep the two concerns apart: someone mid-onboarding must see
// the quiz, never a paywall.
//
// The server still decides what the account may read; this only stops a signed-in
// user landing on an app with no preferences behind it.

import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { useEntitlements } from "@/lib/entitlements-provider";
import { getDraftToken } from "@/lib/quiz-draft-store";

/** How many times we re-read entitlements while a draft is still being claimed. */
const CLAIM_RETRIES = 6;
/** Settings is always reachable: it is where a plan is bought or fixed. */
const PLAN_PATH = "/settings";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { entitlements, loading, error, refetch } = useEntitlements();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const claimWaits = useRef(0);

  const onPlanPage = pathname.startsWith(PLAN_PATH);
  const claiming =
    !loading &&
    !error &&
    !entitlements.onboarded &&
    Boolean(getDraftToken()) &&
    claimWaits.current < CLAIM_RETRIES;
  // Onboarding only. Plan status is deliberately absent from this condition.
  const settled = !loading && (error || entitlements.onboarded);

  useEffect(() => {
    if (loading) return;
    // An unreadable entitlement resolves to Free everywhere, so the pages
    // themselves withhold what they must. Nothing to redirect for.
    if (error) return;
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
