import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconBookmark as Bookmark,
  IconChevronDown as ChevronDown,
  IconExternalLink as ExternalLink,
  IconFlag as Flag,
  IconMailShare as MailShare,
  IconThumbDown as ThumbsDown,
  IconX as X,
  IconBolt as Zap,
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
import { useJobs } from "@/lib/jobs-store";
import type { Job } from "@/lib/jobs-data";
import {
  archiveJob,
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
  useJobRecord,
  type JobRecord,
  type JobStatus,
} from "@/lib/tracker-store";
import { usePlan, isPro } from "@/lib/plan-store";
import { blockCompany } from "@/lib/blocked-companies-store";

export const Route = createFileRoute("/_authenticated/tracker")({
  head: () => ({
    meta: [
      { title: "Tracker — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackerScreen,
});

// Screen-wide subscription: re-render on any store change.
function useTrackerVersion() {
  useJobRecord("__version__");
}

type ColumnKey = "saved" | "applied" | "interview" | "rejection" | "offer";
const COLUMN_ORDER: ColumnKey[] = ["saved", "applied", "interview", "rejection", "offer"];
const COLUMN_TITLE: Record<ColumnKey, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  rejection: "Rejected",
  offer: "Offers",
};

const CHIP_ORANGE = "#FFEDD4";
const CHIP_MINT = "#E6F4EA";
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
}: {
  job: Job;
  onOpen: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onArchive: () => void;
  onRequestApply: () => void;
  onMoveTo: (target: ColumnKey) => void;
  onMailShareToast?: () => void;
  archivedView: boolean;
}) {
  const record = useJobRecord(job.id);
  const status = (record.archived ? record.lastStatus : record.status) as ColumnKey;
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const flagRef = useOutsideClose(flagOpen, () => setFlagOpen(false));
  const moveRef = useOutsideClose(moveOpen, () => setMoveOpen(false));
  const [isDragging, setIsDragging] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);

  const isArchived = !!record.archived;
  const draggable = !isArchived;

  const moveOptions = COLUMN_ORDER.filter((k) => k !== status);
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
        <Row3 status={status} record={record} />
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
        ) : status === "saved" ? (
          <>
            <div className="relative" ref={flagRef}>
              <IconBtn label="Report" noBorder onClick={() => setFlagOpen((v) => !v)}>
                <Flag size={16} strokeWidth={1.6} />
              </IconBtn>
              {flagOpen ? (
                <MenuPop>
                  {["Spam/Scam", "Ghost/Expired", "Duplicate posting"].map((label) => (
                    <MenuItem key={label} danger onClick={() => { setStatus(job.id, "reported"); archiveJob(job.id); setFlagOpen(false); }}>{label}</MenuItem>
                  ))}
                </MenuPop>
              ) : null}
            </div>
            <div className="relative -ml-1" ref={dislikeRef}>
              <IconBtn label="Dislike" noBorder onClick={() => setDislikeOpen((v) => !v)}>
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
              Apply
              <Zap size={14} strokeWidth={2} fill="currentColor" />
            </button>
          </>
        ) : (
          // Applied / Interview / Rejected / Offer
          <>
            <IconBtn label="Archive" noBorder onClick={() => setConfirmArchiveOpen(true)}>
              <X size={16} strokeWidth={1.8} />
            </IconBtn>
            <div className="ml-auto flex items-center gap-1">
              {status === "applied" ? (
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
                    {moveOptions.map((k) => (
                      <MenuItem
                        key={k}
                        onClick={() => {
                          setMoveOpen(false);
                          onMoveTo(k);
                        }}
                      >
                        {COLUMN_TITLE[k]}
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
    <Dialog open={confirmArchiveOpen} onOpenChange={(o) => !o && setConfirmArchiveOpen(false)}>
      <DialogContent className="max-w-[420px] rounded-[8px] p-5">
        <DialogTitle
          className="text-[16px] font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Are you sure?
        </DialogTitle>
        <p className="mt-2 text-[13px] font-light" style={{ color: MUTED_TEXT, lineHeight: "20px" }}>
          Remove <span style={{ color: DARK }}>{job.title}</span> at{" "}
          <span style={{ color: DARK }}>{job.company}</span> from{" "}
          {COLUMN_TITLE[status]}? You can restore it later from Archived.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmArchiveOpen(false)}
            className="inline-flex h-9 items-center rounded-[4px] border bg-white px-3 text-[13px]"
            style={{ borderColor: BORDER_LIGHT, color: DARK }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmArchiveOpen(false);
              onArchive();
            }}
            className="inline-flex h-9 items-center rounded-[4px] px-3 text-[13px] font-medium text-white"
            style={{ background: "#D00D01" }}
          >
            Remove
          </button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function Row3({ status, record }: { status: ColumnKey; record: JobRecord }) {
  if (status === "saved") {
    return (
      <div className="text-[12px] font-light" style={{ color: META_GREY, lineHeight: "16px" }}>
        Saved {dateHelpers.shortDate(record.savedAt)}
      </div>
    );
  }
  if (status === "applied") {
    return (
      <div className="text-[12px] font-light" style={{ color: META_GREY, lineHeight: "16px" }}>
        Applied {dateHelpers.shortDate(record.appliedAt)}
      </div>
    );
  }
  if (status === "rejection") {
    return (
      <div className="text-[12px] font-light" style={{ color: META_GREY, lineHeight: "16px" }}>
        Rejected on {dateHelpers.shortDate(record.rejectionAt)}
      </div>
    );
  }
  if (status === "interview") {
    return (
      <div className="flex flex-wrap gap-1">
        {record.interviewStage ? <Chip>{record.interviewStage}</Chip> : null}
        {record.reminderAt ? <Chip>{dateHelpers.shortDateTime(record.reminderAt)}</Chip> : null}
      </div>
    );
  }
  // offer
  return (
    <div className="flex flex-wrap gap-1">
      {record.offerStatus ? <Chip tone="mint">{record.offerStatus}</Chip> : null}
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
  return (
    <div
      role="menu"
      className="absolute top-[34px] z-30 overflow-hidden rounded-[6px] border bg-white"
      style={{
        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
        minWidth,
        [align === "right" ? "right" : "left"]: 0,
      } as React.CSSProperties}
    >
      {children}
    </div>
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
  status,
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
}: {
  status: ColumnKey;
  jobs: { job: Job; rec: JobRecord }[];
  isDropTarget: boolean;
  placeholderHeight: number;
  onDragEnter: () => void;
  onDrop: () => void;
  onOpen: (j: Job) => void;
  onDragStartJob: (jobId: string, height: number) => void;
  onDragEnd: () => void;
  onArchive: (jobId: string) => void;
  onRequestApply: (jobId: string) => void;
  onMoveTo: (jobId: string, target: ColumnKey) => void;
  onMailShareToast: () => void;
  archivedView: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div
      className="flex w-full min-w-0 flex-col lg:w-[224px] lg:shrink-0"
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
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex w-full items-center gap-2 px-1 lg:pointer-events-none"
        style={{ height: 44 }}
        aria-expanded={!collapsed}
      >
        <span className="text-[16px]" style={{ fontFamily: "var(--font-display)", color: DARK, lineHeight: "24px" }}>
          {COLUMN_TITLE[status]}
        </span>
        <span
          className="inline-flex items-center justify-center text-[14px]"
          style={{ width: 24, height: 24, background: "#F1F3F3", borderRadius: 4, color: MUTED_TEXT }}
        >
          {jobs.length}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className="ml-auto lg:hidden"
          style={{
            color: MUTED_TEXT,
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 150ms",
          }}
        />
      </button>
      {/* Cards */}
      <div className={`flex-col px-1 ${collapsed ? "hidden lg:flex" : "flex"}`} style={{ gap: 4 }}>
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
            onArchive={() => onArchive(job.id)}
            onRequestApply={() => onRequestApply(job.id)}
            onMoveTo={(t) => onMoveTo(job.id, t)}
            onMailShareToast={onMailShareToast}
            archivedView={archivedView}
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
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ColumnKey | null>(null);
  const [dragHeight, setDragHeight] = useState<number>(0);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [pending, setPending] = useState<
    | { jobId: string; target: "interview" | "rejection" | "offer"; source: JobStatus }
    | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<ColumnKey, boolean>>({
    saved: false, applied: false, interview: false, rejection: false, offer: false,
  });

  if (!isPro(plan)) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
        <AppHeader active="tracker" />
        <main className="mx-auto max-w-[720px] px-6 pb-24 pt-12">
          <div className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-8 text-center">
            <img src={proCube.url} alt="" aria-hidden className="mx-auto h-32 w-32 object-contain" />
            <span className="mt-4 inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-3 py-1 text-[13px] font-semibold text-[color:var(--color-green)]">Pro</span>
            <h1 className="mt-3 text-[24px]" style={{ fontFamily: "var(--font-display)" }}>Track every application in one place</h1>
            <p className="mx-auto mt-2 max-w-[440px] text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              Kanban board for Saved, Applied, Interview, Rejected, and Offers — with reminders. Available on Pro.
            </p>
            <Link to="/settings" className="mt-5 inline-flex h-11 items-center rounded-[4px] bg-[color:var(--color-accent)] px-5 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]">
              Upgrade to Pro — $9.99/mo
            </Link>
            <div className="mt-2 text-[11px] text-[color:var(--color-text-muted)]">3-day free trial</div>
          </div>
        </main>
        <MobileTabBar active="tracker" />
      </div>
    );
  }

  // Bucket jobs
  const buckets: Record<ColumnKey, { job: Job; rec: JobRecord }[]> = {
    saved: [], applied: [], interview: [], rejection: [], offer: [],
  };
  let total = 0;
  for (const j of allJobs) {
    const rec = getJobRecord(j.id);
    if (rec.archived) {
      if (showArchived && rec.lastStatus && (COLUMN_ORDER as string[]).includes(rec.lastStatus)) {
        buckets[rec.lastStatus as ColumnKey].push({ job: j, rec });
      }
      continue;
    }
    if ((COLUMN_ORDER as string[]).includes(rec.status)) {
      buckets[rec.status as ColumnKey].push({ job: j, rec });
      total++;
    }
  }
  // Sort: newest movedAt first per column
  const byMovedDesc = (a: { rec: JobRecord }, b: { rec: JobRecord }) =>
    (b.rec.movedAt ?? "").localeCompare(a.rec.movedAt ?? "");
  for (const k of COLUMN_ORDER) buckets[k].sort(byMovedDesc);
  // Interview: soonest upcoming reminder first
  buckets.interview.sort((a, b) => {
    const ar = a.rec.reminderAt, br = b.rec.reminderAt;
    if (ar && br) return ar.localeCompare(br);
    if (ar) return -1;
    if (br) return 1;
    return byMovedDesc(a, b);
  });

  // Dispatcher: any move (drag OR "Move to") funnels through here.
  // Applied is routed to the ApplyModal (unless already applied via Apply modal itself).
  // Interview / Rejected / Offer open their transition popups; cancel reverts.
  function requestMove(jobId: string, target: ColumnKey) {
    const rec = getJobRecord(jobId);
    const source = (rec.archived ? rec.lastStatus ?? "default" : rec.status) as JobStatus;
    if (source === target) return;
    if (target === "saved" || target === "applied") {
      if (target === "applied") {
        const job = allJobs.find((j) => j.id === jobId);
        if (job) setApplyJob(job);
        return;
      }
      setStatus(jobId, "saved");
      return;
    }
    setPending({ jobId, target: target as "interview" | "rejection" | "offer", source });
  }

  function handleDrop(target: ColumnKey) {
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

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active="tracker" />
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4" style={{ minHeight: 36 }}>
          <h1 className="text-[28px]" style={{ fontFamily: "var(--font-display)", color: DARK, lineHeight: 1.1 }}>
            Tracker
          </h1>
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
        <div className="mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-2">
            {COLUMN_ORDER.map((k) => (
              <KanbanColumn
                key={k}
                status={k}
                jobs={buckets[k]}
                isDropTarget={dragOver === k && draggingId !== null}
                placeholderHeight={dragHeight}
                onDragEnter={() => setDragOver(k)}
                onDrop={() => handleDrop(k)}
                onOpen={setOpenJob}
                onDragStartJob={(id, h) => { setDraggingId(id); setDragHeight(h); }}
                onDragEnd={() => { setDraggingId(null); setDragOver(null); setDragHeight(0); }}
                onArchive={(id) => archiveJob(id)}
                onRequestApply={(id) => {
                  const j = allJobs.find((x) => x.id === id);
                  if (j) setApplyJob(j);
                }}
                onMoveTo={(id, target) => requestMove(id, target)}
                onMailShareToast={() => showToast("Follow-up email drafted (demo)")}
                archivedView={showArchived}
                collapsed={collapsed[k]}
                onToggleCollapse={() => setCollapsed((s) => ({ ...s, [k]: !s[k] }))}
              />
            ))}
          </div>
        </div>
      </main>

      <MobileTabBar active="tracker" />

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

      {pendingJob && pending?.target === "interview" ? (
        <InterviewTransitionDialog
          open
          initialStage={getJobRecord(pending.jobId).interviewStage}
          initialReminderIso={getJobRecord(pending.jobId).reminderAt}
          onCancel={cancelPending}
          onSave={({ stage, reminderIso }) => {
            setStatus(pending.jobId, "interview");
            setInterviewStage(pending.jobId, stage);
            storeSetReminder(pending.jobId, reminderIso);
            setPending(null);
          }}
        />
      ) : null}

      {pendingJob && pending?.target === "rejection" ? (
        <RejectedTransitionDialog
          open
          initialDetails={getJobRecord(pending.jobId).rejectionDetails}
          onCancel={cancelPending}
          onSave={({ details }) => {
            setStatus(pending.jobId, "rejection");
            if (details) setRejectionDetails(pending.jobId, details);
            setPending(null);
          }}
        />
      ) : null}

      {pendingJob && pending?.target === "offer" ? (
        <OfferTransitionDialog
          open
          initialStage={getJobRecord(pending.jobId).offerStatus}
          initialReminderIso={getJobRecord(pending.jobId).reminderAt}
          initialDetails={getJobRecord(pending.jobId).offerDetails}
          onCancel={cancelPending}
          onSave={({ stage, reminderIso, details }) => {
            setStatus(pending.jobId, "offer");
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
