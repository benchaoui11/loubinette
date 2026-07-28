import { describe, expect, it } from "vitest";
import { getDateRange, isWithinRange } from "@/lib/analytics/date-ranges";

describe("date ranges", () => {
  it("builds last 7 days with inclusive boundaries", () => {
    const range = getDateRange("last_7_days", new Date("2026-07-28T15:00:00Z"));
    expect(range.label).toBe("Last 7 days");
    expect(range.from.toISOString().slice(0, 10)).toBe("2026-07-22");
    expect(range.to.toISOString().slice(0, 10)).toBe("2026-07-28");
  });

  it("checks whether timestamps are inside the range", () => {
    const range = getDateRange("today", new Date("2026-07-28T15:00:00Z"));
    expect(isWithinRange("2026-07-28T08:00:00Z", range)).toBe(true);
    expect(isWithinRange("2026-07-27T23:00:00Z", range)).toBe(false);
  });
});
