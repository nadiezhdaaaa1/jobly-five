# Settings: remove dev tools, adopt the A-ha plan layout, facelift

Plan only — no code this round.

## Part A — remove the dev rows

Both live in `src/routes/_authenticated/settings.tsx`, rendered by `DevPlanOverrideRow` (line 497, `import.meta.env.DEV`-gated) at line 432 inside the Plan card.

| Control | Line | What it actually does |
|---|---|---|
| `hasHadPro` checkbox | 517 | `setHasHadPro()` — flips the local "has ever had Pro" flag that decides whether the 3-day trial is still offered |
| Free now | 525 | `devDowngradeNow()` — local plan store to free, instantly |
| Restore Pro | 535 | `devRestorePro()` — local plan store back to Pro |
| `pending_deletion` checkbox | 546 | `devSetPendingDeletion()` — flips account status locally, which makes `RestoreAccountScreen` take over |
| Fast-forward past grace | 557 | `devFastForwardPastGrace()` — moves `deletionScheduledFor` 60s into the past, so the purge sweep treats the account as due |
| Run purge now | 567 | POSTs `/api/public/hooks/purge-deleted-accounts` — runs the real due-account sweep and reports `purged/due` |
| Hard purge: email field + Purge and sign out | 628-643 | `devPurgeAccount` against `DEV_PURGE_ALLOWLIST[0]`, then `clearUserStateForSignOut()` + `supabase.auth.signOut()`; renders per-table counts and `clean` |

**Change:** delete `DevPlanOverrideRow`, `DevPlanOverrideRowInner`, `DevHardPurgeRow` and the line-432 call, plus the imports that become unused (`usePlan`/`useHasHadPro`/`setHasHadPro`/`devDowngradeNow`/`devRestorePro`/`devSetPendingDeletion`/`devFastForwardPastGrace`/`useAccount`/`devPurgeAccount`/`DEV_PURGE_ALLOWLIST`/`clearUserStateForSignOut` where no other caller remains). `useHasHadPro` is still used at line 686, so it stays.

**Nothing is lost for purge:** `/dev` already covers the hard purge (dev-only route, `notFound()` in production, `Disallow: /dev`).

**Worth relocating to `/dev` — my recommendation, not doing it this round:** yes for all five of the others. The grace fast-forward plus `pending_deletion` plus "Run purge now" are the only way to exercise the deletion → grace → purge path without waiting real days, and `hasHadPro` / Free now / Restore Pro are the only way to reach the paid and post-paid UI states without touching a real subscription row. All are local-store writes except "Run purge now". Losing them means the deletion and plan-state screens become untestable. Say the word and I will move them in a follow-up.

## Part B — plan section adopts the A-ha layout

Replace the `PlanCardsGrid` + "No plan — $0 / Cancel plan" block (lines 758-782) with `<PlanPaywall>` — the same component `/matches` uses. No fork.

**The prop I would add** to `src/components/site/PlanPaywall.tsx`:

```ts
ctaOverride?: (sku: SkuId) => { label: string; main?: boolean } | null;
```

Presentation only, defaults to `undefined`, so the landing grid and `/matches` are byte-identical in behaviour. When it returns a value, `PaywallCard` uses that label and accent choice instead of `spec.cta`/`spec.ctaMain`; `onSelect(spec)` still fires and Settings decides what to do with it. Nothing in `planSpecs.ts` or `pricing.ts` changes.

Settings passes:
- `initialSku` = `useEntitlements().entitlements.sku` (the read `PlanCardsBlock` already performs at line 690).
- `ctaOverride` = current SKU → `{ label: "Cancel plan", main: false }`; any other SKU → `{ label: "Switch to " + SKU_SWITCHER_LABEL[sku], main: true }`.

**No plan at all** (the screenshot's state): `entitlements.sku` is null, so no tab is "current". I would fall through to `PlanPaywall`'s own `PAYWALL_DEFAULT_SKU` (Pro · 3 months) and leave every CTA as its normal purchase CTA — i.e. `ctaOverride` returns `null` for every SKU and the section behaves exactly like `/matches`. There is nothing to cancel and nothing to switch from. The "No plan — $0" explainer text is worth keeping as a one-line caption under the card rather than as a card with a dead "Current state" button.

**Cancel flow — found, unchanged.** `PlanCard` owns `cancelStep` (line 163). Step 1 is the pause offer (`Modal "Found a job?"` → `pausePlan()`, line 303); step 2 is the confirm with `CancelReasonPicker` and `scheduleCancelAtPeriodEnd()` / `cancelPlanNow()` (lines 337-430). The cancel CTA will call exactly the existing entry point — `onDowngrade()`, which sets `cancelStep(plan === "paused" ? 2 : 1)` (line 295). No one-click cancel, no new dialog, no change to either step.

## Part C — the switch action: direct answers

**1. What `applySubscriptionAction` supports.** Eight actions: `start_trial`, `activate`, `pause`, `unpause`, `cancel_at_period_end`, `resume`, `cancel_now`, `set_ever_subscribed`. There is no dedicated `change_sku`, but `activate` **does** support it: line 178 returns the row untouched when the subscription is live *unless* `allowSkuChange` is true and the SKU differs. So the server has a defined path.

**2. Prepaid remainder — not covered.** In `activate`, a changed SKU sets `keepSame = null` (line 182) and `banked = 0` (line 184), then writes `current_period_end = now + periodDays(newSku)`. The unused paid days of the old SKU are **silently discarded**. Banking only happens in `pause` (line 219, gated on `isPrepaid`). A `pro_6month` subscriber with four months left who switches to `watch_monthly` loses those four months and is charged $4.99 for one. `purchase_price` is also reset to the new SKU's list price. This is the one real gap.

**3. Timing — immediate.** Status flips to `active` and the period restarts from `now` in the same write. Nothing is deferred to period end.

**4. `planIntent.manage` — a real path already exists.** Set in `settings.tsx:730-734` (`PlanCardsBlock.onSelect`) and consumed in `checkout.index.tsx:81` as `allowSkuChange: intent.manage === true`. So Settings → save intent → `/checkout` → `activate` is already wired and already the only `manage: true` producer.

**So I am not blocked on the server — I am blocked on product behaviour for one case.** My recommendation, for you to decide:

- **Preferred:** ship the switcher, but only offer the switch CTA where no prepaid value is forfeited — i.e. when the current SKU is not prepaid (`pro_monthly`, `watch_monthly`, `watch_annual`), or when it is prepaid and its period has already lapsed. On a live prepaid SKU, other tabs render read-only with a plain line explaining the switch takes effect after the current period, and no CTA. That invents nothing.
- **Alternative if you want every switch enabled:** it needs an explicit forfeiture confirmation ("you have N days left on Pro · 6 months; switching now ends them"), which is new billing copy and touches the stated no-refunds rule. I would not write that without your sign-off.
- **Fallback:** Part B display-only with cancel, exactly as scoped.

I will not touch `/legal/refund` or `/legal/billing`.

## Part D — facelift audit and mapping

Ladder reused unchanged: 24 / 20 / 16 / 12 / 8, mapped by rendered size (≤30px → 8, 32-44px → 12, 48px+ → the button class).

| Element | Line | Size | Before | After |
|---|---|---|---|---|
| Section card shell (`Card`) | 132 | full width × auto | 8 | **20** |
| Modal panel (`Modal`) | 1897 | 440 × auto | 8 | **20** |
| Flash banner | 104 | full × 45 | 6 | **12** |
| "No plan — $0" caption band | 764 | full × ~76 | 12 | 16 |
| Notifications hint band | 1070 | full × ~36 | 6 | **12** |
| Notifications error band | 900 | full × ~34 | 4 | **12** |
| Consent row card | 1178 | full × ~44 | 6 | **12** |
| Plan badge | 150, 156 | ~90 × 36 | 8 | **12** |
| Digest frequency toggles | 926, 945 | ~120 × 40 | 4 | **12** |
| Frequency inner pill | 935 | ~34 × 16 | 4 | 4 (off-ladder, flagged) |
| Selects (2× 110, 220) | 961, 976, 991 | × 40 | 4 | **12** |
| Text inputs | 1116, 1611, 1773, 1797 | × 40 | 4 | **12** |
| Cancel-reason radio row | 466 | full × ~32 | 4 | **12** |
| Cancel-reason textarea | 489 | full × ~76 | 4 | **12** |
| Blocked-company chip | 1139 | ~150 × 28 | 4 | **8** |
| Chip remove icon button | 1150 | 16 × 16 | 3 | 3 (off-ladder, flagged) |
| Company logo tile | 1437 | 32 × 32 | 4 | **8** |
| Password reveal icon button | 1618 | 28 × 28 | 4 | **8** |
| Modal close icon button | 1911 | 32 × 32 | 4 | **8** |
| Billing-terms checkbox | 746 | 16 × 16 | 4 | 4 (off-ladder, flagged) |
| Skeleton lines | 206-208, 1329-1331, 1420, 1446 | ≤10 tall | 4 | 4 (off-ladder, flagged) |
| Toggle track / knob / skeleton | 1046, 1215, 1219 | pill | `rounded-full` | unchanged |

**Off-ladder, flagged rather than forced:** the three 16px checkbox-scale squares, the skeleton placeholder lines, the 16px frequency pill, and the `rounded-full` toggle — same reasoning as the Tracker and Profile rounds.

**Buttons onto the design system.** Primaries → `main_accent_button main_accent_button--on-light`: Resume subscription (262, 40px), Restart my search (275, 40px), Pause my plan (321, 44px), Keep my pause (356, 44px), Keep Pro (406, 44px), notifications Save (1391, 40px), block-company Add (1121, 40px), 2FA/recovery confirms (1805, 1824, 1840). Secondaries → `secondary_button secondary_button--on-light`: Cancel subscription header button (222, 36px), the paused Cancel subscription (282), Save-cancel neutrals (1345, 1404, 1852). Danger-red confirms (369, 423, 1566, 1751) keep their red bordered treatment — that is a separate `danger_button` decision, same as on the Tracker.

Each converted button gets inline `borderRadius`, `fontSize`, `height`, `padding` and `justifyContent: "center"`, because those class rules are unlayered and beat Tailwind utilities. Heights and label sizes stay exactly as they render today. Disabled primaries (notifications Save, the recovery confirms) will pick up the standard grey `.main_accent_button:disabled` treatment — I will screenshot those.

**Also worth naming:** the two classes set `font-weight: 300`, so labels currently on `font-medium`/`font-semibold` will lighten — the same open question you have from the Profile round.

## Scope

Radii and the listed buttons only. No layout, spacing, copy, colour, typography, behaviour, validation or data changes; `styles.css` untouched; no account data edited to reach a test state. Verification: audit + mapping tables, screenshots of the page and each dialog, computed values read back from every converted button, `bunx tsgo --noEmit` exit code and the `bunx vitest run` summary line.
