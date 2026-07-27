import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconX as X,
  IconBookmark as Bookmark,
  IconFlag as Flag,
  IconThumbDown as ThumbsDown,
  IconCalendar as Calendar,
  IconMailShare as MailShare,
  IconFileText as FileText,
} from "@tabler/icons-react";
import type { Job } from "@/lib/jobs-data";
import {
  dateHelpers,
  archiveJobWithReason,
  markApplied,
  setInterviewStage,
  setNotes as storeSetNotes,
  setOfferDetails,
  setOfferStatus,
  setRejectionDetails,
  setReminder,
  setStatus,
  useJobRecord,
  type JobStatus,
} from "@/lib/tracker-store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InterviewReminderDialog } from "@/components/app/InterviewReminderDialog";
import {
  InterviewTransitionDialog,
  OfferTransitionDialog,
  RejectedTransitionDialog,
  TestTaskTransitionDialog,
  INTERVIEW_STAGES,
  SCREEN_INTERVIEW_STAGES,
  TECH_INTERVIEW_STAGES,
  OFFER_STAGES,
} from "@/components/app/TrackerTransitionDialogs";
import {
  resolveColumnForCard,
  useColumns,
  type BoardColumn,
} from "@/lib/board-columns-store";
import { setCardColumn } from "@/lib/tracker-store";
import { JobHistory } from "@/components/app/JobHistory";
import { MatchLine } from "@/components/app/MatchLine";
import { IconTooltip } from "@/components/app/IconTooltip";
import { ApplyModal, FollowUpDialog } from "@/components/app/ApplyModal";
import { setDigestSession } from "@/lib/digest-session-store";
import { Link } from "@tanstack/react-router";
import { usePlan, isPro } from "@/lib/plan-store";

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

function BigRing({ score }: { score: number }) {
  const size = 64;
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
      <span className="absolute text-[16px]" style={{ fontFamily: "var(--font-sans)", fontWeight: 400, color: "#090B0C" }}>
        {score}%
      </span>
    </div>
  );
}

function formatDateLabel(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.max(0, daysAgo));
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function ListingMetaBlock({ job }: { job: Job }) {
  const postedDays = job.postedDays ?? 0;
  // Simulated fetch delay: pulled 0–1 day after posting.
  const fetchedDaysAgo = Math.max(0, postedDays - (postedDays > 0 ? 1 : 0));
  const rawSource = job.sources?.[0]?.name ?? "";
  const sourceName = rawSource
    ? rawSource.replace(/\s*—.*$/, "").trim() || rawSource
    : "Unknown source";
  const direct = job.source === "direct";
  const row = "flex items-baseline justify-between gap-3 py-1.5";
  const label = "text-[12px] text-[color:var(--color-text-muted)]" ;
  const value = "text-[13px] text-[color:var(--color-text-secondary)]";
  return (
    <div className="mt-4 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 py-2">
      <div className={row}>
        <span className={label}>Posted</span>
        <span className={value} style={{ fontWeight: 400 }}>{formatDateLabel(postedDays)}</span>
      </div>
      <div className={row}>
        <span className={label}>Added to Jobly</span>
        <span className={value} style={{ fontWeight: 400 }}>{formatDateLabel(fetchedDaysAgo)}</span>
      </div>
      <div className={row}>
        <span className={label}>Source</span>
        <span className={value} style={{ fontWeight: 400, textTransform: "capitalize" }}>{sourceName}</span>
      </div>
      <div className={row}>
        <span className={label}>Type</span>
        <IconTooltip
          side="left"
          label={
            direct
              ? "Direct employer — posted by the company itself on their careers page."
              : "Aggregated — collected from a job board or third-party aggregator."
          }
        >
          <span
            className={`${value} cursor-help underline decoration-dotted underline-offset-4 decoration-[color:var(--color-border)]`}
            style={{ fontWeight: 400 }}
          >
            {direct ? "Direct employer" : "Aggregated"}
          </span>
        </IconTooltip>
      </div>
    </div>
  );
}

function JobDescriptionBlock({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const sections = job.description ?? [];
  if (!sections.length) return null;
  const first = sections[0];
  const rest = sections.slice(1);
  return (
    <div className="mt-5">
      <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
        {first.heading ?? "About the role"}
      </div>
      {first.body ? (
        <p
          className="mt-2 text-[13px] text-[color:var(--color-text-secondary)]"
          style={{ fontWeight: 300, lineHeight: 1.6 }}
        >
          {first.body}
        </p>
      ) : null}
      {first.bullets?.length ? (
        <ul
          className="mt-2 list-disc pl-5 text-[13px] text-[color:var(--color-text-secondary)]"
          style={{ fontWeight: 300, lineHeight: 1.6 }}
        >
          {first.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}

      {expanded && rest.length ? (
        <div className="mt-4 flex flex-col gap-4">
          {rest.map((s, i) => (
            <div key={i}>
              <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                {s.heading}
              </div>
              {s.body ? (
                <p
                  className="mt-2 text-[13px] text-[color:var(--color-text-secondary)]"
                  style={{ fontWeight: 300, lineHeight: 1.6 }}
                >
                  {s.body}
                </p>
              ) : null}
              {s.bullets?.length ? (
                <ul
                  className="mt-2 list-disc pl-5 text-[13px] text-[color:var(--color-text-secondary)]"
                  style={{ fontWeight: 300, lineHeight: 1.6 }}
                >
                  {s.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {rest.length ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
        >
          {expanded ? "Show less" : "Show full description"}
        </button>
      ) : null}
    </div>
  );
}

export function JobDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  const plan = usePlan();
  const pro = isPro(plan);
  const record = useJobRecord(job.id);
  const status = record.status as JobStatus;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = `job-drawer-title-${job.id}`;
  const [reminderOpen, setReminderOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [pending, setPending] = useState<
    | { col: BoardColumn; source: JobStatus }
    | null
  >(null);
  const setPendingCol = setPending;
  const flagRef = useOutsideClose(flagOpen, () => setFlagOpen(false));
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const moveRef = useOutsideClose(moveOpen, () => setMoveOpen(false));
  const saved = status === "saved";
  const [notes, setNotesLocal] = useState(record.notes ?? "");
  const [notesEditing, setNotesEditing] = useState(false);
  const [rejectionDraft, setRejectionDraft] = useState(record.rejectionDetails ?? "");
  const [offerDraft, setOfferDraft] = useState(record.offerDetails ?? "");

  useEffect(() => {
    setNotesLocal(record.notes ?? "");
    setNotesEditing(false);
  }, [job.id, record.notes]);
  useEffect(() => setRejectionDraft(record.rejectionDetails ?? ""), [job.id, record.rejectionDetails]);
  useEffect(() => setOfferDraft(record.offerDetails ?? ""), [job.id, record.offerDetails]);

  function handleNotesSave() {
    storeSetNotes(job.id, notes.trim());
    setNotesEditing(false);
  }
  function handleNotesCancel() {
    setNotesLocal(record.notes ?? "");
    setNotesEditing(false);
  }
  function handleNotesDelete() {
    storeSetNotes(job.id, "");
    setNotesLocal("");
    setNotesEditing(false);
  }
  function handleRejectionBlur() {
    if (rejectionDraft !== (record.rejectionDetails ?? "")) setRejectionDetails(job.id, rejectionDraft);
  }
  function handleOfferBlur() {
    if (offerDraft !== (record.offerDetails ?? "")) setOfferDetails(job.id, offerDraft);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const inTracker =
    status === "saved" ||
    status === "applied" ||
    status === "interview" ||
    status === "interview_screen" ||
    status === "interview_tech" ||
    status === "test_task" ||
    status === "offer" ||
    status === "rejection";
  const isInterviewFamily =
    status === "interview" ||
    status === "interview_screen" ||
    status === "interview_tech" ||
    status === "test_task";
  const boardColumns = useColumns();
  const currentColumn = resolveColumnForCard(record.columnId, status);
  const currentColumnTitle = currentColumn?.title ?? "";

  function requestMoveToColumn(col: BoardColumn) {
    setMoveOpen(false);
    if (col.id === currentColumn?.id) return;
    if (col.stage === "applied") {
      setCardColumn(job.id, col.id);
      setApplyOpen(true);
      return;
    }
    if (col.stage === "saved") {
      setCardColumn(job.id, col.id, "saved");
      return;
    }
    // interview family / offer / rejection open transition dialogs.
    setPendingCol({ col, source: status });
  }

  function cancelPending() {
    if (pending) {
      const rec = record;
      if (rec.status !== pending.source) setStatus(job.id, pending.source);
    }
    setPending(null);
  }

  const dateLine = (() => {
    if (status === "applied") return `Applied ${dateHelpers.shortDate(record.appliedAt)}`;
    if (isInterviewFamily) return `Applied ${dateHelpers.shortDate(record.appliedAt ?? record.interviewAt)}`;
    if (status === "offer") return `Offer received ${dateHelpers.shortDate(record.offerAt)}`;
    if (status === "rejection") return `Received ${dateHelpers.shortDate(record.rejectionAt)}`;
    return `Saved ${dateHelpers.shortDate(record.savedAt ?? new Date().toISOString())}`;
  })();

  const reminderToday = record.reminderAt ? dateHelpers.isSameLocalDay(record.reminderAt) : false;
  const moveOptions = useMemo(
    () => boardColumns.filter((c) => c.id !== currentColumn?.id),
    [boardColumns, currentColumn?.id],
  );
  void moveOptions;
  void reminderToday;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(9,11,12,.32)" }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden bg-[color:var(--color-surface-1)] outline-none md:w-[480px] md:border-l"
        style={{
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          animation: reducedMotion ? undefined : "job-drawer-in 160ms ease-out",
        }}
      >
        <style>{`@keyframes job-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
        {/* Sticky close */}
        <div className="sticky top-4 z-20 float-right mr-4 mt-4">
          <IconTooltip label="Close" side="left">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <X size={16} strokeWidth={1.6} />
            </button>
          </IconTooltip>
        </div>

        <div className="px-5 pb-8 pt-5">
          {/* Identity block */}
          <div className="flex items-start gap-6">
            {job.logo ? (
              <img
                src={job.logo}
                alt={`${job.company} logo`}
                className="shrink-0 rounded-[4px] object-cover"
                style={{ width: 64, height: 64 }}
              />
            ) : (
              <div
                className="flex shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[18px] font-semibold text-white"
                style={{ width: 64, height: 64 }}
              >
                {job.company.charAt(0)}
              </div>
            )}
            {pro ? <BigRing score={job.score} /> : null}
          </div>
          <h2 id={titleId} className="mt-4 text-[20px] font-semibold leading-snug text-[color:var(--color-foreground)]">
            {job.title}
          </h2>
          <div className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location} · {job.salary}
          </div>
          {pro ? (
            <div className="mt-3">
              <MatchLine job={job} wrap />
            </div>
          ) : null}

          {/* Listing metadata */}
          <ListingMetaBlock job={job} />

          {/* Description */}
          <JobDescriptionBlock job={job} />

          {!inTracker || status === "saved" ? (
          <>
          <ApplyModal
            job={job}
            open={applyOpen}
            onClose={() => setApplyOpen(false)}
            onApplied={({ resumeName, coverLetterName }) => {
              setDigestSession(job.id, "applied");
              markApplied(job.id, { resumeName, coverLetterName });
              // Keep drawer open so user can see the applied state; close only if not in tracker.
              if (!inTracker) onClose();
            }}
          />

          <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex items-center gap-2 border-t bg-[color:var(--color-surface-1)] px-5 py-3">
            <button
              type="button"
              onClick={() => setApplyOpen(true)}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Apply
            </button>

            <button
              type="button"
              aria-label="Save"
              aria-pressed={saved}
              onClick={() => setStatus(job.id, saved ? "default" : "saved")}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[4px] border px-3 text-[13px] font-semibold transition-colors hover:bg-[color:var(--color-surface-2)]"
              style={{
                borderColor: saved ? "var(--color-green)" : undefined,
                background: saved ? "var(--color-mint)" : undefined,
                color: saved ? "var(--color-green)" : "var(--color-foreground)",
              }}
            >
              <Bookmark size={15} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save"}
            </button>

            <div className="relative shrink-0" ref={flagRef}>
              <button
                type="button"
                aria-label="Report this job"
                onClick={() => setFlagOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-[4px] border text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                <Flag size={16} strokeWidth={1.6} />
              </button>
              {flagOpen ? (
                <div role="menu" className="absolute right-0 bottom-[44px] z-30 min-w-[220px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
                  {["Spam or scam", "Incorrect match (wrong role)", "Ghost or expired posting", "Duplicate posting"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
                      onClick={() => { setStatus(job.id, "reported"); setFlagOpen(false); onClose(); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative shrink-0" ref={dislikeRef}>
              <button
                type="button"
                aria-label="Not interested"
                onClick={() => setDislikeOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-[4px] border text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                <ThumbsDown size={16} strokeWidth={1.6} />
              </button>
              {dislikeOpen ? (
                <div role="menu" className="absolute right-0 bottom-[44px] z-30 min-w-[220px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
                  {["Don't like the job", "Don't like the company", "Not a relevant job"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                      onClick={() => { setStatus(job.id, "dismissed"); setDislikeOpen(false); onClose(); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          </>
          ) : (
            <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex items-center gap-2 border-t bg-[color:var(--color-surface-1)] px-5 py-3">
              {status === "applied" || status === "interview" || status === "offer" || status === "rejection" ? (
                <button
                  type="button"
                  aria-label="Archive job"
                  onClick={() => setArchiveOpen(true)}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[4px] border px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
                >
                  <X size={15} strokeWidth={1.8} />
                  Archive job
                </button>
              ) : null}
              <a
                href={job.sources?.[0]?.url && job.sources[0].url !== "#" ? job.sources[0].url : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[4px] border text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                Open original job posting
              </a>
            </div>
          )}

          {/* Notes — available for every job (Pro) */}
          {pro ? (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Notes</div>
                {record.notes && !notesEditing ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setNotesEditing(true)}
                      className="inline-flex h-8 items-center gap-1 rounded-[4px] px-2 text-[12px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleNotesDelete}
                      className="inline-flex h-8 items-center gap-1 rounded-[4px] px-2 text-[12px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
              {record.notes && !notesEditing ? (
                <div className="mt-2 whitespace-pre-wrap rounded-[4px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] text-[color:var(--color-foreground)]">
                  {record.notes}
                </div>
              ) : (
                <>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotesLocal(e.target.value)}
                    rows={4}
                    placeholder="Notes — contacts, salary discussed, next steps…"
                    className="mt-2 w-full resize-y rounded-[4px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    {notesEditing ? (
                      <button
                        type="button"
                        onClick={handleNotesCancel}
                        className="inline-flex h-9 items-center rounded-[4px] border px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
                      >
                        Cancel
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleNotesSave}
                      disabled={notes.trim() === (record.notes ?? "")}
                      className="inline-flex h-9 items-center rounded-[4px] bg-[color:var(--color-accent)] px-3 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {!pro ? (
            <div className="mt-5" />
          ) : null}
          {!pro ? (
            <div className="rounded-[6px] border bg-[color:var(--color-mint)]/40 p-4">
              <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-green)]">Pro</span>
              <div className="mt-2 text-[14px] font-semibold text-[color:var(--color-foreground)]">Track this application</div>
              <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
                Save, mark applied, set interview reminders. Available on Pro.
              </p>
              <Link
                to="/settings"
                className="mt-3 inline-flex h-10 items-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
              >
                Go Pro
              </Link>
            </div>
          ) : inTracker ? (
            <div className="mt-6 flex flex-col gap-5">
              {/* Status */}
              <div>
                <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Status</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span
                    className="inline-flex items-center rounded-[4px] px-2 py-1 text-[13px] font-semibold"
                    style={{ background: "var(--color-surface-2)", color: "var(--color-foreground)" }}
                  >
                    {currentColumnTitle}
                  </span>
                  <div className="relative" ref={moveRef}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={moveOpen}
                      onClick={() => setMoveOpen((v) => !v)}
                      className="inline-flex h-9 items-center gap-1 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
                    >
                      Move to
                    </button>
                    {moveOpen ? (
                      <div
                        role="menu"
                        className="absolute right-0 top-[40px] z-30 min-w-[180px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                        style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
                      >
                        {moveOptions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                            onClick={() => requestMoveToColumn(c)}
                          >
                            {c.title}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 text-[13px] text-[color:var(--color-text-secondary)]">{dateLine}</div>
              </div>

              {/* Stage block */}
              {status === "interview" || status === "interview_screen" ? (
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Screen interview stage</div>
                  <select
                    className="mt-2 h-10 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 pr-8 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
                    value={record.interviewStage ?? SCREEN_INTERVIEW_STAGES[0]}
                    onChange={(e) => setInterviewStage(job.id, e.target.value)}
                  >
                    {SCREEN_INTERVIEW_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {status === "interview_tech" ? (
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Tech interview stage</div>
                  <select
                    className="mt-2 h-10 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 pr-8 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
                    value={record.interviewStage ?? TECH_INTERVIEW_STAGES[0]}
                    onChange={(e) => setInterviewStage(job.id, e.target.value)}
                  >
                    {TECH_INTERVIEW_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {status === "test_task" ? (
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Task details</div>
                  <textarea
                    value={record.interviewStage ?? ""}
                    onChange={(e) => setInterviewStage(job.id, e.target.value)}
                    rows={4}
                    placeholder="Link, scope, or notes about the task"
                    className="mt-2 w-full resize-y rounded-[4px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] outline-none focus-visible:border-[color:var(--color-accent)]"
                  />
                </div>
              ) : null}
              {status === "offer" ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Offer stage</div>
                    <select
                      className="mt-2 h-10 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 pr-8 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
                      value={record.offerStatus ?? OFFER_STAGES[0]}
                      onChange={(e) => setOfferStatus(job.id, e.target.value)}
                    >
                      {OFFER_STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Offer details</div>
                    <textarea
                      value={offerDraft}
                      onChange={(e) => setOfferDraft(e.target.value)}
                      onBlur={handleOfferBlur}
                      rows={4}
                      placeholder="Comp, deadline, notes (optional)"
                      className="mt-2 w-full resize-y rounded-[4px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] outline-none focus-visible:border-[color:var(--color-accent)]"
                    />
                  </div>
                </div>
              ) : null}
              {status === "rejection" ? (
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Rejection details</div>
                  <textarea
                    value={rejectionDraft}
                    onChange={(e) => setRejectionDraft(e.target.value)}
                    onBlur={handleRejectionBlur}
                    rows={4}
                    placeholder="What happened? (optional)"
                    className="mt-2 w-full resize-y rounded-[4px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] outline-none focus-visible:border-[color:var(--color-accent)]"
                  />
                </div>
              ) : null}

              {/* Reminder — Interview family + Offer */}
              {isInterviewFamily || status === "offer" ? (
              <div>
                <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Reminder</div>
                {record.reminderAt ? (
                  <div
                    className={`mt-2 flex items-center justify-between rounded-[4px] px-3 py-2 text-[13px] ${
                      status === "offer" ? "bg-[#D8FBEF]" : "bg-[#FFEDD4]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-[color:var(--color-foreground)]">
                      <Calendar size={14} strokeWidth={1.8} />
                      {dateHelpers.shortDateTime(record.reminderAt)}
                    </span>
                    <span className="flex items-center gap-3">
                      <button className={`text-[12px] font-semibold hover:underline ${status === "offer" ? "text-[color:var(--color-green)]" : "text-[#C2410C]"}`} onClick={() => setReminderOpen(true)}>Edit</button>
                      <button className={`text-[12px] font-semibold hover:underline ${status === "offer" ? "text-[color:var(--color-green)]" : "text-[#C2410C]"}`} onClick={() => setReminder(job.id, null)}>Remove</button>
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReminderOpen(true)}
                    className="mt-2 text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
                  >
                    Set a reminder
                  </button>
                )}
              </div>
              ) : null}

              {/* Documents used */}
              {(status === "applied" || isInterviewFamily || status === "offer" || status === "rejection") &&
              (record.appliedResumeName || record.appliedCoverLetterName || status === "applied") ? (
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Documents used</div>
                  <div className="mt-2 flex flex-col gap-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
                    <span className="inline-flex items-center gap-2">
                      <FileText size={14} strokeWidth={1.6} />
                      Resume: {record.appliedResumeName ?? "—"}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FileText size={14} strokeWidth={1.6} />
                      Cover letter: {record.appliedCoverLetterName ?? "—"}
                    </span>
                  </div>
                  {(status === "applied" || status === "interview" || status === "interview_screen" || status === "interview_tech" || status === "test_task" || status === "offer") ? (
                    <button
                      type="button"
                      onClick={() => setFollowUpOpen(true)}
                      className="mt-3 inline-flex h-9 items-center gap-2 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
                    >
                      <MailShare size={14} strokeWidth={1.6} />
                      Generate follow-up letter
                    </button>
                  ) : null}
                </div>
              ) : null}

              {/* History — must be the last block */}
              <JobHistory history={record.history} />
            </div>
          ) : null}

        </div>
      </div>

      <Dialog
        open={archiveOpen}
        onOpenChange={(o) => {
          if (!o) {
            setArchiveOpen(false);
            setArchiveReason("");
          }
        }}
      >
        <DialogContent className="max-w-[440px] rounded-[8px] p-5">
          <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Archive this job?
          </DialogTitle>
          <p className="mt-2 text-[13px] font-light" style={{ color: "var(--color-text-muted)", lineHeight: "20px" }}>
            <span style={{ color: "var(--color-foreground)" }}>{job.title}</span> at{" "}
            <span style={{ color: "var(--color-foreground)" }}>{job.company}</span> will be moved to
            Archived. You can restore it later.
          </p>
          <div className="mt-4">
            <label
              className="text-[12px] font-medium"
              style={{ color: "var(--color-foreground)", display: "block", marginBottom: 6 }}
            >
              Reason (optional)
            </label>
            <textarea
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="e.g. Position filled, lost interest, poor fit…"
              rows={3}
              className="w-full rounded-[4px] border bg-white p-2 text-[13px] outline-none focus:border-[#0E735A]"
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setArchiveOpen(false); setArchiveReason(""); }}
              className="inline-flex h-9 items-center rounded-[4px] border bg-white px-3 text-[13px] text-[color:var(--color-foreground)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const reason = archiveReason.trim();
                setArchiveOpen(false);
                setArchiveReason("");
                archiveJobWithReason(job.id, reason || undefined);
                onClose();
              }}
              className="inline-flex h-9 items-center rounded-[4px] px-3 text-[13px] font-medium text-white"
              style={{ background: "#D00D01" }}
            >
              Archive
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <InterviewReminderDialog
        open={reminderOpen}
        jobId={job.id}
        jobTitle={job.title}
        initialIso={record.reminderAt}
        onCancel={() => setReminderOpen(false)}
        onSave={(iso) => {
          setReminder(job.id, iso);
          setReminderOpen(false);
        }}
      />

      <FollowUpDialog job={job} open={followUpOpen} onClose={() => setFollowUpOpen(false)} />

      {pending && (pending.col.stage === "interview_screen" || pending.col.stage === "interview_tech") ? (
        <InterviewTransitionDialog
          open
          jobId={job.id}
          initialStage={record.interviewStage}
          initialReminderIso={record.reminderAt}
          title={pending.col.stage === "interview_tech" ? "Tech interview" : "Screen interview"}
          stages={pending.col.stage === "interview_tech" ? TECH_INTERVIEW_STAGES : SCREEN_INTERVIEW_STAGES}
          onCancel={cancelPending}
          onSave={({ stage, reminderIso }) => {
            setCardColumn(job.id, pending.col.id, pending.col.stage as JobStatus);
            setInterviewStage(job.id, stage);
            setReminder(job.id, reminderIso);
            setPending(null);
          }}
        />
      ) : null}
      {pending && pending.col.stage === "test_task" ? (
        <TestTaskTransitionDialog
          open
          jobId={job.id}
          initialDetails={record.interviewStage}
          initialReminderIso={record.reminderAt}
          onCancel={cancelPending}
          onSave={({ details, reminderIso }) => {
            setCardColumn(job.id, pending.col.id, "test_task");
            setInterviewStage(job.id, details || "Test task");
            setReminder(job.id, reminderIso);
            setPending(null);
          }}
        />
      ) : null}
      {pending && pending.col.stage === "rejection" ? (
        <RejectedTransitionDialog
          open
          initialDetails={record.rejectionDetails}
          onCancel={cancelPending}
          onSave={({ details }) => {
            setCardColumn(job.id, pending.col.id, "rejection");
            if (details) setRejectionDetails(job.id, details);
            setPending(null);
          }}
        />
      ) : null}
      {pending && pending.col.stage === "offer" ? (
        <OfferTransitionDialog
          open
          jobId={job.id}
          initialStage={record.offerStatus}
          initialReminderIso={record.reminderAt}
          initialDetails={record.offerDetails}
          onCancel={cancelPending}
          onSave={({ stage, reminderIso, details }) => {
            setCardColumn(job.id, pending.col.id, "offer");
            setOfferStatus(job.id, stage);
            setReminder(job.id, reminderIso);
            if (details) setOfferDetails(job.id, details);
            setPending(null);
          }}
        />
      ) : null}

    </div>
  );
}
