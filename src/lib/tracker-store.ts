import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { findColumn } from "@/lib/board-columns-store";
import type { Json } from "@/integrations/supabase/types";
import type { Job } from "@/lib/jobs-data";

export type JobStatus =
  | "default"
  | "saved"
  | "applied"
  | "interview"            // legacy — normalized to "interview_screen" on read
  | "interview_screen"
  | "interview_tech"
  | "test_task"
  | "offer"
  | "rejection"
  | "dismissed"
  | "reported";

export type JobRecord = {
  status: JobStatus;
  savedAt?: string;
  appliedAt?: string;
  interviewAt?: string;
  offerAt?: string;
  rejectionAt?: string;
  reminderAt?: string; // ISO datetime
  notes: string;
  // Kanban v3 additions
  archived?: boolean;
  interviewStage?: string;
  offerStatus?: string;
  movedAt?: string; // last status change timestamp — used to order within columns
  lastStatus?: JobStatus; // preserved column for archived cards ("Show archived" restore-in-place)
  columnId?: string; // which board column this card lives in (custom columns)
  // Documents used when marking applied (Apply modal). Shown on Applied cards.
  appliedResumeName?: string;
  appliedCoverLetterName?: string;
  // Free-form details captured at Rejection / Offer transitions and editable in the drawer.
  rejectionDetails?: string;
  offerDetails?: string;
  // Reverse-chronological activity log (newest first).
  history?: HistoryEntry[];
};

export type HistoryKind =
  | "status"
  | "interview_stage"
  | "offer_stage"
  | "reminder"
  | "applied"
  | "saved"
  | "notes"
  | "rejection_details"
  | "offer_details"
  | "follow_up";

export type HistoryEntry = {
  id: string;
  at: string; // ISO
  kind: HistoryKind;
  description: string;
};

type Seed = {
  id: string;
  status: JobStatus;
  reminderAt?: string;
  interviewStage?: string;
  offerStatus?: string;
};

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

function todayAt(offsetDays: number, hours: number, minutes: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

// Interview / offer demo seeds keyed by job id — applied when seedFrom
// promotes a job to its initialState.
const INTERVIEW_SEEDS: Record<string, { stage: string; reminderAt?: string }> = {
  y2: { stage: "Recruiter screen", reminderAt: todayAt(0, 14, 45) },
  "d3-4": { stage: "Technical", reminderAt: todayAt(2, 11, 0) },
  "d4-4": { stage: "Pre-screen", reminderAt: todayAt(4, 10, 30) },
};
const OFFER_SEEDS: Record<string, string> = {
  t3: "Waiting for my reply",
  "d4-5": "Negotiating",
};

function shortDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shortDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

// "Jul 23 • 04:32 PM" for history entries.
function shortDateTimeAmpm(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} • ${time}`;
}

// "Jul 25 · 2:45 PM" for reminder timestamps referenced inside history descriptions.
function reminderPhrase(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} · ${time}`;
}

function isSameLocalDay(iso: string, ref = new Date()) {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

export const dateHelpers = { shortDate, shortDateTime, shortDateTimeAmpm, reminderPhrase, isSameLocalDay };

// Convenience: is this an interview-family stage?
export function isInterviewStage(s: JobStatus): boolean {
  return s === "interview" || s === "interview_screen" || s === "interview_tech" || s === "test_task";
}

export function isTrackerStage(s: JobStatus): boolean {
  return (
    s === "saved" ||
    s === "applied" ||
    s === "interview" ||
    s === "interview_screen" ||
    s === "interview_tech" ||
    s === "test_task" ||
    s === "offer" ||
    s === "rejection"
  );
}

const STATUS_LABELS: Record<JobStatus, string> = {
  default: "Removed",
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  interview_screen: "Screen interview",
  interview_tech: "Tech interview",
  test_task: "Test task",
  offer: "Offers",
  rejection: "Rejected",
  dismissed: "Dismissed",
  reported: "Reported",
};

let historyPaused = false;
let historySeq = 0;
function logHistory(r: JobRecord, kind: HistoryKind, description: string) {
  if (historyPaused) return;
  if (!r.history) r.history = [];
  historySeq++;
  r.history.unshift({
    id: `${Date.now()}-${historySeq}`,
    at: new Date().toISOString(),
    kind,
    description,
  });
}

// ---- store ----

const records = new Map<string, JobRecord>();
const listeners = new Set<() => void>();
let snapshotVersion = 0;

function emit() {
  snapshotVersion++;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getVersion() {
  return snapshotVersion;
}

function ensure(id: string): JobRecord {
  let r = records.get(id);
  if (!r) {
    r = { status: "default", notes: "" };
    records.set(id, r);
  }
  return r;
}

// Seeded mapping from initialState per job + a handful of pipeline demos
function seedFrom(jobs: Job[], extras: Seed[] = []) {
  for (const j of jobs) {
    if (!records.has(j.id)) {
      const initial = (j.initialState ?? "default") as JobStatus;
      const rec: JobRecord = { status: initial, notes: "" };
      const now = today();
      if (initial === "saved") rec.savedAt = today(-2);
      if (initial === "applied") {
        rec.appliedAt = today(-1);
      }
      if (initial === "interview") {
        rec.appliedAt = today(-3);
        rec.interviewAt = today(-1);
        const iseed = INTERVIEW_SEEDS[j.id];
        if (iseed) {
          rec.interviewStage = iseed.stage;
          if (iseed.reminderAt) rec.reminderAt = iseed.reminderAt;
        } else {
          rec.interviewStage = "Pre-screen";
        }
      }
      if (initial === "offer") {
        rec.appliedAt = today(-6);
        rec.interviewAt = today(-3);
        rec.offerAt = today(0);
        rec.offerStatus = OFFER_SEEDS[j.id] ?? "Waiting for my reply";
      }
      if (initial === "rejection") rec.rejectionAt = today(-1);
      rec.movedAt = now;
      records.set(j.id, rec);
    }
  }
  for (const s of extras) {
    const r = ensure(s.id);
    r.status = s.status;
    if (s.status === "saved") r.savedAt ??= today(-2);
    if (s.status === "applied") r.appliedAt ??= today(-1);
    if (s.status === "interview") {
      r.appliedAt ??= today(-3);
      r.interviewAt ??= today(-1);
      if (s.interviewStage) r.interviewStage = s.interviewStage;
    }
    if (s.status === "offer") {
      r.offerAt ??= today(0);
      if (s.offerStatus) r.offerStatus = s.offerStatus;
    }
    if (s.status === "rejection") r.rejectionAt ??= today(0);
    if (s.reminderAt) r.reminderAt = s.reminderAt;
  }
}

let seeded = false;
function seedOnce() {
  if (seeded) return;
  seeded = true;
}

export function seedTracker(allJobs: Job[]) {
  historyPaused = true;
  seedFrom(allJobs, []);
  historyPaused = false;
  emit();
}

// Actions
export function setStatus(id: string, next: JobStatus) {
  const r = ensure(id);
  const prev = r.status;
  if (prev === next) return;
  r.status = next;
  r.movedAt = today();
  // Clearing the archived flag on any explicit re-status (e.g. Restore)
  if (r.archived && next !== "default") r.archived = false;
  if (next === "saved") r.savedAt ??= today();
  if (next === "applied") r.appliedAt ??= today();
  if (next === "interview") {
    r.interviewAt ??= today();
    // Do not auto-assign a default interview stage — the transition dialog
    // (or the user editing the drawer) records the real stage explicitly.
  }
  if (next === "interview_screen" || next === "interview_tech" || next === "test_task") {
    r.interviewAt ??= today();
  }
  if (next === "offer") {
    r.offerAt ??= today();
    // Same rationale: leave offerStatus unset until the user picks one.
  }
  if (next === "rejection") r.rejectionAt ??= today();
  // History: only log meaningful transitions between tracker columns / saved.
  const trackerCols: JobStatus[] = [
    "saved",
    "applied",
    "interview",
    "interview_screen",
    "interview_tech",
    "test_task",
    "offer",
    "rejection",
  ];
  if (next === "saved" && !trackerCols.includes(prev)) {
    logHistory(r, "saved", "Saved");
  } else if (prev === "saved" && next === "default") {
    logHistory(r, "saved", "Unsaved");
  } else if (trackerCols.includes(prev) && trackerCols.includes(next)) {
    if (next === "saved") logHistory(r, "saved", "Saved");
    else if (next === "applied") logHistory(r, "applied", "Applied");
    else logHistory(r, "status", `Moved to ${STATUS_LABELS[next]}`);
  }
  sync(id);
  emit();
}

export function markApplied(
  id: string,
  meta: { resumeName?: string; coverLetterName?: string } = {},
) {
  const r = ensure(id);
  const prev = r.status;
  r.status = "applied";
  r.appliedAt ??= today();
  r.movedAt = today();
  if (r.archived) r.archived = false;
  if (meta.resumeName) r.appliedResumeName = meta.resumeName;
  if (meta.coverLetterName) r.appliedCoverLetterName = meta.coverLetterName;
  const parts: string[] = [];
  if (meta.resumeName) parts.push(`resume: ${meta.resumeName}`);
  if (meta.coverLetterName) parts.push(`cover letter: ${meta.coverLetterName}`);
  const suffix = parts.length ? ` (${parts.join(", ")})` : "";
  if (prev !== "applied") {
    logHistory(r, "applied", `Applied${suffix}`);
  }
  sync(id);
  emit();
}

export function archiveJob(id: string) {
  const r = ensure(id);
  r.lastStatus = r.status;
  r.archived = true;
  r.status = "default";
  sync(id);
  emit();
}

export function archiveJobWithReason(id: string, reason?: string) {
  const r = ensure(id);
  r.lastStatus = r.status;
  r.archived = true;
  r.status = "default";
  const trimmed = (reason ?? "").trim();
  logHistory(
    r,
    "status",
    trimmed ? `Archived — ${trimmed}` : `Archived`,
  );
  sync(id);
  emit();
}

export function restoreArchived(id: string) {
  const r = ensure(id);
  if (!r.archived) return;
  r.status = (r.lastStatus ?? "saved") as JobStatus;
  r.archived = false;
  r.movedAt = today();
  sync(id);
  emit();
}

export function setInterviewStage(id: string, stage: string) {
  const r = ensure(id);
  const prev = r.interviewStage;
  if (prev === stage) return;
  r.interviewStage = stage;
  // Only record when the user actually changes an existing stage. The
  // initial pick during a transition is already implied by the "Moved to
  // Interview" entry, so we skip logging when there was no prior stage.
  if (prev) {
    logHistory(r, "interview_stage", `Interview stage changed from ${prev} to ${stage}`);
  }
  sync(id);
  emit();
}

export function setOfferStatus(id: string, offerStatus: string) {
  const r = ensure(id);
  const prev = r.offerStatus;
  if (prev === offerStatus) return;
  r.offerStatus = offerStatus;
  if (prev) {
    logHistory(r, "offer_stage", `Offer stage changed from ${prev} to ${offerStatus}`);
  }
  sync(id);
  emit();
}

export function setReminder(id: string, iso: string | null) {
  const r = ensure(id);
  const prev = r.reminderAt;
  if (iso) {
    r.reminderAt = iso;
    if (!prev) logHistory(r, "reminder", `Reminder was set on ${reminderPhrase(iso)}`);
    else if (prev !== iso) logHistory(r, "reminder", `Reminder changed to ${reminderPhrase(iso)}`);
  } else {
    if (prev) {
      delete r.reminderAt;
      logHistory(r, "reminder", `Reminder was removed`);
    } else {
      delete r.reminderAt;
    }
  }
  sync(id);
  emit();
}

export function setRejectionDetails(id: string, details: string) {
  const r = ensure(id);
  const prev = r.rejectionDetails ?? "";
  const next = details ?? "";
  if (prev === next) return;
  r.rejectionDetails = next;
  logHistory(r, "rejection_details", prev ? `Rejection details updated` : `Rejection details added`);
  sync(id);
  emit();
}

export function setOfferDetails(id: string, details: string) {
  const r = ensure(id);
  const prev = r.offerDetails ?? "";
  const next = details ?? "";
  if (prev === next) return;
  r.offerDetails = next;
  logHistory(r, "offer_details", prev ? `Offer details updated` : `Offer details added`);
  sync(id);
  emit();
}

export function setNotes(id: string, notes: string) {
  const r = ensure(id);
  r.notes = notes;
  sync(id);
  emit();
}

// Log a follow-up email send (currently mocked in the UI; the entry lets us
// show it in the job history and later swap in a real send).
export function logFollowUp(
  id: string,
  payload: { to: string; from: string; subject?: string }
) {
  const r = ensure(id);
  const summary = `Follow-up sent to ${payload.to} from ${payload.from}`;
  logHistory(r, "follow_up", summary);
  sync(id);
  emit();
}

// Assign a card to a specific board column (for user-defined column layouts).
// Also normalizes the record's status to the column's stage when they differ.
export function setCardColumn(id: string, columnId: string, stage?: JobStatus) {
  const r = ensure(id);
  if (r.columnId === columnId && (!stage || r.status === stage)) return;
  const prevColumnId = r.columnId;
  const prevStatus = r.status;
  r.columnId = columnId;
  if (stage && r.status !== stage) {
    r.status = stage;
    r.movedAt = today();
  }
  if (prevColumnId !== columnId) {
    const col = findColumn(columnId);
    if (col) {
      if (col.kind === "saved") {
        if (prevStatus !== "saved") logHistory(r, "saved", "Saved");
      } else if (col.kind === "applied") {
        if (prevStatus !== "applied") logHistory(r, "applied", "Applied");
      } else {
        logHistory(r, "status", `Moved to ${col.title}`);
      }
    }
  }
  sync(id);
  emit();
}

export function removeFromTracker(id: string) {
  const r = ensure(id);
  r.status = "default";
  delete r.savedAt;
  delete r.appliedAt;
  delete r.interviewAt;
  delete r.offerAt;
  delete r.rejectionAt;
  delete r.reminderAt;
  sync(id);
  emit();
}

export function getJobRecord(id: string): JobRecord {
  return ensure(id);
}

// Reminder-conflict helper — returns ids of other tracker records whose
// reminder falls on the same wall-clock minute as `iso`. Used by the
// reminder dialogs to warn (not block) the user about overlapping reminders.
export function findReminderConflicts(iso: string, excludeId?: string): string[] {
  if (!iso) return [];
  const target = minuteKey(iso);
  const out: string[] = [];
  for (const [id, r] of records) {
    if (id === excludeId) continue;
    if (!r.reminderAt) continue;
    if (r.archived) continue;
    if (minuteKey(r.reminderAt) === target) out.push(id);
  }
  return out;
}

// Count active (non-archived) tracker records currently placed in `columnId`.
// Used to guard column/stage deletion in the column-edit UI.
export function countActiveInColumn(columnId: string): number {
  let n = 0;
  for (const r of records.values()) {
    if (r.archived) continue;
    if (r.columnId === columnId) n++;
  }
  return n;
}

// Count active (non-archived) tracker records placed in `columnId` whose
// current stage label (interview or offer) equals `stage`.
export function countActiveWithStage(columnId: string, stage: string): number {
  let n = 0;
  for (const r of records.values()) {
    if (r.archived) continue;
    if (r.columnId !== columnId) continue;
    if (r.interviewStage === stage || r.offerStatus === stage) n++;
  }
  return n;
}

function minuteKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
}

// Hooks
export function useJobRecord(id: string): JobRecord {
  const get = () => {
    ensure(id);
    return getVersion();
  };
  useSyncExternalStore(subscribe, get, get);
  return ensure(id);
}

export function useCounts() {
  const get = () => getVersion();
  useSyncExternalStore(subscribe, get, get);
  let saved = 0, applied = 0, interview = 0, offer = 0, rejection = 0;
  for (const r of records.values()) {
    if (r.status === "saved") saved++;
    else if (r.status === "applied") applied++;
    else if (
      r.status === "interview" ||
      r.status === "interview_screen" ||
      r.status === "interview_tech" ||
      r.status === "test_task"
    ) interview++;
    else if (r.status === "offer") offer++;
    else if (r.status === "rejection") rejection++;
  }
  return { saved, applied, interview, offer, rejection };
}

// IDs of jobs that live in the tracker beyond the "Saved" column
// (Applied / Interview / Offer / Rejection). These should be excluded
// from the Digest wall — only Saved tracker jobs continue to appear there.
export function useTrackerHiddenIds(): Set<string> {
  const get = () => getVersion();
  useSyncExternalStore(subscribe, get, get);
  const set = new Set<string>();
  for (const [id, r] of records) {
    if (
      r.status === "applied" ||
      r.status === "interview" ||
      r.status === "interview_screen" ||
      r.status === "interview_tech" ||
      r.status === "test_task" ||
      r.status === "offer" ||
      r.status === "rejection"
    ) {
      set.add(id);
    }
  }
  return set;
}

// The tracker is now hydrated from `public.user_job_state` after sign-in.
// See `hydrateTrackerFromDb` below. No auto-seed at module load.
void seedOnce;

// ---------- Supabase sync ----------

let currentUserId: string | null = null;
let syncEnabled = false;

function toRow(userId: string, jobId: string, r: JobRecord) {
  return {
    user_id: userId,
    job_id: jobId,
    status: r.status,
    archived: !!r.archived,
    last_status: r.lastStatus ?? null,
    saved_at: r.savedAt ?? null,
    applied_at: r.appliedAt ?? null,
    interview_at: r.interviewAt ?? null,
    offer_at: r.offerAt ?? null,
    rejection_at: r.rejectionAt ?? null,
    reminder_at: r.reminderAt ?? null,
    moved_at: r.movedAt ?? null,
    notes: r.notes ?? "",
    interview_stage: r.interviewStage ?? null,
    offer_status: r.offerStatus ?? null,
    column_id: r.columnId ?? null,
    applied_resume_name: r.appliedResumeName ?? null,
    applied_cover_letter_name: r.appliedCoverLetterName ?? null,
    rejection_details: r.rejectionDetails ?? null,
    offer_details: r.offerDetails ?? null,
    history: (r.history ?? []) as unknown as Json,
  };
}

function sync(jobId: string) {
  if (!syncEnabled || !currentUserId) return;
  const r = records.get(jobId);
  if (!r) return;
  const row = toRow(currentUserId, jobId, r);
  void supabase
    .from("user_job_state")
    .upsert(row, { onConflict: "user_id,job_id" })
    .then((res) => {
      if (res.error) console.error("tracker sync failed", res.error);
    });
}

function rowToRecord(row: Record<string, unknown>): JobRecord {
  return {
    status: (row.status as JobStatus) ?? "default",
    notes: (row.notes as string) ?? "",
    archived: !!row.archived,
    lastStatus: (row.last_status as JobStatus | null) ?? undefined,
    savedAt: (row.saved_at as string | null) ?? undefined,
    appliedAt: (row.applied_at as string | null) ?? undefined,
    interviewAt: (row.interview_at as string | null) ?? undefined,
    offerAt: (row.offer_at as string | null) ?? undefined,
    rejectionAt: (row.rejection_at as string | null) ?? undefined,
    reminderAt: (row.reminder_at as string | null) ?? undefined,
    movedAt: (row.moved_at as string | null) ?? undefined,
    interviewStage: (row.interview_stage as string | null) ?? undefined,
    offerStatus: (row.offer_status as string | null) ?? undefined,
    columnId: (row.column_id as string | null) ?? undefined,
    appliedResumeName: (row.applied_resume_name as string | null) ?? undefined,
    appliedCoverLetterName: (row.applied_cover_letter_name as string | null) ?? undefined,
    rejectionDetails: (row.rejection_details as string | null) ?? undefined,
    offerDetails: (row.offer_details as string | null) ?? undefined,
    history: (row.history as HistoryEntry[] | null) ?? [],
  };
}

let hydratePromise: Promise<void> | null = null;
let hydratedUserId: string | null = null;

export async function hydrateTrackerFromDb(userId: string): Promise<void> {
  if (hydratedUserId === userId) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    syncEnabled = false;
    currentUserId = userId;
    // Reset local state so old (unauthed) map doesn't leak between users
    records.clear();
    const { data, error } = await supabase
      .from("user_job_state")
      .select("*")
      .eq("user_id", userId);
    if (!error && data) {
      for (const row of data as Record<string, unknown>[]) {
        records.set(row.job_id as string, rowToRecord(row));
      }
    }
    hydratedUserId = userId;
    syncEnabled = true;
    emit();
  })();
  try {
    await hydratePromise;
  } finally {
    hydratePromise = null;
  }
}

export function resetTrackerForSignOut() {
  syncEnabled = false;
  currentUserId = null;
  hydratedUserId = null;
  records.clear();
  emit();
}
