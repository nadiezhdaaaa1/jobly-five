import { describe, expect, it } from "vitest";
import { getPlan, resolveIsPro, resolvePlan, type Subscription } from "./plan-store";

const sub = (o: Partial<Subscription>): Subscription => ({
  status: "canceling",
  sku: "pro_monthly",
  cancelAtPeriodEnd: true,
  currentPeriodEnd: new Date().toISOString(),
  ...o,
});

describe("entitlement resolution", () => {
  it("canceling with a future period end is still Pro", () => {
    const s = sub({ currentPeriodEnd: new Date(Date.now() + 86400000).toISOString() });
    expect(resolveIsPro(s)).toBe(true);
    expect(resolvePlan(s)).toBe("pro");
  });
  it("canceling with a past period end is Free", () => {
    const s = sub({ currentPeriodEnd: new Date(Date.now() - 86400000).toISOString() });
    expect(resolveIsPro(s)).toBe(false);
    expect(resolvePlan(s)).toBe("free");
  });
  it("active and trialing are Pro", () => {
    expect(resolveIsPro(sub({ status: "active", cancelAtPeriodEnd: false }))).toBe(true);
    expect(resolveIsPro(sub({ status: "trialing", cancelAtPeriodEnd: false }))).toBe(true);
  });
  it("canceled is Free", () => {
    expect(resolveIsPro(sub({ status: "canceled", cancelAtPeriodEnd: false }))).toBe(false);
  });
  it("paused suspends access: labelled paused, and never Pro", () => {
    const paused = sub({ status: "paused", cancelAtPeriodEnd: false });
    expect(resolvePlan(paused)).toBe("paused");
    expect(resolveIsPro(paused)).toBe(false);
  });
  it("a live watch SKU is the watch tier, not Pro", () => {
    const watch = sub({ status: "active", sku: "watch_annual", cancelAtPeriodEnd: false });
    expect(resolvePlan(watch)).toBe("watch");
    expect(resolveIsPro(watch)).toBe(false);
  });
});

describe("fail-closed entitlements", () => {
  it("unknown status resolves to Free", () => {
    const s = sub({ status: "none", sku: null, cancelAtPeriodEnd: false, currentPeriodEnd: new Date(0).toISOString() });
    expect(resolveIsPro(s)).toBe(false);
    expect(resolvePlan(s)).toBe("free");
  });
  it("store starts Free before the server answers", () => {
    expect(getPlan()).toBe("free");
  });
});
