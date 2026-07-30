import { useEffect, useMemo, useState } from "react";
import {
  IconArrowLeft as ArrowLeft,
  IconPlus as Plus,
  IconTrash as Trash,
  IconX as X,
} from "@tabler/icons-react";
import { IconTooltip } from "@/components/app/IconTooltip";
import {
  addStage,
  canDeleteColumn,
  deleteColumn,
  deleteStage,
  findColumn,
  KIND_LABEL,
  renameColumn,
  renameStage,
  useColumns,
} from "@/lib/board-columns-store";
import { countActiveInColumn, countActiveWithStage } from "@/lib/tracker-store";

export function SingleColumnDialog({
  columnId,
  open,
  onClose,
  onBack,
}: {
  columnId: string | null;
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
}) {
  // Subscribe to columns so rename/stage edits re-render live.
  useColumns();
  const col = columnId ? findColumn(columnId) : undefined;
  const [title, setTitle] = useState("");
  const [draftStages, setDraftStages] = useState<Record<string, string>>({});
  const [newStage, setNewStage] = useState("");

  useEffect(() => {
    if (!open || !col) return;
    setTitle(col.title);
    setDraftStages(Object.fromEntries(col.stages.map((s) => [s, s])));
    setNewStage("");
  }, [open, col?.id, col?.title, col?.stages]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const activeInColumn = useMemo(
    () => (col ? countActiveInColumn(col.id) : 0),
    [col, open, draftStages],
  );
  const canDelete = col ? canDeleteColumn(col.id) && activeInColumn === 0 : false;
  const deleteBlockedReason = !col
    ? ""
    : !canDeleteColumn(col.id)
    ? col.kind === "interview"
      ? "At least one Interview column must remain."
      : "This column is required and can't be deleted."
    : activeInColumn > 0
    ? `To delete, move the ${activeInColumn} active job${activeInColumn === 1 ? "" : "s"} out of this column first.`
    : "";

  if (!open || !col) return null;

  const canAddStage = newStage.trim().length > 0 && !col.stages.includes(newStage.trim());
  const hasStages = col.kind === "interview" || col.kind === "offer";

  function commitTitle() {
    if (!col) return;
    const v = title.trim();
    if (v && v !== col.title) renameColumn(col.id, v);
    else setTitle(col.title);
  }

  function tryDeleteStage(name: string) {
    if (!col) return;
    if (col.stages.length <= 1) return;
    if (countActiveWithStage(col.id, name) > 0) return;
    deleteStage(col.id, name);
  }

  function tryDeleteColumn() {
    if (!col || !canDelete) return;
    deleteColumn(col.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={onClose} aria-hidden />
      <div
        className="relative z-10 flex max-h-[90vh] w-[92%] max-w-[480px] flex-col rounded-[8px] border bg-white p-6"
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
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 mb-2 inline-flex h-7 w-fit items-center gap-1 rounded-[4px] px-2 text-[13px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
          >
            <ArrowLeft size={14} strokeWidth={1.8} />
            Back to all
          </button>
        ) : null}
        <h2 className="pr-6 text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Edit column
        </h2>
        <p className="body-small mt-1 text-[color:var(--color-text-muted)]">
          Type: {KIND_LABEL[col.kind]}
        </p>

        <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-light text-[color:var(--color-text-muted)]">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
              className="h-9 rounded-[4px] border bg-white px-2 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
              style={{ borderColor: "#E3E7E8" }}
            />
          </div>

          {hasStages ? (
            <div className="flex flex-col gap-1">
              <div className="text-[12px] font-light text-[color:var(--color-text-muted)]">Stages</div>
              {col.stages.map((s) => {
                const inUse = countActiveWithStage(col.id, s);
                const isLast = col.stages.length <= 1;
                const disabled = isLast || inUse > 0;
                const reason = isLast
                  ? "Keep at least one stage"
                  : inUse > 0
                  ? `In use by ${inUse} active job${inUse === 1 ? "" : "s"}`
                  : "Delete stage";
                return (
                  <div key={s} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={draftStages[s] ?? s}
                      onChange={(e) => setDraftStages((d) => ({ ...d, [s]: e.target.value }))}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== s) renameStage(col.id, s, v);
                        else setDraftStages((d) => ({ ...d, [s]: s }));
                      }}
                      className="h-8 flex-1 rounded-[4px] border bg-white px-2 text-[13px] outline-none focus-visible:border-[color:var(--color-accent)]"
                      style={{ borderColor: "#E3E7E8" }}
                    />
                    <IconTooltip label={reason}>
                      <button
                        type="button"
                        aria-label="Delete stage"
                        aria-disabled={disabled}
                        onClick={() => !disabled && tryDeleteStage(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent"
                      >
                        <Trash size={14} strokeWidth={1.6} />
                      </button>
                    </IconTooltip>
                  </div>
                );
              })}
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add stage (e.g. Panel)"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canAddStage) {
                      addStage(col.id, newStage);
                      setNewStage("");
                    }
                  }}
                  className="h-8 flex-1 rounded-[4px] border bg-white px-2 text-[13px] outline-none focus-visible:border-[color:var(--color-accent)]"
                  style={{ borderColor: "#E3E7E8" }}
                />
                <button
                  type="button"
                  disabled={!canAddStage}
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
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {canDelete ? (
              <button
                type="button"
                onClick={tryDeleteColumn}
                title="Delete column"
                className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border px-3 text-[13px]"
                style={{ borderColor: "#E3E7E8", color: "#D00D01" }}
              >
                <Trash size={14} strokeWidth={1.6} />
                Delete column
              </button>
            ) : deleteBlockedReason ? (
              <span className="text-[11px] font-light text-[color:var(--color-text-muted)]">
                {deleteBlockedReason}
              </span>
            ) : null}
          </div>
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