import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hydrateTrackerFromDb, resetTrackerForSignOut } from "@/lib/tracker-store";
import { loadJobs } from "@/lib/jobs-store";
import { hydrateAccountFromDb, isPastGrace, resetAccountForSignOut, useAccount } from "@/lib/account-store";
import { clearLocalUserData } from "@/lib/local-data";
import { RestoreAccountScreen } from "@/components/app/RestoreAccountScreen";
import { EntitlementProvider } from "@/lib/entitlements-provider";
import { OnboardingGate } from "@/lib/onboarding/OnboardingGate";
import { claimQuizDraft } from "@/lib/quiz-draft.functions";
import { clearDraftToken, getDraftToken } from "@/lib/quiz-draft-store";
import { hydrateQuizFromProfile, resetQuizForSignOut } from "@/lib/quiz-store";
import { hydrateBoardColumnsFromDb, resetBoardColumnsForSignOut } from "@/lib/board-columns-store";
import { hydrateProfileExtrasFromDb, resetProfileExtrasForSignOut } from "@/lib/profile-store";
import { hydrateWorkHistoryFromDb, resetWorkHistoryForSignOut } from "@/lib/resume-store";
import { hydrateBlockedCompaniesFromDb, resetBlockedCompaniesForSignOut } from "@/lib/blocked-companies-store";
import { hydrateJobInteractionsFromDb, resetJobInteractionsForSignOut } from "@/lib/job-interactions-store";
import { linkConsentToAccount } from "@/lib/consent.functions";
import { ensureUserProvisioned } from "@/lib/provisioning.functions";
import { migrateLegacyConsent } from "@/lib/consent-migration";
import { flushPendingSignupAcceptance } from "@/lib/policy-acceptance";
import { ReconsentBanner } from "@/components/app/ReconsentBanner";

/**
 * Claims the anonymous quiz draft for this account and copies the answers onto
 * the profile, then hydrates the in-memory preferences. Idempotent; a failure
 * leaves preferences empty rather than blocking the app.
 */
async function claimAndHydrateQuiz() {
  const token = getDraftToken();
  try {
    // No token means the fallback path: a completed draft matching this email.
    const res = await claimQuizDraft({ data: { token } });
    if (res.ok && token) clearDraftToken();
  } catch {
    // ignore
  }
  await hydrateQuizFromProfile();
}

/**
 * The claim MUST live above OnboardingGate. `onboarded` is derived from the
 * claimed answers, so running this inside the gated subtree meant it could
 * never run for the accounts that need it: the gate withheld its children,
 * the claim never happened, and the gate's retry loop timed out into /quiz.
 * Renders nothing; it exists purely so the claim runs once per app entry
 * whatever the gate decides. The ref keeps that "once" true under StrictMode.
 */
function QuizDraftClaim({ userId }: { userId: string }) {
  const started = useRef<string | null>(null);
  useEffect(() => {
    if (started.current === userId) return;
    started.current = userId;
    void claimAndHydrateQuiz();
  }, [userId]);
  return null;
}

function AuthedShell({ userId }: { userId: string }) {
  const account = useAccount();
  useEffect(() => {
    void (async () => {
      // The route gate only reads the locally stored session (cheap, so tab
      // switches stay instant). Verify it against the server once per mount;
      // an invalid/expired session lands on /login exactly as before.
      const { data: verified, error: verifyError } = await supabase.auth.getUser();
      if (verifyError || !verified.user) {
        window.location.href = "/login";
        return;
      }
      // Backstop the auth trigger before anything reads those rows: if a row
      // is missing the RPC creates it, otherwise this is a no-op.
      try {
        await ensureUserProvisioned();
      } catch {
        // Hydration below surfaces its own errors; don't block boot.
      }
      void loadJobs();
      void hydrateTrackerFromDb(userId);
      void hydrateAccountFromDb(userId);
      // The quiz claim now runs in QuizDraftClaim, above the gate — exactly
      // one call per app entry, so it must NOT be repeated here.

      void hydrateBoardColumnsFromDb(userId);
      void hydrateProfileExtrasFromDb(userId);
      void hydrateWorkHistoryFromDb(userId);
      void hydrateBlockedCompaniesFromDb(userId);
      void hydrateJobInteractionsFromDb(userId);
      // Consent lives only in Postgres: link any pre-account rows, then retire
      // whatever the browser still holds.
      void linkConsentToAccount().catch(() => undefined);
      void migrateLegacyConsent();
      // Google signup parked its Terms/Privacy tick until an email existed.
      void flushPendingSignupAcceptance();
    })();
    return () => {
      // Clear tracker if a different user signs in on the same tab.
      resetTrackerForSignOut();
      resetBoardColumnsForSignOut();
      resetProfileExtrasForSignOut();
      resetWorkHistoryForSignOut();
      resetBlockedCompaniesForSignOut();
      resetJobInteractionsForSignOut();
      resetQuizForSignOut();
      resetAccountForSignOut();
    };
  }, [userId]);
  // Grace window elapsed: the purge job owns the server side, so all we can do
  // here is wipe browser-side leftovers and drop the session.
  useEffect(() => {
    if (account.accountStatus === "pending_deletion" && isPastGrace(account)) {
      clearLocalUserData();
      void supabase.auth.signOut().then(() => {
        window.location.href = "/";
      });
    }
  }, [account]);
  // Grace window: sign-in succeeds but lands on the restore screen, not the app.
  if (account.accountStatus === "pending_deletion") return <RestoreAccountScreen />;
  return (
    <>
      <Outlet />
      <ReconsentBanner />
    </>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  // Run the gate once per app boot: re-running it on every tab switch is what
  // made navigation wait on the network.
  staleTime: Infinity,
  shouldReload: false,
  beforeLoad: async () => {
    // getSession() reads the persisted session locally; no round trip.
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      throw redirect({ to: "/login" });
    }
    return { user: data.session.user };
  },
  component: function AuthedRoute() {
    const { user } = Route.useRouteContext();
    return (
      <EntitlementProvider>
        {/* Sibling of the gate on purpose: the gate's decision depends on the
            result of this claim, so it cannot live inside the gated subtree. */}
        <QuizDraftClaim userId={user.id} />
        <OnboardingGate>
          <AuthedShell userId={user.id} />
        </OnboardingGate>
      </EntitlementProvider>
    );
  },
});