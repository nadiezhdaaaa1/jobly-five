import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// Durable "not interested" / "reported" state for jobs.
// Persisted in `public.job_interactions`, so a reload keeps the job hidden.

export type InteractionKind = "disliked" | "reported";

export type JobInteraction = {
  kind: InteractionKind;
  reason?: string;
  note?: string;
};

const map = new Map<string, JobInteraction>();
const listeners = new Set<() => void>();
let version = 0;
let userId: string | null = null;
let hydratedUserId: string | null = null;

function emit() {
  version++;
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getVersion() {
  return version;
}

export function getJobInteraction(id: string): JobInteraction | undefined {
  return map.get(id);
}

export function useJobInteraction(id: string): JobInteraction | undefined {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return map.get(id);
}

/** Ids to hide from the Digest feed and the Tracker board. */
export function useHiddenJobIds(): Set<string> {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return new Set(map.keys());
}

export function useJobInteractionsHydrated(): boolean {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return hydratedUserId !== null;
}

async function push(jobId: string, i: JobInteraction) {
  if (!userId) return;
  const { error } = await supabase.from("job_interactions").upsert(
    {
      user_id: userId,
      job_id: jobId,
      kind: i.kind,
      reason: i.reason ?? null,
      note: i.note ?? null,
    },
    { onConflict: "user_id,job_id" },
  );
  if (error) console.error("job interaction sync failed", error);
}

async function drop(jobId: string) {
  if (!userId) return;
  const { error } = await supabase
    .from("job_interactions")
    .delete()
    .eq("user_id", userId)
    .eq("job_id", jobId);
  if (error) console.error("job interaction removal failed", error);
}

export function setJobInteraction(
  jobId: string,
  kind: InteractionKind,
  reason?: string,
  note?: string,
) {
  const i: JobInteraction = { kind, reason, note };
  map.set(jobId, i);
  void push(jobId, i);
  emit();
}

/** Session-only undo: also removes the persisted row. */
export function clearJobInteraction(jobId: string) {
  if (!map.delete(jobId)) return;
  void drop(jobId);
  emit();
}

export async function hydrateJobInteractionsFromDb(uid: string) {
  userId = uid;
  const { data, error } = await supabase
    .from("job_interactions")
    .select("job_id, kind, reason, note")
    .eq("user_id", uid);
  if (!error && data) {
    map.clear();
    for (const row of data) {
      map.set(row.job_id, {
        kind: row.kind as InteractionKind,
        reason: row.reason ?? undefined,
        note: row.note ?? undefined,
      });
    }
  }
  hydratedUserId = uid;
  emit();
}

export function resetJobInteractionsForSignOut() {
  userId = null;
  hydratedUserId = null;
  map.clear();
  emit();
}
