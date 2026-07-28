import { describe, expect, it } from "vitest";
import {
  FIRSTIDP_SITE_UUID,
  getConnectedDataSource,
  getEnabledFeatureLabels,
  getSelectedSites,
  SITE_CONFIGS,
  SITE_FEATURE_LABELS,
  validateSiteFeatureConfig,
  type SiteFeatureKey,
} from "@/lib/sites/site-config";
import { getNavigationItemsForSite, NAVIGATION_ITEMS } from "@/lib/sites/navigation";

function labelsFor(siteId?: string | null) {
  return getNavigationItemsForSite(siteId).map((item) => item.label);
}

describe("site configuration", () => {
  it("configures only IDP websites", () => {
    expect(SITE_CONFIGS).toHaveLength(10);
    expect(SITE_CONFIGS.map((site) => [site.site_name, site.domain, site.status])).toEqual([
      ["FirstIDP", "firstidp.com", "live"],
      ["WorldIDP", "worldidp.com", "live"],
      ["Apply International Driving Permit", "applyinternationaldrivingpermit.com", "planned"],
      ["International Auto Association", "international-auto-association.com", "planned"],
      ["International Drivers Document", "internationaldriversdocument.com", "planned"],
      ["International Driving Document", "international-driving-document.com", "planned"],
      ["International IDP", "international-idp.com", "planned"],
      ["International License", "international-license.net", "planned"],
      ["Apply IDP Online", "applyidponline.com", "planned"],
      ["Get IDP Online", "getidponline.com", "planned"],
    ]);
  });

  it("configures the two live websites", () => {
    expect(SITE_CONFIGS.filter((site) => site.status === "live").map((site) => [site.site_name, site.domain])).toEqual([
      ["FirstIDP", "firstidp.com"],
      ["WorldIDP", "worldidp.com"],
    ]);
  });

  it("uses a complete typed feature model for every site", () => {
    const featureKeys = Object.keys(SITE_FEATURE_LABELS) as SiteFeatureKey[];

    for (const site of SITE_CONFIGS) {
      expect(site.site_id).toBeTruthy();
      expect(site.site_name).toBeTruthy();
      expect(site.domain).toContain(".");
      expect(site.logo).toBeTruthy();
      expect(site.brand_color).toMatch(/^#[0-9a-f]{6}$/i);

      for (const feature of featureKeys) {
        expect(typeof site[feature], `${site.site_id}.${feature}`).toBe("boolean");
      }
      expect(validateSiteFeatureConfig(site), site.site_id).toBe(true);
    }

    const firstidp = SITE_CONFIGS.find((site) => site.site_id === "firstidp");
    expect(firstidp?.attribution).toEqual({ field: "site_id", value: FIRSTIDP_SITE_UUID });

    for (const site of SITE_CONFIGS.filter((entry) => entry.site_id !== "firstidp")) {
      expect(site.attribution, `${site.site_id}.attribution`).toBeNull();
    }
  });

  it("models page switching as a separate capability", () => {
    const firstidp = SITE_CONFIGS.find((site) => site.site_id === "firstidp");
    const worldidp = SITE_CONFIGS.find((site) => site.site_id === "worldidp");

    expect(firstidp).toMatchObject({
      has_offer_page: true,
      has_white_page: true,
      has_page_switching: true,
    });
    expect(worldidp).toMatchObject({
      has_offer_page: true,
      has_white_page: false,
      has_page_switching: false,
    });
  });

  it("returns all configured sites for the All Websites selection", () => {
    expect(getSelectedSites("all")).toHaveLength(10);
    expect(getSelectedSites(null)).toHaveLength(10);
  });

  it("keeps planned websites feature-disabled until configured", () => {
    const plannedSites = SITE_CONFIGS.filter((site) => site.status === "planned");

    expect(plannedSites).toHaveLength(8);
    for (const site of plannedSites) {
      expect(getEnabledFeatureLabels(site), site.site_id).toEqual([]);
      expect(site.data_source, site.site_id).toBeNull();
    }
  });

  it("limits connected data sources to configured live sources", () => {
    expect(getConnectedDataSource("firstidp")).toBe("firstidp_legacy_supabase");
    expect(getConnectedDataSource("worldidp")).toBeNull();
    expect(getConnectedDataSource("applyidponline")).toBeNull();
    expect(getConnectedDataSource("all")).toBe("firstidp_legacy_supabase");
  });
});

describe("dynamic navigation", () => {
  it("shows White Page and Offer Page only for sites that support them", () => {
    expect(labelsFor("firstidp")).toContain("White Page");
    expect(labelsFor("firstidp")).toContain("Offer Page");
    expect(labelsFor("worldidp")).not.toContain("White Page");
    expect(labelsFor("worldidp")).toContain("Offer Page");
    expect(labelsFor("applyidponline")).not.toContain("White Page");
    expect(labelsFor("applyidponline")).not.toContain("Offer Page");
  });

  it("does not expose page switching for offer-only websites", () => {
    expect(getEnabledFeatureLabels(SITE_CONFIGS[0])).toContain("Page Switching");
    expect(getEnabledFeatureLabels(SITE_CONFIGS[1])).not.toContain("Page Switching");
    expect(labelsFor("worldidp")).not.toContain("Page Switching");
  });

  it("hides unsupported sections for a selected website", () => {
    expect(labelsFor("firstidp")).toContain("Applications");
    expect(labelsFor("firstidp")).not.toContain("Orders");
    expect(labelsFor("firstidp")).not.toContain("Payments");

    expect(labelsFor("applyidponline")).not.toContain("Orders");
    expect(labelsFor("applyidponline")).not.toContain("Payments");
    expect(labelsFor("applyidponline")).not.toContain("Applications");
    expect(labelsFor("applyidponline")).not.toContain("Visitors");
    expect(labelsFor("applyidponline")).toContain("Website Manager");
  });

  it("uses portfolio-wide feature union for All Websites", () => {
    const labels = labelsFor("all");

    expect(labels).toContain("White Page");
    expect(labels).toContain("Offer Page");
    expect(labels).toContain("Applications");
    expect(labels).toContain("Documents");
    expect(labels).not.toContain("Orders");
    expect(labels).not.toContain("Payments");
  });

  it("keeps navigation feature references inside the site config model", () => {
    const featureKeys = new Set(Object.keys(SITE_FEATURE_LABELS));

    for (const item of NAVIGATION_ITEMS) {
      for (const feature of item.anyOf ?? []) {
        expect(featureKeys.has(feature), item.label).toBe(true);
      }
    }
  });
});
