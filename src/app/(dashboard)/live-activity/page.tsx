import { EmptyState } from "@/components/shared/empty-state";
import { getLiveActivityData, type LiveActivityEvent } from "@/lib/database/live-activity";
import { readSelectedSiteId, siteSelectionLabel } from "@/lib/sites/site-config";
import { Activity, FileText, MousePointerClick, ToggleLeft } from "lucide-react";

export const metadata = { title: "Live Activity" };

function relativeTime(value: string) {
  const date = new Date(value);
  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(deltaSeconds);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  const [unit, seconds] = units.find(([, unitSeconds]) => absoluteSeconds >= unitSeconds) ?? ["second", 1];

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(deltaSeconds / seconds), unit);
}

function eventIcon(source: LiveActivityEvent["source"]) {
  if (source === "applications") return <FileText className="h-4 w-4" aria-hidden="true" />;
  if (source === "visitors") return <MousePointerClick className="h-4 w-4" aria-hidden="true" />;
  return <ToggleLeft className="h-4 w-4" aria-hidden="true" />;
}

function eventTone(source: LiveActivityEvent["source"]) {
  if (source === "applications") return "border-blue-300/30 bg-blue-400/10 text-blue-100";
  if (source === "visitors") return "border-teal-300/30 bg-teal-400/10 text-teal-100";
  return "border-amber-300/30 bg-amber-400/10 text-amber-100";
}

export default async function LiveActivityPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const siteId = await readSelectedSiteId(searchParams);
  const selectedLabel = siteSelectionLabel(siteId);
  const data = await getLiveActivityData(siteId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">Live Activity</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Privacy-safe operations feed</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Recent application, visitor, and page-switch events for {selectedLabel}. No customer names, emails, document paths, signatures, uploads, or checkout details are shown.</p>
        </div>
        <div className="rounded-xl border border-slate-600/40 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
          {data.connected ? "Read-only feed connected" : "Partial or unavailable feed"}
        </div>
      </section>

      {data.errors.length ? (
        <section className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {data.errors.join(" ")}
        </section>
      ) : null}

      <section className="panel rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-400">Server-side read-only query, limited to the latest 20 events.</p>
          </div>
          <Activity className="h-5 w-5 text-blue-200/70" aria-hidden="true" />
        </div>

        {data.events.length ? (
          <div className="overflow-hidden rounded-xl border border-slate-700/70">
            <ul className="divide-y divide-slate-700/60">
              {data.events.map((event) => (
                <li key={event.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border ${eventTone(event.source)}`}>
                      {eventIcon(event.source)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{event.eventType}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{event.websiteName}</p>
                    </div>
                  </div>
                  <time dateTime={event.occurredAt} className="text-sm text-slate-400 sm:text-right">
                    {relativeTime(event.occurredAt)}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState title="No recent activity loaded" body="Activity appears after attributed applications, visitor beacons, or page mode changes are recorded." />
        )}
      </section>
    </div>
  );
}
