// The single source of truth for plan *content*: band labels, tints, badges,
// CTA labels, descriptions, per-card disclosures, switcher labels and feature
// bullets. Lifted out of PlanCards.tsx so the landing grid and the /matches
// paywall read the same data and cannot drift.
//
// Every price, total, percentage, interval and trial length comes from
// @/config/pricing. Nothing numeric is written by hand here.

import {
  RENEWAL_REMINDER_DAYS,
  TRIAL_DAYS,
  WATCH_MONTHLY_ANNUALISED,
  discountPct,
  perMonth,
  renewalPhrase,
  skuTotal,
  usd,
  type SkuId,
} from "@/config/pricing";
import type { SelectPlanInput } from "@/lib/onboarding/usePlanFlow";

export type BandTone = "muted" | "popular" | "best-value";

export type BadgeSpec = { label: string; background: string; color: string };

export type PlanCardSpec = {
  key: "watch" | "pro_monthly" | "pro_3month" | "pro_6month";
  /** Uppercase label in the header band above the card. */
  band: string;
  bandTone: BandTone;
  /** Wrapper tint behind the header band. */
  tint: string;
  name: string;
  price: string;
  suffix: string;
  /** One line that makes the card's billing moment legible. */
  subLine: string;
  description: string;
  cta: string;
  /** Drives only the CTA variant: true = main accent button. */
  ctaMain: boolean;
  /** Price + interval for this card. The shared line never replaces it. */
  disclosure: string;
  badge: BadgeSpec | null;
  /**
   * The saving pill for this SKU whenever it has one, independent of whether a
   * given surface chooses to paint it. The landing Watch card deliberately
   * hides its pill (the switcher owns that corner) via `badge: null`; the
   * paywall has no switcher inside the card, so it renders `savings`.
   */
  savings: BadgeSpec | null;
  /** Watch renders its badge in the title row: the switcher owns the top-right corner. */
  badgeInTitle: boolean;
  /** Corner glow hue, when the card carries one. */
  glow: "accent" | "step" | "none";
  /** Column gap inside the white card. */
  innerGap: number;
  choice: SelectPlanInput;
};

export const savingsBadge = (
  sku: SkuId,
  tone: "accent" | "step" | "neutral",
): BadgeSpec => ({
  label: `save ${discountPct(sku)}%`,
  background:
    tone === "accent"
      ? "var(--main-accent)"
      : tone === "step"
        ? "var(--step-accent)"
        : "var(--color-alt-light-mist)",
  color:
    tone === "accent"
      ? "var(--on-accent)"
      : tone === "step"
        ? "#FFFFFF"
        : "var(--color-foreground)",
});

/** A pill only where the SKU actually saves against its tier baseline. */
const savingsFor = (
  sku: SkuId,
  tone: "accent" | "step" | "neutral",
): BadgeSpec | null => (discountPct(sku) > 0 ? savingsBadge(sku, tone) : null);


export function watchCard(
  sku: Extract<SkuId, "watch_monthly" | "watch_annual">,
): PlanCardSpec {
  const annual = sku === "watch_annual";
  return {
    key: "watch",
    band: "FOR PASSIVE CANDIDATES",
    bandTone: "muted",
    tint: "var(--color-surface-2)",
    name: "Watch",
    price: usd(perMonth(sku)),
    suffix: "/month",
    subLine: annual
      ? `${usd(skuTotal(sku))}/year — save ${discountPct(sku)}%`
      : `${usd(WATCH_MONTHLY_ANNUALISED)}/year`,
    description: "One email a week. For when you're not looking — but you'd move for the right thing.",
    cta: "Get Watch",
    ctaMain: false,
    disclosure: `Charged today. ${renewalPhrase(sku)} until cancelled`,
    // Watch carries no savings pill on the landing grid: the switcher owns the
    // top-right corner and the saving is already stated in the sub-line.
    badge: null,
    savings: savingsFor(sku, "accent"),
    badgeInTitle: false,
    glow: "none",
    innerGap: 32,
    choice: { sku, trial: false },
  };
}

export const PRO_CARDS: PlanCardSpec[] = [
  {
    key: "pro_monthly",
    band: "START HERE",
    bandTone: "muted",
    tint: "var(--color-surface-2)",
    name: "Pro · monthly",
    price: usd(perMonth("pro_monthly")),
    suffix: "/month",
    // The trial folds into the Pro monthly card; there is no standalone trial card.
    subLine: `${TRIAL_DAYS} days free, then ${usd(skuTotal("pro_monthly"))}`,
    description: "Try it on your real search. No commitment, cancel any time.",
    cta: `Start ${TRIAL_DAYS}-day free`,
    ctaMain: false,
    disclosure: `${TRIAL_DAYS} days free, then ${renewalPhrase("pro_monthly")} until cancelled`,
    badge: null,
    savings: savingsFor("pro_monthly", "accent"),
    badgeInTitle: false,
    glow: "none",
    innerGap: 24,
    choice: { sku: "pro_monthly", trial: true },
  },
  {
    key: "pro_3month",
    band: "MOST POPULAR",
    bandTone: "popular",
    tint: "var(--plan-tint-popular)",
    name: "Pro · 3 months",
    price: usd(perMonth("pro_3month")),
    suffix: "/month",
    subLine: `${usd(skuTotal("pro_3month"))} billed today`,
    description: "The median US job search runs 11 weeks. That's exactly one period.",
    cta: "Get 3 months",
    ctaMain: true,
    disclosure: `Charged today. ${renewalPhrase("pro_3month")} until cancelled`,
    badge: savingsBadge("pro_3month", "accent"),
    savings: savingsFor("pro_3month", "accent"),
    badgeInTitle: false,
    glow: "accent",
    innerGap: 32,
    choice: { sku: "pro_3month", trial: false },
  },
  {
    key: "pro_6month",
    band: "BEST VALUE",
    bandTone: "best-value",
    tint: "var(--plan-tint-best-value)",
    name: "Pro · 6 months",
    price: usd(perMonth("pro_6month")),
    suffix: "/month",
    description:
      "The average tech search runs 6–7 months. Land early and your unused days are banked.",
    subLine: `${usd(skuTotal("pro_6month"))} billed today`,
    cta: "Get 6 months",
    ctaMain: true,
    disclosure: `Charged today. ${renewalPhrase("pro_6month")} until cancelled`,
    badge: savingsBadge("pro_6month", "step"),
    savings: savingsFor("pro_6month", "step"),
    badgeInTitle: false,
    glow: "step",
    innerGap: 32,
    choice: { sku: "pro_6month", trial: false },
  },
];

export const BAND_COLOR: Record<BandTone, string> = {
  muted: "var(--color-text-secondary)",
  popular: "var(--plan-band-popular)",
  "best-value": "var(--plan-band-best-value)",
};

/** One spec per flat SKU. The paywall renders exactly one of these at a time. */
export function planSpec(sku: SkuId): PlanCardSpec {
  switch (sku) {
    case "watch_monthly":
    case "watch_annual":
      return watchCard(sku);
    case "pro_monthly":
      return PRO_CARDS[0]!;
    case "pro_3month":
      return PRO_CARDS[1]!;
    case "pro_6month":
      return PRO_CARDS[2]!;
  }
}

/**
 * The switcher's order, default and labels — defined here, never inline in
 * markup. The design mixes U+00B7 and U+2022; the landing cards use U+00B7, so
 * all five use the middle dot.
 */
export const PAYWALL_SKU_ORDER: SkuId[] = [
  "pro_6month",
  "pro_3month",
  "pro_monthly",
  "watch_annual",
  "watch_monthly",
];

export const PAYWALL_DEFAULT_SKU: SkuId = "pro_3month";

export const SKU_SWITCHER_LABEL: Record<SkuId, string> = {
  pro_6month: "Pro · 6 months",
  pro_3month: "Pro · 3 months",
  pro_monthly: "Pro · Monthly",
  watch_annual: "Watch · Annual",
  watch_monthly: "Watch · Monthly",
};

/** What the account is charged at signup, derived — never a literal. */
export function billedTodayLine(sku: SkuId): string {
  if (sku === "pro_monthly") return `${TRIAL_DAYS} days free, then ${usd(skuTotal(sku))}`;
  return `${usd(skuTotal(sku))} billed today`;
}

/**
 * Four bullets per SKU. Two hard rules encoded here:
 *  - "unused days are banked" only on the prepaid SKUs (PREPAID_SKUS is exactly
 *    pro_3month and pro_6month); pausing a monthly plan banks nothing.
 *  - pro_monthly never claims a RENEWAL_REMINDER_DAYS-day warning: its first
 *    charge lands TRIAL_DAYS after signup, so that notice is impossible.
 */
const renewalNotice = `We email you ${RENEWAL_REMINDER_DAYS} days before it renews`;
const samePrice = "Same price when it renews — no step-up";
const cancelAnyTime = "Cancel any time — no lock-in";
const watchDigest = "A weekly digest of scored matches, ghost jobs filtered out";

export const PLAN_FEATURES: Record<SkuId, string[]> = {
  pro_3month: [
    "Everything in Pro, paid for a quarter",
    samePrice,
    "Pause any time — unused days are banked",
    renewalNotice,
  ],
  pro_6month: [
    "Everything in Pro, paid for half a year",
    samePrice,
    "Pause any time — unused days are banked",
    renewalNotice,
  ],
  pro_monthly: [
    "Everything in Pro, month to month",
    `Free for ${TRIAL_DAYS} days — cancel before it ends and pay nothing`,
    "Switch to a longer plan whenever you like",
    "We email you before your trial ends",
  ],
  watch_annual: [watchDigest, samePrice, cancelAnyTime, renewalNotice],
  watch_monthly: [
    watchDigest,
    "Month to month — stop whenever you like",
    cancelAnyTime,
    renewalNotice,
  ],
};
