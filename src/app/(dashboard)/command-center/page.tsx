import { DocumentMetadataTable } from "@/components/documents/document-metadata-table";
import { LineChart } from "@/components/charts/line-chart";
import { KpiCard } from "@/components/command-center/kpi-card";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { UnavailablePanel } from "@/components/analytics/unavailable-panel";
import { VisitorsTable } from "@/components/traffic/visitors-table";
import { EmptyState } from "@/components/shared/empty-state";
import { AttributionSummaryTable } from "@/components/sites/attribution-summary";
import { readSelectedDateRange } from "@/lib/analytics/date-ranges";
import { getReadOnlyDashboardData } from "@/lib/database/firstidp-readonly";
import { readSelectedSiteId, siteSelectionLabel } from "@/lib/sites/site-config";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/format";

export const metadata = {
  title: "Command Center",
};

export default async function CommandCenterPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const siteId = await readSelectedSiteId(searchParams);
  const range = await readSelectedDateRange(searchParams);
  const data = await getReadOnlyDashboardData(range, siteId);
  const { metrics } = data;
  const selectedLabel = siteSelectionLabel(siteId);

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Command Center</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Multi-site IDP operations.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Read-only first milestone. Submitted value is not revenue. Confirmed revenue appears only after a real payment ledger is connected.</p>
        </div>
        <div className="rounded-xl border border-slate-600/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
          {data.connected ? `Connected read-only data for ${selectedLabel}` : `No connected data source for ${selectedLabel}`}
        </div>
      </section>

      {data.error ? <UnavailablePanel title="Data connection notice" body={data.error} /> : null}

      <section className="panel rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-white">Website attribution</h2>
          <p className="mt-1 text-sm text-slate-400">Legacy rows without a reliable site field are grouped as Unknown website. They are not assigned to FirstIDP or WorldIDP.</p>
        </div>
        <AttributionSummaryTable rows={data.attributionSummary} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Operations</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total applicant rows in selected period" value={formatNumber(metrics.totalApplications)} eyebrow="Applications" tooltip="Applicant rows. A travel companion is stored as a second row in the current FirstIDP system." />
          <KpiCard label="Application groups" value={formatNumber(metrics.applicationGroups)} eyebrow="Groups" tone="slate" tooltip="Grouped by primary reference/group_ref. This is closer to commercial order groups than applicant rows." />
          <KpiCard label="Pending review" value={formatNumber(metrics.pendingReview)} eyebrow="Review" tone="amber" tooltip="Rows currently submitted or under review." />
          <KpiCard label="Delivered" value={formatNumber(metrics.delivered)} eyebrow="Fulfillment" tone="green" tooltip="Rows with delivered status." />
          <KpiCard label="Documents accepted" value={formatNumber(metrics.documentsAccepted)} eyebrow="Documents" tone="green" tooltip="Rows with documents_accepted status." />
          <KpiCard label="Processing" value={formatNumber(metrics.processing)} eyebrow="Production" tone="blue" tooltip="Rows currently marked processing." />
          <KpiCard label="Rejected" value={formatNumber(metrics.rejected)} eyebrow="Quality" tone="rose" tooltip="Rows currently rejected." />
          <KpiCard label="Document completion rate" value={formatPercent(metrics.documentCompletionRate)} eyebrow="Quality" tone="slate" tooltip="Share of loaded application rows with all four legacy document paths present." />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Financial</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Submitted Value, not revenue" value={formatCurrency(metrics.submittedValue)} eyebrow="Submitted value" tooltip="Sum of requested totals in applications.total. This does not mean the customer paid." />
          <KpiCard label="Legacy manually marked paid value" value={formatCurrency(metrics.manuallyMarkedPaidValue)} eyebrow="Manual paid" tone="amber" tooltip="Applications with paid/processing/delivered status. This is not verified payment processor revenue." />
          <KpiCard label="Payment ledger not connected" value="Unavailable" eyebrow="Confirmed revenue" tone="slate" tooltip="Confirmed revenue requires a payment ledger or provider webhook. It is intentionally not inferred." />
          <KpiCard label="Average submitted value" value={formatCurrency(metrics.averageSubmittedValue)} eyebrow="Average" tooltip="Average requested application total for loaded rows in the selected range." />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Traffic</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Visitor beacons in selected period" value={formatNumber(metrics.visitors)} eyebrow="Visitors" tooltip="Rows from the existing lightweight visitors table." />
          <KpiCard label="Unique visitor identity unavailable historically" value="Unavailable" eyebrow="Unique visitors" tone="slate" tooltip="The old tracker stores sessionStorage session IDs only, not a durable privacy-safe visitor id." />
          <KpiCard label="Conversion rate unavailable" value="Unavailable" eyebrow="Conversion" tone="slate" tooltip="Historical visitors are not reliably linked to application submissions." />
          <KpiCard label="Applications this month" value={formatNumber(metrics.applicationsThisMonth)} eyebrow="This month" tooltip="Applicant rows created during the current calendar month." />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Applications by day</h2>
              <span className="text-xs text-slate-500">{range.label}</span>
          </div>
          <LineChart data={data.applicationsByDay} label="Applications" />
        </div>
        <div className="panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Visitors by day</h2>
              <span className="text-xs text-slate-500">{range.label}</span>
          </div>
          <LineChart data={data.visitorsByDay} color="var(--chart-2)" label="Visitors" />
        </div>
      </section>

      <UnavailablePanel title="Attribution begins after tracker deployment" body="Current historical visitor data does not include UTM fields, click IDs, first-touch, last-touch, or conversion snapshots. The new attribution model is prepared in migrations and documentation, but old records will remain limited." />

      <section className="panel rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent applications</h2>
          <span className="text-xs text-slate-500">{range.label}</span>
        </div>
        {data.applications.length ? <ApplicationsTable applications={data.applications.slice(0, 8)} /> : <EmptyState title="No applications loaded" body="No application data is connected for this website selection." />}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel rounded-2xl p-5">
          <h2 className="mb-4 font-semibold text-white">Recent visitors</h2>
          {data.visitors.length ? <VisitorsTable visitors={data.visitors.slice(0, 8)} /> : <EmptyState title="No visitors loaded" body="Visitor rows will appear after Supabase is configured." />}
        </div>
        <div className="panel rounded-2xl p-5">
          <h2 className="mb-4 font-semibold text-white">Document metadata</h2>
          {data.documentRows.length ? <DocumentMetadataTable rows={data.documentRows.slice(0, 8)} /> : <EmptyState title="No document metadata loaded" body="The secure document viewer is intentionally gated behind signed URL infrastructure." />}
        </div>
      </section>
    </div>
  );
}
