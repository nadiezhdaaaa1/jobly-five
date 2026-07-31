import { describe, expect, it } from "vitest";
import { resolveIsPro, resolvePlan, type Subscription } from "./plan-store";

const sub = (o: Partial<Subscription>): Subscription => ({
  status: "canceling",
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
  it("canceled is Free, paused keeps entitlements", () => {
    expect(resolveIsPro(sub({ status: "canceled", cancelAtPeriodEnd: false }))).toBe(false);
    expect(resolvePlan(sub({ status: "paused", cancelAtPeriodEnd: false }))).toBe("paused");
  });
});
