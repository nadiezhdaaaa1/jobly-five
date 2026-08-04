# Remove the load-in flash on Digest, plan state, and Tracker

## Recommendation: skeletons, not empty states

An empty state means "there is nothing here". During loading there *is* something — we just don't have it yet. Showing an empty state (or a default value) for a fraction of a second is what makes the current experience feel wrong: filters appear unset, the plan appears Free, the Tracker appears locked, and then everything jumps. So: skeleton placeholders that match the final shape, shown only while the relevant data is unknown, and real content the moment it arrives. Empty states stay reserved for genuinely empty results ("no jobs match", "no cards in this column").

The app already has a `.skeleton` shimmer utility used by the Digest job rows, so this is consistent, not new visual language.

## What changes on screen

1. Digest filter panel — while profile answers are still loading, the panel shows skeleton bars in place of the role chips and the seniority / location / salary values instead of empty controls. No layout shift when they fill in.
2. Plan state (nav "Pro" badge, plan-dependent labels) — renders a small neutral skeleton chip until entitlements are known, instead of briefly reading "Free".
3. Tracker — the Free upsell card no longer flashes for Pro users: while entitlements are unknown, the board area shows the column skeletons already planned for it, then resolves to either the board or the upsell.
4. Tracker board — keeps the existing per-column skeleton behaviour (exact card counts once tracker state is known, 3 neutral placeholders before that).

Nothing is restructured; no copy, spacing, or colour changes beyond the placeholders themselves.

## Technical notes

- `src/lib/quiz-store.ts`: add a `hydrated` flag set by `hydrateQuizFromProfile()` (both the found and not-found paths) plus a `useQuizHydrated()` hook on the existing subscription, so screens can tell "no answers yet" from "not loaded yet".
- `src/routes/_authenticated/dashboard.tsx`: `FilterPanel` and the roles/defaults section render skeleton placeholders while `!quizHydrated`; the existing re-seed effect is untouched.
- `src/components/app/AppNav.tsx`: gate the Pro badge on `useEntitlementsReady()` (already exported from `plan-store`) with a skeleton chip fallback.
- `src/routes/_authenticated/tracker.tsx` (~line 789): check `useEntitlementsReady()` before the `!isPro(plan)` branch; while not ready, render the loading board rather than the upsell.
- No store, query, schema, or matching-logic changes.
