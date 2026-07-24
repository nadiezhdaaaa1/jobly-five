import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconX as X,
  IconBolt as Zap,
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
  archiveJob,
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
  INTERVIEW_STAGES,
  OFFER_STAGES,
} from "@/components/app/TrackerTransitionDialogs";
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
  const [pending, setPending] = useState<
    | { target: "interview" | "rejection" | "offer"; source: JobStatus }
    | null
  >(null);
  const flagRef = useOutsideClose(flagOpen, () => setFlagOpen(false));
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const moveRef = useOutsideClose(moveOpen, () => setMoveOpen(false));
  const saved = status === "saved";
  const [notes, setNotesLocal] = useState(record.notes ?? "");
  const [rejectionDraft, setRejectionDraft] = useState(record.rejectionDetails ?? "");
  const [offerDraft, setOfferDraft] = useState(record.offerDetails ?? "");

  useEffect(() => setNotesLocal(record.notes ?? ""), [job.id, record.notes]);
  useEffect(() => setRejectionDraft(record.rejectionDetails ?? ""), [job.id, record.rejectionDetails]);
  useEffect(() => setOfferDraft(record.offerDetails ?? ""), [job.id, record.offerDetails]);

  function handleNotesBlur() {
    if (notes !== (record.notes ?? "")) storeSetNotes(job.id, notes);
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

  const inTracker = status === "saved" || status === "applied" || status === "interview" || status === "offer" || status === "rejection";
  const columns: JobStatus[] = ["saved", "applied", "interview", "offer", "rejection"];
  const columnLabel: Record<string, string> = {
    saved: "Saved",
    applied: "Applied",
    interview: "Interview",
    offer: "Offers",
    rejection: "Rejected",
  };

  function requestMoveTo(target: JobStatus) {
    setMoveOpen(false);
    if (target === status) return;
    if (target === "applied") {
      setApplyOpen(true);
      return;
    }
    if (target === "saved") {
      setStatus(job.id, "saved");
      return;
    }
    setPending({ target: target as "interview" | "rejection" | "offer", source: status });
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
    if (status === "interview") return `Applied ${dateHelpers.shortDate(record.appliedAt ?? record.interviewAt)}`;
    if (status === "offer") return `Offer received ${dateHelpers.shortDate(record.offerAt)}`;
    if (status === "rejection") return `Received ${dateHelpers.shortDate(record.rejectionAt)}`;
    return `Saved ${dateHelpers.shortDate(record.savedAt ?? new Date().toISOString())}`;
  })();

  const reminderToday = record.reminderAt ? dateHelpers.isSameLocalDay(record.reminderAt) : false;
  const moveOptions = useMemo(() => columns.filter((c) => c !== status), [status]);
  void moveOptions;

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
        className="absolute right-0 top-0 h-full w-full overflow-y-auto bg-[color:var(--color-surface-1)] outline-none md:w-[480px] md:border-l"
        style={{
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          animation: reducedMotion ? undefined : "job-drawer-in 160ms ease-out",
        }}
      >
        <style>{`@keyframes job-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

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

          {!inTracker || status === "saved" ? (
          <>
          {/* Apply */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setApplyOpen(true)}
              className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-[4px] bg-[color:var(--color-accent)] text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Apply
              <Zap size={14} strokeWidth={2} fill="currentColor" />
            </button>
          </div>
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

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="relative" ref={flagRef}>
              <button
                type="button"
                aria-label="Report"
                onClick={() => setFlagOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[4px] border text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                <Flag size={15} strokeWidth={1.6} />
                Report
              </button>
              {flagOpen ? (
                <div role="menu" className="absolute left-0 top-[44px] z-30 min-w-[220px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
                  {["Spam/Scam", "Ghost/Expired", "Duplicate posting"].map((label) => (
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

            <div className="relative" ref={dislikeRef}>
              <button
                type="button"
                aria-label="Dislike"
                onClick={() => setDislikeOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[4px] border text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                <ThumbsDown size={15} strokeWidth={1.6} />
                Dislike
              </button>
              {dislikeOpen ? (
                <div role="menu" className="absolute left-1/2 top-[44px] z-30 min-w-[220px] -translate-x-1/2 overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
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

            <button
              type="button"
              aria-label="Save"
              aria-pressed={saved}
              onClick={() => setStatus(job.id, saved ? "default" : "saved")}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[4px] border text-[13px] font-semibold transition-colors hover:bg-[color:var(--color-surface-2)]"
              style={{
                borderColor: saved ? "var(--color-green)" : undefined,
                background: saved ? "var(--color-mint)" : undefined,
                color: saved ? "var(--color-green)" : "var(--color-foreground)",
              }}
            >
              <Bookmark size={15} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          </>
          ) : (
            <div className="mt-4 flex items-center gap-2">
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
                    {columnLabel[status]}
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
                        {moveOptions.map((k) => (
                          <button
                            key={k}
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                            onClick={() => requestMoveTo(k)}
                          >
                            {columnLabel[k]}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 text-[13px] text-[color:var(--color-text-secondary)]">{dateLine}</div>
              </div>

              {/* Stage block */}
              {status === "interview" ? (
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Interview stage</div>
                  <select
                    className="mt-2 h-10 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 pr-8 text-[14px] outline-none focus-visible:border-[color:var(--color-accent)]"
                    value={record.interviewStage ?? INTERVIEW_STAGES[0]}
                    onChange={(e) => setInterviewStage(job.id, e.target.value)}
                  >
                    {INTERVIEW_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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

              {/* Reminder — only for Interview and Offer */}
              {status === "interview" || status === "offer" ? (
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
              {(status === "applied" || status === "interview" || status === "offer" || status === "rejection") &&
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
                  {status === "applied" ? (
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

              {/* Notes — Saved and all tracked statuses (not default) */}
              {pro ? (
                <div>
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Notes</div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotesLocal(e.target.value)}
                    onBlur={handleNotesBlur}
                    rows={5}
                    placeholder="Notes — contacts, salary discussed, next steps…"
                    className="mt-2 w-full resize-y rounded-[4px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
                  />
                </div>
              ) : null}

              {/* History — must be the last block */}
              <JobHistory history={record.history} />
            </div>
          ) : null}

        </div>
      </div>

      <Dialog open={archiveOpen} onOpenChange={(o) => !o && setArchiveOpen(false)}>
        <DialogContent className="max-w-[420px] rounded-[8px] p-5">
          <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Are you sure?
          </DialogTitle>
          <p className="mt-2 text-[13px] font-light" style={{ color: "var(--color-text-muted)", lineHeight: "20px" }}>
            Remove <span style={{ color: "var(--color-foreground)" }}>{job.title}</span> at{" "}
            <span style={{ color: "var(--color-foreground)" }}>{job.company}</span> from{" "}
            {columnLabel[status] ?? status}? You can restore it later from Archived.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setArchiveOpen(false)}
              className="inline-flex h-9 items-center rounded-[4px] border bg-white px-3 text-[13px] text-[color:var(--color-foreground)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setArchiveOpen(false);
                archiveJob(job.id);
                onClose();
              }}
              className="inline-flex h-9 items-center rounded-[4px] px-3 text-[13px] font-medium text-white"
              style={{ background: "#D00D01" }}
            >
              Remove
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <InterviewReminderDialog
        open={reminderOpen}
        jobTitle={job.title}
        initialIso={record.reminderAt}
        onCancel={() => setReminderOpen(false)}
        onSave={(iso) => {
          setReminder(job.id, iso);
          setReminderOpen(false);
        }}
      />

      <FollowUpDialog job={job} open={followUpOpen} onClose={() => setFollowUpOpen(false)} />

      {pending?.target === "interview" ? (
        <InterviewTransitionDialog
          open
          initialStage={record.interviewStage}
          initialReminderIso={record.reminderAt}
          onCancel={cancelPending}
          onSave={({ stage, reminderIso }) => {
            setStatus(job.id, "interview");
            setInterviewStage(job.id, stage);
            setReminder(job.id, reminderIso);
            setPending(null);
          }}
        />
      ) : null}
      {pending?.target === "rejection" ? (
        <RejectedTransitionDialog
          open
          initialDetails={record.rejectionDetails}
          onCancel={cancelPending}
          onSave={({ details }) => {
            setStatus(job.id, "rejection");
            if (details) setRejectionDetails(job.id, details);
            setPending(null);
          }}
        />
      ) : null}
      {pending?.target === "offer" ? (
        <OfferTransitionDialog
          open
          initialStage={record.offerStatus}
          initialReminderIso={record.reminderAt}
          initialDetails={record.offerDetails}
          onCancel={cancelPending}
          onSave={({ stage, reminderIso, details }) => {
            setStatus(job.id, "offer");
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
