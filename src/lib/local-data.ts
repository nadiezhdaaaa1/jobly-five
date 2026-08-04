// Single place that knows every browser-side key holding user data.
// Used when an account is actually gone (grace window ended, or the user
// chose to continue with deletion) — never while a restore is still possible.

export const LOCAL_USER_DATA_KEYS = [
  "jobly.account",
  "jobly.cancelFeedback",
  "jobly.blockedCompanies",
  "jobly.savedFilters.v1",
  "jobly.profile.extras",
  "jobly.resume",
  "jobly.quiz",
  "jobly.plan",
  "jobly.subscription",
  "jobly.hasHadPro",
  "jobly.boardColumns",
  "jobly.digestSession",
] as const;

/** Wipes every Jobly key from localStorage and sessionStorage. */
export function clearLocalUserData() {
  if (typeof window === "undefined") return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      for (const key of LOCAL_USER_DATA_KEYS) store.removeItem(key);
      // Defensive sweep: anything else namespaced to the app.
      const extra: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        // Covers per-account keys (`jobly.<name>.<userId>`) and old `jobly:` keys.
        if (k && (k.startsWith("jobly.") || k.startsWith("jobly:"))) extra.push(k);
      }
      for (const k of extra) store.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}