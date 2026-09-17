# Make the server obey Cancellation Policy §5

No code this round. Answers first, then the order of work.

## 1. What counts as an upgrade

Rank each SKU by **tier first, period length second** — `(tier: watch 0 / pro 1, months)`:

```
watch_monthly (0,1) < watch_annual (0,12) < pro_monthly (1,1) < pro_3month (1,3) < pro_6month (1,6)
```

Five distinct ranks, so every pair is decided; same SKU is neither. Higher rank = upgrade (immediate, credited), lower = downgrade (deferred).

- `watch_annual → pro_monthly` = **upgrade**. Tier wins over period length: the account gains Pro features today, and the unused Watch time is credited.
- `pro_6month → watch_annual` = **downgrade**, even though 12 months > 6. Takes effect at period end.

Rejected alternative: ranking by price or daily rate. `pro_monthly` costs $16.99/month while `pro_6month` averages $10.99/month, so a money ordering makes `pro_6month → pro_monthly` an "upgrade" and charges immediately — hostile and wrong.

Lives in `src/config/pricing.ts` beside `isPrepaid` (line 53): `SKU_RANK`, `compareSkus(a, b)`, `isUpgrade(from, to)`, `isDowngrade(from, to)`. Pure, date-free, unit-tested in `src/config/pricing.test.ts`. No component decides this.

## 2. How the credit is applied

**What exists today.** Nothing charges money. `src/lib/subscription.functions.ts:14-22` states no provider is wired; `activate` writes the `subscriptions` row itself (lines 187-206) and stamps `activation_source: "manual_preview"` (line 205). `purchase_price` is stored so a renewal charges what was paid (lines 193-196). `stripe_customer_id` / `stripe_subscription_id` exist in the table and are unused. So mechanic (a) — a one-off discount on the next charge — **cannot be built today at all**, because there is no charge to discount.

**Recommendation: (b), credit as time.** Convert remaining paid days to money at the old plan's daily rate, convert that money to days at the new plan's daily rate, and extend the new plan's first period by that many days. Reasons it stays correct once Stripe is live:

- It needs no provider primitive. Charge the new SKU total today and set the next billing anchor to `today + periodDays(new) + creditDays`. Stripe expresses that with `billing_cycle_anchor` / `trial_end`; no coupon, no customer credit balance.
- (a) puts authoritative money in Stripe's balance, which our row would then have to mirror — two sources of truth for the same credit, and the one place drift is unrecoverable.
- Apple and Google (policy §6) have no partial-discount primitive at all. A day-value credit is the only mechanic expressible on all three rails.

**Maths.** `creditMoney = purchase_price_old × daysLeft / periodDays(old)`, `creditDays = floor(creditMoney / (skuTotal(new) / periodDays(new)))`. `daysLeft` already floors whole days (`subscription.functions.ts:77-81`); floor everywhere, never round up — we never grant a day that was not paid for. Because every hop floors, repeated switching can only lose fractions, never inflate.

- **Floor.** Under one day left → `creditDays = 0`, no credit line, switch proceeds normally.
- **Ceiling.** When `creditDays ≥ periodDays(new)` — six months of Pro credited into Watch monthly is roughly 374 days — grant all of it and **charge nothing today**: `current_period_end = today + creditDays`, `purchase_price = skuTotal(new)` for the eventual renewal. §5 says the credit is applied to the new subscription and not paid out in cash; capping it would be a silent forfeiture, and paying it out is forbidden.

**Banked days.** §3 loses them only on cancellation or deletion. A switch preserves `banked_days` and `banked_days_expire_at` untouched — a switch is not a resume, so they are not spent either. Today line 184 zeroes them whenever the SKU differs; that condition goes.

## 3. Deferred downgrade

`scheduleCancelAtPeriodEnd` (`plan-store.ts:211`, server case at `subscription.functions.ts:275-283`) sets one boolean and keeps `status = 'active'`. **The pattern does not generalise, and it is currently broken:** `get_entitlements` grants a tier for `s.status = 'active'` with no period-end check, and no job flips it — a scheduled cancellation never actually takes effect. There is no scheduler at all: `pg_cron` and `pg_net` are not installed, and everything in `src/routes/api/public/hooks/` is an externally-called route.

So a deferred downgrade needs, in one migration:

- `pending_sku` (nullable, `subscription_sku`) and `pending_sku_effective_at` (nullable timestamptz).
- A `SECURITY DEFINER` function `apply_pending_plan_change(uid)`: when `pending_sku_effective_at <= now()`, move `pending_sku` into `sku`, set `plan`, set `purchase_price = skuTotal(pending)`, start a fresh period of `periodDays(pending)`, clear both pending fields. Banked days untouched.
- The same fix for the existing hole: expire `active` / `canceling` rows whose `current_period_end` has passed.
- `get_entitlements` gains `pending_sku` and `pending_sku_effective_at` in its JSON so Settings needs no second call. It is `STABLE` and cannot write, so it must not be the thing that applies the change.

**Applied lazily plus a sweep.** Lazily at the top of the read path (`getSubscriptionRow`, and `applySubscriptionAction` before it computes anything) so a returning user is always correct. Lazy alone is not enough once money moves — an account that never opens the app would be charged the old price — so add `/api/public/hooks/apply-plan-changes`, modelled on `purge-deleted-accounts.ts`, with the same secret-header check.

**Settings between scheduling and effect.** Current SKU stays the selected card and keeps **Cancel plan**, with a line: "Changes to Watch · Monthly on 12 Oct 2026." The pending SKU's card reads "Scheduled — starts 12 Oct 2026" with **Cancel this change** (new `clear_pending_plan_change` action). Other cards behave normally.

**Interactions.** Cancelling while a downgrade is pending: cancellation wins, `pending_sku` cleared — the two are mutually exclusive and the server enforces that, not the UI. Switching again while pending: a new downgrade replaces the pending one (same effective date, the paid period is unchanged); an upgrade clears the pending change and applies immediately with the credit.

## 4. Switch during a trial

`start_trial` sets `current_period_end = trial_ends_at` (`subscription.functions.ts:162`), so the days left are trial days, not paid days. Credit must therefore exclude `status = 'trialing'` entirely: `creditDays = 0`. The trial ends on the switch and the new plan's full amount is charged today — unchanged from today's behaviour and from the existing notice line (`checkout.index.tsx:59-63`).

Under §1's ordering, `pro_monthly → pro_3month/pro_6month` is an upgrade, so immediate is consistent. `pro_monthly (trialing) → watch_*` ranks as a downgrade, but there is **no paid period to defer into**, so §5's "end of the period you have already paid for" has no referent. Recommendation: apply it immediately (trial ends, Watch charged today) and say so in the notice. This is outside §5 rather than an approximation of it; worth one clarifying sentence from the lawyer.

## 5. What the checkout notice becomes

`switchLosses` (`checkout.index.tsx:57-86`) becomes `switchEffects(row, next)` returning `{ kind: "immediate" | "deferred", chargeToday, lines }`. Line by line:

- Trial line — **survives verbatim**. Still true.
- Remaining-period line — inverts from a forfeiture to a credit: "You have 34 days left on Pro · 3 months. That time is credited to the new plan — your first period runs to 12 Feb 2027." When the credit covers the whole first period: "…credited in full: nothing is charged today, and your next charge is 12 Feb 2027."
- Banked-days line — inverts to reassurance: "Your 12 banked days stay on your account." Shown only when > 0.

A deferred downgrade is not a purchase moment. `kind: "deferred"` replaces the amount, the disclosure and the button: "Watch · Monthly starts on 12 Oct 2026, when your current period ends. Nothing is charged today, and you keep Pro until then." Button becomes **Schedule the change**, and it must not land on `/thank-you` as a purchase confirmation. The existing `rowState` fail-closed gating and retry stay and matter more, since the row now decides which of two flows the user is in.

## 6. Everything that assumes a SKU change forfeits everything

- `src/lib/subscription.functions.ts:182` `keepSame` nulls the period on any SKU change; `:184` zeroes banked days; `:186` period end; `:193-196` resets `purchase_price`; `:174-178` the live guard has no deferred branch.
- `src/lib/plan-store.ts:152-166` `activateSku` optimistically commits a fresh period on SKU change; `Subscription` (12-26) and `SubStatus` (10) have no pending-change concept; `defaultSub` (59-71) likewise.
- `src/routes/checkout.index.tsx:51-56` the comment stating the rule, `:57-86` `switchLosses`, `:153-167` `pay()` always activates and routes to `/thank-you`.
- `src/routes/thank-you.tsx:19,45,116,139` assumes a purchase completed; needs a deferred variant or must not be reachable.
- `src/routes/_authenticated/settings.tsx:513-520` the `hidden` CTA and its comment, `:522-533` the `currentSku !== null` guard, `:286-289` cancel wiring.
- `src/components/site/planSpecs.ts:315-330` `planFeatures` drops the switch bullet in manage context — restored once switching is real.
- `src/lib/entitlements.ts:32-36, 139-140, 154-167` the entitlement shape carries no pending fields; `get_entitlements` builds that JSON.
- **Absent, not wrong:** no banked-day expiry notice (policy §6 promises one), no renewal reminder sender (§4, and `src/config/consent.ts:34` reserves the channel), no period-end job. Same missing scheduler the deferred downgrade needs.

## Cannot be implemented faithfully — flagging, not approximating

1. §5's credit as **money** is impossible until a provider exists. We implement it as time of equal value. If the lawyer means a cash-equivalent credit ledger, that is a different build.
2. §2 ("no pro-rated credits, or account credit for unused time") reads against §5 ("we credit the unused portion"). We treat §2 as scoped to refunds/cancellation and §5 as the specific rule for switching, but the two want one reconciling clause.
3. A trial downgrade has no paid period (see §4).
4. Deferred downgrades cannot be applied on time by lazy reads alone once charges are real; the sweep hook is required, and something must call it.

## Order of work, riskiest first

1. **Migration + `get_entitlements`**: pending columns, `apply_pending_plan_change`, the period-end expiry fix, grants. Riskiest — it touches the entitlement gate for every account.
2. **`pricing.ts`**: ordering and credit maths, with tests.
3. **`subscription.functions.ts`**: credited upgrade branch, banked days preserved, `schedule_plan_change` / `clear_pending_plan_change`, reconcile-on-read.
4. **Sweep hook** `/api/public/hooks/apply-plan-changes`.
5. **Plumbing**: `entitlements.ts`, `plan-store.ts` pending state.
6. **Checkout**: `switchEffects`, deferred flow, `/thank-you` variant.
7. **Settings**: CTAs back, upgrade/downgrade labels, scheduled state, cancel-vs-pending rules.
8. **Copy**: restore the switch bullet, update the comments that assert forfeiture.

No account rows are written and no `/legal/*` file changes at any step.
