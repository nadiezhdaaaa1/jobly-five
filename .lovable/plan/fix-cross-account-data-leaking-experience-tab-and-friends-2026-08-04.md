# Fix cross-account data leaking (Experience tab and friends)

## What is happening

The Experience data is not coming from the new account — it is coming from this browser. Several
account stores keep an offline cache in the browser under a single shared key (no user attached),
and on sign-in they do this:

- if the new account has rows on the server -> use the server rows (correct)
- if the new account has NO rows -> **push the browser cache up to the server** (wrong)

A brand-new account has no rows, so the previous account's cached data is adopted and then written
into the new account. Confirmed in the code for:

| Area | Cache key | Behaviour on an empty account |
|---|---|---|
| Experience / Education | `jobly.experience` | previous data pushed into `profiles.work_history` |
| Profile extras (cover letters, links, socials, achievements) | `jobly.profile.extras` | pushed into `profiles.profile_extras` |
| Tracker custom columns and states | `jobly.boardColumns` | pushed into `board_columns` |
| Saved filters | `jobly.savedFilters.v1` | pushed into `saved_filters` |
| Hide jobs from companies | `jobly.blockedCompanies` | pushed into `blocked_companies` |
| Account status | `jobly.account` | read from cache before the server answers |

Tracker job cards (`user_job_state`) and quiz/profile preferences (`profiles.quiz_answers`) are
already server-only, so they do not leak — but their in-memory copies are not cleared on sign-out,
so a second sign-in in the same tab can briefly show the first account's values.

Also: logging out does not clear these browser caches, which is what let the data survive into the
new account.

## The fix

1. **Namespace every cache per user.** Keys become `jobly.<name>.<userId>`. A cache written by
   another account is then invisible, not adopted.
2. **Never push a local cache into an empty account.** On sign-in the server is the only source of
   truth: empty on the server means empty in the app. The local cache is only a paint-before-fetch
   cache for the *same* user id.
3. **Clear on sign-out and on user switch.** Log out (and the delete-account sign-out) wipes all
   `jobly.*` user keys and resets in-memory state (tracker, quiz, profile extras, work history,
   columns, filters, blocked companies, account status).
4. **One-time handling of legacy keys.** An existing un-namespaced cache is adopted only when the
   server already has matching rows for that user (provably their own data); otherwise the legacy
   key is deleted, never uploaded.

## Already-corrupted rows

The new account may already hold the old account's Experience/extras/columns on the server. Nothing
is deleted without your say-so: default is to leave the rows so you can edit or clear them in the
UI. Say the word and I will add a one-off cleanup of those rows for the new account instead.

## Technical detail

- `src/lib/resume-store.ts`, `src/lib/profile-store.ts`, `src/lib/board-columns-store.ts`,
  `src/lib/saved-filters-store.ts`, `src/lib/blocked-companies-store.ts`, `src/lib/account-store.ts`:
  add `setCacheUser(userId)`; read/write the cache under the namespaced key; remove the
  "empty account -> push local" branch in each `hydrate*FromDb`; each `reset*ForSignOut` also resets
  in-memory state to defaults.
- `src/lib/local-data.ts`: keep the `jobly.` prefix sweep (it already covers namespaced keys) and use
  it from sign-out.
- `src/routes/_authenticated/route.tsx`: set the cache user id before any hydrate call; hydrate order
  and the existing cleanup on `userId` change stay as they are.
- `src/routes/_authenticated/settings.tsx`: both `supabase.auth.signOut()` call sites clear local
  caches and in-memory stores first.
- `src/lib/quiz-store.ts`: reset answers and the `hydrated` flag on sign-out.
- No visible UI or layout changes; no schema changes.