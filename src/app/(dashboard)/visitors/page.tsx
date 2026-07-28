import { EmptyState } from "@/components/shared/empty-state";
import { VisitorsTable } from "@/components/traffic/visitors-table";
import { getReadOnlyDashboardData } from "@/lib/database/firstidp-readonly";
import { readSelectedSiteId } from "@/lib/sites/site-config";

export const metadata = { title: "Visitors" };

export default async function VisitorsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const siteId = await readSelectedSiteId(searchParams);
  const data = await getReadOnlyDashboardData("last_30_days", siteId);
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Visitors</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Privacy-aware visitor records</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Connected rows come from privacy-aware website beacons. Planned websites do not display visitor data until a real source is configured.</p>
      </div>
      <section className="panel rounded-2xl p-5">
        {data.visitors.length ? <VisitorsTable visitors={data.visitors} /> : <EmptyState title="No visitors loaded" body="No visitor data is connected for this website selection." />}
      </section>
    </div>
  );
}
