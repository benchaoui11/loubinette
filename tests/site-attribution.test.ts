import { describe, expect, it } from "vitest";
import {
  buildAttributionSummary,
  canQueryProductionData,
  filterRowsForSite,
  rowMatchesAttribution,
} from "@/lib/sites/site-attribution";
import { FIRSTIDP_SITE_UUID, WORLDIDP_SITE_UUID } from "@/lib/sites/site-config";

const rows = [
  { id: 1, site_id: FIRSTIDP_SITE_UUID, domain: "firstidp.com" },
  { id: 2, site_id: WORLDIDP_SITE_UUID, domain: "worldidp.com" },
  { id: 3 },
];

describe("site-level attribution", () => {
  it("supports exact FirstIDP matching when a reliable rule exists", () => {
    expect(rowMatchesAttribution(rows[0], { field: "site_id", value: FIRSTIDP_SITE_UUID })).toBe(true);
    expect(rowMatchesAttribution(rows[1], { field: "site_id", value: FIRSTIDP_SITE_UUID })).toBe(false);
  });

  it("supports exact WorldIDP matching when a reliable rule exists", () => {
    expect(rowMatchesAttribution(rows[1], { field: "site_id", value: WORLDIDP_SITE_UUID })).toBe(true);
    expect(rowMatchesAttribution(rows[0], { field: "site_id", value: WORLDIDP_SITE_UUID })).toBe(false);
  });

  it("filters FirstIDP rows by the configured production site UUID", () => {
    expect(filterRowsForSite(rows, "firstidp")).toEqual([rows[0]]);
  });

  it("filters WorldIDP rows by the configured production site UUID", () => {
    expect(filterRowsForSite(rows, "worldidp")).toEqual([rows[1]]);
  });

  it("keeps unattributed records visible in the All Websites aggregation", () => {
    const summary = buildAttributionSummary(rows, rows);
    const unknown = summary.find((row) => row.siteId === "unattributed");

    expect(filterRowsForSite(rows, "all")).toEqual(rows);
    expect(unknown).toMatchObject({
      siteName: "Unknown website",
      applications: 1,
      visitors: 1,
    });
  });

  it("guards planned websites from production data queries", () => {
    expect(canQueryProductionData("applyidponline")).toBe(false);
    expect(canQueryProductionData("getidponline")).toBe(false);
  });
});
