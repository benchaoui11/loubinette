import type { VisitorRecord } from "@/types/firstidp";

export function VisitorsTable({ visitors }: { visitors: VisitorRecord[] }) {
  return (
    <div className="table-wrap">
      <div className="table-scroll-x" tabIndex={0} aria-label="Recent visitors table scroll area">
        <table className="min-w-[76rem]">
          <thead>
            <tr>
              <th className="w-[10rem]">Time</th>
              <th className="w-[18rem]">Landing page</th>
              <th className="w-[9rem]">Country</th>
              <th className="w-[10rem]">Device</th>
              <th className="w-[16rem]">Browser / OS</th>
              <th className="w-[22rem]">Referrer</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((visitor, index) => (
              <tr key={`${visitor.session_id}-${visitor.created_at}-${index}`}>
                <td className="whitespace-nowrap">{formatVisitorTime(visitor.created_at)}</td>
                <td className="mono max-w-[18rem] truncate" title={visitor.landing_page || "/"}>{visitor.landing_page || "/"}</td>
                <td className="whitespace-nowrap">{visitor.country || "Unknown"}</td>
                <td className="whitespace-nowrap">{visitor.device || "Unknown"}</td>
                <td className="max-w-[16rem] truncate" title={browserOs(visitor)}>{browserOs(visitor)}</td>
                <td className="max-w-[22rem] truncate" title={visitor.referrer || "Direct / unavailable"}>{visitor.referrer ? safeHost(visitor.referrer) : "Direct / unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatVisitorTime(value: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function browserOs(visitor: VisitorRecord) {
  return [visitor.browser, visitor.os].filter(Boolean).join(" / ") || "Unknown";
}

function safeHost(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value.slice(0, 48);
  }
}
