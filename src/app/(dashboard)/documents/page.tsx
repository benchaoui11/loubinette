import { DocumentMetadataTable } from "@/components/documents/document-metadata-table";
import { EmptyState } from "@/components/shared/empty-state";
import { UnavailablePanel } from "@/components/analytics/unavailable-panel";
import { readSelectedDateRange } from "@/lib/analytics/date-ranges";
import { getReadOnlyDashboardData } from "@/lib/database/firstidp-readonly";
import { readSelectedSiteId } from "@/lib/sites/site-config";

export const metadata = { title: "Documents" };

export default async function DocumentsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const siteId = await readSelectedSiteId(searchParams);
  const range = await readSelectedDateRange(searchParams);
  const data = await getReadOnlyDashboardData(range, siteId);
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Documents</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Sensitive document control</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">This page shows metadata only. Existing document paths are never moved, renamed, publicly exposed, or rendered with public URLs.</p>
      </div>
      <UnavailablePanel title="Viewer actions are intentionally disabled" body="Signed document access, access logs, RBAC checks, and review history must be active before document viewing or review mutations are enabled." />
      <section className="panel rounded-2xl p-5">
        {data.documentRows.length ? <DocumentMetadataTable rows={data.documentRows} /> : <EmptyState title="No document metadata loaded" body="No document metadata is connected for this website selection." />}
      </section>
    </div>
  );
}
