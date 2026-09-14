import { describe, expect, it } from "vitest";
import {
  SKUS,
  TRIAL_DAYS,
  TRIAL_SKU,
  WATCH_MONTHLY_ANNUALISED,
  discountPct,
  isPrepaid,
  perMonth,
  periodDays,
  renewalPhrase,
  savings,
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
