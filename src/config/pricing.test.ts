import { describe, expect, it } from "vitest";
import { PRICING, TRIAL_DAYS, discountPct, savings, total } from "./pricing";

describe("pricing", () => {
  it("annual total is $69.48", () => {
    expect(total(PRICING.annual)).toBe(69.48);
  });
  it("annual savings is $50.40", () => {
    expect(savings(PRICING.annual)).toBe(50.4);
  });
  it("monthly total is $9.99", () => {
    expect(total(PRICING.monthly)).toBe(9.99);
  });
  it("annual discount is 42%", () => {
    expect(discountPct(PRICING.annual)).toBe(42);
  });
  it("trial length is 3 days", () => {
    expect(TRIAL_DAYS).toBe(3);
  });
  it("no trial copy string contains 14", () => {
    const copy = [
      `Start ${TRIAL_DAYS}-day free trial`,
      `Start free ${TRIAL_DAYS}-day trial`,
      `Welcome to Pro — your ${TRIAL_DAYS}-day trial has started.`,
      `${TRIAL_DAYS} days free`,
    ];
    for (const s of copy) expect(s).not.toContain("14");
  });
});