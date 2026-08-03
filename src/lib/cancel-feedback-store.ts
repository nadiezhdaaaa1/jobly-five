import { saveCancelFeedback } from "@/lib/subscription.functions";

/** Why a user canceled. Recorded on the account; the browser copy is a cache. */
export const CANCEL_REASONS = [
  "I found a job",
  "Too expensive",
  "Not enough relevant matches",
  "Taking a break from my job search",
  "Missing features I need",
  "Too many emails",
  "Other",
] as const;

export type CancelReason = (typeof CANCEL_REASONS)[number];

export type CancelFeedback = {
  reason: CancelReason;
  /** Free-text detail, required when reason is "Other". */
  details?: string;
  at: string;
};

const KEY = "jobly.cancelFeedback";

export function recordCancelFeedback(reason: CancelReason, details?: string) {
  const entry: CancelFeedback = {
    reason,
    details: details?.trim() ? details.trim() : undefined,
    at: new Date().toISOString(),
  };
  void saveCancelFeedback({ data: { reason: entry.reason, details: entry.details } }).catch(() => {
    /* the local copy below keeps the answer if the write fails */
  });
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: CancelFeedback[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* ignore */
  }
  return entry;
}

export function getCancelFeedback(): CancelFeedback[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CancelFeedback[]) : [];
  } catch {
    return [];
  }
}
