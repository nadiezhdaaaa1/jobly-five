import { useEffect, useState } from "react";

/**
 * Placeholder until the backend exposes the real digest delivery time.
 * TODO(backend): replace with a server read (e.g. `getLatestDigestAt()` server fn
 * against a `digests` table) inside `useLatestDigestAt` below. Nothing outside
 * this file needs to change when that lands.
 */
export function placeholderLatestDigestAt(): Date {
  const d = new Date();
  d.setHours(9, 2, 0, 0);
  return d;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function timePart(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Today at 9:02" / "Yesterday at 9:02" / "Aug 1 at 9:02" / first-digest copy. */
export function formatDigestArrival(date: Date | null, now: Date = new Date()): string {
  if (!date) return "Your first digest is on its way";
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  const when = dayDiff === 0 ? "Today" : dayDiff === 1 ? "Yesterday" : `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return `Your latest digest arrived ${when} at ${timePart(date)}`;
}

export function useLatestDigestAt(): { at: Date | null; loading: boolean } {
  const [state, setState] = useState<{ at: Date | null; loading: boolean }>({ at: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    // TODO(backend): swap this resolution for the real server read.
    const resolve = async (): Promise<Date | null> => placeholderLatestDigestAt();
    resolve().then((at) => {
      if (!cancelled) setState({ at, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
