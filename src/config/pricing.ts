// Single source of truth for all Jobly pricing.
// Never hardcode a price, total, saving or discount anywhere else.

export type PricingTier = { months: number; perMonth: number };

export const PRICING = {
  monthly: { months: 1, perMonth: 9.99 },
  annual: { months: 12, perMonth: 5.79 },
} as const;

// Canonical free-trial length. Never hardcode a trial length anywhere else.
export const TRIAL_DAYS = 3;

// Derived values — always compute, never hardcode.
export const total = (p: PricingTier) => +(p.perMonth * p.months).toFixed(2);
export const savings = (p: PricingTier) =>
  +((PRICING.monthly.perMonth - p.perMonth) * p.months).toFixed(2);
export const discountPct = (p: PricingTier) =>
  Math.round((1 - p.perMonth / PRICING.monthly.perMonth) * 100);

// Formatting helpers used by UI copy.
export const money = (n: number) => n.toFixed(2);
export const usd = (n: number) => `$${money(n)}`;