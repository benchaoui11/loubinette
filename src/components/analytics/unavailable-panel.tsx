export function UnavailablePanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-amber-300/20 bg-amber-300/8 p-4">
      <h3 className="text-sm font-semibold text-amber-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-amber-100/70">{body}</p>
    </section>
  );
}
