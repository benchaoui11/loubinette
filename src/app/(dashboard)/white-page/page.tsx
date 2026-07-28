import { UnavailablePage } from "@/components/shared/unavailable-page";
import { UnavailablePanel } from "@/components/analytics/unavailable-panel";
import { FirstIdpModeSwitcher } from "@/components/sites/firstidp-mode-switcher";
import { getSiteById, isFeatureEnabledForSelection, readSelectedSiteId, siteSelectionLabel } from "@/lib/sites/site-config";

export const metadata = { title: "White Page" };

export default async function WhitePageControlsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const siteId = await readSelectedSiteId(searchParams);
  const site = getSiteById(siteId);
  const siteLabel = siteSelectionLabel(siteId);

  if (site?.site_id !== "firstidp") {
    return (
      <UnavailablePage
        eyebrow="White Page"
        title="White Page is not enabled"
        body={`${siteLabel} is not configured with FirstIDP White Page switching. WorldIDP and planned websites do not use White Page controls, site settings, or switch logs.`}
      />
    );
  }

  if (!isFeatureEnabledForSelection(siteId, "has_white_page")) {
    return (
      <UnavailablePage
        eyebrow="White Page"
        title="White Page is not enabled"
        body={`${siteLabel} is not configured with White Page support.`}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">White Page</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">FirstIDP page switching</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Only FirstIDP supports White Page and Offer Page switching. The action is restricted to the authenticated owner admin.</p>
      </div>
      <FirstIdpModeSwitcher />
      <UnavailablePanel
        title="Scoped to FirstIDP"
        body="WorldIDP remains offer-only and planned websites stay disabled until explicitly configured with page switching."
      />
    </div>
  );
}
