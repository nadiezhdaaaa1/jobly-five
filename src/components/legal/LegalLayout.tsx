import { Link } from "@tanstack/react-router";
import { Link as LinkIcon } from "lucide-react";
import type { LegalDoc, LegalBlock } from "../../lib/legal-data";
import { LEGAL_DOCS, LEGAL_ORDER, formatLegalDate, slugifyHeading } from "../../lib/legal-data";
import { TableOfContents, type TocItem } from "../blog/TableOfContents";

function buildToc(body: LegalBlock[]): TocItem[] {
  return body
    .filter((b): b is Extract<LegalBlock, { type: "h2" | "h3" }> => b.type === "h2" || b.type === "h3")
    .map((b) => ({ id: slugifyHeading(b.text), text: b.text, level: b.type === "h2" ? 2 : 3 }));
}

export function LegalLayout({ doc }: { doc: LegalDoc }) {
  const toc = buildToc(doc.body);
  const others = LEGAL_ORDER.filter((s) => s !== doc.slug).map((s) => LEGAL_DOCS[s]);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
      <header className="mb-10 max-w-[680px]">
        <h1 className="text-3xl md:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
          Last updated: {formatLegalDate(doc.lastUpdated)}
        </p>
        <p className="mt-4 text-[color:var(--color-text-secondary)]">{doc.intro}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)_220px]">
        <TableOfContents items={toc} />

        <article className="min-w-0">
          <div className="max-w-[680px]">
            {doc.body.map((b, i) => {
              if (b.type === "h2") {
                const id = slugifyHeading(b.text);
                return (
                  <h2 key={i} id={id} className="group mt-10 scroll-mt-24 text-2xl">
                    <a href={`#${id}`} className="inline-flex items-center gap-2 no-underline">
                      <span>{b.text}</span>
                      <LinkIcon
                        size={14}
                        className="opacity-0 transition-opacity group-hover:opacity-60"
                        aria-hidden
                      />
                    </a>
                  </h2>
                );
              }
              if (b.type === "h3") {
                const id = slugifyHeading(b.text);
                return (
                  <h3 key={i} id={id} className="mt-6 scroll-mt-24 text-lg">
                    {b.text}
                  </h3>
                );
              }
              if (b.type === "p") {
                return (
                  <p key={i} className="mt-4 leading-7 text-[color:var(--color-foreground)]">
                    {b.text}
                  </p>
                );
              }
              return (
                <ul key={i} className="mt-4 list-disc space-y-2 pl-6">
                  {b.items.map((it, j) => (
                    <li key={j} className="leading-7">
                      {it}
                    </li>
                  ))}
                </ul>
              );
            })}
          </div>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5">
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)]">Other policies</div>
            <ul className="mt-3 space-y-2 text-sm">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    to={`/legal/${o.slug}` as string}
                    className="text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
                  >
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}