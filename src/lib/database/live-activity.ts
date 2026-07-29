import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { canQueryProductionData, filterRowsForSite, rowMatchesAttribution } from "@/lib/sites/site-attribution";
import { getConnectedDataSource, SITE_CONFIGS, siteSelectionLabel } from "@/lib/sites/site-config";

const ACTIVITY_LIMIT = 20;

type ReadResult = {
  data: unknown[] | null;
  error: { message?: string } | null;
};

type ActivitySource = "applications" | "visitors" | "switch_log";

export type LiveActivityEvent = {
  id: string;
  websiteName: string;
  eventType: "New application submitted" | "Visitor recorded" | "Page mode changed";
  occurredAt: string;
  source: ActivitySource;
};

export type LiveActivityData = {
  events: LiveActivityEvent[];
  connected: boolean;
  errors: string[];
};

function stringOrNull(value: unknown) {
  return typeof value === "string" ? value : value == null ? null : String(value);
}

function normalizeRows(data: unknown[] | null | undefined) {
  return (data ?? []).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
}

function siteNameForRow(row: Record<string, unknown>) {
  const site = SITE_CONFIGS
    .filter((entry) => entry.status !== "planned")
    .find((entry) => rowMatchesAttribution(row, entry.attribution));

  return site?.site_name ?? "Unknown website";
}

function makeEvent(row: Record<string, unknown>, source: ActivitySource): LiveActivityEvent | null {
  const occurredAt = stringOrNull(source === "switch_log" ? row.changed_at : row.created_at);
  if (!occurredAt) return null;

  const sourceId = stringOrNull(row.id) ?? `${source}:${occurredAt}`;
  const eventType =
    source === "applications" ? "New application submitted" :
    source === "visitors" ? "Visitor recorded" :
    "Page mode changed";

  return {
    id: `${source}:${sourceId}`,
    websiteName: siteNameForRow(row),
    eventType,
    occurredAt,
    source,
  };
}

async function readRows(table: ActivitySource, select: string, orderColumn: string): Promise<ReadResult> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { data: null, error: { message: "Supabase server credentials are not configured." } };

  const result = await supabase
    .from(table)
    .select(select)
    .order(orderColumn, { ascending: false })
    .limit(ACTIVITY_LIMIT);

  return result as ReadResult;
}

async function readSwitchLogRows(): Promise<ReadResult> {
  const result = await readRows("switch_log", "id, site_id, changed_at", "changed_at");
  if (!result.error?.message || !/site_id/i.test(result.error.message)) return result;

  return readRows("switch_log", "id, changed_at", "changed_at");
}

export async function getLiveActivityData(siteId?: string | null): Promise<LiveActivityData> {
  const dataSource = getConnectedDataSource(siteId);

  if (!canQueryProductionData(siteId)) {
    return {
      events: [],
      connected: false,
      errors: [`${siteSelectionLabel(siteId)} has no reliable site attribution yet.`],
    };
  }

  if (dataSource !== "firstidp_legacy_supabase") {
    return {
      events: [],
      connected: false,
      errors: [`${siteSelectionLabel(siteId)} has no connected read-only data source yet.`],
    };
  }

  const [applicationsResult, visitorsResult, switchLogResult] = await Promise.all([
    readRows("applications", "id, site_id, created_at", "created_at"),
    readRows("visitors", "id, site_id, created_at", "created_at"),
    readSwitchLogRows(),
  ]);

  const errors = [applicationsResult.error, visitorsResult.error, switchLogResult.error]
    .map((error) => error?.message)
    .filter((message): message is string => Boolean(message));

  const applications = filterRowsForSite(normalizeRows(applicationsResult.data), siteId);
  const visitors = filterRowsForSite(normalizeRows(visitorsResult.data), siteId);
  const switchLogRows = filterRowsForSite(normalizeRows(switchLogResult.data), siteId);

  const events = [
    ...applications.map((row) => makeEvent(row, "applications")),
    ...visitors.map((row) => makeEvent(row, "visitors")),
    ...switchLogRows.map((row) => makeEvent(row, "switch_log")),
  ]
    .filter((event): event is LiveActivityEvent => Boolean(event))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, ACTIVITY_LIMIT);

  return {
    events,
    connected: errors.length === 0,
    errors,
  };
}
