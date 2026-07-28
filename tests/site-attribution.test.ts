import { describe, expect, it } from "vitest";
import {
  buildAttributionSummary,
  canQueryProductionData,
  filterRowsForSite,
  rowMatchesAttribution,
} from "@/lib/sites/site-attribution";

const rows = [
  { id: 1, site_id: "firstidp", domain: "firstidp.com" },
  { id: 2, site_id: "worldidp", domain: "worldidp.com" },
  { id: 3 },
];

describe("site-level attribution", () => {
  it("supports exact FirstIDP matching when a reliable rule exists", () => {
    expect(rowMatchesAttribution(rows[0], { field: "site_id", value: "firstidp" })).toBe(true);
    expect(rowMatchesAttribution(rows[1], { field: "site_id", value: "firstidp" })).toBe(false);
  });

  it("supports exact WorldIDP matching when a reliable rule exists", () => {
    expect(rowMatchesAttribution(rows[1], { field: "domain", value: "worldidp.com" })).toBe(true);
    expect(rowMatchesAttribution(rows[0], { field: "domain", value: "worldidp.com" })).toBe(false);
  });

  it("does not guess FirstIDP rows without a configured reliable attribution rule", () => {
    expect(filterRowsForSite(rows, "firstidp")).toEqual([]);
  });

  it("does not guess WorldIDP rows without a configured reliable attribution rule", () => {
    expect(filterRowsForSite(rows, "worldidp")).toEqual([]);
  });

  it("keeps unattributed records visible in the All Websites aggregation", () => {
    const summary = buildAttributionSummary(rows, rows);
    const unknown = summary.find((row) => row.siteId === "unattributed");

    expect(filterRowsForSite(rows, "all")).toEqual(rows);
    expect(unknown).toMatchObject({
      siteName: "Unknown website",
      applications: 3,
      visitors: 3,
    });
  });

  it("guards planned websites from production data queries", () => {
    expect(canQueryProductionData("applyidponline")).toBe(false);
    expect(canQueryProductionData("getidponline")).toBe(false);
  });
});
