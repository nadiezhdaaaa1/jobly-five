import { describe, expect, it } from "vitest";
import {
  SKUS,
  SKU_IDS,
  TRIAL_DAYS,
  TRIAL_SKU,
  WATCH_MONTHLY_ANNUALISED,
  compareSkus,
  creditDays,
  discountPct,
  isDowngrade,
  isPrepaid,
  isUpgrade,
  perMonth,
  periodDays,
  renewalPhrase,
  savings,
  skuRank,
  skuTotal,
} from "./pricing";

describe("SKU totals", () => {
  it("carries the five flat SKUs at their published totals", () => {
    expect(skuTotal("watch_monthly")).toBe(4.99);
    expect(skuTotal("watch_annual")).toBe(34.99);
    expect(skuTotal("pro_monthly")).toBe(16.99);
    expect(skuTotal("pro_3month")).toBe(38.97);
    expect(skuTotal("pro_6month")).toBe(65.94);
  });
  it("has exactly five SKUs and no plan x cycle grid", () => {
    expect(Object.keys(SKUS)).toHaveLength(5);
    expect(SKUS).not.toHaveProperty("pro_annual");
    expect(SKUS).not.toHaveProperty("watch_3month");
  });
});

describe("discountPct is computed from totals, not the rounded per-month value", () => {
  it("watch_annual is 42% (41% if taken from the $2.92 display value)", () => {
    expect(perMonth("watch_annual")).toBe(2.92);
    expect(discountPct("watch_annual")).toBe(42);
  });
  it("pro_3month is 24%", () => {
    expect(discountPct("pro_3month")).toBe(24);
  });
  it("pro_6month is 35%", () => {
    expect(discountPct("pro_6month")).toBe(35);
  });
  it("baseline SKUs discount nothing", () => {
    expect(discountPct("watch_monthly")).toBe(0);
    expect(discountPct("pro_monthly")).toBe(0);
  });
});

describe("savings use each tier's own baseline", () => {
  it("watch measures against watch_monthly", () => {
    expect(savings("watch_annual")).toBe(24.89);
  });
  it("pro measures against pro_monthly", () => {
    expect(savings("pro_3month")).toBe(12);
    expect(savings("pro_6month")).toBe(36);
  });
});

describe("periods, trial and banking", () => {
  it("maps each SKU to its paid span in days", () => {
    expect(periodDays("watch_monthly")).toBe(30);
    expect(periodDays("watch_annual")).toBe(365);
    expect(periodDays("pro_monthly")).toBe(30);
    expect(periodDays("pro_3month")).toBe(90);
    expect(periodDays("pro_6month")).toBe(180);
  });
  it("pro_monthly is the only trial SKU", () => {
    expect(TRIAL_SKU).toBe("pro_monthly");
    expect(TRIAL_DAYS).toBe(3);
    for (const sku of Object.values(SKUS)) {
      expect(sku.trialDays > 0).toBe(sku.id === "pro_monthly");
    }
  });
  it("banks days on prepaid SKUs only", () => {
    expect(isPrepaid("pro_3month")).toBe(true);
    expect(isPrepaid("pro_6month")).toBe(true);
    expect(isPrepaid("pro_monthly")).toBe(false);
    expect(isPrepaid("watch_monthly")).toBe(false);
    expect(isPrepaid("watch_annual")).toBe(false);
  });
});

describe("derived copy", () => {
  it("annualises watch monthly without claiming a saving", () => {
    expect(WATCH_MONTHLY_ANNUALISED).toBe(59.88);
  });
  it("phrases each renewal by its interval", () => {
    expect(renewalPhrase("watch_monthly")).toBe("$4.99/month");
    expect(renewalPhrase("watch_annual")).toBe("$34.99/year");
    expect(renewalPhrase("pro_3month")).toBe("$38.97 every 3 months");
  });
});

describe("upgrade / downgrade ordering (Cancellation Policy §5)", () => {
  it("orders tier first, period length second", () => {
    expect(skuRank("watch_monthly")).toBeLessThan(skuRank("watch_annual"));
    expect(skuRank("watch_annual")).toBeLessThan(skuRank("pro_monthly"));
    expect(skuRank("pro_monthly")).toBeLessThan(skuRank("pro_3month"));
    expect(skuRank("pro_3month")).toBeLessThan(skuRank("pro_6month"));
  });
  it("decides every pair, and the same SKU is neither", () => {
    const ids = SKU_IDS;
    const ranks = new Set(ids.map(skuRank));
    expect(ranks.size).toBe(ids.length);
    for (const id of ids) {
      expect(isUpgrade(id, id)).toBe(false);
      expect(isDowngrade(id, id)).toBe(false);
    }
  });
  it("treats a tier gain as an upgrade even when the period shortens", () => {
    expect(isUpgrade("watch_annual", "pro_monthly")).toBe(true);
    expect(isDowngrade("watch_annual", "pro_monthly")).toBe(false);
  });
  it("treats a tier loss as a downgrade even when the period lengthens", () => {
    expect(isDowngrade("pro_6month", "watch_annual")).toBe(true);
    expect(isUpgrade("pro_6month", "watch_annual")).toBe(false);
  });
  it("does not rank by price: dropping to monthly is never an upgrade", () => {
    expect(isUpgrade("pro_6month", "pro_monthly")).toBe(false);
    expect(isDowngrade("pro_6month", "pro_monthly")).toBe(true);
  });
});

describe("§5 credit for the unused period", () => {
  it("values remaining days at what was paid, in whole days of the new plan", () => {
    // 45 of 90 days left on pro_3month = $19.485; pro_6month costs $0.3663/day.
    expect(creditDays({ from: "pro_3month", to: "pro_6month", daysLeft: 45 })).toBe(53);
  });
  it("credits nothing below one day", () => {
    expect(creditDays({ from: "pro_3month", to: "pro_6month", daysLeft: 0 })).toBe(0);
    expect(creditDays({ from: "pro_3month", to: "pro_6month", daysLeft: -3 })).toBe(0);
  });
  it("may exceed the new plan's own period rather than capping", () => {
    const days = creditDays({ from: "pro_6month", to: "watch_monthly", daysLeft: 170 });
    expect(days).toBeGreaterThan(periodDays("watch_monthly"));
    expect(days).toBe(374);
  });
  it("uses the price actually paid, not the list price", () => {
    const paid = creditDays({ from: "pro_3month", to: "pro_monthly", daysLeft: 45, paidTotal: 20 });
    const list = creditDays({ from: "pro_3month", to: "pro_monthly", daysLeft: 45 });
    expect(paid).toBeLessThan(list);
  });
  it("never inflates: a round trip cannot gain days", () => {
    const out = creditDays({ from: "pro_6month", to: "pro_3month", daysLeft: 180 });
    const back = creditDays({ from: "pro_3month", to: "pro_6month", daysLeft: out });
    expect(back).toBeLessThanOrEqual(180);
  });
});
