import { dateHelpers, type HistoryEntry } from "@/lib/tracker-store";

export function JobHistory({ history }: { history?: HistoryEntry[] }) {
  const entries = history ?? [];
  return (
    <div>
      <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">History</div>
      {entries.length === 0 ? (
        <div className="mt-2 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
          No activity yet
        </div>
      ) : (
        <ul className="mt-2 divide-y" style={{ borderColor: "var(--color-border)" }}>
          {entries.map((e) => (
            <li key={e.id} className="flex flex-col py-2">
              <span
                className="text-[12px] text-[color:var(--color-text-muted)]"
                style={{ fontWeight: 300 }}
              >
                {dateHelpers.shortDateTimeAmpm(e.at)}
              </span>
              <span
                className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]"
                style={{ fontWeight: 300 }}
              >
                {e.description}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}