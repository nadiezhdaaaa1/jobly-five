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
import proCube from "@/assets/pro-cube.png.asset.json";
import { InterviewReminderDialog } from "@/components/app/InterviewReminderDialog";
import { FollowUpDialog } from "@/components/app/ApplyModal";
import { getAllJobs, type Job } from "@/lib/jobs-data";
import {
  archiveJob,
  dateHelpers,
  getJobRecord,
  restoreArchived,
  setReminder as storeSetReminder,
  setStatus,
  useJobRecord,
  type JobRecord,
  type JobStatus,
} from "@/lib/tracker-store";
import { usePlan, isPro } from "@/lib/plan-store";

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
  children,
}: {
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const base = "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[4px] border p-[7px] transition-colors";
  const cls = active
    ? `${base}`
    : `${base} bg-white hover:bg-[color:var(--color-surface-2)]`;
  const style: React.CSSProperties = active
    ? { background: "#D8FBEF", borderColor: "#0E735A", color: "#0E735A" }
    : { borderColor: BORDER_LIGHT, color: danger ? "#D00D01" : MUTED_TEXT };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cls}
      style={style}
    >
      {children}
    </button>
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
  onRequestInterviewReminder,
  onRequestApplyToast,
  onMoveTo,
  onMailShareToast,
  archivedView,
}: {
  job: Job;
  onOpen: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onArchive: () => void;
  onRequestInterviewReminder?: () => void;
  onRequestApplyToast?: () => void;
  onMoveTo: (target: ColumnKey) => void;
  onMailShareToast?: () => void;
  archivedView: boolean;
}) {
  const record = useJobRecord(job.id);
  const status = (record.archived ? record.lastStatus : record.status) as ColumnKey;
  const [applyOpen, setApplyOpen] = useState(false);
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const applyRef = useOutsideClose(applyOpen, () => setApplyOpen(false));
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const moveRef = useOutsideClose(moveOpen, () => setMoveOpen(false));
  const [isDragging, setIsDragging] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);

  const isArchived = !!record.archived;
  const draggable = !isArchived;

  const moveOptions = COLUMN_ORDER.filter((k) => k !== status);

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
      className={`group relative cursor-pointer rounded-[8px] border bg-white transition-shadow ${isDragging ? "hidden" : ""}`}
      style={{
        borderColor: BORDER_LIGHT,
        padding: 13,
        boxShadow: "0px 1px 4px 0px rgba(0,0,0,0.08)",
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
            <div className="relative" ref={dislikeRef}>
              <IconBtn label="Report or dislike" onClick={() => setDislikeOpen((v) => !v)}>
                <Flag size={16} strokeWidth={1.6} />
              </IconBtn>
              {dislikeOpen ? (
                <MenuPop>
                  <MenuItem onClick={() => { setStatus(job.id, "reported"); archiveJob(job.id); setDislikeOpen(false); }}>Report — looks fake or ghost</MenuItem>
                </MenuPop>
              ) : null}
            </div>
            <IconBtn label="Dislike" onClick={() => { setStatus(job.id, "dismissed"); archiveJob(job.id); }}>
              <ThumbsDown size={16} strokeWidth={1.6} />
            </IconBtn>
            <IconBtn label="Saved" active onClick={() => { setStatus(job.id, "default"); archiveJob(job.id); }}>
              <Bookmark size={16} strokeWidth={1.6} fill="#0E735A" />
            </IconBtn>
            <div className="relative flex-1" ref={applyRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={applyOpen}
                onClick={() => setApplyOpen((v) => !v)}
                className="flex h-[30px] w-full items-center justify-center gap-1 rounded-[4px] text-[12px]"
                style={{ background: "#00F1A9", border: "1px solid #00F1A9", color: DARK }}
              >
                Apply
                <Zap size={14} strokeWidth={2} fill="currentColor" />
              </button>
              {applyOpen ? (
                <MenuPop align="right">
                  <MenuItem onClick={() => { window.open(job.postingUrl ?? "#", "_blank"); setApplyOpen(false); onRequestApplyToast?.(); }}>
                    <ExternalLink size={14} strokeWidth={1.6} />
                    Open posting to apply
                  </MenuItem>
                  <MenuItem onClick={() => { setStatus(job.id, "applied"); setApplyOpen(false); }}>
                    Already applied
                  </MenuItem>
                </MenuPop>
              ) : null}
            </div>
          </>
        ) : (
          // Applied / Interview / Rejected / Offer
          <>
            <IconBtn label="Archive" onClick={onArchive}>
              <X size={16} strokeWidth={1.8} />
            </IconBtn>
            <div className="ml-auto flex items-center gap-1">
              {status === "applied" ? (
                <IconBtn label="Send a follow-up" onClick={(e) => { e.stopPropagation(); setFollowUpOpen(true); }}>
                  <MailShare size={16} strokeWidth={1.6} />
                </IconBtn>
              ) : null}
              <div className="relative" ref={moveRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={moveOpen}
                  onClick={() => setMoveOpen((v) => !v)}
                  className="inline-flex h-[30px] items-center gap-1 rounded-[4px] border bg-white px-2 text-[12px]"
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
                          if (k === "interview") {
                            setStatus(job.id, "interview");
                            onRequestInterviewReminder?.();
                          } else {
                            setStatus(job.id, k);
                          }
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
      {record.offerStatus ? <Chip>{record.offerStatus}</Chip> : null}
      {record.reminderAt ? <Chip>{dateHelpers.shortDateTime(record.reminderAt)}</Chip> : null}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center text-[12px] font-light"
      style={{
        background: CHIP_ORANGE,
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

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
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
  onRequestInterviewReminder,
  onRequestApplyToast,
  onMoveTo,
  onMailShareToast,
  archivedView,
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
  onRequestInterviewReminder: (jobId: string) => void;
  onRequestApplyToast: (jobId: string) => void;
  onMoveTo: (jobId: string, target: ColumnKey) => void;
  onMailShareToast: () => void;
  archivedView: boolean;
}) {
  return (
    <div
      className="flex shrink-0 flex-col"
      style={{ width: 224 }}
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
      <div className="flex items-center gap-2 px-1" style={{ height: 44 }}>
        <span className="text-[20px]" style={{ fontFamily: "var(--font-display)", color: DARK, lineHeight: "28px" }}>
          {COLUMN_TITLE[status]}
        </span>
        <span
          className="inline-flex items-center justify-center text-[14px]"
          style={{ width: 24, height: 24, background: "#F1F3F3", borderRadius: 4, color: MUTED_TEXT }}
        >
          {jobs.length}
        </span>
      </div>
      {/* Cards */}
      <div className="flex flex-col px-1" style={{ gap: 4 }}>
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
            onRequestInterviewReminder={() => onRequestInterviewReminder(job.id)}
            onRequestApplyToast={() => onRequestApplyToast(job.id)}
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
  const allJobs = useMemo(() => getAllJobs(), []);
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ColumnKey | null>(null);
  const [dragHeight, setDragHeight] = useState<number>(0);
  const [reminderJobId, setReminderJobId] = useState<string | null>(null);
  const [applyToast, setApplyToast] = useState<Job | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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

  function handleDrop(target: ColumnKey) {
    setDragOver(null);
    if (!draggingId) return;
    if (target === "interview") {
      setStatus(draggingId, "interview");
      setReminderJobId(draggingId);
    } else {
      setStatus(draggingId, target);
    }
    setDraggingId(null);
    setDragHeight(0);
  }

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
          <div className="flex items-center gap-4" style={{ height: 24 }}>
            <label className="flex cursor-pointer items-center gap-2">
              <Toggle checked={showArchived} onChange={setShowArchived} label="Show archived" />
              <span className="text-[14px]" style={{ color: MUTED_TEXT }}>Show archived</span>
            </label>
            <span aria-hidden style={{ width: 1, height: 24, background: BORDER_LIGHT }} />
            <span className="text-[16px] font-light" style={{ color: META_GREY }}>
              {total} application{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Board */}
        <div className="mt-6 -mx-6 overflow-x-auto px-6">
          <div className="flex" style={{ gap: 8, minWidth: 1152 }}>
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
                onRequestInterviewReminder={setReminderJobId}
                onRequestApplyToast={(id) => { const j = allJobs.find((x) => x.id === id); if (j) setApplyToast(j); }}
                onMoveTo={(id, target) => {
                  if (target === "interview") {
                    setStatus(id, "interview");
                    setReminderJobId(id);
                  } else {
                    setStatus(id, target);
                  }
                }}
                onMailShareToast={() => showToast("Follow-up email drafted (demo)")}
                archivedView={showArchived}
              />
            ))}
          </div>
        </div>
      </main>

      <MobileTabBar active="tracker" />

      {openJob ? <JobDrawer job={openJob} onClose={() => setOpenJob(null)} /> : null}

      <InterviewReminderDialog
        open={reminderJobId !== null}
        jobTitle={reminderJobId ? allJobs.find((j) => j.id === reminderJobId)?.title : undefined}
        initialIso={reminderJobId ? getJobRecord(reminderJobId).reminderAt : undefined}
        onCancel={() => setReminderJobId(null)}
        onSave={(iso) => {
          if (reminderJobId) {
            storeSetReminder(reminderJobId, iso);
            setStatus(reminderJobId, "interview");
          }
          setReminderJobId(null);
        }}
      />

      {applyToast ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={() => setApplyToast(null)} aria-hidden />
          <div className="relative z-10 w-[92%] max-w-[440px] rounded-[8px] border bg-[color:var(--color-surface-1)] p-6" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
            <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Did you apply to {applyToast.title}?
            </h2>
            <p className="mt-2 text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              Let us know so we can move it to Applied on your tracker.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]" onClick={() => { setStatus(applyToast.id, "applied"); setApplyToast(null); }}>
                Yes, mark as applied
              </button>
              <button type="button" className="h-11 w-full rounded-[4px] border px-4 text-[14px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]" onClick={() => setApplyToast(null)}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-[6px] bg-[color:var(--color-foreground)] px-4 py-2 text-[13px] text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
