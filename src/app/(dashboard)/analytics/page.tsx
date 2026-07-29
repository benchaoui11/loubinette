import { LineChart } from "@/components/charts/line-chart";
import { UnavailablePanel } from "@/components/analytics/unavailable-panel";
import { readSelectedDateRange } from "@/lib/analytics/date-ranges";
import { getReadOnlyDashboardData } from "@/lib/database/firstidp-readonly";
import { readSelectedSiteId } from "@/lib/sites/site-config";
import { formatCurrency } from "@/lib/utils/format";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const siteId = await readSelectedSiteId(searchParams);
  const range = await readSelectedDateRange(searchParams);
  const data = await getReadOnlyDashboardData(range, siteId);
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Analytics</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Day-by-day operating analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Server-side loaded for {range.label}, date-bounded, and intentionally honest about unavailable historical attribution and payment data.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel rounded-2xl p-5">
          <h2 className="mb-4 font-semibold text-white">Applications over time</h2>
          <LineChart data={data.applicationsByDay} label="Applications" />
        </section>
        <section className="panel rounded-2xl p-5">
          <h2 className="mb-4 font-semibold text-white">Visitors over time</h2>
          <LineChart data={data.visitorsByDay} color="var(--chart-2)" label="Visitors" />
        </section>
      </div>
      <section className="panel rounded-2xl p-5">
        <h2 className="mb-4 font-semibold text-white">Application statuses</h2>
        {data.statusBreakdown.length ? <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {data.statusBreakdown.map((row) => (
            <div key={row.status} className="rounded-xl border border-slate-500/20 bg-slate-900/45 p-4">
              <div className="text-2xl font-semibold text-white">{row.count}</div>
              <div className="mt-1 text-sm capitalize text-slate-400">{row.status.replaceAll("_", " ")}</div>
            </div>
          ))}
        </div> : <p className="text-sm text-slate-400">No analytics data is connected for this website selection.</p>}
      </section>
      <UnavailablePanel title="Confirmed revenue is unavailable" body={`Submitted value is ${formatCurrency(data.metrics.submittedValue)}, but FirstIDP currently collects payment manually after document review. This dashboard will show verified revenue only after the payment ledger is connected.`} />
    </div>
  );
}
