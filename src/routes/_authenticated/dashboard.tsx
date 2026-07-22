import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconBookmark as Bookmark,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconExternalLink as ExternalLink,
  IconFlag as Flag,
  IconPencil as PencilIcon,
  IconThumbDown as ThumbsDown,
  IconX as X,
  IconBolt as Zap,
} from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { JobDrawer } from "@/components/app/JobDrawer";
import { getDigestDays, type Job } from "@/lib/jobs-data";
import { useResumeState } from "@/lib/resume-store";
import { loadQuiz } from "@/lib/quiz-store";
import { SUMMARY_LABEL, summaryValue, type StepKey } from "@/routes/quiz";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePlan, isPro } from "@/lib/plan-store";
import {
  setStatus,
  useCounts,
  useJobRecord,
  type JobStatus,
} from "@/lib/tracker-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Digest — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DigestScreen,
});

// ---------- Utilities ----------

function ago(days: number) {
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

// ---------- Header ----------

// ---------- Score ring ----------

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const plan = usePlan();
  if (!isPro(plan)) {
    return (
      <div
        className="relative flex shrink-0 items-center justify-center rounded-full"
        style={{ width: size, height: size, background: "var(--color-surface-2)" }}
        role="img"
        aria-label="Match score locked — upgrade to Pro"
        title="Upgrade to Pro to see match scores"
      >
        <svg width={size - 8} height={size - 8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--color-text-muted)]">
          <rect x="4" y="11" width="16" height="9" rx="1.5" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      </div>
    );
  }
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

// ---------- Profile card ----------

function ParametersCard() {
  const resume = useResumeState();
  const quiz = useMemo(() => loadQuiz(), []);
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      const path = data?.avatar_url ?? null;
      if (!active || !path) return;
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (active && signed?.signedUrl) setAvatarUrl(signed.signedUrl);
    })();
    return () => {
      active = false;
    };
  }, [user]);
  const initial = (user?.email ?? "S").charAt(0).toUpperCase();
  const STEPS: StepKey[] = ["field", "role", "hard", "tools", "soft", "level", "loc"];
  const rows = STEPS.map((k) => ({
    label: SUMMARY_LABEL[k],
    value: summaryValue(k, quiz) || "-",
  }));
  return (
    <aside className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain">
      <div className="flex items-start justify-between">
        <div
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[6px] text-[20px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #00F1A9, #0E735A)" }}
          aria-hidden
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <Link to="/profile" aria-label="Edit profile" className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
          <PencilIcon size={16} strokeWidth={1.6} />
        </Link>
      </div>
      <div className="mt-4 divide-y">
        {rows.map((r) => (
          <div key={r.label} className="py-3 first:pt-0">
            <div className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-muted)]">{r.label}</div>
            <div className="mt-1 text-[14px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300 }}>{r.value}</div>
          </div>
        ))}
        <div className="pt-4">
          {resume.hasResume ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Resume</span>
                <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-green)]">
                  Added
                </span>
              </div>
              <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
                Powering your matches since {resume.addedDate}.
              </p>
              <Link
                to="/resume"
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[4px] border px-4 text-[14px] font-semibold text-[color:var(--color-foreground)] hover:border-[color:var(--color-border-strong)]"
              >
                Manage resume
              </Link>
            </div>
          ) : (
            <div>
              <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Add your resume</div>
              <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
                Sharpen your matches — upload a file or build one in minutes. Your quiz answers are already in.
              </p>
              <Link
                to="/resume"
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
              >
                Add resume
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ---------- Right rail ----------

function RightRail() {
  const plan = usePlan();
  const pro = isPro(plan);
  const counts = useCounts();
  const items = [
    { n: counts.saved, l: "Saved" },
    { n: counts.applied, l: "Applied" },
    { n: counts.interview, l: "Interview" },
  ];
  return (
    <aside className="flex flex-col gap-4">
      {pro ? (
      <div className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4">
        <h3 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Tracker</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {items.map((s) => (
            <div key={s.l}>
              <div className="text-[24px] leading-none text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-display)" }}>
                {s.n}
              </div>
              <div className="mt-1 text-[11px] text-[color:var(--color-text-muted)]">{s.l}</div>
            </div>
          ))}
        </div>
        <Link to="/tracker" className="mt-3 inline-block button-small text-[color:var(--color-green)] hover:underline">
          Open tracker
        </Link>
      </div>
      ) : (
      <div className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4">
        <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-green)]">Pro</span>
        <h3 className="mt-2 text-[14px] font-semibold text-[color:var(--color-foreground)]">Track every application</h3>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Saved, applied, interviews, offers — organized. Pro unlocks the full tracker.
        </p>
        <Link to="/settings" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]">
          Go Pro
        </Link>
      </div>
      )}
      <div className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4 opacity-55" aria-disabled>
        <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[color:var(--color-text-muted)]">
          In development
        </span>
        <h3 className="mt-2 text-[14px] font-semibold text-[color:var(--color-foreground)]">Salary insights</h3>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Your range vs the market.
        </p>
      </div>
    </aside>
  );
}

// ---------- Menus ----------

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

// ---------- Job card ----------

function statusLabel(s: JobStatus) {
  switch (s) {
    case "applied": return "Applied";
    case "interview": return "Interview";
    case "offer": return "Offer";
    case "rejection": return "Rejection";
    default: return "Saved";
  }
}

function JobCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  const plan = usePlan();
  const pro = isPro(plan);
  const record = useJobRecord(job.id);
  const state = record.status;
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const applyRef = useOutsideClose(applyOpen, () => setApplyOpen(false));
  const statusRef = useOutsideClose(statusOpen, () => setStatusOpen(false));

  const saved = state === "saved";
  const dismissed = state === "dismissed";
  const reported = state === "reported";
  const inTracker = state === "applied" || state === "interview" || state === "offer" || state === "rejection";

  // Regime C — dismissed / reported compact rows
  if (reported) {
    return (
      <div className="flex items-center justify-between rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3 text-[13px] text-[color:var(--color-text-secondary)]">
        <span>Thanks — we'll check this posting.</span>
        <button type="button" className="text-[color:var(--color-green)] font-semibold hover:underline" onClick={() => setStatus(job.id, "default")}>
          Undo
        </button>
      </div>
    );
  }
  if (dismissed) {
    return (
      <div className="flex items-center justify-between rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3 text-[13px] text-[color:var(--color-text-muted)] opacity-70">
        <span className="truncate">{job.title} — dismissed</span>
        <button type="button" className="text-[color:var(--color-green)] font-semibold hover:underline" onClick={() => setStatus(job.id, "default")}>
          Undo
        </button>
      </div>
    );
  }

  return (
    <article
      className={`group relative rounded-[6px] border bg-[color:var(--color-surface-1)] p-4 transition-colors ${dismissed ? "opacity-55" : "hover:border-[color:var(--color-border-strong)]"}`}
    >
      <button
        type="button"
        aria-label={`Open details for ${job.title}`}
        onClick={onOpen}
        className="flex w-full items-start gap-3 text-left"
      >
        {job.logo ? (
          <img
            src={job.logo}
            alt={`${job.company} logo`}
            className="h-10 w-10 shrink-0 rounded-[4px] object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[14px] font-semibold text-white">
            {job.company.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-[color:var(--color-foreground)] group-hover:underline">
            {job.title}
          </span>
          <div className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location} · {job.salary}
          </div>
          {pro ? (
            <p className="mt-1 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
              {job.why}
            </p>
          ) : null}
        </div>
        <ScoreRing score={job.score} />
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.source === "direct" ? (
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[12px] text-[color:var(--color-green)]">
            Direct employer
          </span>
        ) : (
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[12px] text-[color:var(--color-text-secondary)]">
            Aggregated
          </span>
        )}
        <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[12px] text-[color:var(--color-text-muted)]">
          {ago(job.postedDays)}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {inTracker ? (
            // ---------- Regime B ----------
            <>
              <div className="relative" ref={dislikeRef}>
                <button
                  type="button"
                  aria-label="Remove from tracker or report"
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
                    className="absolute right-0 top-[34px] z-30 min-w-[230px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
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

              <div className="relative" ref={statusRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={statusOpen}
                  onClick={() => setStatusOpen((v) => !v)}
                  className="inline-flex h-[30px] items-center gap-1 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
                >
                  {statusLabel(state)}
                  <ChevronDown size={13} strokeWidth={2} />
                </button>
                {statusOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[34px] z-30 min-w-[180px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                    style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
                  >
                    {(["saved", "applied", "interview", "offer", "rejection"] as JobStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="menuitem"
                        onClick={() => { setStatus(job.id, s); setStatusOpen(false); }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)] ${state === s ? "font-semibold text-[color:var(--color-green)]" : ""}`}
                      >
                        {statusLabel(s)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            // ---------- Regime A ----------
            <>
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
                className="absolute right-0 top-[34px] z-30 min-w-[230px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
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

          <button
            type="button"
            aria-label="Save the opening"
            title="Save the opening"
            aria-pressed={saved}
            onClick={() => setStatus(job.id, saved ? "default" : "saved")}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
          >
            <Bookmark
              size={15}
              strokeWidth={1.6}
              className={saved ? "text-[color:var(--color-foreground)]" : ""}
              fill={saved ? "var(--color-accent)" : "none"}
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
                    onClick={() => {
                      window.open(job.postingUrl ?? "#", "_blank");
                      setApplyOpen(false);
                      setToast(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                  >
                    <ExternalLink size={14} strokeWidth={1.6} />
                    Open posting to apply
                  </button>
                </div>
              ) : null}
            </div>
            </>
          )}
        </div>
      </div>

      {toast ? (
        <div
          className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit items-center gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3 text-[13px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
          role="status"
        >
          <span>Did you apply to {job.title}?</span>
          <button
            type="button"
            className="rounded-[4px] bg-[color:var(--color-accent)] px-3 py-1 text-[12px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            onClick={() => { setStatus(job.id, "applied"); setToast(false); }}
          >
            Yes, mark as applied
          </button>
          <button
            type="button"
            className="rounded-[4px] border px-3 py-1 text-[12px] text-[color:var(--color-text-secondary)]"
            onClick={() => setToast(false)}
          >
            Not yet
          </button>
        </div>
      ) : null}
    </article>
  );
}

// ---------- Digest wall ----------

function DigestGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-3 mt-2 flex items-baseline justify-between">
      <div className="text-[15px] text-[color:var(--color-text-secondary)]" style={{ fontFamily: "var(--font-display)" }}>
        {label}
      </div>
      <div className="text-[12px] text-[color:var(--color-text-muted)]">{count} matches</div>
    </div>
  );
}

function DigestWall({ onOpen }: { onOpen: (job: Job) => void }) {
  const allDays = useMemo(() => getDigestDays(), []);
  const [visibleCount, setVisibleCount] = useState(2);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visibleCount >= allDays.length) return;
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((c) => Math.min(c + 1, allDays.length));
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visibleCount, allDays.length]);

  const days = allDays.slice(0, visibleCount);

  return (
    <section>
      <h1 className="text-[24px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
        Good morning, Serhii
      </h1>
      <p className="mt-1 text-[14px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
        Latest digest arrived{" "}
        <span className="font-semibold text-[color:var(--color-text-secondary)]">Today at 9:02</span>
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {days.map((g) => (
          <div key={g.key}>
            <DigestGroupHeader label={g.label} count={g.jobs.length} />
            <div className="flex flex-col gap-3">
              {g.jobs.map((j) => (
                <JobCard key={j.id} job={j} onOpen={() => onOpen(j)} />
              ))}
            </div>
          </div>
        ))}

        {visibleCount < allDays.length ? (
          <div ref={sentinel} className="py-6 text-center text-[13px] text-[color:var(--color-text-muted)]">
            Loading older digests…
          </div>
        ) : (
          <div className="py-6 text-center text-[12px] text-[color:var(--color-text-muted)]">
            You've reached the end of your digest history.
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Screen ----------

function DigestScreen() {
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const plan = usePlan();
  const pro = isPro(plan);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active="digest" />
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-6 lg:pb-24">
        {!pro ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border bg-[color:var(--color-mint)]/40 px-4 py-3">
            <div className="text-[13px] text-[color:var(--color-foreground)]">
              You're on <span className="font-semibold">Free</span> — weekly digest, top 5 matches. Match scores and the tracker are Pro.
            </div>
            <Link to="/settings" className="inline-flex h-9 items-center rounded-[4px] bg-[color:var(--color-accent)] px-3 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]">
              Go Pro
            </Link>
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)_250px]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ParametersCard />
          </div>
          <div className="min-w-0">
            <DigestWall onOpen={setOpenJob} />
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <RightRail />
          </div>
        </div>
      </main>
      <MobileTabBar active="digest" />
      {openJob ? (
        <JobDrawer job={openJob} onClose={() => setOpenJob(null)} />
      ) : null}
    </div>
  );
}