import { describe, expect, it } from "vitest";
import { PRICING, discountPct, savings, total } from "./pricing";

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
});