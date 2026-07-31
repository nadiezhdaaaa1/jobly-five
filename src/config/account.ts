// Single source of truth for account-deletion grace handling.
// Never hardcode a grace-period length or deletion date anywhere else.

export const ACCOUNT_DELETION_GRACE_DAYS = 30;

const DAY_MS = 86_400_000;

/** Derived hard-delete moment: request time + the canonical grace period. */
export const deletionDateFrom = (requestedAt: Date) =>
  new Date(requestedAt.getTime() + ACCOUNT_DELETION_GRACE_DAYS * DAY_MS);

/** Reminder email moment — 3 days before the purge. */
export const DELETION_REMINDER_DAYS_BEFORE = 3;
export const deletionReminderDateFrom = (requestedAt: Date) =>
  new Date(deletionDateFrom(requestedAt).getTime() - DELETION_REMINDER_DAYS_BEFORE * DAY_MS);

export const formatDeletionDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Approved deletion copy. Day counts are interpolated, never spelled out. */
export const DELETION_COPY = {
  dangerCaption: `Deletes your profile, resume, matches, and tracker. You'll have ${ACCOUNT_DELETION_GRACE_DAYS} days to change your mind.`,
  confirmBody: (date: string) =>
    `Your account will be deleted on ${date}. Until then you can sign in and restore everything. Your subscription cancels today and digests stop immediately.`,
  scheduledToast: (date: string) => `Deletion scheduled for ${date}`,
  restoreHeadline: (date: string) => `Your account is scheduled for deletion on ${date}`,
  restoreBody:
    "Restore it now and everything comes back — profile, resume, matches, and tracker. Your subscription will not restart automatically.",
  restorePrimary: "Restore my account",
  restoreSecondary: "Continue with deletion",
  restoredToast: "Welcome back — your account is restored.",
} as const;