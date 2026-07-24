import { useSyncExternalStore } from "react";

// Session-only overlay for the Digest wall. NOT persisted. Cleared on reload.
// Values represent an ephemeral card-collapse state on the feed. The tracker
// store remains the source of truth for real "applied" persistence.

export type DigestSessionState = "applied" | "disliked" | "reported";

const map = new Map<string, DigestSessionState>();
const listeners = new Set<() => void>();
let version = 0;

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

export function setDigestSession(id: string, s: DigestSessionState) {
  map.set(id, s);
  emit();
}

export function clearDigestSession(id: string) {
  if (map.delete(id)) emit();
}

export function getDigestSession(id: string): DigestSessionState | undefined {
  return map.get(id);
}

export function useDigestSession(id: string): DigestSessionState | undefined {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return map.get(id);
}