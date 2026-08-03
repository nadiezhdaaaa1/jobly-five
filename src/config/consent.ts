/**
 * Canonical policy version stamped on every consent record. Must match the
 * version published on the site footer and in the legal pages — a version that
 * does not match what was published is not evidence.
 */
export const POLICY_VERSION = "2026-08-01";

/** Wording marker used when a consent predates evidence capture. */
export const UNRECORDED_WORDING = "[migrated from client storage — original wording unrecorded]";

export const CONSENT_SOURCES = [
  "quiz_email_gate",
  "settings",
  "unsubscribe_link",
  "signup",
  "checkout",
  "resume_upload",
  "localstorage_migration",
  "preferences_table_migration",
  "admin",
] as const;

export type ConsentSource = (typeof CONSENT_SOURCES)[number];

export const CONSENT_CHANNELS = [
  "daily_digest",
  "high_match_alerts",
  "weekly_report",
  "product_updates",
  "marketing",
  "reactivation",
  "resume_storage",
  "billing_terms",
] as const;

export type ConsentChannelName = (typeof CONSENT_CHANNELS)[number];

/** The core service email; exempt from the double opt-in requirement. */
export const CORE_SERVICE_CHANNEL: ConsentChannelName = "daily_digest";
