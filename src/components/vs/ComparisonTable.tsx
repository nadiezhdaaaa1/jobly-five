import type { VsComparisonRow } from "../../lib/vs-data";

/**
 * Semantic comparison table — a real <table> so it can be parsed, quoted and
 * lifted out of context by search engines and answer engines.
 * Renders nothing until the `comparison` array has rows.
 */
export function ComparisonTable({
  rows,
  competitorName,
}: {
  rows: VsComparisonRow[];
  competitorName: string;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mx-auto max-w-[820px] px-5 md:px-0">
      <h2 className="text-2xl">Jobly vs {competitorName} at a glance</h2>
      <div className="mt-6 overflow-x-auto rounded-lg border border-[color:var(--color-border)]">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Feature-by-feature comparison of Jobly and {competitorName}
          </caption>
          <thead className="bg-[color:var(--color-surface-1)]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Feature
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Jobly
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {competitorName}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.feature} className="border-t border-[color:var(--color-border)]">
                <th scope="row" className="px-4 py-3 align-top font-medium">
                  {r.feature}
                </th>
                <td className="px-4 py-3 align-top text-[color:var(--color-text-secondary)]">{r.jobly}</td>
                <td className="px-4 py-3 align-top text-[color:var(--color-text-secondary)]">{r.competitor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
