import type { AttributionSummary } from "@/lib/sites/site-attribution";

function badgeClass(status: AttributionSummary["status"]) {
  if (status === "unknown") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (status === "planned") return "border-slate-500/25 bg-slate-400/10 text-slate-300";
  return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
}

export function AttributionSummaryTable({ rows }: { rows: AttributionSummary[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Website</th>
            <th>Status</th>
            <th>Applications</th>
            <th>Visitors</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.siteId}>
              <td>
                <div className="font-medium text-slate-100">{row.siteName}</div>
                <div className="mt-0.5 text-xs text-slate-500">{row.domain}</div>
              </td>
              <td>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs capitalize ${badgeClass(row.status)}`}>
                  {row.status === "unknown" ? "Unattributed" : row.status}
                </span>
              </td>
              <td className="mono">{row.applications}</td>
              <td className="mono">{row.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
