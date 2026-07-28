import { describe, expect, it } from "vitest";
import { getDateRange } from "@/lib/analytics/date-ranges";
import { calculateMetrics } from "@/lib/analytics/metrics";
import type { FirstIdpApplication } from "@/types/firstidp";

function app(partial: Partial<FirstIdpApplication>): FirstIdpApplication {
  return {
    ref: "WIDP-1",
    order_number: 1,
    status: "submitted",
    format: "digital",
    validity_years: 1,
    destination_country: "Thailand",
    total: 49,
    currency: "USD",
    first_name: "A",
    last_name: "B",
    email: "a@example.com",
    phone: null,
    group_ref: null,
    is_companion: false,
    file_selfie: "a/selfie.jpg",
    file_license_front: "a/front.jpg",
    file_license_back: "a/back.jpg",
    file_signature: "a/signature.png",
    created_at: "2026-07-28T10:00:00Z",
    ...partial,
  };
}

describe("dashboard metrics", () => {
  it("keeps submitted value separate from confirmed revenue", () => {
    const range = getDateRange("today", new Date("2026-07-28T12:00:00Z"));
    const metrics = calculateMetrics([app({ status: "paid", total: 99 })], [], range);
    expect(metrics.submittedValue).toBe(99);
    expect(metrics.manuallyMarkedPaidValue).toBe(99);
    expect(metrics.confirmedRevenueAvailable).toBe(false);
  });

  it("counts companion rows and groups separately", () => {
    const range = getDateRange("today", new Date("2026-07-28T12:00:00Z"));
    const metrics = calculateMetrics([
      app({ ref: "WIDP-A", group_ref: null }),
      app({ ref: "WIDP-A-2", group_ref: "WIDP-A", is_companion: true }),
    ], [], range);
    expect(metrics.totalApplications).toBe(2);
    expect(metrics.applicationGroups).toBe(1);
  });
});
