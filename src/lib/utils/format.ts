export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "L") + (parts[1]?.[0] ?? "");
}

export function maskEmail(email?: string | null) {
  if (!email) return "No email";
  const [user, domain] = email.split("@");
  if (!domain || user.length < 3) return email;
  return `${user.slice(0, 2)}***@${domain}`;
}

export function fullName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ").trim() || "Unknown applicant";
}
