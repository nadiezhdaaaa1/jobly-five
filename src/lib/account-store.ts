import { useSyncExternalStore } from "react";
import { deletionDateFrom } from "@/config/account";
import { setPlan } from "@/lib/plan-store";
import {
  getAccountState,
  requestDeletionOnServer,
  restoreAccountOnServer,
} from "@/lib/account.functions";

// Account lifecycle status. Deliberately ORTHOGONAL to the plan enum
// (free | pro | paused) — deletion state is never merged into it.
export type AccountStatus = "active" | "pending_deletion";

export type AccountState = {
  accountStatus: AccountStatus;
  deletionRequestedAt: string | null;
  /** Derived from deletionRequestedAt — never an independent input. */
  deletionScheduledFor: string | null;
};

const LEGACY_KEY = "jobly.account";
const CACHE = "account";

// Set once the signed-in user is known; the cache is per account.
let accountUserId: string | null = null;

function activeState(): AccountState {
  return { accountStatus: "active", deletionRequestedAt: null, deletionScheduledFor: null };
}

function fromCache(p: Partial<AccountState> | null): AccountState {
  if (p?.accountStatus === "pending_deletion" && p.deletionRequestedAt) {
    return {
      accountStatus: "pending_deletion",
      deletionRequestedAt: p.deletionRequestedAt,
      deletionScheduledFor:
        p.deletionScheduledFor ?? deletionDateFrom(new Date(p.deletionRequestedAt)).toISOString(),
    };
  }
  return activeState();
}

let state: AccountState = activeState();
const listeners = new Set<() => void>();

function commit(next: AccountState) {
  state = next;
  writeUserCache(CACHE, accountUserId, state);
  listeners.forEach((l) => l());
}

export function getAccount(): AccountState {
  return state;
}

/** Pure helper — the deletion schedule for a given request time. */
export function scheduleFor(requestedAt: Date): AccountState {
  return {
    accountStatus: "pending_deletion",
    deletionRequestedAt: requestedAt.toISOString(),
    deletionScheduledFor: deletionDateFrom(requestedAt).toISOString(),
  };
}

/**
 * Request deletion. Nothing is erased: status flips, timestamps are set,
 * the subscription cancels immediately (no pause offer here) and all
 * outbound digests/notifications stop.
 */
export function requestAccountDeletion(now: Date = new Date()) {
  commit(scheduleFor(now));
  // Immediate cancellation — NOT cancel-at-period-end.
  setPlan("free");
}

/** Server-of-record write. Local state is updated optimistically first. */
export async function requestAccountDeletionServer(now: Date = new Date()) {
  requestAccountDeletion(now);
  const next = await requestDeletionOnServer({ data: { requestedAt: now.toISOString() } });
  commit(next);
  return next;
}

export async function restoreAccountServer() {
  restoreAccount();
  const next = await restoreAccountOnServer({});
  commit(next);
  return next;
}

/** Pull the authoritative status from the database after sign-in. */
export async function hydrateAccountFromDb() {
  try {
    const next = await getAccountState({});
    commit(next);
    return next;
  } catch {
    return state;
  }
}

/** Restore during the grace window. Data comes back as-is; plan stays Free. */
export function restoreAccount() {
  commit(activeState());
}

export function isPendingDeletion(s: AccountState = state) {
  return s.accountStatus === "pending_deletion";
}

export function isPastGrace(s: AccountState = state, now: number = Date.now()) {
  return Boolean(s.deletionScheduledFor && now >= new Date(s.deletionScheduledFor).getTime());
}

/** DEV ONLY — force the pending_deletion state locally. */
export function devSetPendingDeletion(on: boolean) {
  commit(on ? scheduleFor(new Date()) : activeState());
}

/** DEV ONLY — move the scheduled purge into the past to exercise that path. */
export function devFastForwardPastGrace() {
  if (!isPendingDeletion()) return;
  const past = new Date(Date.now() - 60_000).toISOString();
  commit({ ...state, deletionScheduledFor: past });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useAccount(): AccountState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}