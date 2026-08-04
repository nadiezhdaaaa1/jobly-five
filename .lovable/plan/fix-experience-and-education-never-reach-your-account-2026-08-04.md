# Fix: Experience and Education never reach your account

## What is wrong

Confirmed by testing against the live app and the database:

- Your profile row holds an empty work history (`work_history` is `{}`), and so does every other account — nothing was ever written.
- The write itself is allowed: running the same save manually from the app succeeded instantly. So this is not permissions.
- The cause is the save call being created but never sent. The database call is fired as `void supabase.from("profiles").update(...)` — this style of call only performs a request when it is awaited (or `.then(...)`-ed). A check in the live app confirmed zero network requests for such a call.

The same "never sent" pattern also affects:

| What | Effect today |
|---|---|
| Experience / Education (`profiles.work_history`) | never saved |
| Profile extras: cover letters, links, socials, achievements, apply mode (`profiles.profile_extras`) | never saved |
| Hide jobs from companies: add and remove (`blocked_companies`) | never saved |

Because the browser cache is only a paint-before-fetch copy, the next load reads the (empty) server value and your entries disappear.

Tracker cards, board columns and saved filters use awaited calls and are fine.

## The fix

1. Actually dispatch the writes: await the call inside each sync function and handle its result instead of discarding the builder. Applies to work history, profile extras, and both blocked-companies calls.
2. Report failures instead of swallowing them: on error, log it and keep the local copy so the next edit retries — no silent data loss.
3. Flush pending saves: the work-history and profile-extras writes are debounced ~400ms. Also flush on page hide / before unload so a quick edit followed by a reload still lands.
4. Verify end to end: save an Experience and an Education entry in the preview, confirm the rows appear in the database, then reload and confirm they are still shown.

## What you will see

No layout or copy changes. Entries you add now persist to your account and survive reload and other browsers. Your existing (lost) entries cannot be recovered — they were never stored — so they need re-entering once.

## Technical detail

- `src/lib/resume-store.ts`: `scheduleHistorySync` awaits the `profiles.update({ work_history })` call, checks `error`, plus a `flushHistorySync()` used on `visibilitychange`/`pagehide`.
- `src/lib/profile-store.ts`: same treatment for `profiles.update({ profile_extras })`.
- `src/lib/blocked-companies-store.ts`: `blockCompany` upsert and `unblockCompany` delete become awaited helpers with error handling.
- No schema, RLS, or grant changes — those are already correct.
