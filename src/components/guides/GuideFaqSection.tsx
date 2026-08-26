import type { GuideFaq } from "../../lib/guides-data";

export function GuideFaqSection({ items }: { items: GuideFaq[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-[680px] px-5 pb-4 md:px-0">
      <h2 className="text-2xl">Frequently asked questions</h2>
      <div className="mt-6 space-y-3">
        {items.map((f) => (
          <details
            key={f.question}
            className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5"
          >
            <summary className="cursor-pointer text-base font-semibold">{f.question}</summary>
            <p className="mt-3 leading-7 text-[color:var(--color-text-secondary)]">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
