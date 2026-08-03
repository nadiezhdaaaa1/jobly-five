import { describe, expect, it } from "vitest";
import { formatDigestArrival } from "./digest-delivery-store";

const now = new Date(2026, 7, 3, 14, 0, 0);

describe("formatDigestArrival", () => {
  it("formats today", () => {
    expect(formatDigestArrival(new Date(2026, 7, 3, 9, 2), now)).toBe("Your latest digest arrived Today at 9:02");
  });
  it("formats yesterday", () => {
    expect(formatDigestArrival(new Date(2026, 7, 2, 9, 2), now)).toBe("Your latest digest arrived Yesterday at 9:02");
  });
  it("formats older dates US style", () => {
    expect(formatDigestArrival(new Date(2026, 7, 1, 18, 30), now)).toBe("Your latest digest arrived Aug 1 at 6:30");
  });
  it("handles no digest yet", () => {
    expect(formatDigestArrival(null, now)).toBe("Your first digest is on its way");
  });
});
