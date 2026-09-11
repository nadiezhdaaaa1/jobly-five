# Two paid plans, registration in a modal, and a guided first run

## What changes for a visitor

- The pricing block on the homepage becomes two cards: a 3-day free trial that continues at the monthly price, and an annual plan with a "Save 42%" badge. The Free card and the Monthly/Annual switch are removed.
- Choosing a plan opens a sign-up window on top of the page instead of sending people to a separate page. It supports Google and email + password with the confirmation email exactly as today, and the "check your inbox" message appears inside the window.
- After signing up, people go to a clearly-labelled mock checkout, then to a confirmation screen that re-reads their real access from the server, then into the app.
- Two entry orders are supported: quiz first (quiz -> top matches -> pick a plan), and plan first (pick a plan -> pay -> quiz -> top matches).
- The quiz no longer asks for an email; the account email comes from the sign-up window.

## Verified against the code (facts I am building on)

- `src/config/pricing.ts`: monthly 9.99, annual 5.79/mo, `TRIAL_DAYS = 3`; `total`, `savings`, `discountPct`, `usd` helpers exist. All copy will call these.
- `Features` in `src/lib/entitlements.ts`: match_score, daily_digest, tracker, follow_up_reminders, found_a_job_pause.
- `get_entitlements()` (latest migration `20260803141951…`) already treats `status = 'trialing' AND trial_ends_at > now()` as Pro, so trial = full Pro access once `trial_ends_at` is actually written. It does not return `cycle` yet.
- `applySubscriptionAction` in `src/lib/subscription.functions.ts` is the only service-role write path; it has no `start_trial` and never writes `trial_ends_at`.
- `src/routes/matches.tsx` `handleEmailCreate` waits 900ms and navigates — it creates no account. Its email field is `answers.email` (readOnly).
- `claimQuizDraft` claims by `token_hash` with no ownership check and falls back to `quiz_drafts.email`; `clearDraftToken()` is absent from `src/lib/sign-out.ts`.
- `src/routes/_authenticated/route.tsx` gate only checks for a session.

## Conflicts with the brief, and how I will resolve them

1. **"Settings → Subscription" does not exist.** `src/routes/_authenticated/settings.tsx` is one page of cards titled **Plan**, "Billing and payment", "Notifications", "Hide jobs from companies", "Security and sign in", "Danger zone". The cancel flow is genuinely two steps (pause offer, then confirm with reason). So both disclosures will read: `Cancel anytime in Settings → Plan in two steps.` — the price interpolated with `usd()` / `usd(total(PRICING.annual))`.
2. **There is no analytics layer today** — no PostHog, gtag, dataLayer, or track helper anywhere in `src/`. "Keep every existing event" is vacuous. I will add a tiny `src/lib/analytics.ts` (`track(name, props)`) that is a safe no-op until a provider is wired, and emit the three new events through it. No provider will be installed.
3. **There is no "onboarded" flag.** I will derive it server-side from `profiles.quiz_answers` being non-empty with a matching `quiz_schema_version` (already written by `claimQuizDraft`), exposed as a boolean on the existing entitlements/subscription read. No new table.
4. **Settings is inside `_authenticated`**, so "gate-exempt" means the new *access* rules skip `/settings` (the session check still applies) — no route move.
5. Stale Free copy also exists in `src/lib/faq-data.ts` ("The daily digest and quiz are free forever…" and the weekly-cadence answer) besides the two items you named. I will update those too and report the final list.

## Draft recovery (§6 answer)

The `quiz_drafts.email` fallback is fed only by the step being deleted, so left alone it becomes dead code. **Recommended: keep the fallback alive by writing the email from the registration modal.** On a successful modal *signup* (email path) I will fire one `saveQuizDraft` patch carrying the entered email before navigating, so a token lost between sign-up and confirmation-link click can still be recovered by email — same column, same server function, no schema change. For the Google path there is no email until the callback, so recovery there relies on the token, which survives the redirect in localStorage. If you would rather not touch the draft on sign-up, the alternative is deleting the email fallback branch from `claimQuizDraft` entirely; say the word and I will do that instead.

## Account-scoped draft guard (§9)

- `claimQuizDraft`: refuse a draft whose `user_id` is set to a different account; only claim rows with `user_id IS NULL` or equal to the caller. Fallback-by-email only matches the caller's own verified email (as today) and only unclaimed rows.
- `clearDraftToken()` added to `clearUserStateForSignOut` in `src/lib/sign-out.ts`.
- The draft token is stamped with the account id it was claimed for; on a different account in the same browser the pointer is dropped before any hydration reads it.

## Database migration (one migration)

```sql
ALTER TABLE public.subscriptions
  ADD COLUMN cycle text CHECK (cycle IN ('monthly','annual'));
-- get_entitlements(): add 'cycle', s.cycle and 'onboarded' (profiles.quiz_answers <> '{}')
CREATE OR REPLACE FUNCTION public.get_entitlements() ... ;
```
No table creation, so no new GRANTs; `subscriptions` grants stay as they are. `plan` keeps its free/pro/paused meaning; `resolveIsPro` / `resolvePlan` untouched.

## Files

**Create**
- `src/lib/auth/authActions.ts` — extracted signup/sign-in/Google logic with every existing control kept: Turnstile, `guardAuthAttempt`, `getSigninGate`/`reportSigninFailure`, honeypot, 1.5s fill floor, `isDisposableEmail`, enumeration-neutral copy, `markPendingSignupAcceptance`/`recordSignupAcceptance`.
- `src/components/auth/RegistrationModal.tsx` — dialog-based, signup + sign-in modes, required Terms/Privacy tick with today's wording and links, inbox state inside the modal, `onAuthed` callback, ESC/backdrop/focus trap, close keeps saved intent.
- `src/lib/onboarding/planIntent.ts` — enum plan + cycle intent store (localStorage) plus the `postAuthPath` sessionStorage key.
- `src/lib/onboarding/usePlanFlow.ts` — `selectPlan({ plan, cycle, trial })` with the four branches from §4; clears `postAuthPath` on every outcome including errors, in-session success, and modal close.
- `src/lib/analytics.ts` — thin `track()`.
- `src/routes/checkout.tsx` — mock checkout, no card fields, shows plan/cycle + matching disclosure, confirms via `applySubscriptionAction`; never opens the modal.
- `src/routes/checkout.confirmation.tsx` — re-reads `get_entitlements` / `getSubscriptionRow`; ignores query params.
- `src/components/onboarding/PlanStep.tsx` — plan selection after the `/matches` A-ha screen.

**Modify**
- `src/lib/subscription.functions.ts` — `start_trial` action (status trialing, plan pro, cycle monthly, `trial_ends_at` = now + `TRIAL_DAYS`, `current_period_end` = trial end, ever_subscribed true); `activate` takes a cycle (+30d / +365d); `cycle` in `SubscriptionRow` and `COLS`. Trial can only convert to monthly.
- `src/lib/entitlements.ts` — `cycle` and `onboarded` on `Entitlements`.
- `src/routes/index.tsx` — two-card pricing, Free card and toggle deleted, `CtaLink`/card clicks route through `usePlanFlow`, `SoftwareApplication` offers array drops the $0 Free offer.
- `src/components/site/FaqSection.tsx` — remove "daily on Pro, weekly on Free" (also fixes the live FAQPage JSON-LD).
- `src/lib/faq-data.ts` — remove free-forever / Free-tier claims.
- `src/routes/signup.tsx`, `src/routes/login.tsx` — consume the extracted module; pages stay as-is for direct navigation.
- `src/routes/matches.tsx` — fake email path deleted, registration modal in its place, plan step after the matches list, `answers.email` prefill removed.
- `src/routes/quiz.tsx` — `"email"` removed from `StepKey`/`STEP_ORDER`, `EmailStep` deleted, summary label/value entries removed; quiz ends at `loc`. No other step touched.
- `src/lib/quiz-store.ts` — `email` no longer collected by the quiz.
- `src/lib/quiz-draft.functions.ts` — ownership guard.
- `src/lib/sign-out.ts` — clear the draft token.
- `src/routes/_authenticated/route.tsx` — access gate rows from §8, `/settings` exempt.
- `public/robots.txt` — `Disallow: /checkout` (covers the confirmation child).

## Assumptions

- `cycle` is a checked `text` column rather than a new enum, to keep the migration reversible and the types simple.
- "Onboarded" = quiz answers present on the profile at the current schema version.
- The mock checkout is a single confirm button; no card fields, no provider.
- Existing subscribers keep `cycle = null` until their next action; UI treats null as monthly-equivalent for display only.

## Not touched

Auth model and every security control, `src/config/pricing.ts` numbers, the other nine quiz steps and the draft autosave/beacon, `/preferences` and unsubscribe, blog/guides/vs/footer/sitemap/llms.txt, tracker/dashboard/profile/resume beyond entitlement reads, and no Prettier sweeps.
