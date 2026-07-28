import { CircleOff } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-500/30 bg-slate-900/30 p-8 text-center">
      <CircleOff className="mx-auto mb-3 size-8 text-slate-500" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}
