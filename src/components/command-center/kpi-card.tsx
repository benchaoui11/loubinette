import { Info } from "lucide-react";

export function KpiCard({ label, value, eyebrow, tone = "blue", tooltip }: { label: string; value: string; eyebrow?: string; tone?: "blue" | "green" | "amber" | "rose" | "slate"; tooltip: string }) {
  const toneClass = {
    blue: "from-blue-300/16 to-blue-400/5 text-blue-100",
    green: "from-emerald-300/16 to-emerald-400/5 text-emerald-100",
    amber: "from-amber-300/16 to-amber-400/5 text-amber-100",
    rose: "from-rose-300/16 to-rose-400/5 text-rose-100",
    slate: "from-slate-300/12 to-slate-400/5 text-slate-100",
  }[tone];

  return (
    <section className={`rounded-xl border border-slate-500/18 bg-gradient-to-br ${toneClass} p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{eyebrow ?? "Metric"}</p>
        <span title={tooltip} className="text-slate-500">
          <Info className="size-3.5" />
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </section>
  );
}
