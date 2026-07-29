import { Info } from "lucide-react";

export function KpiCard({ label, value, eyebrow, tone = "blue", tooltip }: { label: string; value: string; eyebrow?: string; tone?: "blue" | "green" | "amber" | "rose" | "slate"; tooltip: string }) {
  return (
    <section className="kpi-card rounded-xl p-4" data-tone={tone}>
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
