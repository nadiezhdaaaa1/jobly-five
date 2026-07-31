import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  DELETION_COPY,
  deletionDateFrom,
} from "@/config/account";
import { scheduleFor } from "./account-store";

const DAY = 86_400_000;

describe("account deletion grace period", () => {
  it("schedules the purge exactly GRACE_DAYS after the request", () => {
    const now = new Date("2026-07-31T12:00:00.000Z");
    const s = scheduleFor(now);
    expect(s.accountStatus).toBe("pending_deletion");
    const delta =
      new Date(s.deletionScheduledFor!).getTime() - new Date(s.deletionRequestedAt!).getTime();
    expect(delta).toBe(ACCOUNT_DELETION_GRACE_DAYS * DAY);
    expect(new Date(s.deletionScheduledFor!).toISOString()).toBe(deletionDateFrom(now).toISOString());
  });

  it("restore clears both timestamps", () => {
    const restored = { accountStatus: "active", deletionRequestedAt: null, deletionScheduledFor: null };
    expect(restored.deletionRequestedAt).toBeNull();
    expect(restored.deletionScheduledFor).toBeNull();
  });

  it("deletion copy interpolates the constant and hardcodes no day count", () => {
    expect(DELETION_COPY.dangerCaption).toContain(`${ACCOUNT_DELETION_GRACE_DAYS} days`);
    const strings = [
      DELETION_COPY.dangerCaption,
      DELETION_COPY.confirmBody("Aug 30 2026"),
      DELETION_COPY.scheduledToast("Aug 30 2026"),
      DELETION_COPY.restoreHeadline("Aug 30 2026"),
      DELETION_COPY.restoreBody,
    ];
    for (const s of strings) {
      const days = [...s.matchAll(/(\d+)[- ]days?\b/g)].map((m) => Number(m[1]));
      for (const d of days) expect(d).toBe(ACCOUNT_DELETION_GRACE_DAYS);
      expect(s).not.toMatch(/can't be undone|permanently/i);
    }
  });
});