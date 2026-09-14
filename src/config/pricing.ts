// Single source of truth for all Jobly pricing.
// Never hardcode a price, total, saving, percentage or trial length elsewhere.
//
// Five flat SKUs. This is deliberately NOT `tier x cycle`: a grid would let
// impossible combinations (pro_annual, watch_3month) into the type and the
// database. Each SKU stores only its purchase total and its length in months —
// everything else is derived.

export type Tier = "watch" | "pro";

export type SkuId = "watch_monthly" | "watch_annual" | "pro_monthly" | "pro_3month" | "pro_6month";

export type Sku = {
  id: SkuId;
  tier: Tier;
  /** What the customer pays per purchase. */
  total: number;
  /** Length of one paid period, in months. */
  months: number;
  /** Free-trial length in days. Only `pro_monthly` has one. */
  trialDays: number;
};

/** Canonical free-trial length. Never hardcode a trial length anywhere else. */
export const TRIAL_DAYS = 3;

/** The only SKU that carries a trial. `start_trial` must refuse every other. */
export const TRIAL_SKU: SkuId = "pro_monthly";

export const SKUS: Record<SkuId, Sku> = {
  watch_monthly: { id: "watch_monthly", tier: "watch", total: 4.99, months: 1, trialDays: 0 },
  watch_annual: { id: "watch_annual", tier: "watch", total: 34.99, months: 12, trialDays: 0 },
  pro_monthly: { id: "pro_monthly", tier: "pro", total: 16.99, months: 1, trialDays: TRIAL_DAYS },
  pro_3month: { id: "pro_3month", tier: "pro", total: 38.97, months: 3, trialDays: 0 },
  pro_6month: { id: "pro_6month", tier: "pro", total: 65.94, months: 6, trialDays: 0 },
};

export const SKU_IDS = Object.keys(SKUS) as SkuId[];

export function isSkuId(value: unknown): value is SkuId {
  return typeof value === "string" && value in SKUS;
}

/** Prepaid multi-month SKUs — the only ones whose days bank on pause. */
export const PREPAID_SKUS: SkuId[] = ["pro_3month", "pro_6month"];

export function isPrepaid(id: SkuId): boolean {
  return PREPAID_SKUS.includes(id);
}

/**
 * The SKU each tier's savings are measured against. Baselines differ per tier:
 * Watch measures against watch_monthly, Pro against pro_monthly.
 */
export const BASELINE_SKU: Record<Tier, SkuId> = {
  watch: "watch_monthly",
  pro: "pro_monthly",
};

/** Unrounded per-month figure. Use this for arithmetic, never for display. */
export const perMonthExact = (id: SkuId) => SKUS[id].total / SKUS[id].months;

/** Rounded per-month figure. Display only. */
export const perMonth = (id: SkuId) => +perMonthExact(id).toFixed(2);

export const skuTotal = (id: SkuId) => SKUS[id].total;

/**
 * Discount against the tier's own baseline, computed from TOTALS over the same
 * duration. Computing it from the rounded per-month display value is wrong:
 * watch_annual displays $2.92/month, and 1 - 2.92/4.99 rounds to 41% while the
 * true figure from totals (1 - 34.99/59.88) is 42%.
 */
export function discountPct(id: SkuId): number {
  const sku = SKUS[id];
  const baselineTotal = perMonthExact(BASELINE_SKU[sku.tier]) * sku.months;
  if (baselineTotal <= 0) return 0;
  return Math.round((1 - sku.total / baselineTotal) * 100);
}

/** Money saved against the tier's baseline over the same duration. */
export function savings(id: SkuId): number {
  const sku = SKUS[id];
  return +(perMonthExact(BASELINE_SKU[sku.tier]) * sku.months - sku.total).toFixed(2);
}

/** Length of one paid period in days — the span a purchase buys. */
export function periodDays(id: SkuId): number {
  switch (id) {
    case "watch_annual":
      return 365;
    case "pro_6month":
      return 180;
    case "pro_3month":
      return 90;
    default:
      return 30;
  }
}

/**
 * The annualisation of Watch monthly ($4.99 x 12). A comparison line only —
 * it is not a purchasable SKU and carries no saving.
 */
export const WATCH_MONTHLY_ANNUALISED = +(SKUS.watch_monthly.total * 12).toFixed(2);

// Formatting helpers used by UI copy.
export const money = (n: number) => n.toFixed(2);
export const usd = (n: number) => `$${money(n)}`;

/** How the charge repeats, for disclosure copy. */
export function intervalLabel(id: SkuId): string {
  const { months } = SKUS[id];
  if (months === 1) return "month";
  if (months === 12) return "year";
  return `${months} months`;
}

/** "$4.99/month" / "$34.99/year" / "$38.97 every 3 months". */
export function renewalPhrase(id: SkuId): string {
  const { months } = SKUS[id];
  const price = usd(skuTotal(id));
  return months === 1 || months === 12 ? `${price}/${intervalLabel(id)}` : `${price} every ${months} months`;
}

/** Per-card disclosure: price plus interval. Never the shared line's job. */
export function skuDisclosure(id: SkuId): string {
  return `${renewalPhrase(id)} until cancelled.`;
}

/**
 * The one line under all four cards. Carries the cancellation path, the
 * pre-charge email promise and the currency. Never replaces a card disclosure.
 */
export const SHARED_PLAN_DISCLOSURE =
  "Cancel anytime in Settings → Plan in two steps. We email you before every charge. Prices in USD.";
