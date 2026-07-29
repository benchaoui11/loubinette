export function UnavailablePanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="notice-panel rounded-xl border p-4">
      <h3 className="text-sm font-semibold text-amber-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-amber-100/70">{body}</p>
    </section>
  );
}
