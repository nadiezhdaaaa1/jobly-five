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
};

type Seed = { id: string; status: JobStatus; reminderAt?: string };

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

// Interview-reminder demo seeds: today (orange chip), upcoming (neutral),
// and one interview with no reminder to cover all three visual states.
const REMINDER_SEEDS: Record<string, string> = {
  y2: todayAt(0, 14, 45),
  "d3-4": todayAt(2, 11, 0),
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

function isSameLocalDay(iso: string, ref = new Date()) {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

export const dateHelpers = { shortDate, shortDateTime, isSameLocalDay };

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
      const r: JobRecord = { status: (j.initialState as JobStatus) ?? "default", notes: "" };
      if (r.status === "saved") r.savedAt = today(-2);
      if (r.status === "applied") {
        r.savedAt = today(-3);
        r.appliedAt = today(-1);
      }
      if (r.status === "interview") {
        r.savedAt = today(-6);
        r.appliedAt = today(-4);
        r.interviewAt = today(-1);
      }
      if (r.status === "offer") {
        r.savedAt = today(-14);
        r.appliedAt = today(-10);
        r.interviewAt = today(-5);
        r.offerAt = today(0);
      }
      if (r.status === "rejection") {
        r.savedAt = today(-10);
        r.appliedAt = today(-7);
        r.rejectionAt = today(0);
      }
      const rem = REMINDER_SEEDS[j.id];
      if (rem && r.status === "interview") r.reminderAt = rem;
      records.set(j.id, r);
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
    }
    if (s.status === "offer") r.offerAt ??= today(0);
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
  seedFrom(allJobs, []);
  emit();
}

// Actions
export function setStatus(id: string, next: JobStatus) {
  const r = ensure(id);
  r.status = next;
  if (next === "saved") r.savedAt ??= today();
  if (next === "applied") r.appliedAt ??= today();
  if (next === "interview") r.interviewAt ??= today();
  if (next === "offer") r.offerAt ??= today();
  if (next === "rejection") r.rejectionAt ??= today();
  emit();
}

export function setReminder(id: string, iso: string | null) {
  const r = ensure(id);
  if (iso) r.reminderAt = iso;
  else delete r.reminderAt;
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
seedFrom([...TODAY_JOBS, ...YESTERDAY_JOBS]);
seedOnce();
