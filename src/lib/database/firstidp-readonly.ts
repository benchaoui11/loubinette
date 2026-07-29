import { getDateRange, isWithinRange, type DateRange, type DateRangePreset } from "@/lib/analytics/date-ranges";
import { calculateMetrics, seriesByDay, statusBreakdown } from "@/lib/analytics/metrics";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildAttributionSummary, canQueryProductionData, filterRowsForSite } from "@/lib/sites/site-attribution";
import { getConnectedDataSource, siteSelectionLabel } from "@/lib/sites/site-config";
import { fullName } from "@/lib/utils/format";
import type { DocumentFileField, FirstIdpApplication, ReadOnlyDashboardData, VisitorRecord } from "@/types/firstidp";
import { FIRST_IDP_SITE } from "./sites";

const EMPTY_METRICS = calculateMetrics([], [], getDateRange("last_30_days"));

const DOCUMENT_FIELDS: { type: DocumentFileField; label: string }[] = [
  { type: "file_license_front", label: "Driver license front" },
  { type: "file_license_back", label: "Driver license back" },
  { type: "file_selfie", label: "Personal photo" },
  { type: "file_signature", label: "Signature" },
];

const APPLICATION_SELECT_WITH_SITE_ID = "id, site_id, ref, order_number, status, format, validity_years, destination_country, total, currency, first_name, last_name, email, phone, vip_processing, group_ref, is_companion, file_selfie, file_license_front, file_license_back, file_signature, created_at";
const APPLICATION_SELECT_LEGACY = "id, ref, order_number, status, format, validity_years, destination_country, total, currency, first_name, last_name, email, phone, vip_processing, group_ref, is_companion, file_selfie, file_license_front, file_license_back, file_signature, created_at";
const VISITOR_SELECT_WITH_SITE_ID = "id, site_id, created_at, session_id, site_mode_at_visit, country, browser, os, device, referrer, landing_page";
const VISITOR_SELECT_LEGACY = "id, created_at, session_id, site_mode_at_visit, country, browser, os, device, referrer, landing_page";

type ReadResult = {
  data: unknown[] | null;
  error: { message?: string } | null;
};

function emptyDashboardData(range: ReturnType<typeof getDateRange>, error?: string): ReadOnlyDashboardData {
  return {
    site: FIRST_IDP_SITE,
    generatedAt: new Date().toISOString(),
    connected: false,
    error,
    metrics: EMPTY_METRICS,
    applications: [],
    visitors: [],
    applicationsByDay: seriesByDay([], range),
    visitorsByDay: seriesByDay([], range),
    statusBreakdown: [],
    documentRows: [],
    attributionSummary: buildAttributionSummary([], []),
  };
}

function normalizeApplication(row: Record<string, unknown>): FirstIdpApplication {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    site_id: stringOrNull(row.site_id),
    ref: stringOrNull(row.ref),
    order_number: numberOrNull(row.order_number),
    status: stringOrNull(row.status),
    format: stringOrNull(row.format),
    validity_years: numberOrNull(row.validity_years),
    destination_country: stringOrNull(row.destination_country),
    total: numberOrNull(row.total),
    currency: stringOrNull(row.currency),
    first_name: stringOrNull(row.first_name),
    last_name: stringOrNull(row.last_name),
    email: stringOrNull(row.email),
    phone: stringOrNull(row.phone),
    vip_processing: row.vip_processing == null ? null : Boolean(row.vip_processing),
    group_ref: stringOrNull(row.group_ref),
    is_companion: Boolean(row.is_companion),
    file_selfie: stringOrNull(row.file_selfie),
    file_license_front: stringOrNull(row.file_license_front),
    file_license_back: stringOrNull(row.file_license_back),
    file_signature: stringOrNull(row.file_signature),
    created_at: stringOrNull(row.created_at),
  };
}

function normalizeVisitor(row: Record<string, unknown>): VisitorRecord {
  return {
    id: numberOrNull(row.id) ?? undefined,
    site_id: stringOrNull(row.site_id),
    created_at: stringOrNull(row.created_at),
    session_id: stringOrNull(row.session_id),
    site_mode_at_visit: stringOrNull(row.site_mode_at_visit),
    country: stringOrNull(row.country),
    browser: stringOrNull(row.browser),
    os: stringOrNull(row.os),
    device: stringOrNull(row.device),
    referrer: stringOrNull(row.referrer),
    landing_page: stringOrNull(row.landing_page),
  };
}

function stringOrNull(value: unknown) {
  return typeof value === "string" ? value : value == null ? null : String(value);
}

function numberOrNull(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isMissingSiteIdColumn(error: { message?: string } | null | undefined) {
  return Boolean(error?.message && /site_id/i.test(error.message));
}

export async function getReadOnlyDashboardData(presetOrRange: DateRangePreset | DateRange = "last_30_days", siteId?: string | null): Promise<ReadOnlyDashboardData> {
  const range = typeof presetOrRange === "string" ? getDateRange(presetOrRange) : presetOrRange;
  const dataSource = getConnectedDataSource(siteId);

  if (!canQueryProductionData(siteId)) {
    return emptyDashboardData(range, `${siteSelectionLabel(siteId)} has no reliable site attribution yet.`);
  }

  if (dataSource !== "firstidp_legacy_supabase") {
    return emptyDashboardData(range, `${siteSelectionLabel(siteId)} has no connected read-only data source yet.`);
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return emptyDashboardData(range, "Supabase server credentials are not configured. Add environment variables to connect real IDP data.");
  }

  const supabaseClient = supabase;

  async function readApplications(select: string): Promise<ReadResult> {
    const result = await supabaseClient
      .from("applications")
      .select(select)
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    return result as ReadResult;
  }

  async function readVisitors(select: string): Promise<ReadResult> {
    const result = await supabaseClient
      .from("visitors")
      .select(select)
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);

    return result as ReadResult;
  }

  let [applicationsResult, visitorsResult] = await Promise.all([
    readApplications(APPLICATION_SELECT_WITH_SITE_ID),
    readVisitors(VISITOR_SELECT_WITH_SITE_ID),
  ]);

  if (isMissingSiteIdColumn(applicationsResult.error)) {
    applicationsResult = await readApplications(APPLICATION_SELECT_LEGACY);
  }

  if (isMissingSiteIdColumn(visitorsResult.error)) {
    visitorsResult = await readVisitors(VISITOR_SELECT_LEGACY);
  }

  if (applicationsResult.error) {
    return emptyDashboardData(range, applicationsResult.error.message);
  }

  const allApplications = (applicationsResult.data ?? []).map((row) => normalizeApplication(row as Record<string, unknown>));
  const allVisitors = (visitorsResult.data ?? []).map((row) => normalizeVisitor(row as Record<string, unknown>));
  const applications = (filterRowsForSite(allApplications as unknown as Record<string, unknown>[], siteId) as unknown as FirstIdpApplication[])
    .filter((application) => isWithinRange(application.created_at, range));
  const visitors = (filterRowsForSite(allVisitors as unknown as Record<string, unknown>[], siteId) as unknown as VisitorRecord[])
    .filter((visitor) => isWithinRange(visitor.created_at, range));
  const metrics = calculateMetrics(applications, visitors, range);

  return {
    site: FIRST_IDP_SITE,
    generatedAt: new Date().toISOString(),
    connected: true,
    error: visitorsResult.error?.message,
    metrics,
    applications,
    visitors,
    applicationsByDay: seriesByDay(applications, range),
    visitorsByDay: seriesByDay(visitors, range),
    statusBreakdown: statusBreakdown(applications, range),
    attributionSummary: buildAttributionSummary(
      allApplications as unknown as Record<string, unknown>[],
      allVisitors as unknown as Record<string, unknown>[],
    ),
    documentRows: applications.slice(0, 12).map((app) => {
      const docs = [app.file_selfie, app.file_license_front, app.file_license_back, app.file_signature];
      return {
        applicationId: app.id ?? null,
        applicationRef: app.ref || "No ref",
        applicant: fullName(app.first_name, app.last_name),
        documentsUploaded: docs.filter(Boolean).length,
        documentsExpected: 4,
        storagePathsPresent: docs.some(Boolean),
        documents: DOCUMENT_FIELDS.map((document) => ({
          ...document,
          available: Boolean(app[document.type]),
        })),
      };
    }),
  };
}
