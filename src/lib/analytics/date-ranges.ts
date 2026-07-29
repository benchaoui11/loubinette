export type DateRangePreset =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_month"
  | "previous_month";

export type DateRangeSelection =
  | { preset: DateRangePreset }
  | { preset: "custom"; from: string; to: string };

export type DateRange = {
  preset: DateRangePreset | "custom";
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  label: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfDay(date: Date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  d.setMilliseconds(d.getMilliseconds() - 1);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function parseDateOnly(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function withPrevious(preset: DateRangePreset | "custom", from: Date, to: Date, label: string): DateRange {
  const span = to.getTime() - from.getTime() + 1;
  return {
    preset,
    from,
    to,
    previousFrom: new Date(from.getTime() - span),
    previousTo: new Date(from.getTime() - 1),
    label,
  };
}

export function getDateRange(preset: DateRangePreset = "last_30_days", now = new Date()): DateRange {
  const today = startOfDay(now);

  if (preset === "today") return withPrevious(preset, today, endOfDay(today), "Today");

  if (preset === "this_month") {
    return withPrevious(preset, startOfMonth(now), endOfDay(now), "This month");
  }

  if (preset === "previous_month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const end = endOfMonth(start);
    return withPrevious(preset, start, end, "Previous month");
  }

  if (preset === "last_90_days") {
    const from = new Date(today.getTime() - 89 * DAY_MS);
    return withPrevious(preset, from, endOfDay(today), "Last 90 days");
  }

  const days = preset === "last_7_days" ? 7 : 30;
  const from = new Date(today.getTime() - (days - 1) * DAY_MS);
  return withPrevious(preset, from, endOfDay(today), days === 7 ? "Last 7 days" : "Last 30 days");
}

export function getCustomDateRange(fromValue: string | null | undefined, toValue: string | null | undefined, now = new Date()): DateRange {
  const fallback = getDateRange("last_30_days", now);
  const from = parseDateOnly(fromValue);
  const to = parseDateOnly(toValue);
  if (!from || !to) return fallback;

  const start = startOfDay(from <= to ? from : to);
  const end = endOfDay(from <= to ? to : from);
  return withPrevious("custom", start, end, `${dayKey(start)} to ${dayKey(end)}`);
}

export function getDateRangeFromSelection(selection?: DateRangeSelection | null, now = new Date()) {
  if (!selection) return getDateRange("last_30_days", now);
  if (selection.preset === "custom") return getCustomDateRange(selection.from, selection.to, now);
  return getDateRange(selection.preset, now);
}

export async function readSelectedDateRange(searchParams?: Promise<Record<string, string | string[] | undefined>>) {
  const params = searchParams ? await searchParams : {};
  const rawRange = valueOf(params.range);
  const from = valueOf(params.from);
  const to = valueOf(params.to);
  const presets: DateRangePreset[] = ["today", "last_7_days", "last_30_days", "last_90_days", "this_month", "previous_month"];

  if (rawRange === "custom") return getCustomDateRange(from, to);
  if (presets.includes(rawRange as DateRangePreset)) return getDateRange(rawRange as DateRangePreset);
  return getDateRange("last_30_days");
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function isWithinRange(iso: string | null | undefined, range: Pick<DateRange, "from" | "to">) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= range.from.getTime() && t <= range.to.getTime();
}

export function dayKey(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function enumerateDays(from: Date, to: Date) {
  const days: string[] = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end) {
    days.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
