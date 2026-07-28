import type { VisitorRecord } from "@/types/firstidp";

export function VisitorsTable({ visitors }: { visitors: VisitorRecord[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Landing page</th>
            <th>Country</th>
            <th>Device</th>
            <th>Browser / OS</th>
            <th>Referrer</th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((visitor, index) => (
            <tr key={`${visitor.session_id}-${visitor.created_at}-${index}`}>
              <td>{visitor.created_at ? new Date(visitor.created_at).toLocaleString() : "Unknown"}</td>
              <td className="mono">{visitor.landing_page || "/"}</td>
              <td>{visitor.country || "Unknown"}</td>
              <td>{visitor.device || "Unknown"}</td>
              <td>{[visitor.browser, visitor.os].filter(Boolean).join(" / ") || "Unknown"}</td>
              <td>{visitor.referrer ? safeHost(visitor.referrer) : "Direct / unavailable"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function safeHost(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value.slice(0, 48);
  }
}
