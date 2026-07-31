# Skeleton loading for the Tracker board

Short answer: yes — and we can show the **exact** number of cards per column, not a guess.

## Why exact counts are possible

The board gets its data from two independent sources:

- **Card placement** (which job sits in which column) comes from the user's saved tracker state, a small per-user table that loads almost instantly right after sign-in.
- **Job details** (title, company, logo, salary) come from the big jobs dataset, which is what actually takes time to load.

So by the time we need to draw the board, we already know "Saved: 4, Applied: 7, Offer: 2" — we just don't have the text to put inside the cards yet. The skeletons can therefore mirror the real board one-for-one, and the real cards swap in with zero layout shift.

Fallback: in the brief moment before even the tracker state has loaded (or for a brand-new user with no state yet), we show **3 placeholder cards per column** as a neutral default.

## What changes

- Each column header renders normally (title + real count) as soon as tracker state is known.
- While job details are still loading, each column renders N skeleton cards where N = that column's real card count.
- Skeleton card matches the real Kanban card shell exactly: 8px white card on the grey column, logo square, two text lines (title / company), a meta row, and the small action-button blocks.
- Same shimmer used on the Digest, so the two screens feel consistent; reduced-motion falls back to a soft pulse.
- Empty columns stay empty (no skeletons) — we know they're empty.
- Real cards fade in when data arrives.

## Technical notes

- `src/lib/tracker-store.ts`: export a `useTrackerHydrated()` hook plus a per-column pending-count selector derived from the existing in-memory records map (same source `countActiveInColumn` already uses). No schema or sync changes.
- `src/routes/_authenticated/tracker.tsx`: read `loaded` from `useJobs()` (currently discarded at line 714) and pass a `loadingCount` into `KanbanColumn`; when `!loaded`, render `KanbanCardSkeleton` x N instead of the job list.
- New `KanbanCardSkeleton` component reusing the existing `.skeleton` utility already added to `src/styles.css` for the Digest — no new CSS.
- Purely presentational; drag/drop, counts, and archived toggle logic untouched.
