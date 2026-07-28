import { ALL_WEBSITES_ID, getSiteById, SITE_CONFIGS, type SiteConfig } from "@/lib/sites/site-config";

export type AttributionField =
  | "site_id"
  | "site_name"
  | "domain"
  | "source"
  | "hostname";

export type AttributionRule = {
  field: AttributionField;
  value: string;
};

export type AttributableRow = Record<string, unknown>;

export type AttributionSummary = {
  siteId: string;
  siteName: string;
  domain: string;
  status: SiteConfig["status"] | "unknown";
  applications: number;
  visitors: number;
};

export function canQueryProductionData(siteId: string | null | undefined) {
  if (!siteId || siteId === ALL_WEBSITES_ID) return true;

  const site = getSiteById(siteId);
  if (!site || site.status === "planned") return false;

  return Boolean(site.attribution);
}

export function rowMatchesAttribution(row: AttributableRow, rule: AttributionRule | null) {
  if (!rule) return false;

  const raw = row[rule.field];
  if (raw == null) return false;

  return String(raw).toLowerCase() === rule.value.toLowerCase();
}

export function splitRowsByAttribution<T extends AttributableRow>(rows: T[], site: SiteConfig) {
  const rule = site.attribution;
  const attributed = rule ? rows.filter((row) => rowMatchesAttribution(row, rule)) : [];
  const attributedSet = new Set(attributed);

  return {
    attributed,
    unattributed: rows.filter((row) => !attributedSet.has(row)),
  };
}

export function filterRowsForSite<T extends AttributableRow>(rows: T[], siteId: string | null | undefined) {
  if (!siteId || siteId === ALL_WEBSITES_ID) return rows;

  const site = getSiteById(siteId);
  if (!site) return [];

  return splitRowsByAttribution(rows, site).attributed;
}

export function buildAttributionSummary(applications: AttributableRow[], visitors: AttributableRow[]): AttributionSummary[] {
  const attributedApplicationSet = new Set<AttributableRow>();
  const attributedVisitorSet = new Set<AttributableRow>();

  const siteSummaries = SITE_CONFIGS
    .filter((site) => site.status !== "planned")
    .map((site) => {
      const siteApplications = splitRowsByAttribution(applications, site).attributed;
      const siteVisitors = splitRowsByAttribution(visitors, site).attributed;
      siteApplications.forEach((row) => attributedApplicationSet.add(row));
      siteVisitors.forEach((row) => attributedVisitorSet.add(row));

      return {
        siteId: site.site_id,
        siteName: site.site_name,
        domain: site.domain,
        status: site.status,
        applications: siteApplications.length,
        visitors: siteVisitors.length,
      };
    });

  const unattributedApplications = applications.filter((row) => !attributedApplicationSet.has(row)).length;
  const unattributedVisitors = visitors.filter((row) => !attributedVisitorSet.has(row)).length;

  return [
    ...siteSummaries,
    {
      siteId: "unattributed",
      siteName: "Unknown website",
      domain: "Unattributed legacy records",
      status: "unknown",
      applications: unattributedApplications,
      visitors: unattributedVisitors,
    },
  ];
}
