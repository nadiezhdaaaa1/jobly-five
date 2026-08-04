/**
 * Per-account browser cache.
 *
 * Account data lives on the server; the browser keeps only a paint-before-fetch
 * copy. That copy MUST be namespaced by user id — a shared key let a new account
 * adopt (and then upload) the previous account's data on this browser.
 *
 * Keys look like `jobly.<name>.<userId>`; the legacy un-namespaced `jobly.<name>`
 * keys are deleted on sight, never adopted.
 */

function keyFor(name: string, userId: string) {
  return `jobly.${name}.${userId}`;
}

export function readUserCache<T>(name: string, userId: string | null): T | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(name, userId));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeUserCache(name: string, userId: string | null, value: unknown) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(keyFor(name, userId), JSON.stringify(value));
  } catch {
    /* quota — the server is the source of truth anyway */
  }
}

export function clearUserCache(name: string, userId: string | null) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.removeItem(keyFor(name, userId));
  } catch {
    /* ignore */
  }
}

/** Drops a pre-namespacing key so it can never be uploaded to an account. */
export function dropLegacyCache(...legacyKeys: string[]) {
  if (typeof window === "undefined") return;
  for (const k of legacyKeys) {
    try {
      window.localStorage.removeItem(k);
      window.sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}