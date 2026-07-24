import { useSyncExternalStore } from "react";
import { TODAY_JOBS, YESTERDAY_JOBS, type Job } from "@/lib/jobs-data";

export type JobStatus =
  | "default"
  | "saved"
  | "applied"
  | "interview"
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
  | "offer_details";

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

const STATUS_LABELS: Record<JobStatus, string> = {
  default: "Removed",
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
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
    if (!r.interviewStage) r.interviewStage = "Pre-screen";
  }
  if (next === "offer") {
    r.offerAt ??= today();
    if (!r.offerStatus) r.offerStatus = "Waiting for my reply";
  }
  if (next === "rejection") r.rejectionAt ??= today();
  // History: only log meaningful transitions between tracker columns / saved.
  const trackerCols: JobStatus[] = ["saved", "applied", "interview", "offer", "rejection"];
  if (next === "saved" && !trackerCols.includes(prev)) {
    logHistory(r, "saved", "Saved");
  } else if (prev === "saved" && next === "default") {
    logHistory(r, "saved", "Unsaved");
  } else if (trackerCols.includes(prev) && trackerCols.includes(next)) {
    logHistory(r, "status", `Moved from ${STATUS_LABELS[prev]} to ${STATUS_LABELS[next]}`);
  }
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
  emit();
}

export function archiveJob(id: string) {
  const r = ensure(id);
  r.lastStatus = r.status;
  r.archived = true;
  r.status = "default";
  emit();
}

export function restoreArchived(id: string) {
  const r = ensure(id);
  if (!r.archived) return;
  r.status = (r.lastStatus ?? "saved") as JobStatus;
  r.archived = false;
  r.movedAt = today();
  emit();
}

export function setInterviewStage(id: string, stage: string) {
  const r = ensure(id);
  const prev = r.interviewStage;
  if (prev === stage) return;
  r.interviewStage = stage;
  if (prev) {
    logHistory(r, "interview_stage", `Interview stage changed from ${prev} to ${stage}`);
  } else {
    logHistory(r, "interview_stage", `Interview stage set to ${stage}`);
  }
  emit();
}

export function setOfferStatus(id: string, offerStatus: string) {
  const r = ensure(id);
  const prev = r.offerStatus;
  if (prev === offerStatus) return;
  r.offerStatus = offerStatus;
  if (prev) {
    logHistory(r, "offer_stage", `Offer stage changed from ${prev} to ${offerStatus}`);
  } else {
    logHistory(r, "offer_stage", `Offer stage set to ${offerStatus}`);
  }
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
  emit();
}

export function setRejectionDetails(id: string, details: string) {
  const r = ensure(id);
  const prev = r.rejectionDetails ?? "";
  const next = details ?? "";
  if (prev === next) return;
  r.rejectionDetails = next;
  logHistory(r, "rejection_details", prev ? `Rejection details updated` : `Rejection details added`);
  emit();
}

export function setOfferDetails(id: string, details: string) {
  const r = ensure(id);
  const prev = r.offerDetails ?? "";
  const next = details ?? "";
  if (prev === next) return;
  r.offerDetails = next;
  logHistory(r, "offer_details", prev ? `Offer details updated` : `Offer details added`);
  emit();
}

export function setNotes(id: string, notes: string) {
  const r = ensure(id);
  r.notes = notes;
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
  emit();
}

export function getJobRecord(id: string): JobRecord {
  return ensure(id);
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
    else if (r.status === "interview") interview++;
    else if (r.status === "offer") offer++;
    else if (r.status === "rejection") rejection++;
  }
  return { saved, applied, interview, offer, rejection };
}

// Auto-seed on import
historyPaused = true;
seedFrom([...TODAY_JOBS, ...YESTERDAY_JOBS]);
seedOnce();
historyPaused = false;
