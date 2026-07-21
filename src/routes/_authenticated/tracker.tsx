import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconBookmark as Bookmark,
  IconCalendar as Calendar,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconExternalLink as ExternalLink,
  IconFlag as Flag,
  IconThumbDown as ThumbsDown,
  IconX as X,
  IconBolt as Zap,
} from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { JobDrawer } from "@/components/app/JobDrawer";
import { InterviewReminderDialog } from "@/components/app/InterviewReminderDialog";
import { getAllJobs, type Job } from "@/lib/jobs-data";
import {
  dateHelpers,
  setReminder as storeSetReminder,
  setStatus,
  useJobRecord,
  type JobRecord,
  type JobStatus,
} from "@/lib/tracker-store";
import { useSyncExternalStore } from "react";

export const Route = createFileRoute("/_authenticated/tracker")({
  head: () => ({
    meta: [
      { title: "Tracker — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackerScreen,
});

// ---------- Bridge: subscribe all cards to store updates ----------

// Small helper hook: subscribe to any store change so re-renders happen when
// job statuses/reminders change from anywhere (drawer, digest, this screen).
function useTrackerVersion() {
  // Piggyback on useJobRecord for a sentinel id; but simpler: reuse the store's
  // subscribe path via a tiny custom hook.
  useJobRecord("__sentinel__");
}

// ---------- UI atoms ----------

function CompanySquare({ name, logo, size = 40 }: { name: string; logo?: string; size?: number }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={`${name} logo`}
        className="shrink-0 rounded-[4px] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] font-semibold text-white"
      style={{ width: size, height: size, fontSize: size >= 40 ? 16 : 13 }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${score} percent match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E3E7E8" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#0E735A" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="butt" />
      </svg>
      <span className="absolute text-[14px]" style={{ fontFamily: "var(--font-sans)", fontWeight: 400, color: "#090B0C" }}>
        {score}%
      </span>
    </div>
  );
}

function CountTag({ n }: { n: number }) {
  return (
    <span className="inline-flex min-w-[22px] items-center justify-center rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-[1px] text-[12px] text-[color:var(--color-text-secondary)]">
      {n}
    </span>
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

// ---------- Card ----------

type Regime = "saved" | "applied-interview" | "offer" | "rejection";

function statusLabel(s: JobStatus): string {
  switch (s) {
    case "saved": return "Saved";
    case "applied": return "Applied";
    case "interview": return "Interview";
    case "offer": return "Offer";
    case "rejection": return "Rejection";
    default: return "";
  }
}

function JobCard({
  job,
  regime,
  onOpen,
  onDragStart,
  onDragEnd,
  onRequestInterviewReminder,
  onRequestApplyToast,
}: {
  job: Job;
  regime: Regime;
  onOpen: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onRequestInterviewReminder?: () => void;
  onRequestApplyToast?: () => void;
}) {
  const record = useJobRecord(job.id);
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const applyRef = useOutsideClose(applyOpen, () => setApplyOpen(false));
  const statusRef = useOutsideClose(statusOpen, () => setStatusOpen(false));

  const dim = regime === "rejection";
  const draggable = regime === "saved" || regime === "applied-interview";
  const articleRef = useRef<HTMLElement | null>(null);

  // Status dropdown options for anything past Saved
  const statusOptions: JobStatus[] = ["applied", "interview", "offer", "rejection"];

  function handleStatusChange(next: JobStatus) {
    setStatusOpen(false);
    if (next === "interview") {
      setStatus(job.id, "interview");
      onRequestInterviewReminder?.();
      return;
    }
    setStatus(job.id, next);
  }

  function currentStatusLabel() {
    if (regime === "offer") return "Offer";
    if (regime === "rejection") return "Rejection";
    return statusLabel(record.status);
  }

  // Reminder chip (Interview cards only)
  const isInterview = record.status === "interview";
  const reminderIso = isInterview ? record.reminderAt : undefined;
  const reminderToday = reminderIso ? dateHelpers.isSameLocalDay(reminderIso) : false;

  return (
    <article
      ref={articleRef as React.RefObject<HTMLElement>}
      draggable={draggable}
      onDragStart={(e) => {
        // Set a lightweight drag image so the browser doesn't render the
        // whole card (which can look broken with popovers open).
        if (articleRef.current) {
          e.dataTransfer.setDragImage(articleRef.current, 16, 16);
        }
        onDragStart?.(e);
        // Hide the source card after the drag image is captured so only
        // the drag preview remains visible while dragging.
        setTimeout(() => setIsDragging(true), 0);
      }}
      onDragEnd={(e) => {
        setIsDragging(false);
        onDragEnd?.(e);
      }}
      className={`group relative rounded-[6px] border bg-[color:var(--color-surface-1)] p-4 ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${isDragging ? "hidden" : ""}`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open details for ${job.title}`}
        className={`flex w-full items-start gap-3 text-left ${dim ? "opacity-70" : ""}`}
      >
        <CompanySquare name={job.company} logo={job.logo} />
        <div className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-[color:var(--color-foreground)] group-hover:underline">
            {job.title}
          </span>
          <div className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[20px] font-semibold text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-display)" }}>
            {job.score}
          </span>
          <span className="text-[14px] text-[color:var(--color-green)]">%</span>
        </div>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Left: state-dependent tag */}
        {regime === "saved" ? (
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-1 text-[12px] text-[color:var(--color-text-secondary)]">
            Saved {dateHelpers.shortDate(record.savedAt)}
          </span>
        ) : null}
        {regime === "applied-interview" && record.status === "applied" ? (
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-1 text-[12px] text-[color:var(--color-text-secondary)]">
            Applied {dateHelpers.shortDate(record.appliedAt)}
          </span>
        ) : null}
        {regime === "applied-interview" && record.status === "interview" && reminderIso ? (
          <span
            className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[12px] ${
              reminderToday ? "text-[color:var(--color-foreground)]" : "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)]"
            }`}
            style={reminderToday ? { background: "#FFEDD4" } : undefined}
          >
            <Calendar size={12} strokeWidth={1.8} />
            {dateHelpers.shortDateTime(reminderIso)}
          </span>
        ) : null}
        {regime === "offer" ? (
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-1 text-[12px] font-semibold text-[color:var(--color-green)]">
            Received {dateHelpers.shortDate(record.offerAt)}
          </span>
        ) : null}
        {regime === "rejection" ? (
          <span className="inline-flex items-center rounded-[4px] px-2 py-1 text-[12px] font-semibold" style={{ background: "#FFE2E2", color: "#D00D01" }}>
            Received {dateHelpers.shortDate(record.rejectionAt)}
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {/* Left icon-button: thumbs-down for Saved / Default, X otherwise */}
          {regime === "saved" ? (
            <div className="relative" ref={dislikeRef}>
              <button
                type="button"
                aria-label="Dislike or report"
                aria-haspopup="menu"
                aria-expanded={dislikeOpen}
                onClick={() => setDislikeOpen((v) => !v)}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
              >
                <ThumbsDown size={15} strokeWidth={1.6} />
              </button>
              {dislikeOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[34px] z-30 min-w-[240px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                    onClick={() => { setStatus(job.id, "dismissed"); setDislikeOpen(false); }}
                  >
                    <ThumbsDown size={15} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />
                    Dislike — not a good match
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
                    onClick={() => { setStatus(job.id, "reported"); setDislikeOpen(false); }}
                  >
                    <Flag size={15} strokeWidth={1.6} />
                    Report — looks fake or ghost
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="relative" ref={dislikeRef}>
              <button
                type="button"
                aria-label="Remove or report"
                aria-haspopup="menu"
                aria-expanded={dislikeOpen}
                onClick={() => setDislikeOpen((v) => !v)}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
              >
                <X size={15} strokeWidth={1.6} />
              </button>
              {dislikeOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[34px] z-30 min-w-[240px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                    onClick={() => { setStatus(job.id, "default"); setDislikeOpen(false); }}
                  >
                    <X size={15} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />
                    Remove from tracker
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
                    onClick={() => { setStatus(job.id, "reported"); setDislikeOpen(false); }}
                  >
                    <Flag size={15} strokeWidth={1.6} />
                    Report — looks fake or ghost
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Right control(s) */}
          {regime === "saved" ? (
            <>
              <button
                type="button"
                aria-label="Save the opening"
                title="Save the opening"
                aria-pressed
                onClick={() => setStatus(job.id, "default")}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
              >
                <Bookmark
                  size={15}
                  strokeWidth={1.6}
                  className="text-[color:var(--color-foreground)]"
                  fill="var(--color-accent)"
                />
              </button>
              <div className="relative" ref={applyRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={applyOpen}
                  onClick={() => setApplyOpen((v) => !v)}
                  className="inline-flex h-[30px] items-center gap-1 rounded-[4px] bg-[color:var(--color-accent)] px-3 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
                >
                  Apply
                  <Zap size={13} strokeWidth={2} fill="currentColor" />
                </button>
                {applyOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[34px] z-30 min-w-[240px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                    style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
                  >
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-text-muted)]">
                      <span>Tailor your resume</span>
                      <span className="rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px]">Soon</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-text-muted)]">
                      <span>Generate a cover letter</span>
                      <span className="rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px]">Soon</span>
                    </div>
                    <div className="border-t" />
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                      onClick={() => {
                        window.open(job.postingUrl ?? "#", "_blank");
                        setApplyOpen(false);
                        onRequestApplyToast?.();
                      }}
                    >
                      <ExternalLink size={14} strokeWidth={1.6} />
                      Open posting to apply
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            // Status dropdown for Applied / Interview / Offer / Rejection
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={statusOpen}
                onClick={() => setStatusOpen((v) => !v)}
                className="inline-flex h-[30px] items-center gap-1 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                {currentStatusLabel()}
                <ChevronDown size={13} strokeWidth={2} />
              </button>
              {statusOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[34px] z-30 min-w-[180px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
                >
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="menuitem"
                      onClick={() => handleStatusChange(s)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)] ${
                        record.status === s ? "font-semibold text-[color:var(--color-green)]" : ""
                      }`}
                    >
                      {s === "offer" ? "Received offer" : statusLabel(s)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ---------- Kanban column ----------

function KanbanColumn({
  title,
  status,
  jobs,
  isDropTarget,
  placeholderHeight,
  onDragOver,
  onDrop,
  onOpen,
  onDragStartJob,
  onDragEnd,
  onRequestInterviewReminder,
  onRequestApplyToast,
}: {
  title: string;
  status: JobStatus;
  jobs: Job[];
  isDropTarget: boolean;
  placeholderHeight: number;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onOpen: (j: Job) => void;
  onDragStartJob: (jobId: string, height: number) => void;
  onDragEnd: () => void;
  onRequestInterviewReminder: (jobId: string) => void;
  onRequestApplyToast: (jobId: string) => void;
}) {
  const regime: Regime = status === "saved" ? "saved" : "applied-interview";
  return (
    <div
      className="flex min-w-0 flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(e);
      }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="text-[15px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>{title}</span>
        <CountTag n={jobs.length} />
      </div>
      <div className="flex flex-col gap-3">
        {isDropTarget ? (
          <div
            className="rounded-[6px] border-2 border-dashed"
            style={{ borderColor: "var(--color-border-strong)", height: placeholderHeight || 96 }}
          />
        ) : null}
        {jobs.length === 0 && !isDropTarget ? (
          <div className="rounded-[6px] border border-dashed p-6 text-center text-[13px] text-[color:var(--color-text-muted)]" style={{ borderColor: "var(--color-border-strong)" }}>
            Nothing here yet
          </div>
        ) : null}
        {jobs.map((j) => (
          <JobCard
            key={j.id}
            job={j}
            regime={regime}
            onOpen={() => onOpen(j)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", j.id);
              e.dataTransfer.effectAllowed = "move";
              const h = (e.currentTarget as HTMLElement).getBoundingClientRect().height;
              onDragStartJob(j.id, h);
            }}
            onDragEnd={onDragEnd}
            onRequestInterviewReminder={() => onRequestInterviewReminder(j.id)}
            onRequestApplyToast={() => onRequestApplyToast(j.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Screen ----------

type Tab = "ongoing" | "offers" | "rejections";

function TrackerScreen() {
  useTrackerVersion();
  const allJobs = useMemo(() => getAllJobs(), []);
  const [tab, setTab] = useState<Tab>("ongoing");
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<JobStatus | null>(null);
  const [dragHeight, setDragHeight] = useState<number>(0);
  const [reminderJobId, setReminderJobId] = useState<string | null>(null);
  const [applyToast, setApplyToast] = useState<Job | null>(null);

  // Compute buckets from the shared store on each render. useTrackerVersion()
  // above ensures we re-render on every store emit, so a plain (non-memoized)
  // computation stays in sync with status changes from drag-and-drop.
  const buckets: Record<JobStatus, { job: Job; rec: JobRecord }[]> = {
    default: [], saved: [], applied: [], interview: [], offer: [], rejection: [], dismissed: [], reported: [],
  };
  for (const j of allJobs) {
    const rec = readRecord(j.id);
    buckets[rec.status].push({ job: j, rec });
  }
  const sortDesc = (key: keyof JobRecord) =>
    (a: { rec: JobRecord }, x: { rec: JobRecord }) => {
      const av = (a.rec[key] as string | undefined) ?? "";
      const xv = (x.rec[key] as string | undefined) ?? "";
      return xv.localeCompare(av);
    };
  buckets.saved.sort(sortDesc("savedAt"));
  buckets.applied.sort(sortDesc("appliedAt"));
  // Interview: soonest upcoming reminder first; cards without a reminder go to the bottom,
  // ordered by most recently moved into Interview.
  buckets.interview.sort((a, x) => {
    const ar = a.rec.reminderAt;
    const xr = x.rec.reminderAt;
    if (ar && xr) return ar.localeCompare(xr);
    if (ar) return -1;
    if (xr) return 1;
    return (x.rec.interviewAt ?? "").localeCompare(a.rec.interviewAt ?? "");
  });
  buckets.offer.sort(sortDesc("offerAt"));
  buckets.rejection.sort(sortDesc("rejectionAt"));

  const totalInTracker =
    buckets.saved.length + buckets.applied.length + buckets.interview.length + buckets.offer.length + buckets.rejection.length;

  const savedJobs = buckets.saved.map((x) => x.job);
  const appliedJobs = buckets.applied.map((x) => x.job);
  const interviewJobs = buckets.interview.map((x) => x.job);
  const offerJobs = buckets.offer.map((x) => x.job);
  const rejectionJobs = buckets.rejection.map((x) => x.job);

  const boardEmpty = savedJobs.length + appliedJobs.length + interviewJobs.length === 0;

  function handleDrop(target: JobStatus) {
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

  const handleDragStart = (id: string, height: number) => {
    setDraggingId(id);
    setDragHeight(height);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOver(null);
    setDragHeight(0);
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active="tracker" />
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[24px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
              Tracker
            </h1>
            <span className="text-[13px] text-[color:var(--color-text-muted)]">
              {totalInTracker} application{totalInTracker === 1 ? "" : "s"}
            </span>
          </div>
          <div className="inline-flex rounded-[4px] border bg-[color:var(--color-surface-1)] p-1">
            {(["ongoing", "offers", "rejections"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`h-8 w-[120px] rounded-[4px] button-small transition-colors ${
                  tab === t
                    ? "bg-[color:var(--color-foreground)] text-white"
                    : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                }`}
              >
                {t === "ongoing" ? "Ongoing" : t === "offers" ? "Offers" : "Rejections"}
              </button>
            ))}
          </div>
        </div>

        {tab === "ongoing" ? (
          boardEmpty ? (
            <EmptyBoard />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <KanbanColumn
                title="Saved"
                status="saved"
                jobs={savedJobs}
                isDropTarget={dragOver === "saved" && draggingId !== null}
                placeholderHeight={dragHeight}
                onDragOver={() => setDragOver("saved")}
                onDrop={() => handleDrop("saved")}
                onOpen={setOpenJob}
                onDragStartJob={handleDragStart}
                onDragEnd={handleDragEnd}
                onRequestInterviewReminder={setReminderJobId}
                onRequestApplyToast={(id) => {
                  const j = allJobs.find((x) => x.id === id);
                  if (j) setApplyToast(j);
                }}
              />
              <KanbanColumn
                title="Applied"
                status="applied"
                jobs={appliedJobs}
                isDropTarget={dragOver === "applied" && draggingId !== null}
                placeholderHeight={dragHeight}
                onDragOver={() => setDragOver("applied")}
                onDrop={() => handleDrop("applied")}
                onOpen={setOpenJob}
                onDragStartJob={handleDragStart}
                onDragEnd={handleDragEnd}
                onRequestInterviewReminder={setReminderJobId}
                onRequestApplyToast={(id) => {
                  const j = allJobs.find((x) => x.id === id);
                  if (j) setApplyToast(j);
                }}
              />
              <KanbanColumn
                title="Interview"
                status="interview"
                jobs={interviewJobs}
                isDropTarget={dragOver === "interview" && draggingId !== null}
                placeholderHeight={dragHeight}
                onDragOver={() => setDragOver("interview")}
                onDrop={() => handleDrop("interview")}
                onOpen={setOpenJob}
                onDragStartJob={handleDragStart}
                onDragEnd={handleDragEnd}
                onRequestInterviewReminder={setReminderJobId}
                onRequestApplyToast={(id) => {
                  const j = allJobs.find((x) => x.id === id);
                  if (j) setApplyToast(j);
                }}
              />
            </div>
          )
        ) : tab === "offers" ? (
          <GridSection
            title="Received offers"
            jobs={offerJobs}
            regime="offer"
            onOpen={setOpenJob}
            onRequestInterviewReminder={setReminderJobId}
          />
        ) : (
          <GridSection
            title="Rejections"
            jobs={rejectionJobs}
            regime="rejection"
            onOpen={setOpenJob}
            onRequestInterviewReminder={setReminderJobId}
          />
        )}
      </main>

      <MobileTabBar active="tracker" />

      {openJob ? (
        <JobDrawer job={openJob} onClose={() => setOpenJob(null)} />
      ) : null}

      <InterviewReminderDialog
        open={reminderJobId !== null}
        jobTitle={reminderJobId ? allJobs.find((j) => j.id === reminderJobId)?.title : undefined}
        initialIso={reminderJobId ? readRecord(reminderJobId).reminderAt : undefined}
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
          <div
            role="status"
            className="relative z-10 w-[92%] max-w-[440px] rounded-[8px] border bg-[color:var(--color-surface-1)] p-6"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
          >
            <h2
              className="text-[18px] font-semibold text-[color:var(--color-foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Did you apply to {applyToast.title}?
            </h2>
            <p className="mt-2 text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              Let us know so we can move it to Applied on your tracker.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
                onClick={() => { setStatus(applyToast.id, "applied"); setApplyToast(null); }}
              >
                Yes, mark as applied
              </button>
              <button
                type="button"
                className="h-11 w-full rounded-[4px] border px-4 text-[14px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                onClick={() => setApplyToast(null)}
              >
                Not yet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GridSection({
  title,
  jobs,
  regime,
  onOpen,
  onRequestInterviewReminder,
}: {
  title: string;
  jobs: Job[];
  regime: Regime;
  onOpen: (j: Job) => void;
  onRequestInterviewReminder: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-[18px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
        <CountTag n={jobs.length} />
      </div>
      {jobs.length === 0 ? (
        <div className="rounded-[6px] border border-dashed p-10 text-center text-[13px] text-[color:var(--color-text-muted)]" style={{ borderColor: "var(--color-border-strong)" }}>
          Nothing here yet
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              regime={regime}
              onOpen={() => onOpen(j)}
              onRequestInterviewReminder={() => onRequestInterviewReminder(j.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyBoard() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[8px] border bg-[color:var(--color-surface-1)] p-10 text-center">
      <div className="text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        Nothing tracked yet
      </div>
      <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        Save a job from your digest and it appears here.
      </p>
      <Link
        to="/dashboard"
        className="mt-1 inline-flex items-center rounded-[4px] bg-[color:var(--color-accent)] px-4 py-2 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
      >
        Open digest
      </Link>
    </div>
  );
}

// ---------- Store bridge ----------
// Read a record without subscribing per-id (we already have a screen-wide
// version subscription via useTrackerVersion). We import the hook only to
// force a subscription; the actual lookup uses the module-level helper.
import { getJobRecord as _getJobRecord } from "@/lib/tracker-store";

function readRecord(id: string): JobRecord {
  return _getJobRecord(id);
}

// Screen-wide subscription: re-render on any store change. Store exposes a
// per-id useJobRecord hook that internally subscribes to the global version,
// so calling it with a sentinel id gives us the same signal.
function useVersion() {
  // useJobRecord already re-renders on every store emit. Re-use it as the
  // version signal by reading the sentinel record's identity.
  const r = useJobRecord("__version__");
  return r; // returned value unused; identity changes on each version bump
}

// Suppress unused React import for useSyncExternalStore (kept for future).
void useSyncExternalStore;
void Check;