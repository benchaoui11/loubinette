"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import {
  ALL_WEBSITES_ID,
  getEnabledFeatureLabels,
  SITE_CONFIGS,
  siteSelectionLabel,
} from "@/lib/sites/site-config";

type SwitcherOption = {
  site_id: string;
  site_name: string;
  domain: string;
  status: string;
  features: string[];
};

function buildHref(pathname: string, searchParams: URLSearchParams, siteId: string) {
  const params = new URLSearchParams(searchParams);
  if (siteId === ALL_WEBSITES_ID) {
    params.delete("site");
  } else {
    params.set("site", siteId);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function SiteSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSiteId = searchParams.get("site") ?? ALL_WEBSITES_ID;
  const selectedLabel = siteSelectionLabel(selectedSiteId);
  const portfolioFeatures = Array.from(new Set(SITE_CONFIGS.flatMap(getEnabledFeatureLabels)));

  const options: SwitcherOption[] = [
    {
      site_id: ALL_WEBSITES_ID,
      site_name: "All Websites",
      domain: `${SITE_CONFIGS.length} configured websites`,
      status: "portfolio",
      features: portfolioFeatures,
    },
    ...SITE_CONFIGS.map((site) => ({
      site_id: site.site_id,
      site_name: site.site_name,
      domain: site.domain,
      status: site.status,
      features: getEnabledFeatureLabels(site),
    })),
  ];

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-600/40 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
        <Globe2 className="size-4 text-blue-200" />
        <span>{selectedLabel}</span>
        <ChevronDown className="size-4 text-slate-500 group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-full z-50 mt-2 w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-slate-600/40 bg-slate-950 p-2 shadow-2xl">
        {options.map((option) => {
          const selected = option.site_id === selectedSiteId || (option.site_id === ALL_WEBSITES_ID && selectedSiteId === ALL_WEBSITES_ID);
          return (
            <Link
              key={option.site_id}
              href={buildHref(pathname, searchParams, option.site_id)}
              className="block rounded-lg px-3 py-3 hover:bg-white/[0.045]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-100">{option.site_name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{option.domain}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${option.status === "planned" ? "border-slate-500/25 bg-slate-400/10 text-slate-300" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"}`}>
                    {option.status}
                  </span>
                  {selected ? <Check className="size-4 text-blue-200" /> : null}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {option.features.length ? option.features.map((feature) => (
                  <span key={feature} className="rounded-full border border-slate-500/20 bg-slate-400/10 px-2 py-0.5 text-[11px] text-slate-300">
                    {feature}
                  </span>
                )) : <span className="text-[11px] text-slate-500">No features enabled yet</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </details>
  );
}
