import type { SiteStatus } from "@/types/firstidp";

export type SiteFeatureKey =
  | "has_white_page"
  | "has_offer_page"
  | "has_page_switching"
  | "has_documents"
  | "has_visitors"
  | "has_orders"
  | "has_applications"
  | "analytics_enabled";

export type SiteConfig = {
  site_id: string;
  site_name: string;
  domain: string;
  status: SiteStatus;
  logo: string;
  brand_color: string;
  has_white_page: boolean;
  has_offer_page: boolean;
  has_page_switching: boolean;
  has_documents: boolean;
  has_visitors: boolean;
  has_orders: boolean;
  has_applications: boolean;
  analytics_enabled: boolean;
  data_source: "firstidp_legacy_supabase" | null;
  attribution: {
    field: "site_id" | "site_name" | "domain" | "source" | "hostname";
    value: string;
  } | null;
};

export const SITE_FEATURE_LABELS: Record<SiteFeatureKey, string> = {
  has_white_page: "White Page",
  has_offer_page: "Offer Page",
  has_page_switching: "Page Switching",
  has_documents: "Documents",
  has_visitors: "Visitors",
  has_orders: "Orders",
  has_applications: "Applications",
  analytics_enabled: "Analytics",
};

export const SITE_CONFIGS = [
  {
    site_id: "firstidp",
    site_name: "FirstIDP",
    domain: "firstidp.com",
    status: "live",
    logo: "FirstIDP",
    brand_color: "#4f8cff",
    has_white_page: true,
    has_offer_page: true,
    has_page_switching: true,
    has_documents: true,
    has_visitors: true,
    has_orders: false,
    has_applications: true,
    analytics_enabled: true,
    data_source: "firstidp_legacy_supabase",
    attribution: null,
  },
  {
    site_id: "worldidp",
    site_name: "WorldIDP",
    domain: "worldidp.com",
    status: "live",
    logo: "WorldIDP",
    brand_color: "#14b8a6",
    has_white_page: false,
    has_offer_page: true,
    has_page_switching: false,
    has_documents: true,
    has_visitors: true,
    has_orders: false,
    has_applications: true,
    analytics_enabled: true,
    data_source: null,
    attribution: null,
  },
  {
    site_id: "applyinternationaldrivingpermit",
    site_name: "Apply International Driving Permit",
    domain: "applyinternationaldrivingpermit.com",
    status: "planned",
    logo: "AIDP",
    brand_color: "#64748b",
    has_white_page: false,
    has_offer_page: false,
    has_page_switching: false,
    has_documents: false,
    has_visitors: false,
    has_orders: false,
    has_applications: false,
    analytics_enabled: false,
    data_source: null,
    attribution: null,
  },
  {
    site_id: "international-auto-association",
    site_name: "International Auto Association",
    domain: "international-auto-association.com",
    status: "planned",
    logo: "IAA",
    brand_color: "#64748b",
    has_white_page: false,
    has_offer_page: false,
    has_page_switching: false,
    has_documents: false,
    has_visitors: false,
    has_orders: false,
    has_applications: false,
    analytics_enabled: false,
    data_source: null,
    attribution: null,
  },
  {
    site_id: "internationaldriversdocument",
    site_name: "International Drivers Document",
    domain: "internationaldriversdocument.com",
    status: "planned",
    logo: "IDD",
    brand_color: "#64748b",
    has_white_page: false,
    has_offer_page: false,
    has_page_switching: false,
    has_documents: false,
    has_visitors: false,
    has_orders: false,
    has_applications: false,
    analytics_enabled: false,
    data_source: null,
    attribution: null,
  },
  {
    site_id: "international-driving-document",
    site_name: "International Driving Document",
    domain: "international-driving-document.com",
    status: "planned",
    logo: "IDD",
    brand_color: "#64748b",
    has_white_page: false,
    has_offer_page: false,
    has_page_switching: false,
    has_documents: false,
    has_visitors: false,
    has_orders: false,
    has_applications: false,
    analytics_enabled: false,
    data_source: null,
    attribution: null,
  },
  {
    site_id: "international-idp",
    site_name: "International IDP",
    domain: "international-idp.com",
    status: "planned",
    logo: "IIDP",
    brand_color: "#64748b",
    has_white_page: false,
    has_offer_page: false,
    has_page_switching: false,
    has_documents: false,
    has_visitors: false,
    has_orders: false,
    has_applications: false,
    analytics_enabled: false,
    data_source: null,
    attribution: null,
  },
  {
    site_id: "international-license",
    site_name: "International License",
    domain: "international-license.net",
    status: "planned",
    logo: "IL",
    brand_color: "#64748b",
    has_white_page: false,
    has_offer_page: false,
    has_page_switching: false,
    has_documents: false,
    has_visitors: false,
    has_orders: false,
    has_applications: false,
    analytics_enabled: false,
    data_source: null,
    attribution: null,
  },
  {
    site_id: "applyidponline",
    site_name: "Apply IDP Online",
    domain: "applyidponline.com",
    status: "planned",
    logo: "AIO",
    brand_color: "#64748b",
    has_white_page: false,
    has_offer_page: false,
    has_page_switching: false,
    has_documents: false,
    has_visitors: false,
    has_orders: false,
    has_applications: false,
    analytics_enabled: false,
    data_source: null,
    attribution: null,
  },
  {
    site_id: "getidponline",
    site_name: "Get IDP Online",
    domain: "getidponline.com",
    status: "planned",
    logo: "GIO",
    brand_color: "#64748b",
    has_white_page: false,
    has_offer_page: false,
    has_page_switching: false,
    has_documents: false,
    has_visitors: false,
    has_orders: false,
    has_applications: false,
    analytics_enabled: false,
    data_source: null,
    attribution: null,
  },
] as const satisfies readonly SiteConfig[];

export const ALL_WEBSITES_ID = "all";

export function getSiteById(siteId: string | null | undefined) {
  return SITE_CONFIGS.find((site) => site.site_id === siteId) ?? null;
}

export function getSelectedSites(siteId: string | null | undefined): readonly SiteConfig[] {
  const site = getSiteById(siteId);
  return site ? [site] : SITE_CONFIGS;
}

export function getEnabledFeatureLabels(site: SiteConfig) {
  return (Object.keys(SITE_FEATURE_LABELS) as SiteFeatureKey[])
    .filter((feature) => site[feature])
    .map((feature) => SITE_FEATURE_LABELS[feature]);
}

export function isFeatureEnabledForSelection(siteId: string | null | undefined, feature: SiteFeatureKey) {
  return getSelectedSites(siteId).some((site) => site[feature]);
}

export function validateSiteFeatureConfig(site: SiteConfig) {
  return !site.has_page_switching || (site.has_white_page && site.has_offer_page);
}

export function siteSelectionLabel(siteId: string | null | undefined) {
  return getSiteById(siteId)?.site_name ?? "All Websites";
}

export function getConnectedDataSource(siteId: string | null | undefined) {
  const selectedSites = getSelectedSites(siteId);
  return selectedSites.find((site) => site.data_source)?.data_source ?? null;
}

export async function readSelectedSiteId(searchParams?: Promise<Record<string, string | string[] | undefined>>) {
  const params = searchParams ? await searchParams : {};
  const value = params.site;
  return Array.isArray(value) ? value[0] : value;
}
