const STATUS_STYLES: Record<string, string> = {
  submitted: "border-blue-400/25 bg-blue-400/10 text-blue-100",
  under_review: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  documents_accepted: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  paid: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  processing: "border-violet-300/30 bg-violet-300/10 text-violet-100",
  delivered: "border-green-300/30 bg-green-300/10 text-green-100",
  rejected: "border-rose-300/30 bg-rose-300/10 text-rose-100",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const key = status || "unknown";
  const label = key.replaceAll("_", " ");
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[key] ?? "border-slate-400/20 bg-slate-400/10 text-slate-200"}`}>
      {label}
    </span>
  );
}
