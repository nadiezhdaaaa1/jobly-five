# Prepare the digest timestamp for real backend data

Right now the Digest header always says "Your latest digest arrived Today at 9:02" — a hard-coded string. This prepares that line to display a real delivery time once the backend provides one, without changing anything else on the screen.

## Behaviour

- New small data source for "when did this user's latest digest arrive".
- Until the backend exists, it returns a placeholder timestamp (today at 09:02) so the screen looks unchanged.
- While the value is being resolved, the line shows a short shimmer placeholder instead of a wrong time.
- If there is no digest yet (new user), the line reads "Your first digest is on its way" instead of a fake time.
- Formatting is smart and reusable:
  - Today -> "Today at 9:02"
  - Yesterday -> "Yesterday at 9:02"
  - Older -> "Aug 1 at 9:02" (US style, matching the rest of the app)

## Technical notes

- New `src/lib/digest-delivery-store.ts`:
  - `formatDigestArrival(date: Date | null): string` (pure, unit-testable)
  - `useLatestDigestAt(): { at: Date | null; loading: boolean }` hook, currently returning the placeholder value from a single clearly-marked `PLACEHOLDER_LATEST_DIGEST_AT` constant, with a `TODO(backend)` marker at the exact swap point.
- New `src/lib/digest-delivery.functions.ts` is not created yet — the hook is written so only its internals change when the server function/table lands (no component edits needed later).
- `src/routes/_authenticated/dashboard.tsx` line 1389 only: replace the literal string with `formatDigestArrival(at)` plus the loading/empty branches. No layout, typography, or colour changes.
- Add a vitest case for `formatDigestArrival` covering today / yesterday / older / null.
