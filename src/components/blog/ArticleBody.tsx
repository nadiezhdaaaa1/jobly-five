import type { ContentBlock } from "../../lib/blog-data";
import { slugifyHeading } from "../../lib/blog-data";

export function ArticleBody({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="mx-auto max-w-[680px]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2": {
            const id = slugifyHeading(b.text);
            return (
              <h2 key={i} id={id} className="group mt-10 scroll-mt-24 text-2xl">
                <a href={`#${id}`} className="no-underline">
                  {b.text}
                </a>
              </h2>
            );
          }
          case "h3": {
            const id = slugifyHeading(b.text);
            return (
              <h3 key={i} id={id} className="mt-8 scroll-mt-24 text-lg">
                {b.text}
              </h3>
            );
          }
          case "p":
            return (
              <p key={i} className="mt-4 leading-7 text-[color:var(--color-foreground)]">
                {b.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-6 text-[color:var(--color-foreground)]">
                {b.items.map((it, j) => (
                  <li key={j} className="leading-7">
                    {it}
                  </li>
                ))}
              </ul>
            );
          case "image":
            return (
              <figure key={i} className="mt-8">
                <div className="overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
                  <img src={b.src} alt={b.alt} className="h-auto w-full" loading="lazy" />
                </div>
                {b.caption && (
                  <figcaption className="mt-2 text-center text-sm text-[color:var(--color-text-muted)]">
                    {b.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="mt-8 border-l-4 border-[color:var(--color-accent)] pl-4 italic text-[color:var(--color-text-secondary)]"
              >
                <p className="leading-7">"{b.text}"</p>
                {b.cite && <cite className="mt-2 block text-sm not-italic text-[color:var(--color-text-muted)]">— {b.cite}</cite>}
              </blockquote>
            );
          case "table":
            return (
              <div key={i} className="mt-8 overflow-x-auto rounded-lg border border-[color:var(--color-border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[color:var(--color-surface-2)]">
                    <tr>
                      {b.headers.map((h, j) => (
                        <th key={j} className="px-4 py-2 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-[color:var(--color-border)]">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "callout":
            return (
              <aside
                key={i}
                className="mt-8 rounded-lg bg-[color:var(--color-mint)] p-5 text-[color:var(--color-green)]"
              >
                {b.title && <div className="text-sm font-semibold">{b.title}</div>}
                <p className="mt-1 leading-7">{b.text}</p>
              </aside>
            );
        }
      })}
    </div>
  );
}