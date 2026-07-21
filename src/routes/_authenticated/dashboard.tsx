import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconBookmark as Bookmark, IconCheck as Check, IconChevronDown as ChevronDown, IconChevronUp as ChevronUp, IconExternalLink as ExternalLink, IconFileText as FileText, IconFlag as Flag, IconPencil as Pencil, IconPencil as PencilIcon, IconThumbDown as ThumbsDown, IconBolt as Zap } from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { JobDrawer } from "@/components/app/JobDrawer";
import { TODAY_JOBS, YESTERDAY_JOBS, type CardState, type Job } from "@/lib/jobs-data";
import { useResumeState } from "@/lib/resume-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Digest — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DigestScreen,
});

// ---------- Grouping ----------

type DigestGroup = { key: string; label: string; jobs: Job[] };

const TODAY: Job[] = TODAY_JOBS;
const YESTERDAY: Job[] = YESTERDAY_JOBS;

const OLDER_DAYS: DigestGroup[] = [
  { key: "d3", label: "Fri, Jul 17", jobs: YESTERDAY.slice(0, 5) },
  { key: "d4", label: "Thu, Jul 16", jobs: YESTERDAY.slice(0, 5) },
];

// ---------- Utilities ----------

function ago(days: number) {
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

// ---------- Header ----------

// ---------- Score ring ----------

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

// ---------- Profile card ----------

function ProfileCard() {
  const resume = useResumeState();
  const rows = [
    { label: "Field", value: "Program, Project & Technical-Adjacent" },
    { label: "Role", value: "Backend Engineer" },
    { label: "Stack", value: "Node, Java, Swift" },
    { label: "Experience", value: "Senior · 13y · English · Spanish · Dutch" },
    { label: "Location and salary", value: "New York City · Baltimore · Philadelphia · $100k–$160k" },
  ];
  return (
    <aside className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-4">
      <div className="flex items-start justify-between">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[6px] text-[20px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-green))" }}
          aria-hidden
        >
          S
        </div>
        <button type="button" aria-label="Edit profile" className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
          <PencilIcon size={16} strokeWidth={1.6} />
        </button>
      </div>
      <h2 className="mt-3 text-[16px] font-semibold text-[color:var(--color-foreground)]">Parameters</h2>
      <div className="mt-3 divide-y">
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
  return (
    <aside className="flex flex-col gap-4">
      <div className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4">
        <h3 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Tracker</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { n: 4, l: "Saved" },
            { n: 6, l: "Applied" },
            { n: 2, l: "Interview" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-[24px] leading-none text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-display)" }}>
                {s.n}
              </div>
              <div className="mt-1 text-[11px] text-[color:var(--color-text-muted)]">{s.l}</div>
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 text-[13px] font-semibold text-[color:var(--color-green)] hover:underline">
          Open tracker
        </button>
      </div>
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

function JobCard({
  job,
  state,
  setState,
  onOpen,
}: {
  job: Job;
  state: CardState;
  setState: (s: CardState) => void;
  onOpen: () => void;
}) {
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const applyRef = useOutsideClose(applyOpen, () => setApplyOpen(false));

  const saved = state === "saved";
  const applied = state === "applied";
  const dismissed = state === "dismissed";
  const reported = state === "reported";

  if (reported) {
    return (
      <div className="flex items-center justify-between rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3 text-[13px] text-[color:var(--color-text-secondary)]">
        <span>Thanks — we'll check this posting.</span>
        <button type="button" className="text-[color:var(--color-green)] font-semibold hover:underline" onClick={() => setState("default")}>
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
        onClick={dismissed ? undefined : onOpen}
        disabled={dismissed}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[14px] font-semibold text-white">
          {job.company.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-[color:var(--color-foreground)] group-hover:underline">
            {job.title}
          </span>
          <div className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location} · {job.salary}
          </div>
          <p className="mt-1 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
            {job.why}
          </p>
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
          {/* Thumbs-down */}
          <div className="relative" ref={dislikeRef}>
            <button
              type="button"
              aria-label="Dislike or report"
              aria-haspopup="menu"
              aria-expanded={dislikeOpen}
              aria-pressed={dismissed}
              onClick={() => setDislikeOpen((v) => !v)}
              className={`flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border ${dismissed ? "border-[color:var(--color-danger)] bg-[color:var(--color-danger-subtle)] text-[color:var(--color-danger)]" : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"}`}
              onDoubleClick={() => dismissed && setState("default")}
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
                  onClick={() => {
                    setState("dismissed");
                    setDislikeOpen(false);
                  }}
                >
                  <ThumbsDown size={15} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />
                  Dislike — not a good match
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
                  onClick={() => {
                    setState("reported");
                    setDislikeOpen(false);
                  }}
                >
                  <Flag size={15} strokeWidth={1.6} />
                  Report — looks fake or ghost
                </button>
              </div>
            ) : null}
          </div>

          {/* Bookmark */}
          <button
            type="button"
            aria-label="Save to tracker"
            aria-pressed={saved}
            onClick={() => setState(saved ? "default" : "saved")}
            className={`flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border ${saved ? "border-[color:var(--color-green)] bg-[color:var(--color-mint)] text-[color:var(--color-green)]" : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"}`}
          >
            <Bookmark size={15} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} />
          </button>

          {/* Apply */}
          {applied ? (
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-[color:var(--color-mint)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--color-green)]">
              <Check size={14} strokeWidth={2} />
              Applied
            </span>
          ) : (
            <div className="relative" ref={applyRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={applyOpen}
                onClick={() => setApplyOpen((v) => !v)}
                className="inline-flex h-[30px] items-center gap-1 rounded-[4px] bg-[color:var(--color-accent)] px-3 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
              >
                Apply
                <Zap size={13} strokeWidth={2} fill="currentColor" />
              </button>
              {applyOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[34px] z-30 min-w-[230px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-[color:var(--color-text-muted)]" aria-disabled>
                    <span className="flex items-center gap-2">
                      <Pencil size={14} strokeWidth={1.6} />
                      Tailor your resume
                    </span>
                    <span className="rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[10px]">Coming soon</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-[color:var(--color-text-muted)]" aria-disabled>
                    <span className="flex items-center gap-2">
                      <FileText size={14} strokeWidth={1.6} />
                      Generate a cover letter
                    </span>
                    <span className="rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[10px]">Coming soon</span>
                  </div>
                  <div className="border-t" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      window.open("#", "_blank");
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
            onClick={() => {
              setState("applied");
              setToast(false);
            }}
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

function OlderDayRow({
  group,
  getState,
  setState,
  onOpen,
}: {
  group: DigestGroup;
  getState: (job: Job) => CardState;
  setState: (id: string, s: CardState) => void;
  onOpen: (job: Job) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3 text-left"
      >
        <span className="text-[14px] text-[color:var(--color-text-secondary)]">
          {group.label} · {group.jobs.length} matches
        </span>
        {open ? <ChevronUp size={16} strokeWidth={1.6} /> : <ChevronDown size={16} strokeWidth={1.6} />}
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          {group.jobs.map((j) => (
            <JobCard
              key={`${group.key}-${j.id}`}
              job={j}
              state={getState(j)}
              setState={(s) => setState(j.id, s)}
              onOpen={() => onOpen(j)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DigestWall({
  getState,
  setState,
  onOpen,
}: {
  getState: (job: Job) => CardState;
  setState: (id: string, s: CardState) => void;
  onOpen: (job: Job) => void;
}) {
  const groups = useMemo(
    () => [
      { key: "today", label: "Today, Mon, Jul 20", jobs: TODAY },
      { key: "yesterday", label: "Yesterday, Sun, Jul 19", jobs: YESTERDAY },
    ],
    [],
  );

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
        {groups.map((g) => (
          <div key={g.key}>
            <DigestGroupHeader label={g.label} count={g.jobs.length} />
            <div className="flex flex-col gap-3">
              {g.jobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  state={getState(j)}
                  setState={(s) => setState(j.id, s)}
                  onOpen={() => onOpen(j)}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-3">
          {OLDER_DAYS.map((g) => (
            <OlderDayRow key={g.key} group={g} getState={getState} setState={setState} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Screen ----------

function DigestScreen() {
  const [states, setStates] = useState<Record<string, CardState>>({});
  const [openJob, setOpenJob] = useState<Job | null>(null);

  const getState = useCallback(
    (job: Job): CardState => states[job.id] ?? job.initialState ?? "default",
    [states],
  );
  const setState = useCallback((id: string, s: CardState) => {
    setStates((prev) => ({ ...prev, [id]: s }));
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active="digest" />
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-6 lg:pb-24">
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)_250px]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ProfileCard />
          </div>
          <div className="min-w-0">
            <DigestWall getState={getState} setState={setState} onOpen={setOpenJob} />
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <RightRail />
          </div>
        </div>
      </main>
      <MobileTabBar active="digest" />
      {openJob ? (
        <JobDrawer
          job={openJob}
          state={getState(openJob)}
          setState={(s) => setState(openJob.id, s)}
          onClose={() => setOpenJob(null)}
        />
      ) : null}
    </div>
  );
}