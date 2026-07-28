import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, fullName, maskEmail } from "@/lib/utils/format";
import type { FirstIdpApplication } from "@/types/firstidp";

export function ApplicationsTable({ applications }: { applications: FirstIdpApplication[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Applicant</th>
            <th>Email</th>
            <th>Format</th>
            <th>Validity</th>
            <th>Destination</th>
            <th>Submitted value</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.ref ?? `${app.email}-${app.created_at}`}>
              <td className="mono text-blue-100">{app.ref ?? "No ref"}</td>
              <td>
                <div className="font-medium text-slate-100">{fullName(app.first_name, app.last_name)}</div>
                {app.is_companion ? <div className="text-xs text-slate-500">Travel companion</div> : null}
              </td>
              <td>{maskEmail(app.email)}</td>
              <td className="capitalize">{app.format?.replace("_", " ") ?? "Unknown"}</td>
              <td>{app.validity_years ? `${app.validity_years} years` : "Unknown"}</td>
              <td>{app.destination_country ?? "Unknown"}</td>
              <td>{formatCurrency(Number(app.total) || 0, app.currency ?? "USD")}</td>
              <td><StatusBadge status={app.status} /></td>
              <td>{app.created_at ? new Date(app.created_at).toLocaleDateString() : "Unknown"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
