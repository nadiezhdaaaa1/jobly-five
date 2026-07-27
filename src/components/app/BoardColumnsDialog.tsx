import { useEffect, useMemo, useState } from "react";
import {
  IconArrowDown as ArrowDown,
  IconArrowUp as ArrowUp,
  IconChevronDown as ChevronDown,
  IconChevronRight as ChevronRight,
  IconPlus as Plus,
  IconTrash as Trash,
  IconX as X,
} from "@tabler/icons-react";
import {
  addInterviewColumn,
  addStage,
  canDeleteColumn,
  deleteColumn,
  deleteStage,
  KIND_LABEL,
  moveColumn,
  moveStage,
  renameColumn,
  renameStage,
  resetColumns,
  useColumns,
  type BoardColumn,
} from "@/lib/board-columns-store";

function StagesEditor({ col }: { col: BoardColumn }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newStage, setNewStage] = useState("");
  const canAdd = newStage.trim().length > 0;
  useEffect(() => {
    setDraft(Object.fromEntries(col.stages.map((s) => [s, s])));
  }, [col.id, col.stages]);
  return (
    <div className="mt-2 flex flex-col gap-1 rounded-[6px] p-2" style={{ background: "#F7F8F8" }}>
      <div className="text-[11px] font-light text-[color:var(--color-text-muted)]">Stages</div>
      {col.stages.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move stage up"
            disabled={i === 0}
            onClick={() => moveStage(col.id, s, -1)}
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-white disabled:opacity-30"
          >
            <ArrowUp size={12} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Move stage down"
            disabled={i === col.stages.length - 1}
            onClick={() => moveStage(col.id, s, 1)}
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-white disabled:opacity-30"
          >
            <ArrowDown size={12} strokeWidth={1.8} />
          </button>
          <input
            type="text"
            value={draft[s] ?? s}
            onChange={(e) => setDraft((d) => ({ ...d, [s]: e.target.value }))}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== s) renameStage(col.id, s, v);
              else setDraft((d) => ({ ...d, [s]: s }));
            }}
            className="h-8 flex-1 rounded-[4px] border bg-white px-2 text-[13px] outline-none focus-visible:border-[color:var(--color-accent)]"
            style={{ borderColor: "#E3E7E8" }}
          />
          <button
            type="button"
            aria-label="Delete stage"
            onClick={() => deleteStage(col.id, s)}
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-white"
          >
            <Trash size={14} strokeWidth={1.6} />
          </button>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-1">
        <input
          type="text"
          placeholder="Add stage (e.g. Panel)"
          value={newStage}
          onChange={(e) => setNewStage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canAdd) {
              addStage(col.id, newStage);
              setNewStage("");
            }
          }}
          className="h-8 flex-1 rounded-[4px] border bg-white px-2 text-[13px] outline-none focus-visible:border-[color:var(--color-accent)]"
          style={{ borderColor: "#E3E7E8" }}
        />
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            addStage(col.id, newStage);
            setNewStage("");
          }}
          className="inline-flex h-8 items-center gap-1 rounded-[4px] px-2 text-[12px] font-semibold text-[color:var(--color-on-accent)] disabled:opacity-40"
          style={{ background: "var(--color-accent)" }}
        >
          <Plus size={12} strokeWidth={2} />
          Add
        </button>
      </div>
    </div>
  );
}

export function BoardColumnsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const columns = useColumns();
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});
  const [newInterviewTitle, setNewInterviewTitle] = useState("");
  const [existingOpen, setExistingOpen] = useState(true);

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
          Add a new Interview column, or rename and reorder existing ones. Saved, Applied, Offer, and Rejected are single columns.
        </p>

        <div className="mt-4 rounded-[12px] p-4" style={{ background: "#E3E7E8" }}>
          <div className="text-[13px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Add a new Interview column
          </div>
          <p className="body-small mt-1 text-[color:var(--color-text-muted)]">
            Give it a clear name — e.g. "Second-round tech" or "Panel". You can edit stages afterwards.
          </p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              placeholder="Column title"
              value={newInterviewTitle}
              onChange={(e) => setNewInterviewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAddInterview) {
                  addInterviewColumn(newInterviewTitle);
                  setNewInterviewTitle("");
                }
              }}
              className="h-10 rounded-[4px] border bg-white px-3 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
              style={{ borderColor: "#D0D6D8" }}
            />
            <button
              type="button"
              disabled={!canAddInterview}
              onClick={() => {
                addInterviewColumn(newInterviewTitle);
                setNewInterviewTitle("");
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-[4px] px-4 text-[13px] font-semibold text-[color:var(--color-on-accent)] disabled:opacity-40"
              style={{ background: "var(--color-accent)" }}
            >
              <Plus size={14} strokeWidth={2} />
              Add column
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExistingOpen((v) => !v)}
          className="mt-4 flex items-center justify-between gap-2 rounded-[4px] py-2 text-left"
        >
          <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {existingOpen ? <ChevronDown size={16} strokeWidth={1.8} /> : <ChevronRight size={16} strokeWidth={1.8} />}
            Existing columns
            <span className="text-[12px] font-light text-[color:var(--color-text-muted)]">({columns.length})</span>
          </span>
        </button>

        {existingOpen ? (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-[12px] p-3" style={{ background: "#E3E7E8" }}>
          {columns.map((c, idx) => (
            <div key={c.id} className="rounded-[6px] border bg-white p-2" style={{ borderColor: "#E3E7E8" }}>
              <div className="flex items-center gap-2">
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
                <button
                  type="button"
                  aria-label="Delete column"
                  disabled={!canDeleteColumn(c.id)}
                  onClick={() => deleteColumn(c.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
                >
                  <Trash size={16} strokeWidth={1.6} />
                </button>
              </div>
              {(c.kind === "interview" || c.kind === "offer") ? <StagesEditor col={c} /> : null}
            </div>
          ))}
        </div>
        ) : null}

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