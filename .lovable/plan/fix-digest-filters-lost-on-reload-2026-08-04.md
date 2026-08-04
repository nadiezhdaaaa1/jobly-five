# Fix: Digest filters lost on reload

## What's happening

On reload, the Digest screen builds its filters from your saved profile answers **once, at the moment the page mounts** — but those answers are still being fetched from the server at that point. The fetch finishes a moment later and nothing re-reads it, so the filter panel comes up empty (no roles selected, defaults everywhere) until you navigate away and back.

The same timing gap also affects job match scores: jobs can finish loading before your profile answers arrive, and the scores are calculated at that moment, so they're computed against an empty profile.

## The fix

1. Make the profile answers store reactive: add a subscription hook so screens re-render when the answers arrive from the server (the store already supports subscriptions; nothing reads them yet).
2. Digest screen reads answers through that hook instead of a one-time read. When the answers first arrive, re-seed the filter panel (roles, defaults) — but only if you haven't already changed filters yourself, so an in-progress edit is never overwritten.
3. Filter panel's role list (the "roles universe" from your profile) becomes reactive too, so the role chips appear instead of the "no roles in your profile" message.
4. Re-score jobs when the profile answers arrive, so match rings and ordering reflect your profile after a reload.

No layout, styling, or filter-panel structure changes. Existing edits in place.

## Technical notes

- `src/lib/quiz-store.ts`: export a `useQuiz()` hook via `useSyncExternalStore(subscribeQuiz, ...)` with a version counter (the current listener set has no snapshot value, so add one).
- `src/routes/_authenticated/dashboard.tsx`: `JobsScreen` uses `useQuiz()`; `seed` derives from it; an effect re-applies the seed on first non-empty answers when `pending`/`applied` are still untouched. `FilterPanel`'s two `loadQuiz()` memos (lines ~971, ~982) switch to the hook value.
- `src/lib/jobs-store.ts`: subscribe to quiz changes and re-map `dbJobs` through `toJob` (re-running `computeMatch`) + bump the store version, so `useJobs`/`useMatchedJobs` consumers update.
