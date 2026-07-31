import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconBookmark as Bookmark,
  IconChevronDown as ChevronDown,
  IconArrowUpRight as ExternalLink,
  IconFlag as Flag,
  IconMailShare as MailShare,
  IconLayoutColumns as LayoutColumns,
  IconThumbDown as ThumbsDown,
  IconX as X,
  IconBan as Cancel,
  IconBolt as Zap,
  IconPencil as Pencil,
  IconColumns as Columns,
} from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { JobDrawer } from "@/components/app/JobDrawer";
import { IconTooltip } from "@/components/app/IconTooltip";
import proCube from "@/assets/pro-cube.png.asset.json";
import { FollowUpDialog, ApplyModal } from "@/components/app/ApplyModal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  InterviewTransitionDialog,
  OfferTransitionDialog,
  RejectedTransitionDialog,
} from "@/components/app/TrackerTransitionDialogs";
import { BoardColumnsDialog } from "@/components/app/BoardColumnsDialog";
import { SingleColumnDialog } from "@/components/app/SingleColumnDialog";
import { CompareOffersDialog } from "@/components/app/CompareOffersDialog";
import { useJobs } from "@/lib/jobs-store";
import type { Job } from "@/lib/jobs-data";
import {
  archiveJob,
  archiveJobWithReason,
  dateHelpers,
  getJobRecord,
  markApplied,
  restoreArchived,
  setInterviewStage,
  setOfferStatus,
  setRejectionDetails,
  setOfferDetails,
  setReminder as storeSetReminder,
  setStatus,
  setCardColumn,
  useJobRecord,
  getTrackerEntries,
  useTrackerHydrated,
  type JobRecord,
  type JobStatus,
} from "@/lib/tracker-store";
import { resolveColumnForCard, useColumns, statusForKind, type BoardColumn, type ColumnKind } from "@/lib/board-columns-store";
import { usePlan, isPro } from "@/lib/plan-store";
import { blockCompany } from "@/lib/blocked-companies-store";

export const Route = createFileRoute("/_authenticated/tracker")({
  head: () => ({
    meta: [
      { title: "Tracker — Jobly" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TrackerScreen,
});

// Screen-wide subscription: re-render on any store change.
function useTrackerVersion() {
  useJobRecord("__version__");
}

// (Column kinds live on each BoardColumn now.)

const CHIP_ORANGE = "#FFEDD4";
const CHIP_MINT = "#D8FBEF";
const BORDER_LIGHT = "#E3E7E8";
const META_GREY = "#67787C";
const DARK = "#090B0C";
const MUTED_TEXT = "#4B585B";

function CompanyLogo({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={`${name} logo`}
        className="h-7 w-7 shrink-0 rounded-[4px] object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[12px] font-semibold text-white"
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      // Menus render in a portal (outside `ref`), so treat them as "inside".
      if (target?.closest("[data-menu-pop]")) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

function IconBtn({
  label,
  onClick,
  active,
  danger,
  noBorder,
  children,
}: {
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  danger?: boolean;
  noBorder?: boolean;
  children: React.ReactNode;
}) {
  const base = `flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[4px] ${noBorder && !active ? "" : "border"} p-[7px] transition-colors`;
  const cls = active
    ? `${base}`
    : `${base} bg-white hover:bg-[color:var(--color-surface-2)]`;
  const style: React.CSSProperties = active
    ? { background: "#D8FBEF", borderColor: "#0E735A", color: "#0E735A" }
    : { borderColor: noBorder ? "transparent" : BORDER_LIGHT, color: danger ? "#D00D01" : MUTED_TEXT };
  return (
    <IconTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        className={cls}
        style={style}
      >
        {children}
      </button>
    </IconTooltip>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
      style={{ background: checked ? "#0E735A" : "#E3E7E8" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: `translateX(${checked ? 18 : 2}px)` }}
      />
    </button>
  );
}

// ---------- Card ----------

function KanbanCard({
  job,
  onOpen,
  onDragStart,
  onDragEnd,
  onArchive,
  onRequestApply,
  onMoveTo,
  onMailShareToast,
  archivedView,
  column,
  moveColumns,
}: {
  job: Job;
  onOpen: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onArchive: (reason?: string) => void;
  onRequestApply: () => void;
  onMoveTo: (target: BoardColumn) => void;
  onMailShareToast?: () => void;
  archivedView: boolean;
  column: BoardColumn;
  moveColumns: BoardColumn[];
}) {
  const record = useJobRecord(job.id);
  const kind: ColumnKind = column.kind;
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const flagRef = useOutsideClose(flagOpen, () => setFlagOpen(false));
  const moveRef = useOutsideClose(moveOpen, () => setMoveOpen(false));
  const [isDragging, setIsDragging] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);

  const isArchived = !!record.archived;
  const draggable = !isArchived;

  const moveOptions = moveColumns.filter((c) => c.id !== column.id);
  // Suppress unused-var warning; kept for API symmetry
  void onMailShareToast;

  return (
    <>
    <article
      ref={articleRef as React.RefObject<HTMLElement>}
      draggable={draggable}
      onDragStart={(e) => {
        if (articleRef.current) e.dataTransfer.setDragImage(articleRef.current, 16, 16);
        onDragStart?.(e);
        setTimeout(() => setIsDragging(true), 0);
      }}
      onDragEnd={(e) => {
        setIsDragging(false);
        onDragEnd?.(e);
      }}
      onClick={onOpen}
      className={`group relative cursor-pointer rounded-[8px] border border-[#E3E7E8] bg-white shadow-[0_1px_6px_0_rgba(12,12,13,0.08)] transition-[box-shadow,border-color] hover:border-[#D0D6D8] hover:shadow-[0_2px_10px_0_rgba(12,12,13,0.10)] ${isDragging ? "hidden" : ""}`}
      style={{
        padding: 13,
        opacity: isArchived && archivedView ? 0.55 : 1,
      }}
    >
      <div className="flex flex-col" style={{ gap: 8 }}>
        {/* Row 1: logo + score */}
        <div className="flex items-start justify-between gap-2">
          <CompanyLogo name={job.company} logo={job.logo} />
          <div className="text-right leading-none">
            <span
              className="text-[20px]"
              style={{ fontFamily: "var(--font-display)", color: "#0E735A", lineHeight: "28px" }}
            >
              {job.score}
            </span>
            <span className="text-[16px]" style={{ color: META_GREY, lineHeight: "24px" }}>%</span>
          </div>
        </div>
        {/* Row 2: title + meta */}
        <div className="min-w-0">
          <div className="text-[16px]" style={{ fontFamily: "var(--font-display)", color: DARK, lineHeight: "24px" }}>
            {job.title}
          </div>
          <div className="text-[12px] font-light" style={{ color: META_GREY, lineHeight: "16px", marginTop: 4 }}>
            {job.company} · {job.location}
          </div>
        </div>
        {/* Row 3: per-status content */}
        <Row3 kind={kind} record={record} column={column} />
      </div>

      {/* Footer controls */}
      <div className="mt-4 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {isArchived ? (
          <button
            type="button"
            className="text-[13px] font-semibold hover:underline"
            style={{ color: "#0E735A" }}
            onClick={() => restoreArchived(job.id)}
          >
            Restore
          </button>
        ) : kind === "saved" ? (
          <>
            <div
              className={`relative transition-opacity ${flagOpen ? "opacity-100" : "max-lg:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100"}`}
              ref={flagRef}
            >
              <IconBtn label="Report this job" noBorder onClick={() => setFlagOpen((v) => !v)}>
                <Flag size={16} strokeWidth={1.6} />
              </IconBtn>
              {flagOpen ? (
                <MenuPop>
                  {["Spam or scam", "Incorrect match (wrong role)", "Ghost or expired posting", "Duplicate posting"].map((label) => (
                    <MenuItem key={label} danger onClick={() => { setStatus(job.id, "reported"); archiveJob(job.id); setFlagOpen(false); }}>{label}</MenuItem>
                  ))}
                </MenuPop>
              ) : null}
            </div>
            <div
              className={`relative -ml-1 transition-opacity ${dislikeOpen ? "opacity-100" : "max-lg:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100"}`}
              ref={dislikeRef}
            >
              <IconBtn label="Not interested" noBorder onClick={() => setDislikeOpen((v) => !v)}>
                <ThumbsDown size={16} strokeWidth={1.6} />
              </IconBtn>
              {dislikeOpen ? (
                <MenuPop>
                  {["Not relevant to my role", "Wrong seniority", "Compensation too low", "Don't recommend the company"].map((label) => (
                    <MenuItem
                      key={label}
                      onClick={() => {
                        if (label === "Don't recommend the company") blockCompany(job.company);
                        setStatus(job.id, "dismissed");
                        archiveJob(job.id);
                        setDislikeOpen(false);
                      }}
                    >
                      {label}
                    </MenuItem>
                  ))}
                </MenuPop>
              ) : null}
            </div>
            <IconBtn label="Saved" active onClick={() => { setStatus(job.id, "default"); archiveJob(job.id); }}>
              <Bookmark size={16} strokeWidth={1.6} fill="#0E735A" />
            </IconBtn>
            <button
              type="button"
              onClick={onRequestApply}
              className="flex h-[30px] flex-1 items-center justify-center gap-1 rounded-[4px] text-[12px]"
              style={{ background: "#00F1A9", border: "1px solid #00F1A9", color: DARK }}
            >
              <ExternalLink size={14} strokeWidth={1.8} />
              Apply
            </button>
          </>
        ) : (
          // Applied / Interview / Rejected / Offer
          <>
            <div className="transition-opacity max-lg:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
              <IconBtn label="Archive" noBorder onClick={() => setConfirmArchiveOpen(true)}>
                <Cancel size={16} strokeWidth={1.8} />
              </IconBtn>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {(kind === "applied" || kind === "interview" || kind === "offer") ? (
                <IconBtn label="Send a follow-up" noBorder onClick={(e) => { e.stopPropagation(); setFollowUpOpen(true); }}>
                  <MailShare size={16} strokeWidth={1.6} />
                </IconBtn>
              ) : null}
              <div className="relative" ref={moveRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={moveOpen}
                  onClick={() => setMoveOpen((v) => !v)}
                  className="inline-flex h-[30px] w-full items-center justify-between gap-1 rounded-[4px] border bg-white px-2 text-[12px]"
                  style={{ borderColor: BORDER_LIGHT, color: DARK, minWidth: 91 }}
                >
                  Move to
                  <ChevronDown size={13} strokeWidth={2} />
                </button>
                {moveOpen ? (
                  <MenuPop align="right" minWidth={200}>
                    {moveOptions.map((c) => (
                      <MenuItem
                        key={c.id}
                        onClick={() => {
                          setMoveOpen(false);
                          onMoveTo(c);
                        }}
                      >
                        {c.title}
                      </MenuItem>
                    ))}
                  </MenuPop>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </article>
    <FollowUpDialog job={job} open={followUpOpen} onClose={() => setFollowUpOpen(false)} />
    <Dialog
      open={confirmArchiveOpen}
      onOpenChange={(o) => {
        if (!o) {
          setConfirmArchiveOpen(false);
          setArchiveReason("");
        }
      }}
    >
      <DialogContent className="max-w-[440px] rounded-[8px] p-5">
        <DialogTitle
          className="text-[16px] font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Archive this job?
        </DialogTitle>
        <p className="mt-2 text-[13px] font-light" style={{ color: MUTED_TEXT, lineHeight: "20px" }}>
          <span style={{ color: DARK }}>{job.title}</span> at{" "}
          <span style={{ color: DARK }}>{job.company}</span> will be moved to
          Archived. You can restore it later.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => { setConfirmArchiveOpen(false); setArchiveReason(""); }}
            className="inline-flex h-9 items-center rounded-[4px] border bg-white px-3 text-[13px]"
            style={{ borderColor: BORDER_LIGHT, color: DARK }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const reason = archiveReason.trim();
              setConfirmArchiveOpen(false);
              setArchiveReason("");
              onArchive(reason || undefined);
            }}
            className="inline-flex h-9 items-center rounded-[4px] px-3 text-[13px] font-medium text-white"
            style={{ background: "#D00D01" }}
          >
            Archive
          </button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function Row3({ kind, record, column }: { kind: ColumnKind; record: JobRecord; column: BoardColumn }) {
  if (kind === "saved" || kind === "applied" || kind === "rejected") {
    return null;
  }
  const fallbackStage = column.stages?.[0];
  if (kind === "interview") {
    const stage = record.interviewStage || fallbackStage;
    return (
      (stage || record.reminderAt) ? (
        <div className="flex flex-wrap gap-1">
          {stage ? <Chip>{stage}</Chip> : null}
          {record.reminderAt ? <Chip>{dateHelpers.shortDateTime(record.reminderAt)}</Chip> : null}
        </div>
      ) : null
    );
  }
  // offer
  const offerStage = record.offerStatus || fallbackStage;
  return (
    <div className="flex flex-wrap gap-1">
      {offerStage ? <Chip tone="mint">{offerStage}</Chip> : null}
      {record.reminderAt ? <Chip tone="mint">{dateHelpers.shortDateTime(record.reminderAt)}</Chip> : null}
    </div>
  );
}

function Chip({ children, tone = "orange" }: { children: React.ReactNode; tone?: "orange" | "mint" }) {
  return (
    <span
      className="inline-flex items-center text-[12px] font-light"
      style={{
        background: tone === "mint" ? CHIP_MINT : CHIP_ORANGE,
        color: DARK,
        padding: "4px 6px",
        borderRadius: 4,
        lineHeight: "16px",
      }}
    >
      {children}
    </span>
  );
}

function MenuPop({
  children,
  align = "left",
  minWidth = 220,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  minWidth?: number;
}) {
  // Rendered in a portal: the board row uses overflow-x-auto and each column
  // clips its content, so an absolutely positioned menu gets cut off.
  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const parent = anchorRef.current?.parentElement;
      const menu = menuRef.current;
      if (!parent || !menu) return;
      const r = parent.getBoundingClientRect();
      const width = Math.max(minWidth, menu.offsetWidth);
      const height = menu.offsetHeight;
      let left = align === "right" ? r.right - width : r.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      let top = r.bottom + 4;
      if (top + height > window.innerHeight - 8) {
        top = Math.max(8, r.top - 4 - height);
      }
      setPos({ top, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [align, minWidth]);

  return (
    <>
      <span ref={anchorRef} className="hidden" aria-hidden />
      {createPortal(
        <div
          ref={menuRef}
          role="menu"
          data-menu-pop
          className="fixed z-[70] overflow-y-auto rounded-[6px] border bg-white"
          style={{
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            minWidth,
            maxHeight: "min(320px, 70vh)",
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            visibility: pos ? "visible" : "hidden",
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={
        danger
          ? "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
          : "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
      }
    >
      {children}
    </button>
  );
}

// ---------- Column ----------

function KanbanColumn({
  column,
  jobs,
  isDropTarget,
  placeholderHeight,
  onDragEnter,
  onDrop,
  onOpen,
  onDragStartJob,
  onDragEnd,
  onArchive,
  onRequestApply,
  onMoveTo,
  onMailShareToast,
  archivedView,
  collapsed,
  onToggleCollapse,
  moveColumns,
  onEditColumn,
}: {
  skeletonCount,
  column: BoardColumn;
  jobs: { job: Job; rec: JobRecord }[];
  skeletonCount?: number;
  isDropTarget: boolean;
  placeholderHeight: number;
  onDragEnter: () => void;
  onDrop: () => void;
  onOpen: (j: Job) => void;
  onDragStartJob: (jobId: string, height: number) => void;
  onDragEnd: () => void;
  onArchive: (jobId: string, reason?: string) => void;
  onRequestApply: (jobId: string) => void;
  onMoveTo: (jobId: string, target: BoardColumn) => void;
  onMailShareToast: () => void;
  archivedView: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  moveColumns: BoardColumn[];
  onEditColumn: () => void;
}) {
  return (
    <div
      className="flex w-full min-w-0 flex-col lg:w-[240px] lg:shrink-0"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragEnter();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      {/* Header: 44px */}
      <div
        className="group/col flex w-full items-center gap-2"
        style={{ height: 44, paddingLeft: 4 }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex flex-1 items-center gap-2 lg:pointer-events-none"
          aria-expanded={!collapsed}
        >
          <span className="text-[14px]" style={{ fontFamily: "var(--font-display)", color: DARK, lineHeight: "20px" }}>
            {column.title}
          </span>
          <span
            className="inline-flex items-center justify-center text-[14px]"
            style={{ width: 22, height: 22, background: "#E3E7E8", borderRadius: 4, color: DARK, fontFamily: "var(--font-display)" }}
          >
            {jobs.length}
          </span>
        </button>
        <IconTooltip label="Edit column">
          <button
            type="button"
            onClick={onEditColumn}
            aria-label="Edit column"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] transition-opacity hover:bg-white max-lg:opacity-100 lg:opacity-0 lg:group-hover/col:opacity-100 lg:focus-within:opacity-100"
          >
            <Pencil size={14} strokeWidth={1.8} />
          </button>
        </IconTooltip>
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className="lg:hidden"
          style={{
            color: MUTED_TEXT,
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 150ms",
          }}
        />
      </div>
      {/* Cards */}
      <div
        className={`flex-col ${collapsed ? "hidden lg:flex" : "flex"}`}
        style={{ gap: 4, background: "#F1F3F3", padding: 4, borderRadius: 12 }}
      >
        {isDropTarget ? (
          <div
            className="rounded-[8px] border-2 border-dashed"
            style={{ borderColor: "#D0D6D8", height: placeholderHeight || 96 }}
          />
        ) : null}
        {jobs.length === 0 && !isDropTarget ? (
          <div
            className="rounded-[8px] border border-dashed p-4 text-center text-[12px]"
            style={{ borderColor: BORDER_LIGHT, color: MUTED_TEXT }}
          >
            Nothing here yet
          </div>
        ) : null}
        {jobs.map(({ job }) => (
          <KanbanCard
            key={job.id}
            job={job}
            onOpen={() => onOpen(job)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", job.id);
              e.dataTransfer.effectAllowed = "move";
              const h = (e.currentTarget as HTMLElement).getBoundingClientRect().height;
              onDragStartJob(job.id, h);
            }}
            onDragEnd={onDragEnd}
            onArchive={(reason) => onArchive(job.id, reason)}
            onRequestApply={() => onRequestApply(job.id)}
            onMoveTo={(t) => onMoveTo(job.id, t)}
            onMailShareToast={onMailShareToast}
            archivedView={archivedView}
            column={column}
            moveColumns={moveColumns}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Screen ----------

function TrackerScreen() {
  const plan = usePlan();
  useTrackerVersion();
  const { jobs: allJobs } = useJobs();
  const columns = useColumns();
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragHeight, setDragHeight] = useState<number>(0);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [pending, setPending] = useState<
    | { jobId: string; column: BoardColumn; source: JobStatus }
    | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [editColumnId, setEditColumnId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  if (!isPro(plan)) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
        <AppHeader active="tracker" />
        <main className="mx-auto max-w-[1200px] px-6 pt-6">
          <div className="mx-auto w-full max-w-[672px] rounded-[24px] bg-[#F1F3F3] p-[16px]">
            <div
              data-tracker-upsell
              className="relative isolate flex flex-col items-center justify-center overflow-hidden rounded-[12px] border border-white bg-white/80"
              style={{
                boxShadow: "0 1px 4px rgba(12, 12, 13, 0.05)",
                gap: 32,
                padding: "49px 33px",
              }}
            >
              <style>{`
                @media (max-width: 767px) {
                  [data-tracker-upsell] { padding: 40px 24px !important; gap: 24px !important; }
                  [data-tracker-upsell] [data-tu-illus] { width: 96px !important; height: 96px !important; }
                  [data-tracker-upsell] [data-tu-text] { padding-left: 0 !important; padding-right: 0 !important; }
                  [data-tracker-upsell] [data-tu-headline] { font-size: 20px !important; line-height: 28px !important; }
                  [data-tracker-upsell] [data-tu-glow] { width: 200px !important; height: 200px !important; bottom: -132px !important; }
                  [data-tracker-upsell] [data-tu-btn] { width: 100% !important; }
                }
              `}</style>
              <div
                data-tu-glow
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  zIndex: 1,
                  left: "50%",
                  bottom: "-184.5px",
                  transform: "translateX(-50%)",
                  width: 280,
                  height: 280,
                  background: "radial-gradient(circle, #00F1A9 0%, rgba(0,241,169,0) 70%)",
                  filter: "blur(56px)",
                  opacity: 0.45,
                }}
              />
              <img
                data-tu-illus
                src={proCube.url}
                alt=""
                aria-hidden
                className="pointer-events-none object-contain"
                style={{ position: "relative", zIndex: 4, width: 128, height: 128 }}
              />
              <div
                data-tu-text
                className="relative flex flex-col items-center text-center"
                style={{ zIndex: 3, gap: 8, paddingLeft: 40, paddingRight: 40 }}
              >
                <div
                  data-tu-headline
                  style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 24, lineHeight: "32px", color: "#090B0C" }}
                >
                  Track every application in one place
                </div>
                <div style={{ fontWeight: 300, fontSize: 14, lineHeight: "20px", color: "#67787C" }}>
                  Move every job through Saved, Applied, Interview, and Offer — with follow-up reminders so nothing slips.
                </div>
              </div>
              <Link
                data-tu-btn
                to="/settings"
                className="relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] border border-[#00F1A9] bg-[#00F1A9] text-[#090B0C] hover:bg-[color:var(--color-accent-hover)]"
                style={{ zIndex: 2, padding: "13px 17px", fontSize: 14, lineHeight: "20px", fontWeight: 400 }}
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </main>
        <MobileTabBar active="tracker" />
      </div>
    );
  }

  // Bucket jobs into columns dynamically. `resolveColumnForCard` maps a
  // record's (columnId? or status) to the currently displayed column.
  const buckets: Record<string, { job: Job; rec: JobRecord }[]> = {};
  for (const c of columns) buckets[c.id] = [];
  let total = 0;
  for (const j of allJobs) {
    const rec = getJobRecord(j.id);
    const raw = rec.archived ? rec.lastStatus : rec.status;
    if (!raw) continue;
    if (rec.archived) {
      if (!showArchived) continue;
      const col = resolveColumnForCard(rec.columnId, raw);
      if (col) buckets[col.id].push({ job: j, rec });
      continue;
    }
    const col = resolveColumnForCard(rec.columnId, raw);
    if (col) {
      buckets[col.id].push({ job: j, rec });
      total++;
    }
  }
  const byMovedDesc = (a: { rec: JobRecord }, b: { rec: JobRecord }) =>
    (b.rec.movedAt ?? "").localeCompare(a.rec.movedAt ?? "");
  for (const c of columns) {
    if (c.kind === "interview") {
      buckets[c.id].sort((a, b) => {
        const ar = a.rec.reminderAt, br = b.rec.reminderAt;
        if (ar && br) return ar.localeCompare(br);
        if (ar) return -1;
        if (br) return 1;
        return byMovedDesc(a, b);
      });
    } else {
      buckets[c.id].sort(byMovedDesc);
    }
  }

  // Active (non-archived) cards sitting in Offer columns — the compare set.
  const offerEntries = columns
    .filter((c) => c.kind === "offer")
    .flatMap((c) => (buckets[c.id] ?? []).filter((e) => !e.rec.archived));
  const canCompareOffers = offerEntries.length >= 2;

  // Dispatcher: any move (drag OR "Move to") funnels through here.
  // Applied routes to the ApplyModal; interview/test/offer/rejection open their
  // transition popups. Saved is a simple status update.
  function requestMove(jobId: string, target: BoardColumn) {
    const rec = getJobRecord(jobId);
    const source = (rec.archived ? rec.lastStatus ?? "default" : rec.status) as JobStatus;
    // No-op if already in the same column
    if (rec.columnId === target.id) return;
    if (target.kind === "saved" || target.kind === "applied") {
      if (target.kind === "applied") {
        const job = allJobs.find((j) => j.id === jobId);
        if (job) {
          setCardColumn(jobId, target.id);
          setApplyJob(job);
        }
        return;
      }
      setCardColumn(jobId, target.id, "saved");
      return;
    }
    void source;
    setPending({ jobId, column: target, source });
  }

  function handleDrop(target: BoardColumn) {
    setDragOver(null);
    const id = draggingId;
    setDraggingId(null);
    setDragHeight(0);
    if (!id) return;
    requestMove(id, target);
  }

  function cancelPending() {
    // Revert: if a move already committed the status change, put it back.
    if (pending) {
      const rec = getJobRecord(pending.jobId);
      if (rec.status !== pending.source) {
        setStatus(pending.jobId, pending.source);
      }
    }
    setPending(null);
  }

  const pendingJob = pending ? allJobs.find((j) => j.id === pending.jobId) ?? null : null;
  const pendingKind = pending?.column.kind;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active="tracker" />
      <main className="mx-auto max-w-[1200px] px-6 pt-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4" style={{ minHeight: 36 }}>
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-[28px]" style={{ fontFamily: "var(--font-display)", color: DARK, lineHeight: 1.1 }}>
              Tracker
            </h1>
            <span aria-hidden className="hidden sm:block" style={{ width: 1, height: 24, background: BORDER_LIGHT }} />
            <div className="flex flex-wrap items-center gap-2 sm:contents">
            <button
              type="button"
              onClick={() => setColumnsDialogOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2 text-[13px] hover:bg-[color:var(--color-surface-2)]"
              style={{ color: MUTED_TEXT }}
            >
              <LayoutColumns size={14} strokeWidth={1.8} />
              Edit columns
            </button>
            {canCompareOffers ? (
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2 text-[13px] hover:bg-[color:var(--color-surface-2)]"
                style={{ color: MUTED_TEXT }}
              >
                <Columns size={14} strokeWidth={1.8} />
                Compare offers
                <span
                  className="ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] px-1 text-[11px]"
                  style={{ background: "#E3E7E8", color: DARK }}
                >
                  {offerEntries.length}
                </span>
              </button>
            ) : null}
            </div>
          </div>
          <div className="flex items-center gap-6" style={{ height: 24 }}>
            <label className="flex cursor-pointer items-center gap-2">
              <Toggle checked={showArchived} onChange={setShowArchived} label="Show archived" />
              <span className="text-[14px]" style={{ color: MUTED_TEXT }}>Show archived</span>
            </label>
            <span aria-hidden style={{ width: 1, height: 24, background: BORDER_LIGHT }} />
            <span className="text-[14px] font-light" style={{ color: META_GREY }}>
              <span style={{ color: DARK }}>{total}</span> application{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Board */}
        <div className="mt-6 lg:mx-[calc(50%-50vw)]">
        <div className="flex flex-col gap-4 pb-6 lg:flex-row lg:gap-2 lg:overflow-x-auto lg:px-[max(24px,calc(50vw-600px))]">
            {columns.map((c) => (
              <KanbanColumn
                key={c.id}
                column={c}
                jobs={buckets[c.id] ?? []}
                isDropTarget={dragOver === c.id && draggingId !== null}
                placeholderHeight={dragHeight}
                onDragEnter={() => setDragOver(c.id)}
                onDrop={() => handleDrop(c)}
                onOpen={setOpenJob}
                onDragStartJob={(id, h) => { setDraggingId(id); setDragHeight(h); }}
                onDragEnd={() => { setDraggingId(null); setDragOver(null); setDragHeight(0); }}
                onArchive={(id, reason) => archiveJobWithReason(id, reason)}
                onRequestApply={(id) => {
                  const j = allJobs.find((x) => x.id === id);
                  if (j) setApplyJob(j);
                }}
                onMoveTo={(id, target) => requestMove(id, target)}
                onMailShareToast={() => showToast("Follow-up email drafted (demo)")}
                archivedView={showArchived}
                collapsed={!!collapsed[c.id]}
                onToggleCollapse={() => setCollapsed((s) => ({ ...s, [c.id]: !s[c.id] }))}
                moveColumns={columns}
                onEditColumn={() => setEditColumnId(c.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <MobileTabBar active="tracker" />

      <BoardColumnsDialog
        open={columnsDialogOpen}
        onClose={() => setColumnsDialogOpen(false)}
        onEditStages={(id) => setEditColumnId(id)}
      />

      <SingleColumnDialog
        columnId={editColumnId}
        open={editColumnId !== null}
        onClose={() => setEditColumnId(null)}
        onBack={() => {
          setEditColumnId(null);
          setColumnsDialogOpen(true);
        }}
      />

      <CompareOffersDialog
        open={compareOpen && canCompareOffers}
        offers={offerEntries}
        onClose={() => setCompareOpen(false)}
        onOpenJob={(j) => {
          setCompareOpen(false);
          setOpenJob(j);
        }}
      />

      {openJob ? <JobDrawer job={openJob} onClose={() => setOpenJob(null)} /> : null}

      {applyJob ? (
        <ApplyModal
          job={applyJob}
          open={applyJob !== null}
          onClose={() => setApplyJob(null)}
          onApplied={({ resumeName, coverLetterName }) => {
            markApplied(applyJob.id, { resumeName, coverLetterName });
          }}
        />
      ) : null}

      {pendingJob && pending && pendingKind === "interview" ? (
        <InterviewTransitionDialog
          open
          jobId={pending.jobId}
          initialStage={getJobRecord(pending.jobId).interviewStage}
          initialReminderIso={getJobRecord(pending.jobId).reminderAt}
          title={pending.column.title}
          stages={pending.column.stages}
          onCancel={cancelPending}
          onSave={({ stage, reminderIso }) => {
            setCardColumn(pending.jobId, pending.column.id, statusForKind(pending.column.kind));
            setInterviewStage(pending.jobId, stage);
            storeSetReminder(pending.jobId, reminderIso);
            setPending(null);
          }}
        />
      ) : null}

      {pendingJob && pending && pendingKind === "rejected" ? (
        <RejectedTransitionDialog
          open
          initialDetails={getJobRecord(pending.jobId).rejectionDetails}
          onCancel={cancelPending}
          onSave={({ details }) => {
            setCardColumn(pending.jobId, pending.column.id, "rejection");
            if (details) setRejectionDetails(pending.jobId, details);
            setPending(null);
          }}
        />
      ) : null}

      {pendingJob && pending && pendingKind === "offer" ? (
        <OfferTransitionDialog
          open
          jobId={pending.jobId}
          initialStage={getJobRecord(pending.jobId).offerStatus}
          initialReminderIso={getJobRecord(pending.jobId).reminderAt}
          initialDetails={getJobRecord(pending.jobId).offerDetails}
          stages={pending.column.stages}
          title={pending.column.title}
          onCancel={cancelPending}
          onSave={({ stage, reminderIso, details }) => {
            setCardColumn(pending.jobId, pending.column.id, "offer");
            setOfferStatus(pending.jobId, stage);
            storeSetReminder(pending.jobId, reminderIso);
            if (details) setOfferDetails(pending.jobId, details);
            setPending(null);
          }}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-[6px] bg-[color:var(--color-foreground)] px-4 py-2 text-[13px] text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
