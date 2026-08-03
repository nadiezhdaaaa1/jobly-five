# Make every account setting live on the server

Right now only some things are stored in your account: sign-in, quiz answers, notification settings, resume files, and tracker cards. Everything else lives in the browser, so it disappears on reload or when you sign in from another browser.

Verified current state:
- Subscription changes (upgrade, pause, cancel, resume, dev overrides) are held in memory only, so on reload the app re-reads the server, which still says "free" — the change looks reset.
- Kanban column setup is in browser storage under `jobly:board-columns:v2`.
- Profile extras (cover letters, links, socials, achievements, apply mode) — browser storage.
- Work history (experience / education) — browser storage.
- Saved filters, hidden companies, cancellation feedback — browser storage.
- Already server-side and fine: display name, quiz answers, notification preferences and consents, resume documents, tracker cards, account deletion state.

## What changes for you

1. Subscription state survives reload and follows the account. Upgrade / pause / cancel-at-period-end / resume all write to the account first; the UI shows the state the server confirms. Dev tools keep working but now also write to the account (still dev-only).
2. Tracker board columns (names, order, extra interview columns, stages) follow the account. On first sign-in from a new browser, if the account has no saved column set, the default board is written once so cards keep resolving.
3. Profile tab content — cover letters, links, socials, achievements, apply mode, work history — follows the account.
4. Digest saved filters and "Hide jobs from companies" follow the account.
5. Cancellation feedback is recorded on the account instead of the browser.
6. While these load in a fresh browser you'll briefly see the existing skeleton/placeholder styling; nothing new is invented visually.

No layout, copy, or component structure changes beyond that.

## Technical plan

### Database (one migration)
- `subscriptions`: keep client write access closed — writes happen only through server functions using the service-role client after verifying `auth.uid()`. Add `ever_subscribed boolean not null default false` so "has had Pro" is server truth.
- New `board_columns` (user_id, column_id text, kind, title, stages text[], position int, unique(user_id, column_id)) with GRANTs to `authenticated`/`service_role`, RLS `auth.uid() = user_id` on all four verbs, `updated_at` trigger.
- New `saved_filters` (user_id, name, filters jsonb) and `blocked_companies` (user_id, company text, unique per user) — same GRANT + RLS shape.
- New `cancel_feedback` (user_id, reason, details) — insert/select own.
- `profiles`: add `profile_extras jsonb not null default '{}'` and `work_history jsonb not null default '{}'` (existing profiles RLS already covers own-row read/write).

### Client stores (edited in place, same exported API)
Each affected store gets the pattern already used by `quiz-store` / `notifications-store`:
- `hydrateXFromDb()` called from `src/routes/_authenticated/route.tsx` alongside the existing hydrations.
- Writes go to the database (debounced ~400ms for jsonb blobs, immediate for column reorders and filter add/delete); localStorage stays only as an offline cache, never as truth.
- SSR snapshots keep returning defaults.

Files: `board-columns-store.ts`, `profile-store.ts`, `resume-store.ts` (work history), `saved-filters-store.ts`, `blocked-companies-store.ts`, `cancel-feedback-store.ts`.

### Subscription path
- New `src/lib/subscription.functions.ts` with `requireSupabaseAuth`-protected fns: `startPro`, `pauseSubscription`, `cancelAtPeriodEnd`, `resumeSubscription`, plus `devSetStatus` guarded to non-production. Each writes `subscriptions` for `context.userId` (service-role client imported inside the handler) and returns fresh entitlements.
- `plan-store.ts` mutators become thin wrappers: call the server fn, then `hydrateSubscription(...)` from the returned row; on failure the previous state is kept and the caller flashes an error. `settings.tsx` call sites keep their current names and toasts.
- `entitlements-provider` gains a `refetch()` after each mutation so all gated regions agree.
- These remain placeholders for real billing: once Stripe is wired up, the same rows are written by the webhook instead.