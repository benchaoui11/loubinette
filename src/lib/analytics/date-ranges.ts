export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "previous_month"
  | "last_90_days"
  | "year_to_date";

export type DateRange = {
  preset: DateRangePreset;
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

function withPrevious(preset: DateRangePreset, from: Date, to: Date, label: string): DateRange {
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

  if (preset === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return withPrevious(preset, y, endOfDay(y), "Yesterday");
  }

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

  if (preset === "year_to_date") {
    return withPrevious(preset, new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), endOfDay(today), "Year to date");
  }

  const days = preset === "last_7_days" ? 7 : 30;
  const from = new Date(today.getTime() - (days - 1) * DAY_MS);
  return withPrevious(preset, from, endOfDay(today), days === 7 ? "Last 7 days" : "Last 30 days");
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
