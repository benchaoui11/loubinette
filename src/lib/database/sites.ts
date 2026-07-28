import type { ManagedSite } from "@/types/firstidp";
import { ALL_WEBSITES_ID, SITE_CONFIGS, type SiteConfig } from "@/lib/sites/site-config";

function toManagedSite(site: SiteConfig): ManagedSite {
  return {
    id: site.site_id,
    siteKey: site.site_id,
    name: site.site_name,
    domain: site.domain,
    status: site.status,
    logo: site.logo,
    color: site.brand_color,
    currency: "USD",
    timezone: "UTC",
    hasOfferPage: site.has_offer_page,
    hasWhitePage: site.has_white_page,
    hasPageSwitching: site.has_page_switching,
    hasDocuments: site.has_documents,
    hasVisitors: site.has_visitors,
    hasOrders: site.has_orders,
    hasApplications: site.has_applications,
    analyticsEnabled: site.analytics_enabled,
  };
}

export const MANAGED_SITES: ManagedSite[] = SITE_CONFIGS.map(toManagedSite);
export const FIRST_IDP_SITE = MANAGED_SITES.find((site) => site.siteKey === "firstidp") ?? MANAGED_SITES[0];

export function resolveSite(siteKey?: string | null) {
  if (!siteKey || siteKey === ALL_WEBSITES_ID) return FIRST_IDP_SITE;
  return MANAGED_SITES.find((site) => site.siteKey === siteKey) ?? FIRST_IDP_SITE;
}
