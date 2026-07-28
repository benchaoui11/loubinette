import { UnavailablePanel } from "@/components/analytics/unavailable-panel";

export function UnavailablePage({ title, eyebrow, body }: { title: string; eyebrow: string; body: string }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
      </div>
      <UnavailablePanel title="Prepared architecture, not enabled yet" body={body} />
    </div>
  );
}
