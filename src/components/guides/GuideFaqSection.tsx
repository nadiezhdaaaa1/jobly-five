import { IconChevronDown as ChevronDown } from "@tabler/icons-react";

export function GuideFaqSection({ items }: { items: { question: string; answer: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-[680px] px-5 pb-4 md:px-0">
      <h2 className="text-2xl">Frequently asked questions</h2>
      <div className="mt-6 space-y-3">
        {items.map((f) => (
          <details
            key={f.question}
            className="group overflow-hidden rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base [&::-webkit-details-marker]:hidden">
              <span>{f.question}</span>
              <ChevronDown
                size={18}
                className="shrink-0 text-[color:var(--color-text-muted)] transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="border-t border-[color:var(--color-border)] px-5 py-4 text-sm text-[color:var(--color-text-secondary)]">
              {f.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
