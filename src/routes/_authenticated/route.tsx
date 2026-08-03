import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hydrateTrackerFromDb, resetTrackerForSignOut } from "@/lib/tracker-store";
import { loadJobs } from "@/lib/jobs-store";
import { hydrateAccountFromDb, isPastGrace, useAccount } from "@/lib/account-store";
import { clearLocalUserData } from "@/lib/local-data";
import { RestoreAccountScreen } from "@/components/app/RestoreAccountScreen";
import { EntitlementProvider } from "@/lib/entitlements-provider";
import { claimQuizDraft } from "@/lib/quiz-draft.functions";
import { clearDraftToken, getDraftToken } from "@/lib/quiz-draft-store";
import { hydrateQuizFromProfile } from "@/lib/quiz-store";
import { hydrateBoardColumnsFromDb, resetBoardColumnsForSignOut } from "@/lib/board-columns-store";
import { hydrateProfileExtrasFromDb, resetProfileExtrasForSignOut } from "@/lib/profile-store";
import { hydrateWorkHistoryFromDb, resetWorkHistoryForSignOut } from "@/lib/resume-store";
import { hydrateSavedFiltersFromDb, resetSavedFiltersForSignOut } from "@/lib/saved-filters-store";
import { hydrateBlockedCompaniesFromDb, resetBlockedCompaniesForSignOut } from "@/lib/blocked-companies-store";
import { linkConsentToAccount } from "@/lib/consent.functions";
import { migrateLegacyConsent } from "@/lib/consent-migration";

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

function AuthedShell({ userId }: { userId: string }) {
  const account = useAccount();
  useEffect(() => {
    void loadJobs();
    void hydrateTrackerFromDb(userId);
    void hydrateAccountFromDb();
    void claimAndHydrateQuiz();
    void hydrateBoardColumnsFromDb(userId);
    void hydrateProfileExtrasFromDb(userId);
    void hydrateWorkHistoryFromDb(userId);
    void hydrateSavedFiltersFromDb(userId);
    void hydrateBlockedCompaniesFromDb(userId);
    // Consent lives only in Postgres: link any pre-account rows, then retire
    // whatever the browser still holds.
    void linkConsentToAccount().catch(() => undefined);
    void migrateLegacyConsent();
    return () => {
      // Clear tracker if a different user signs in on the same tab.
      resetTrackerForSignOut();
      resetBoardColumnsForSignOut();
      resetProfileExtrasForSignOut();
      resetWorkHistoryForSignOut();
      resetSavedFiltersForSignOut();
      resetBlockedCompaniesForSignOut();
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
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
    return { user: data.user };
  },
  component: function AuthedRoute() {
    const { user } = Route.useRouteContext();
    return (
      <EntitlementProvider>
        <AuthedShell userId={user.id} />
      </EntitlementProvider>
    );
  },
});