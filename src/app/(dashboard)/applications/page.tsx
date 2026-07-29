import { ApplicationsTable } from "@/components/applications/applications-table";
import { EmptyState } from "@/components/shared/empty-state";
import { readSelectedDateRange } from "@/lib/analytics/date-ranges";
import { getReadOnlyDashboardData } from "@/lib/database/firstidp-readonly";
import { readSelectedSiteId } from "@/lib/sites/site-config";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const siteId = await readSelectedSiteId(searchParams);
  const params = searchParams ? await searchParams : {};
  const range = await readSelectedDateRange(Promise.resolve(params));
  const highlightRef = valueOf(params.highlight);
  const data = await getReadOnlyDashboardData(range, siteId);
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Applications</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Read-only application workspace</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Status changes remain disabled until RBAC, audit logs, status history, and server-side transition validation are complete.</p>
      </div>
      <section className="panel rounded-2xl p-5">
        {data.applications.length ? <ApplicationsTable applications={data.applications} highlightRef={highlightRef} /> : <EmptyState title="No applications loaded" body="No application data is connected for this website selection." />}
      </section>
    </div>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
