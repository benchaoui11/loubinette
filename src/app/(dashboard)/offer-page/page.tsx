import { UnavailablePage } from "@/components/shared/unavailable-page";
import { UnavailablePanel } from "@/components/analytics/unavailable-panel";
import { FirstIdpModeSwitcher } from "@/components/sites/firstidp-mode-switcher";
import { getSiteById, isFeatureEnabledForSelection, readSelectedSiteId, siteSelectionLabel } from "@/lib/sites/site-config";

export const metadata = { title: "Offer Page" };

export default async function OfferPageControlsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const siteId = await readSelectedSiteId(searchParams);
  const site = getSiteById(siteId);
  const siteLabel = siteSelectionLabel(siteId);

  if (!isFeatureEnabledForSelection(siteId, "has_offer_page")) {
    return (
      <UnavailablePage
        eyebrow="Offer Page"
        title="Offer Page is not enabled"
        body={`${siteLabel} is not configured with Offer Page support. Planned websites stay disabled until a real IDP website and data source are configured.`}
      />
    );
  }

  if (site?.site_id !== "firstidp") {
    return (
      <UnavailablePage
        eyebrow="Offer Page"
        title={`${siteLabel} is offer-only`}
        body="This website has Offer Page support but does not have White Page switching. No site settings or switch logs are used for WorldIDP or planned websites."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Offer Page</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">FirstIDP page switching</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Use this control to activate the FirstIDP Offer Page or White Page. WorldIDP remains offer-only.</p>
      </div>
      <FirstIdpModeSwitcher />
      <UnavailablePanel
        title="FirstIDP only"
        body="Switching is not shown for WorldIDP or planned websites. The Control Center updates only the existing FirstIDP site settings row."
      />
    </div>
  );
}
