import { ShieldCheck } from "lucide-react";
import { getEnabledFeatureLabels, SITE_CONFIGS } from "@/lib/sites/site-config";

export const metadata = { title: "Site Control" };

function statusClass(status: string) {
  return status === "planned"
    ? "border-slate-500/25 bg-slate-400/10 text-slate-300"
    : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
}

export default function SiteControlPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Website Manager</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">IDP website registry</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Live IDP websites and planned IDP domains are configured here. Planned websites stay disabled until a real data source and feature flags are configured.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {SITE_CONFIGS.map((site) => (
          <section key={site.site_id} className="panel rounded-2xl p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 grid size-10 place-items-center rounded-lg border border-slate-500/25 text-sm font-black text-white" style={{ backgroundColor: `${site.brand_color}26`, borderColor: `${site.brand_color}55` }}>
                  {site.logo.slice(0, 1)}
                </div>
                <h2 className="text-xl font-semibold text-white">{site.site_name}</h2>
                <p className="mt-1 text-sm text-slate-400">{site.domain}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm capitalize ${statusClass(site.status)}`}>
                <ShieldCheck className="size-4" /> {site.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {getEnabledFeatureLabels(site).length ? getEnabledFeatureLabels(site).map((feature) => (
                <span key={feature} className="rounded-full border border-slate-500/20 bg-slate-400/10 px-2.5 py-1 text-xs text-slate-300">
                  {feature}
                </span>
              )) : <span className="rounded-full border border-slate-500/20 bg-slate-400/10 px-2.5 py-1 text-xs text-slate-400">No features enabled yet</span>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
