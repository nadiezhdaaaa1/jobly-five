import { useEffect, useMemo, useRef, useState } from "react";
import { IconX as X, IconArrowUpRight as ExternalLink, IconPencil as Pencil } from "@tabler/icons-react";
import type { Job } from "@/lib/jobs-data";
import type { JobRecord } from "@/lib/tracker-store";
import { setNotes, setOfferDetails } from "@/lib/tracker-store";

const BORDER_LIGHT = "#E3E7E8";
const META_GREY = "#67787C";

export type OfferEntry = { job: Job; rec: JobRecord };

// Best-effort parse of the top of a salary range ("$120k – $150k", "$95,000/yr").
function salaryValue(salary?: string): number | null {
  if (!salary) return null;
  const matches = salary.match(/\d[\d,.]*\s*k?/gi);
  if (!matches?.length) return null;
  const nums = matches
    .map((m) => {
      const isK = /k$/i.test(m.trim());
      const n = Number(m.replace(/[^\d.]/g, ""));
      if (!Number.isFinite(n) || n === 0) return null;
      return isK ? n * 1000 : n;
    })
    .filter((n): n is number => n !== null);
  if (!nums.length) return null;
  return Math.max(...nums);
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Row = {
  label: string;
  value: (e: OfferEntry) => string;
  multiline?: boolean;
  save?: (id: string, next: string) => void;
  placeholder?: string;
};

const ROWS: Row[] = [
  { label: "Moved to offer", value: (e) => fmtDate(e.rec.offerAt ?? e.rec.movedAt) },
  {
    label: "Offer details",
    value: (e) => e.rec.offerDetails ?? "",
    multiline: true,
    save: setOfferDetails,
    placeholder: "Paste the offer letter or key terms…",
  },
  {
    label: "Notes",
    value: (e) => e.rec.notes ?? "",
    multiline: true,
    save: setNotes,
    placeholder: "Your notes about this offer…",
  },
];

// Editable multiline cell: click to edit, Save / Cancel, Esc cancels.
function EditableCell({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div>
        <textarea
          autoFocus
          value={draft}
          placeholder={placeholder}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Escape") {
              ev.stopPropagation();
              setEditing(false);
              setDraft(value);
            }
          }}
          rows={8}
          className="w-full resize-y rounded-[4px] border px-2 py-1.5 text-[14px] outline-none focus:border-[color:var(--color-foreground)]"
          style={{ borderColor: BORDER_LIGHT }}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            className="h-8 rounded-[4px] bg-[color:var(--color-foreground)] px-3 text-[13px] font-medium text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="h-8 rounded-[4px] border px-3 text-[13px]"
            style={{ borderColor: BORDER_LIGHT, color: META_GREY }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      {value ? (
        <span className="block whitespace-pre-wrap">{value}</span>
      ) : (
        <span style={{ color: "#A6B2B5" }}>—</span>
      )}
      <button
        type="button"
        aria-label="Edit"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-[4px] bg-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-[color:var(--color-surface-2)]"
        style={{ color: META_GREY }}
      >
        <Pencil size={14} strokeWidth={1.6} />
      </button>
    </div>
  );
}

export function CompareOffersDialog({
  open,
  offers,
  onClose,
  onOpenJob,
}: {
  open: boolean;
  offers: OfferEntry[];
  onClose: () => void;
  onOpenJob?: (job: Job) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const bestSalaryId = useMemo(() => {
    let best: { id: string; v: number } | null = null;
    for (const e of offers) {
      const v = salaryValue(e.job.salary);
      if (v === null) continue;
      if (!best || v > best.v) best = { id: e.job.id, v };
    }
    // Only meaningful when more than one offer has a parseable salary.
    const parseable = offers.filter((e) => salaryValue(e.job.salary) !== null).length;
    return parseable > 1 ? best?.id ?? null : null;
  }, [offers]);

  const rows = useMemo(() => {
    if (!onlyDifferences) return ROWS;
    return ROWS.filter((r) => {
      const vals = offers.map((e) => r.value(e).trim());
      return new Set(vals).size > 1;
    });
  }, [onlyDifferences, offers]);

  if (!open) return null;

  const colWidth = 300;
  const labelWidth = 120;
  const naturalWidth = labelWidth + offers.length * colWidth + 2;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Compare offers">
      <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={onClose} aria-hidden />
      <div
        className="relative z-10 flex max-h-[90vh] flex-col overflow-hidden rounded-[8px] border bg-white"
        style={{
          borderColor: BORDER_LIGHT,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          width: `min(${naturalWidth}px, calc(100vw - 48px))`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4" style={{ borderColor: BORDER_LIGHT }}>
          <div>
            <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Compare offers
            </h2>
            <p className="body-small mt-1" style={{ color: META_GREY }}>
              {offers.length} offers side by side. Scroll horizontally to see them all.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyDifferences((v) => !v)}
              aria-pressed={onlyDifferences}
              className="hidden h-8 items-center rounded-[4px] border px-2.5 text-[13px] hover:bg-[color:var(--color-surface-2)] sm:inline-flex"
              style={{
                borderColor: BORDER_LIGHT,
                color: onlyDifferences ? "var(--color-foreground)" : META_GREY,
                background: onlyDifferences ? "var(--color-surface-2)" : "transparent",
              }}
            >
              Only differences
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <X size={16} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        {/* Matrix */}
        <div ref={scrollRef} className="flex-1 overflow-auto rounded-b-[8px]">
          <table className="w-max border-separate" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                <th
                  className="sticky left-0 top-0 z-30 border-b border-r bg-white px-4 py-3 text-left align-bottom text-[12px] font-light"
                  style={{ width: labelWidth, minWidth: labelWidth, borderColor: BORDER_LIGHT, color: META_GREY }}
                  scope="col"
                >
                  Offer
                </th>
                {offers.map((e) => (
                  <th
                    key={e.job.id}
                    scope="col"
                    className="sticky top-0 z-20 border-b border-r bg-white px-4 py-3 text-left align-top"
                    style={{ width: colWidth, minWidth: colWidth, borderColor: BORDER_LIGHT }}
                  >
                    <div className="flex items-start gap-2">
                      {e.job.logo ? (
                        <img src={e.job.logo} alt="" className="h-7 w-7 shrink-0 rounded-[4px] object-cover" />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[12px] font-semibold text-white" aria-hidden>
                          {e.job.company.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium" title={e.job.title}>
                          {e.job.title}
                        </div>
                        <div className="truncate text-[13px] font-light" style={{ color: META_GREY }} title={e.job.company}>
                          {e.job.company}
                        </div>
                      </div>
                    </div>
                    {onOpenJob ? (
                      <button
                        type="button"
                        onClick={() => onOpenJob(e.job)}
                        className="mt-2 inline-flex h-7 items-center gap-1 rounded-[4px] px-1.5 text-[13px] font-normal hover:bg-[color:var(--color-surface-2)]"
                        style={{ color: META_GREY }}
                      >
                        Open job
                        <ExternalLink size={13} strokeWidth={1.8} />
                      </button>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-r bg-white px-4 py-3 text-left align-top text-[13px] font-light"
                    style={{ width: labelWidth, minWidth: labelWidth, borderColor: BORDER_LIGHT, color: META_GREY }}
                  >
                    {r.label}
                  </th>
                  {offers.map((e) => {
                    const v = r.value(e).trim();
                    const isBestSalary = r.label === "Salary" && bestSalaryId === e.job.id && v !== "";
                    return (
                      <td
                        key={e.job.id}
                        className="border-b border-r px-4 py-3 align-top text-[14px]"
                        style={{ width: colWidth, minWidth: colWidth, borderColor: BORDER_LIGHT }}
                      >
                        {r.save ? (
                          <EditableCell
                            key={`${e.job.id}:${v}`}
                            value={v}
                            placeholder={r.placeholder}
                            onSave={(next) => r.save!(e.job.id, next)}
                          />
                        ) : v ? (
                          <span className={r.multiline ? "block whitespace-pre-wrap" : "block"}>
                            {v}
                            {isBestSalary ? (
                              <span
                                className="ml-2 inline-block rounded-[4px] px-1.5 py-0.5 align-middle text-[11px]"
                                style={{ background: "#D8FBEF", color: "#0B3B2E" }}
                              >
                                Highest
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span style={{ color: "#A6B2B5" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[14px]" style={{ color: META_GREY }} colSpan={offers.length + 1}>
                    These offers match on every field.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}