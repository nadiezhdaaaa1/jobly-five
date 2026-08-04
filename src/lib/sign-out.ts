// One place that tears down every browser-side trace of an account.
// Called before supabase.auth.signOut() so a second sign-in on this tab can
// never read the previous account's cached or in-memory data.

import { clearLocalUserData } from "@/lib/local-data";
import { resetTrackerForSignOut } from "@/lib/tracker-store";
import { resetBoardColumnsForSignOut } from "@/lib/board-columns-store";
import { resetProfileExtrasForSignOut } from "@/lib/profile-store";
import { resetWorkHistoryForSignOut } from "@/lib/resume-store";
import { resetSavedFiltersForSignOut } from "@/lib/saved-filters-store";
import { resetBlockedCompaniesForSignOut } from "@/lib/blocked-companies-store";
import { resetQuizForSignOut } from "@/lib/quiz-store";
import { resetAccountForSignOut } from "@/lib/account-store";

export function clearUserStateForSignOut() {
  resetTrackerForSignOut();
  resetBoardColumnsForSignOut();
  resetProfileExtrasForSignOut();
  resetWorkHistoryForSignOut();
  resetSavedFiltersForSignOut();
  resetBlockedCompaniesForSignOut();
  resetQuizForSignOut();
  resetAccountForSignOut();
  clearLocalUserData();
}
