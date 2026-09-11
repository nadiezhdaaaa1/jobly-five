// One place that tears down every browser-side trace of an account.
// Called before supabase.auth.signOut() so a second sign-in on this tab can
// never read the previous account's cached or in-memory data.

import { clearLocalUserData } from "@/lib/local-data";
import { resetTrackerForSignOut } from "@/lib/tracker-store";
import { resetBoardColumnsForSignOut } from "@/lib/board-columns-store";
import { resetProfileExtrasForSignOut } from "@/lib/profile-store";
import { resetWorkHistoryForSignOut } from "@/lib/resume-store";
import { resetBlockedCompaniesForSignOut } from "@/lib/blocked-companies-store";
import { resetJobInteractionsForSignOut } from "@/lib/job-interactions-store";
import { resetQuizForSignOut } from "@/lib/quiz-store";
import { resetAccountForSignOut } from "@/lib/account-store";
import { resetTimezoneCache } from "@/lib/dates";
import { clearDraftToken } from "@/lib/quiz-draft-store";

export function clearUserStateForSignOut() {
  resetTrackerForSignOut();
  resetBoardColumnsForSignOut();
  resetProfileExtrasForSignOut();
  resetWorkHistoryForSignOut();
  resetBlockedCompaniesForSignOut();
  resetJobInteractionsForSignOut();
  resetQuizForSignOut();
  resetAccountForSignOut();
  resetTimezoneCache();
  // The draft token is a bearer credential for one person's answers: it must
  // never survive into the next account signed in on this tab.
  clearDraftToken();
  clearLocalUserData();
}
