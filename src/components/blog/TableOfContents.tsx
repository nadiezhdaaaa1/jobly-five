import { useEffect, useState } from "react";

export type TocItem = { id: string; text: string; level: 2 | 3 };

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    const nodes = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const list = (
    <ul className="space-y-1.5 text-sm">
      {items.map((it) => (
        <li key={it.id} className={it.level === 3 ? "pl-3" : ""}>
          <a
            href={`#${it.id}`}
            className={
              "block px-2 py-1 transition-colors " +
              (active === it.id
                ? "rounded-sm bg-[color:var(--color-surface-2)] text-[color:var(--color-foreground)]"
                : "rounded-md text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]")
            }
          >
            {it.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <details className="mb-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold">On this page</summary>
        <nav aria-label="On this page" className="mt-3">
          {list}
        </nav>
      </details>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <nav aria-label="On this page">
          <div className="mb-3 text-xs uppercase tracking-wide text-[color:var(--color-text-muted)]">On this page</div>
          {list}
        </nav>
      </aside>
    </>
  );
}