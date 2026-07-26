import { useEffect, useMemo, useState } from "react";
import {
  IconArrowDown as ArrowDown,
  IconArrowUp as ArrowUp,
  IconPlus as Plus,
  IconTrash as Trash,
  IconX as X,
} from "@tabler/icons-react";
import {
  addColumn,
  deleteColumn,
  isBuiltin,
  moveColumn,
  renameColumn,
  resetColumns,
  STAGE_LABEL,
  useColumns,
  type BoardStage,
} from "@/lib/board-columns-store";

const STAGES: BoardStage[] = [
  "saved",
  "applied",
  "interview_screen",
  "interview_tech",
  "test_task",
  "offer",
  "rejection",
];

export function BoardColumnsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const columns = useColumns();
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});
  const [newTitle, setNewTitle] = useState("");
  const [newStage, setNewStage] = useState<BoardStage>("interview_screen");

  useEffect(() => {
    if (!open) return;
    setDraftTitles(Object.fromEntries(columns.map((c) => [c.id, c.title])));
    setNewTitle("");
  }, [open, columns]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canAdd = useMemo(() => newTitle.trim().length > 0, [newTitle]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={onClose} aria-hidden />
      <div
        className="relative z-10 w-[92%] max-w-[520px] rounded-[8px] border bg-white p-6"
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
        <p className="mt-1 text-[12px] font-light text-[color:var(--color-text-muted)]">
          Rename, reorder, add, or remove columns. Built-in columns can be renamed and reordered but not deleted.
        </p>

        <div className="mt-4 flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
          {columns.map((c, idx) => (
            <div key={c.id} className="flex items-center gap-2 rounded-[6px] border p-2" style={{ borderColor: "#E3E7E8" }}>
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={idx === 0}
                  onClick={() => moveColumn(c.id, -1)}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
                >
                  <ArrowUp size={14} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={idx === columns.length - 1}
                  onClick={() => moveColumn(c.id, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
                >
                  <ArrowDown size={14} strokeWidth={1.8} />
                </button>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
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
                <span className="text-[11px] font-light text-[color:var(--color-text-muted)]">Stage: {STAGE_LABEL[c.stage]}</span>
              </div>
              <button
                type="button"
                aria-label="Delete column"
                disabled={isBuiltin(c.id)}
                onClick={() => deleteColumn(c.id)}
                className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
              >
                <Trash size={16} strokeWidth={1.6} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[6px] border p-3" style={{ borderColor: "#E3E7E8" }}>
          <div className="text-[13px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>Add a column</div>
          <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2">
            <input
              type="text"
              placeholder="Column title (e.g. Second-round tech)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-9 rounded-[4px] border bg-white px-2 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
              style={{ borderColor: "#E3E7E8" }}
            />
            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value as BoardStage)}
              className="h-9 rounded-[4px] border bg-white px-2 pr-7 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
              style={{ borderColor: "#E3E7E8" }}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABEL[s]}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => {
                addColumn({ title: newTitle, stage: newStage });
                setNewTitle("");
              }}
              className="inline-flex h-9 items-center gap-1 rounded-[4px] px-3 text-[13px] font-semibold text-[color:var(--color-on-accent)] disabled:opacity-40"
              style={{ background: "var(--color-accent)" }}
            >
              <Plus size={14} strokeWidth={2} />
              Add
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