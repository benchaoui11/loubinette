import type { DashboardMetrics, FirstIdpApplication, TimeSeriesPoint, VisitorRecord } from "@/types/firstidp";
import { dayKey, enumerateDays, isWithinRange, type DateRange } from "./date-ranges";

const PENDING_STATUSES = new Set(["submitted", "under_review"]);
const ACCEPTED_STATUSES = new Set(["documents_accepted"]);
const PROCESSING_STATUSES = new Set(["processing"]);
const DELIVERED_STATUSES = new Set(["delivered"]);
const REJECTED_STATUSES = new Set(["rejected"]);
const PAID_LEGACY_STATUSES = new Set(["paid", "processing", "delivered"]);

function amount(app: FirstIdpApplication) {
  return Number(app.total) || 0;
}

export function groupKey(app: FirstIdpApplication) {
  return app.group_ref || app.ref || "unknown";
}

export function calculateMetrics(applications: FirstIdpApplication[], visitors: VisitorRecord[], range: DateRange): DashboardMetrics {
  const currentApps = applications.filter((app) => isWithinRange(app.created_at, range));
  const today = new Date();
  const todayKey = dayKey(today);
  const monthKey = today.toISOString().slice(0, 7);
  const applicationGroups = new Set(currentApps.map(groupKey)).size;
  const submittedValue = currentApps.reduce((sum, app) => sum + amount(app), 0);
  const manuallyMarkedPaidValue = currentApps.filter((app) => PAID_LEGACY_STATUSES.has(app.status || "")).reduce((sum, app) => sum + amount(app), 0);
  const docsComplete = currentApps.filter((app) => [app.file_selfie, app.file_license_front, app.file_license_back, app.file_signature].every(Boolean)).length;

  return {
    totalApplications: currentApps.length,
    applicationGroups,
    applicationsToday: applications.filter((app) => app.created_at?.startsWith(todayKey)).length,
    applicationsThisMonth: applications.filter((app) => app.created_at?.startsWith(monthKey)).length,
    pendingReview: currentApps.filter((app) => PENDING_STATUSES.has(app.status || "")).length,
    documentsAccepted: currentApps.filter((app) => ACCEPTED_STATUSES.has(app.status || "")).length,
    processing: currentApps.filter((app) => PROCESSING_STATUSES.has(app.status || "")).length,
    delivered: currentApps.filter((app) => DELIVERED_STATUSES.has(app.status || "")).length,
    rejected: currentApps.filter((app) => REJECTED_STATUSES.has(app.status || "")).length,
    submittedValue,
    manuallyMarkedPaidValue,
    confirmedRevenueAvailable: false,
    averageSubmittedValue: currentApps.length ? submittedValue / currentApps.length : 0,
    visitors: visitors.filter((visitor) => isWithinRange(visitor.created_at, range)).length,
    uniqueVisitors: null,
    conversionRate: null,
    documentCompletionRate: currentApps.length ? (docsComplete / currentApps.length) * 100 : 0,
  };
}

export function seriesByDay<T extends { created_at: string | null }>(rows: T[], range: DateRange, valueFn?: (row: T) => number): TimeSeriesPoint[] {
  const buckets = new Map(enumerateDays(range.from, range.to).map((day) => [day, 0]));
  for (const row of rows) {
    if (!row.created_at || !isWithinRange(row.created_at, range)) continue;
    const key = row.created_at.slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + (valueFn ? valueFn(row) : 1));
  }
  return [...buckets.entries()].map(([date, current]) => ({ date, current }));
}

export function statusBreakdown(applications: FirstIdpApplication[], range: DateRange) {
  const counts = new Map<string, number>();
  for (const app of applications) {
    if (!isWithinRange(app.created_at, range)) continue;
    const key = app.status || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([status, count]) => ({ status, count }));
}
