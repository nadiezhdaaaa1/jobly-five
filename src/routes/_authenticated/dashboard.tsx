import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Flag,
  Kanban,
  Mail,
  Pencil,
  Pencil as PencilIcon,
  ThumbsDown,
  User as UserIcon,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Digest — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DigestScreen,
});

// ---------- Types & mock data ----------

type Source = "direct" | "aggregated";
type CardState = "default" | "saved" | "applied" | "dismissed" | "reported";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  score: number;
  why: string;
  source: Source;
  postedDays: number;
  initialState?: CardState;
};

type DigestGroup = { key: string; label: string; jobs: Job[] };

const TODAY: Job[] = [
  { id: "t1", title: "Lead UI Developer", company: "Nimbus Corp", location: "Remote (US)", salary: "$160–200K", score: 95, why: "Expert in Vue.js + JavaScript, leadership role, competitive salary", source: "direct", postedDays: 3, initialState: "saved" },
  { id: "t2", title: "Principal Frontend Developer", company: "Orion Tech", location: "Hybrid, Los Angeles", salary: "$150–190K", score: 86, why: "Proficient in Angular + TypeScript, senior position, salary fits your expectations", source: "aggregated", postedDays: 1 },
  { id: "t3", title: "Senior React Engineer", company: "Vertex Solutions", location: "Remote (US)", salary: "$165–205K", score: 74, why: "Strong React + Redux skills, senior level, salary aligned with your range", source: "aggregated", postedDays: 4 },
  { id: "t4", title: "Frontend Architect", company: "Helix Innovations", location: "Remote (US)", salary: "$180–220K", score: 71, why: "Expertise in Svelte + TypeScript, senior role, salary within your range", source: "direct", postedDays: 6, initialState: "applied" },
  { id: "t5", title: "UI Engineer Lead", company: "Quantum Leap", location: "Remote (US)", salary: "$175–215K", score: 70, why: "Strong React + GraphQL experience, senior level, salary matches your expectations", source: "direct", postedDays: 8, initialState: "dismissed" },
];

const YESTERDAY: Job[] = [
  { id: "y1", title: "Staff Frontend Engineer", company: "Vercel", location: "Remote (US)", salary: "$190–230K", score: 79, why: "Next.js + React expert, staff-level scope, salary above your target", source: "direct", postedDays: 2 },
  { id: "y2", title: "Senior Software Engineer, Web", company: "Figma", location: "Hybrid, San Francisco", salary: "$175–215K", score: 68, why: "TypeScript + React fit, senior IC track, salary in range", source: "direct", postedDays: 2 },
  { id: "y3", title: "Senior Frontend Engineer", company: "Linear", location: "Remote (US)", salary: "$170–210K", score: 76, why: "React + TypeScript match, senior role, competitive comp", source: "direct", postedDays: 3 },
  { id: "y4", title: "Senior Product Engineer", company: "Notion", location: "Hybrid, New York", salary: "$180–220K", score: 72, why: "Full-stack React fit, senior scope, salary aligned", source: "aggregated", postedDays: 3 },
  { id: "y5", title: "Senior Frontend Developer", company: "Ramp", location: "Hybrid, New York", salary: "$175–210K", score: 70, why: "React + TS strong match, senior level, salary within range", source: "direct", postedDays: 4 },
];

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

function AppHeader({ hasNewDigest = true }: { hasNewDigest?: boolean }) {
  const tabs: Array<{ key: string; label: string; icon: typeof Mail; active?: boolean; dot?: boolean }> = [
    { key: "digest", label: "Digest", icon: Mail, active: true, dot: hasNewDigest },
    { key: "tracker", label: "Tracker", icon: Kanban },
    { key: "resume", label: "Resume", icon: FileText },
    { key: "profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-[color:var(--color-surface-1)]">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[20px] font-semibold leading-none text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-logo)" }}>
            jobly
          </span>
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-green)]">
            Pro
          </span>
        </Link>
        <nav className="hidden md:flex items-end gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                className={`relative flex h-14 w-[76px] flex-col items-center justify-center gap-1 border-b-2 ${t.active ? "border-[color:var(--color-foreground)] text-[color:var(--color-foreground)]" : "border-transparent text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]"}`}
                aria-current={t.active ? "page" : undefined}
              >
                <span className="relative">
                  <Icon size={19} strokeWidth={1.6} />
                  {t.dot ? (
                    <span
                      className="absolute -right-1 -top-1 h-[7px] w-[7px] rounded-full bg-[color:var(--color-accent)]"
                      style={{ boxShadow: "0 0 0 1.5px #fff" }}
                      aria-hidden
                    />
                  ) : null}
                </span>
                <span className="text-[11px] leading-none">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function MobileTabBar({ hasNewDigest = true }: { hasNewDigest?: boolean }) {
  const tabs: Array<{ key: string; label: string; icon: typeof Mail; active?: boolean; dot?: boolean }> = [
    { key: "digest", label: "Digest", icon: Mail, active: true, dot: hasNewDigest },
    { key: "tracker", label: "Tracker", icon: Kanban },
    { key: "resume", label: "Resume", icon: FileText },
    { key: "profile", label: "Profile", icon: UserIcon },
  ];
  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-[color:var(--color-surface-1)]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              className={`relative flex h-14 flex-col items-center justify-center gap-1 border-t-2 ${t.active ? "border-[color:var(--color-foreground)] text-[color:var(--color-foreground)]" : "border-transparent text-[color:var(--color-text-muted)]"}`}
            >
              <span className="relative">
                <Icon size={19} strokeWidth={1.6} />
                {t.dot ? (
                  <span
                    className="absolute -right-1 -top-1 h-[7px] w-[7px] rounded-full bg-[color:var(--color-accent)]"
                    style={{ boxShadow: "0 0 0 1.5px #fff" }}
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="text-[11px] leading-none">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------- Score ring ----------

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${score} percent match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-green)" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[14px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
        {score}%
      </span>
    </div>
  );
}

// ---------- Profile card ----------

function ProfileCard() {
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
          <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Add your resume</div>
          <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            Sharpen your matches — upload a file or build one in minutes. Your quiz answers are already in.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Add resume
          </button>
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

function JobCard({ job }: { job: Job }) {
  const [state, setState] = useState<CardState>(job.initialState ?? "default");
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
      className={`relative rounded-[6px] border bg-[color:var(--color-surface-1)] p-4 ${dismissed ? "opacity-55" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[14px] font-semibold text-white">
          {job.company.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <a href="#" className="block text-[15px] font-semibold text-[color:var(--color-foreground)] hover:underline">
            {job.title}
          </a>
          <div className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location} · {job.salary}
          </div>
          <p className="mt-1 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
            {job.why}
          </p>
        </div>
        <ScoreRing score={job.score} />
      </div>

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

function OlderDayRow({ group }: { group: DigestGroup }) {
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
            <JobCard key={`${group.key}-${j.id}`} job={j} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DigestWall() {
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
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-3">
          {OLDER_DAYS.map((g) => (
            <OlderDayRow key={g.key} group={g} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Screen ----------

function DigestScreen() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader />
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-6 lg:pb-24">
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)_250px]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ProfileCard />
          </div>
          <div className="min-w-0">
            <DigestWall />
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <RightRail />
          </div>
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}