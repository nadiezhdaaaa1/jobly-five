import { useEffect, useMemo, useState } from "react";
import {
  IconArrowDown as ArrowDown,
  IconArrowUp as ArrowUp,
  IconGripVertical as Grip,
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
  reorderColumns,
  resetColumns,
  useColumns,
} from "@/lib/board-columns-store";
import { countActiveInColumn } from "@/lib/tracker-store";

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
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

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

  function handleDrop(targetId: string) {
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const ids = columns.map((c) => c.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, sourceId);
    reorderColumns(ids);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={onClose} aria-hidden />
      <div
        className="relative z-10 flex max-h-[90vh] w-[92%] max-w-[560px] flex-col rounded-[8px] border bg-white p-6"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
      >
        <div className="absolute right-3 top-3">
          <IconTooltip label="Close">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <X size={16} strokeWidth={1.6} />
            </button>
          </IconTooltip>
        </div>
        <h2 className="pr-6 text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Edit columns
        </h2>
        <p className="body-small mt-1 text-[color:var(--color-text-muted)]">
          Add a new column, or rename and reorder existing ones
        </p>

        <div className="mt-4 flex items-center gap-2">
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

        <div
          className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto rounded-[12px] border p-1"
          style={{ background: "#F1F3F3", borderColor: "#F1F3F3" }}
        >
          {columns.map((c, idx) => {
            const activeInColumn = countActiveInColumn(c.id);
            const deleteAllowed = canDeleteColumn(c.id) && activeInColumn === 0;
            const deleteLabel = !canDeleteColumn(c.id)
              ? c.kind === "interview"
                ? "At least one Interview column must remain."
                : "This column is required and can't be deleted."
              : activeInColumn > 0
              ? `To delete, move the ${activeInColumn} active job${activeInColumn === 1 ? "" : "s"} out of this column first.`
              : "Delete column";
            return (
            <div
              key={c.id}
              draggable
              onDragStart={(e) => {
                setDragId(c.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId && overId !== c.id) setOverId(c.id);
              }}
              onDragLeave={() => setOverId((v) => (v === c.id ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(c.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className="rounded-[8px] border p-2"
              style={{
                background: "rgba(255,255,255,0.9)",
                borderColor: overId === c.id && dragId && dragId !== c.id ? "var(--color-accent)" : "#FFFFFF",
                opacity: dragId === c.id ? 0.5 : 1,
                boxShadow: "0 1px 4px 0 rgba(12,12,13,0.05)",
              }}
            >
              <div className="flex items-center gap-2">
                <IconTooltip label="Drag to reorder">
                  <span
                    aria-label="Drag to reorder"
                    className="flex h-6 w-5 cursor-grab items-center justify-center text-[color:var(--color-text-muted)] active:cursor-grabbing"
                  >
                    <Grip size={16} strokeWidth={1.6} />
                  </span>
                </IconTooltip>
                <div className="flex flex-row items-center gap-0.5">
                  <IconTooltip label={idx === 0 ? "Already first" : "Move up"}>
                    <button
                      type="button"
                      aria-label="Move up"
                      aria-disabled={idx === 0}
                      onClick={() => idx !== 0 && moveColumn(c.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent"
                    >
                      <ArrowUp size={14} strokeWidth={1.8} />
                    </button>
                  </IconTooltip>
                  <IconTooltip label={idx === columns.length - 1 ? "Already last" : "Move down"}>
                    <button
                      type="button"
                      aria-label="Move down"
                      aria-disabled={idx === columns.length - 1}
                      onClick={() => idx !== columns.length - 1 && moveColumn(c.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent"
                    >
                      <ArrowDown size={14} strokeWidth={1.8} />
                    </button>
                  </IconTooltip>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <IconTooltip label="Rename column">
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
                  </IconTooltip>
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
                <IconTooltip label={deleteLabel}>
                  <button
                    type="button"
                    aria-label="Delete column"
                    aria-disabled={!deleteAllowed}
                    onClick={() => deleteAllowed && deleteColumn(c.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent"
                  >
                    <Trash size={16} strokeWidth={1.6} />
                  </button>
                </IconTooltip>
              </div>
            </div>
            );
          })}
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