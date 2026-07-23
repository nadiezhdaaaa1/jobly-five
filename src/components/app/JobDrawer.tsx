import { useEffect, useRef, useState } from "react";
import {
  IconCalendar as Calendar,
  IconCheck as Check,
  IconExternalLink as ExternalLink,
  IconX as X,
  IconBolt as Zap,
  IconBookmark as Bookmark,
  IconFlag as Flag,
  IconThumbDown as ThumbsDown,
} from "@tabler/icons-react";
import type { Job } from "@/lib/jobs-data";
import { dateHelpers, setReminder, setStatus, useJobRecord, type JobStatus } from "@/lib/tracker-store";
import { InterviewReminderDialog } from "@/components/app/InterviewReminderDialog";
import { MatchLine } from "@/components/app/MatchLine";
import congratAsset from "@/assets/congrat.png.asset.json";
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
  const [postingToast, setPostingToast] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const flagRef = useOutsideClose(flagOpen, () => setFlagOpen(false));
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const applyRef = useOutsideClose(applyOpen, () => setApplyOpen(false));
  const saved = status === "saved";

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

  const isPipeline = status === "saved" || status === "applied" || status === "interview";
  const isOffer = status === "offer";
  const isRejection = status === "rejection";
  const inTracker = status !== "default" && status !== "dismissed" && status !== "reported";

  function handleStatus(next: JobStatus) {
    if (next === "interview") {
      setStatus(job.id, "interview");
      setReminderOpen(true);
      return;
    }
    setStatus(job.id, next);
  }

  function handleOpenPosting() {
    window.open(job.postingUrl ?? "#", "_blank");
    if (status !== "applied" && status !== "interview" && status !== "offer" && status !== "rejection") {
      setPostingToast(true);
    }
  }

  const dateLine = (() => {
    if (status === "applied") return `Applied ${dateHelpers.shortDate(record.appliedAt)}`;
    if (status === "interview") return `Applied ${dateHelpers.shortDate(record.appliedAt ?? record.interviewAt)}`;
    if (status === "offer") return `Offer received ${dateHelpers.shortDate(record.offerAt)}`;
    if (status === "rejection") return `Received ${dateHelpers.shortDate(record.rejectionAt)}`;
    return `Saved ${dateHelpers.shortDate(record.savedAt ?? new Date().toISOString())}`;
  })();

  const reminderToday = record.reminderAt ? dateHelpers.isSameLocalDay(record.reminderAt) : false;

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
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sticky top-4 z-20 float-right mr-4 mt-4 flex h-8 w-8 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          <X size={16} strokeWidth={1.6} />
        </button>

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

          {/* Apply + actions */}
          <div className="relative mt-4" ref={applyRef}>
            <button
              type="button"
              onClick={() => setApplyOpen((v) => !v)}
              className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-[4px] bg-[color:var(--color-accent)] text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Apply
              <Zap size={14} strokeWidth={2} fill="currentColor" />
            </button>
            {applyOpen ? (
              <div role="menu" className="absolute right-0 top-[44px] z-30 min-w-[240px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
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
                  onClick={() => { setApplyOpen(false); handleOpenPosting(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                >
                  <ExternalLink size={14} strokeWidth={1.6} />
                  Open posting to apply
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="relative" ref={flagRef}>
              <button
                type="button"
                aria-label="Report"
                onClick={() => setFlagOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[4px] border text-[13px] font-semibold text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
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
                      onClick={() => { setStatus(job.id, "reported"); setFlagOpen(false); }}
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
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[4px] border text-[13px] font-semibold text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
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
                      onClick={() => { setStatus(job.id, "dismissed"); setDislikeOpen(false); }}
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
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[4px] border text-[13px] font-semibold transition-colors"
              style={{
                borderColor: saved ? "var(--color-green)" : undefined,
                background: saved ? "var(--color-mint)" : undefined,
                color: saved ? "var(--color-green)" : "var(--color-text-muted)",
              }}
            >
              <Bookmark size={15} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>

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
          ) : isPipeline ? (
            <div className="mt-5"><PipelinePanel
              status={status}
              dateLine={dateLine}
              reminderIso={record.reminderAt}
              reminderToday={reminderToday}
              onStatus={handleStatus}
              onSetReminder={() => setReminderOpen(true)}
              onEditReminder={() => setReminderOpen(true)}
              onRemoveReminder={() => setReminder(job.id, null)}
              onRejection={() => setStatus(job.id, "rejection")}
              onOffer={() => setStatus(job.id, "offer")}
            /></div>
          ) : isOffer ? (
            <div className="mt-5"><OfferPanel dateLine={dateLine} onChangeStatus={handleStatus} /></div>
          ) : isRejection ? (
            <div className="mt-5"><RejectionPanel dateLine={dateLine} onChangeStatus={handleStatus} /></div>
          ) : null}

          {/* Footer */}
          <div className="mt-5 flex items-center justify-end text-[13px]">
            {inTracker ? (
              <button
                type="button"
                onClick={() => setStatus(job.id, "default")}
                className="text-[color:var(--color-text-muted)] hover:underline"
              >
                Remove from tracker
              </button>
            ) : <span />}
          </div>
        </div>
      </div>

      <InterviewReminderDialog
        open={reminderOpen}
        jobTitle={job.title}
        initialIso={record.reminderAt}
        onCancel={() => setReminderOpen(false)}
        onSave={(iso) => {
          setReminder(job.id, iso);
          setStatus(job.id, "interview");
          setReminderOpen(false);
        }}
      />

      {postingToast ? (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-[70] mx-auto flex w-fit items-center gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3 text-[13px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
        >
          <span>Did you apply to {job.title}?</span>
          <button
            type="button"
            onClick={() => { setStatus(job.id, "applied"); setPostingToast(false); }}
            className="rounded-[4px] bg-[color:var(--color-accent)] px-3 py-1 text-[12px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Yes, mark as applied
          </button>
          <button
            type="button"
            onClick={() => setPostingToast(false)}
            className="rounded-[4px] border px-3 py-1 text-[12px] text-[color:var(--color-text-secondary)]"
          >
            Not yet
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PipelinePanel({
  status,
  dateLine,
  reminderIso,
  reminderToday,
  onStatus,
  onSetReminder,
  onEditReminder,
  onRemoveReminder,
  onRejection,
  onOffer,
}: {
  status: JobStatus;
  dateLine: string;
  reminderIso?: string;
  reminderToday: boolean;
  onStatus: (s: JobStatus) => void;
  onSetReminder: () => void;
  onEditReminder: () => void;
  onRemoveReminder: () => void;
  onRejection: () => void;
  onOffer: () => void;
}) {
  const tabs: { key: JobStatus; label: string }[] = [
    { key: "saved", label: "Saved" },
    { key: "applied", label: "Applied" },
    { key: "interview", label: "Interview" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRejection}
          className="inline-flex h-10 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] text-[14px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        >
          Rejection
        </button>
        <button
          type="button"
          onClick={onOffer}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-[4px] bg-[color:var(--color-accent)] text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
        >
          Received offer
          <Zap size={13} strokeWidth={2} fill="currentColor" />
        </button>
      </div>
      <div>
        <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Status</div>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-[4px] border p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onStatus(t.key)}
              className={`h-8 rounded-[4px] text-[13px] font-semibold transition-colors ${
                t.key === status
                  ? "bg-[color:var(--color-green)] text-white"
                  : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="text-[13px] text-[color:var(--color-text-secondary)]">{dateLine}</div>

      {status === "interview" ? (
        <div>
          <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Interview reminder</div>
          {reminderIso ? (
            <div
              className={`mt-2 flex items-center justify-between rounded-[4px] px-3 py-2 text-[13px] ${
                reminderToday ? "bg-[#FFEDD4]" : "bg-[color:var(--color-surface-2)]"
              }`}
            >
              <span className="inline-flex items-center gap-2 text-[color:var(--color-foreground)]">
                <Calendar size={14} strokeWidth={1.8} />
                {dateHelpers.shortDateTime(reminderIso)}
              </span>
              <span className="flex items-center gap-3">
                <button className="text-[12px] font-semibold text-[color:var(--color-green)] hover:underline" onClick={onEditReminder}>Edit</button>
                <button className="text-[12px] text-[color:var(--color-text-muted)] hover:underline" onClick={onRemoveReminder}>Remove</button>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSetReminder}
              className="mt-2 text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
            >
              Set a reminder
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function OfferPanel({ dateLine, onChangeStatus }: { dateLine: string; onChangeStatus: (s: JobStatus) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-[8px] border border-[color:var(--color-accent)] bg-[color:var(--color-mint)] p-4">
        <div
          className="relative z-10 text-[color:var(--color-foreground)]"
          style={{ fontSize: 13, fontWeight: 300 }}
        >
          Congratulations on the offer!
        </div>
        <img
          src={congratAsset.url}
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
          style={{ height: "100%", width: "auto" }}
        />
      </div>
      <div className="text-[13px] text-[color:var(--color-text-secondary)]">{dateLine}</div>
      <ChangeStatusLink onChange={onChangeStatus} />
    </div>
  );
}

function RejectionPanel({ dateLine, onChangeStatus }: { dateLine: string; onChangeStatus: (s: JobStatus) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[8px] p-4" style={{ background: "#FFE2E2" }}>
        <div className="text-[13px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300 }}>Rejection</div>
        <p className="mt-1 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          The right offer is close. Check the latest digest for more great opportunities.
        </p>
      </div>
      <div className="text-[13px] text-[color:var(--color-text-secondary)]">{dateLine}</div>
      <ChangeStatusLink onChange={onChangeStatus} />
    </div>
  );
}

function ChangeStatusLink({ onChange }: { onChange: (s: JobStatus) => void }) {
  const [open, setOpen] = useState(false);
  const opts: { key: JobStatus; label: string }[] = [
    { key: "applied", label: "Applied" },
    { key: "interview", label: "Interview" },
    { key: "offer", label: "Received offer" },
    { key: "rejection", label: "Rejection" },
  ];
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[13px] text-[color:var(--color-text-muted)] hover:underline"
      >
        Change status
      </button>
      {open ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {opts.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => { onChange(o.key); setOpen(false); }}
              className="rounded-[4px] border px-3 py-1 text-[12px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Silence unused import warning if any (Check kept for potential future use)
void Check;