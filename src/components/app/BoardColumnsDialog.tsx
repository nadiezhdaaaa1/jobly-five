import { useEffect, useMemo, useState } from "react";
import {
  IconArrowDown as ArrowDown,
  IconArrowUp as ArrowUp,
  IconListDetails as ListDetails,
  IconPlus as Plus,
  IconTrash as Trash,
  IconX as X,
} from "@tabler/icons-react";
import { IconTooltip } from "@/components/app/IconTooltip";
import {
  addInterviewColumn,
  canDeleteColumn,
  deleteColumn,
  moveColumn,
  renameColumn,
  resetColumns,
  useColumns,
} from "@/lib/board-columns-store";

export function BoardColumnsDialog({
  open,
  onClose,
  onEditStages,
}: {
  open: boolean;
  onClose: () => void;
  onEditStages?: (columnId: string) => void;
}) {
  const columns = useColumns();
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});
  const [newInterviewTitle, setNewInterviewTitle] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraftTitles(Object.fromEntries(columns.map((c) => [c.id, c.title])));
    setNewInterviewTitle("");
  }, [open, columns]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canAddInterview = useMemo(() => newInterviewTitle.trim().length > 0, [newInterviewTitle]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={onClose} aria-hidden />
      <div
        className="relative z-10 flex max-h-[90vh] w-[92%] max-w-[560px] flex-col rounded-[8px] border bg-white p-6"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          <X size={16} strokeWidth={1.6} />
        </button>
        <h2 className="pr-6 text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Edit columns
        </h2>
        <p className="body-small mt-1 text-[color:var(--color-text-muted)]">
          Add a new column, or rename and reorder existing ones. Saved, Applied, Offer, and Rejected are single columns.
        </p>

        <div className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto rounded-[12px] p-1" style={{ background: "#F1F3F3" }}>
          {columns.map((c, idx) => (
            <div
              key={c.id}
              className="rounded-[8px] border p-2"
              style={{
                background: "rgba(255,255,255,0.9)",
                borderColor: "#FFFFFF",
                boxShadow: "0 1px 4px 0 rgba(12,12,13,0.05)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-row items-center gap-0.5">
                  <IconTooltip label="Move up">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={idx === 0}
                      onClick={() => moveColumn(c.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
                    >
                      <ArrowUp size={14} strokeWidth={1.8} />
                    </button>
                  </IconTooltip>
                  <IconTooltip label="Move down">
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={idx === columns.length - 1}
                      onClick={() => moveColumn(c.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
                    >
                      <ArrowDown size={14} strokeWidth={1.8} />
                    </button>
                  </IconTooltip>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <input
                    type="text"
                    value={draftTitles[c.id] ?? c.title}
                    onChange={(e) => setDraftTitles((s) => ({ ...s, [c.id]: e.target.value }))}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== c.title) renameColumn(c.id, v);
                      else setDraftTitles((s) => ({ ...s, [c.id]: c.title }));
                    }}
                    className="h-9 rounded-[4px] border bg-white px-2 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
                    style={{ borderColor: "#E3E7E8" }}
                  />
                </div>
                {(c.kind === "interview" || c.kind === "offer") && onEditStages ? (
                  <IconTooltip label="Edit stages">
                    <button
                      type="button"
                      aria-label="Edit stages"
                      onClick={() => {
                        onClose();
                        onEditStages(c.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
                    >
                      <ListDetails size={16} strokeWidth={1.6} />
                    </button>
                  </IconTooltip>
                ) : null}
                <IconTooltip label={canDeleteColumn(c.id) ? "Delete column" : "This column can't be deleted"}>
                  <button
                    type="button"
                    aria-label="Delete column"
                    disabled={!canDeleteColumn(c.id)}
                    onClick={() => deleteColumn(c.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
                  >
                    <Trash size={16} strokeWidth={1.6} />
                  </button>
                </IconTooltip>
              </div>
            </div>
          ))}

          <div
            className="flex items-center gap-2 rounded-[8px] border p-2"
            style={{
              background: "rgba(255,255,255,0.9)",
              borderColor: "#FFFFFF",
              boxShadow: "0 1px 4px 0 rgba(12,12,13,0.05)",
            }}
          >
            <input
              type="text"
              placeholder="New column name"
              value={newInterviewTitle}
              onChange={(e) => setNewInterviewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAddInterview) {
                  addInterviewColumn(newInterviewTitle);
                  setNewInterviewTitle("");
                }
              }}
              className="h-9 min-w-0 flex-1 rounded-[4px] border bg-white px-2 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
              style={{ borderColor: "#E3E7E8" }}
            />
            <button
              type="button"
              disabled={!canAddInterview}
              onClick={() => {
                addInterviewColumn(newInterviewTitle);
                setNewInterviewTitle("");
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] px-3 text-[13px] font-semibold text-[color:var(--color-on-accent)] disabled:opacity-40"
              style={{ background: "var(--color-accent)" }}
            >
              <Plus size={14} strokeWidth={2} />
              Add column
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => resetColumns()}
            className="h-9 rounded-[4px] px-3 text-[13px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
          >
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}