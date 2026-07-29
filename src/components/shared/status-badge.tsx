export function StatusBadge({ status }: { status?: string | null }) {
  const key = status || "unknown";
  const label = key.replaceAll("_", " ");
  return (
    <span className="status-badge inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize" data-status={key}>
      {label}
    </span>
  );
}
