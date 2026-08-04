import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared date layer. Two rules:
 *  1. Never render a date we don't actually know — callers get `null` and must
 *     fall back to date-free copy.
 *  2. Format client-side only, in the account's timezone, so SSR and the
 *     browser can't disagree.
 */

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

let cachedTz: string | null = null;
let tzPromise: Promise<string> | null = null;

/** Account timezone from notification preferences, browser zone as fallback. */
export function displayTimezone(): Promise<string> {
  if (cachedTz) return Promise.resolve(cachedTz);
  if (!tzPromise) {
    tzPromise = (async () => {
      try {
        const { data } = await supabase
          .from("notification_preferences")
          .select("timezone")
          .maybeSingle();
        cachedTz = data?.timezone || browserTimezone();
      } catch {
        cachedTz = browserTimezone();
      }
      return cachedTz;
    })();
  }
  return tzPromise;
}

/** Clears the cached zone — used on sign-out / account switch. */
export function resetTimezoneCache() {
  cachedTz = null;
  tzPromise = null;
}

function isKnown(iso: string | null | undefined): iso is string {
  if (!iso) return false;
  const ms = new Date(iso).getTime();
  // Epoch-ish values are our "unknown" sentinel, not a real date.
  return Number.isFinite(ms) && ms > 86_400_000;
}

/** "Aug 20, 2026" — or `null` when the date isn't actually known. */
export function formatDateLabel(iso: string | null | undefined, tz?: string): string | null {
  if (!isKnown(iso)) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(tz ? { timeZone: tz } : {}),
    });
  } catch {
    return null;
  }
}

/**
 * Client-only formatted label. `null` while hydrating or when the date is
 * unknown, so copy that depends on it can be omitted entirely.
 */
export function useDateLabel(iso: string | null | undefined): string | null {
  const [tz, setTz] = useState<string | null>(cachedTz);
  useEffect(() => {
    let alive = true;
    void displayTimezone().then((z) => {
      if (alive) setTz(z);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!tz) return null;
  return formatDateLabel(iso, tz);
}
