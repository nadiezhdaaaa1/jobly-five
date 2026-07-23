import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconBookmark as Bookmark,
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
  IconExternalLink as ExternalLink,
  IconFlag as Flag,
  IconBan,
  IconThumbDown as ThumbsDown,
  IconPlus,
  IconX as X,
  IconBolt as Zap,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { JobDrawer } from "@/components/app/JobDrawer";
import { getAllJobs, type Job } from "@/lib/jobs-data";
import { loadQuiz, type QuizAnswers } from "@/lib/quiz-store";
import { usePlan, isPro } from "@/lib/plan-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { setStatus, useCounts, useJobRecord, type JobStatus } from "@/lib/tracker-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Jobs — Jobly" },
      { name: "description", content: "Your live wall of matched roles. Filter by role, skills, level, sources, and match score." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JobsScreen,
});

// ============================================================
// Boards, seniority, remote inference
// ============================================================

const ALL_BOARDS = [
  "LinkedIn",
  "Indeed",
  "Greenhouse",
  "Lever",
  "Ashby",
  "Workable",
  "Wellfound",
  "Built In",
  "RemoteOK",
  "We Work Remotely",
] as const;
type Board = (typeof ALL_BOARDS)[number];
const DIRECT_BOARDS: ReadonlySet<Board> = new Set(["Greenhouse", "Lever", "Ashby", "Workable"]);

const SENIORITIES = ["Junior", "Middle", "Senior", "Lead", "Exec"] as const;
type Seniority = (typeof SENIORITIES)[number];

const ENGLISH_LEVELS = [
  "No English",
  "Elementary · A1",
  "Pre-intermediate · A2",
  "Intermediate · B1",
  "Upper-intermediate · B2",
  "Advanced · C1",
  "Proficient · C2",
  "Native speaker",
] as const;

function inferSeniority(title: string): Seniority {
  const t = title.toLowerCase();
  if (/\b(principal|staff)\b/.test(t)) return "Lead";
  if (/\blead|head|director|vp\b/.test(t)) return "Lead";
  if (/\bexec|chief|cto|cpo\b/.test(t)) return "Exec";
  if (/\bsenior|sr\.?\b/.test(t)) return "Senior";
  if (/\bjunior|jr\.?|entry\b/.test(t)) return "Junior";
  if (/\bmid|middle|intermediate\b/.test(t)) return "Middle";
  return "Senior";
}

function inferBoard(job: Job): Board {
  const primary = job.sources?.[0]?.name?.toLowerCase() ?? "";
  for (const b of ALL_BOARDS) if (primary.includes(b.toLowerCase())) return b;
  // Deterministic hash from id
  let h = 0;
  for (let i = 0; i < job.id.length; i++) h = (h * 31 + job.id.charCodeAt(i)) >>> 0;
  const pool: Board[] = job.source === "direct"
    ? ["Greenhouse", "Lever", "Ashby", "Workable"]
    : ["LinkedIn", "Indeed", "Wellfound", "Built In", "RemoteOK", "We Work Remotely"];
  return pool[h % pool.length];
}

function isRemote(loc: string) {
  return /remote/i.test(loc);
}

type EnrichedJob = Job & { board: Board; seniority: Seniority; remote: boolean };

function enrich(job: Job): EnrichedJob {
  return {
    ...job,
    board: inferBoard(job),
    seniority: inferSeniority(job.title),
    remote: isRemote(job.location),
  };
}

// ============================================================
// Filter model
// ============================================================

type PostedRange = "any" | "24h" | "7d" | "30d";

type FilterState = {
  field: string;
  roles: string[];
  seniority: Seniority[];
  years: string[]; // year range chips
  english: string;
  onlyRemote: boolean;
  locations: string[];
  sources: Board[];
  minMatch: number;
  minSalary: number;
  postedWithin: PostedRange;
};

const YEAR_CHIPS = ["No experience", "1–2 years", "3–5 years", "6–9 years", "10 years or more"] as const;

// Field → Roles taxonomy (from docs/jobly-roles-and-stacks.md).
const FIELD_ROLES: Record<string, string[]> = {
  Engineering: [
    "Frontend Engineer",
    "Backend Engineer",
    "Full-Stack Engineer",
    "Software Engineer (General)",
    "Mobile Engineer — iOS",
    "Mobile Engineer — Android",
    "Mobile Engineer — Cross-platform",
    "Web Developer",
    "Game Developer",
    "Embedded / Firmware Engineer",
    "Systems / Low-level Engineer",
    "Desktop / Enterprise Application Developer",
  ],
  "Data & AI / ML": [
    "Data Analyst",
    "Data Scientist",
    "Data Engineer",
    "Analytics Engineer",
    "Machine Learning Engineer",
    "AI / LLM Engineer",
    "ML / AI Research Scientist",
    "MLOps Engineer",
    "Computer Vision Engineer",
    "NLP Engineer",
    "BI Developer / Analyst",
    "Data Architect",
    "Database Administrator (DBA)",
  ],
  "Infrastructure, DevOps & Cloud": [
    "DevOps Engineer",
    "Site Reliability Engineer (SRE)",
    "Platform Engineer",
    "Cloud Engineer / Architect",
    "Infrastructure Engineer",
    "Network Engineer",
    "Systems Administrator",
  ],
  Security: [
    "Security Engineer",
    "Application Security (AppSec) Engineer",
    "Cloud Security Engineer",
    "Penetration Tester / Red Team",
    "Security / SOC Analyst",
    "GRC / Security Compliance",
    "Incident Response / Threat Intelligence",
  ],
  "QA & Testing": ["QA Engineer (Manual)", "QA Automation Engineer", "SDET"],
  Product: [
    "Product Manager",
    "Technical Product Manager",
    "Growth Product Manager",
    "AI / ML Product Manager",
    "Data Product Manager",
    "Product Owner",
    "Product Marketing Manager",
  ],
  Design: [
    "Product Designer",
    "UX Designer",
    "UI Designer",
    "UX Researcher",
    "Interaction Designer",
    "Design Systems Designer",
    "UX Engineer / Design Engineer",
    "Content Designer / UX Writer",
    "Visual / Graphic Designer",
    "Motion Designer",
  ],
  "Engineering Leadership & Architecture": [
    "Tech Lead",
    "Staff / Principal Engineer",
    "Engineering Manager",
    "Software / Solutions Architect",
    "Director / VP Engineering / CTO",
  ],
  "Program, Project & Technical-Adjacent": [
    "Technical Program Manager (TPM)",
    "Project Manager (Tech)",
    "Scrum Master / Agile Coach",
    "Solutions Engineer / Sales Engineer",
    "Developer Advocate (DevRel)",
    "Technical Writer",
    "Business / Systems Analyst",
  ],
  "Emerging / Specialized": [
    "Blockchain / Web3 Developer",
    "AR / VR / XR Engineer",
    "Robotics Engineer",
    "Data Governance / Data Quality Engineer",
  ],
};
const FIELDS = Object.keys(FIELD_ROLES);
const FIELD_ANY = "Any";
const FIELDS_WITH_ANY = [FIELD_ANY, ...FIELDS];

// New filter model uses multi-select seniority + defaults per product spec.
function defaultFilters(): FilterState {
  return {
    field: FIELD_ANY,
    roles: [],
    seniority: [],
    years: [],
    english: "",
    onlyRemote: false,
    locations: [],
    sources: [...ALL_BOARDS] as Board[],
    minMatch: 50,
    minSalary: 0,
    postedWithin: "any",
  };
}

function filterEqual(a: FilterState, b: FilterState) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function applyFilters(jobs: EnrichedJob[], f: FilterState): EnrichedJob[] {
  return jobs.filter((j) => {
    if (j.score < f.minMatch) return false;
    if (f.sources.length && !f.sources.includes(j.board)) return false;
    const postedDaysCap = f.postedWithin === "24h" ? 1 : f.postedWithin === "7d" ? 7 : f.postedWithin === "30d" ? 30 : Infinity;
    if (j.postedDays > postedDaysCap) return false;
    if (f.onlyRemote && !j.remote) return false;
    if (!f.onlyRemote && f.locations.length) {
      const hit = f.locations.some((l) => j.location.toLowerCase().includes(l.toLowerCase()));
      if (!hit) return false;
    }
    if (f.seniority.length && !f.seniority.includes(j.seniority)) return false;
    if (f.minSalary > 0) {
      const nums = (j.salary.match(/\d[\d,]*/g) ?? []).map((s) => Number(s.replace(/,/g, "")));
      const hasK = /k/i.test(j.salary);
      const scaled = nums.map((n) => (hasK ? n * 1000 : n));
      const maxSal = scaled.length ? Math.max(...scaled) : 0;
      // Slider is monthly; compare against annualized salary when parseable.
      if (maxSal > 0 && maxSal < f.minSalary * 12) return false;
    }
    // Loose taxonomy filter: if roles set is non-empty, require some overlap in title/why
    if (f.roles.length) {
      const hay = `${j.title} ${j.why}`.toLowerCase();
      const anyMatch = f.roles.some((r) => hay.includes(r.toLowerCase().split(" ")[0]));
      if (!anyMatch && f.roles.length > 0) {
        // don't hard-filter if nothing matches; keep loose
      }
    }
    return true;
  });
}

// ============================================================
// UI primitives
// ============================================================

function ScoreRing({ score, size = 74 }: { score: number; size?: number }) {
  const plan = usePlan();
  if (!isPro(plan)) {
    return (
      <div
        className="relative flex shrink-0 items-center justify-center rounded-full"
        style={{ width: size, height: size, background: "var(--color-surface-2)" }}
        aria-label="Match score locked — upgrade to Pro"
      >
        <span className="text-[18px]" style={{ fontFamily: "var(--font-sans)", color: "#090B0C" }}>--%</span>
      </div>
    );
  }
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${score}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-green)" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="butt" />
      </svg>
      <span className="absolute text-[18px]" style={{ fontFamily: "var(--font-display)", color: "#090B0C" }}>{score}%</span>
    </div>
  );
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  return ref;
}

function ago(days: number) {
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

// ============================================================
// Left sidebar — Tracker widget + Salary teaser
// ============================================================

function TrackerWidget() {
  const c = useCounts();
  const items: Array<{ n: number; l: string }> = [
    { n: c.saved, l: "Saved" },
    { n: c.applied, l: "Applied" },
    { n: c.interview, l: "Interview" },
    { n: c.rejection, l: "Rejected" },
  ];
  return (
    <aside className="rounded-[6px] border bg-[color:var(--color-surface-1)]">
      <div className="flex items-center justify-between px-4 pt-4">
        <h3 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Tracker</h3>
        <Link to="/tracker" className="text-[13px] font-semibold text-[color:var(--color-green)] hover:underline">Open</Link>
      </div>
      <div className="mt-3 grid grid-cols-2">
        {items.map((s, i) => (
          <div
            key={s.l}
            className={`px-4 py-3 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b" : ""}`}
          >
            <div className="text-[26px] leading-none text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-display)" }}>{s.n}</div>
            <div className="mt-1 text-[11px] text-[color:var(--color-text-muted)]">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="border-t px-4 py-3" style={{ background: "var(--color-mint)" }}>
        <div className="text-[26px] leading-none text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-display)" }}>{c.offer}</div>
        <div className="mt-1 text-[11px] text-[color:var(--color-green)] font-semibold">Offers</div>
      </div>
    </aside>
  );
}

function SalaryTeaser() {
  return (
    <aside className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4 opacity-55" aria-disabled>
      <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[color:var(--color-text-muted)]">In development</span>
      <h3 className="mt-2 text-[14px] font-semibold text-[color:var(--color-foreground)]">Salary insights</h3>
      <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>Your range vs the market.</p>
    </aside>
  );
}

// ============================================================
// Job row variants
// ============================================================

function StatusTag({ status }: { status: JobStatus }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    applied: { bg: "var(--color-mint)", fg: "var(--color-green)", label: "Applied" },
    interview: { bg: "var(--color-surface-2)", fg: "var(--color-foreground)", label: "Interview" },
    offer: { bg: "var(--color-mint)", fg: "var(--color-green)", label: "Offer" },
    rejection: { bg: "var(--color-danger-subtle)", fg: "var(--color-danger)", label: "Rejection" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px] font-semibold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
  );
}

function CompactPipelineRow({ job, status }: { job: EnrichedJob; status: JobStatus }) {
  return (
    <div className="flex h-[54px] items-center gap-3 bg-[color:var(--color-surface-1)] px-4">
      <StatusTag status={status} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">{job.title}</span>
      <Link
        to="/tracker"
        className="inline-flex h-[30px] items-center rounded-[4px] border px-3 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
      >
        To tracker
      </Link>
    </div>
  );
}

function CompactFeedbackRow({ job, kind }: { job: EnrichedJob; kind: "dismissed" | "reported" }) {
  const text = kind === "reported" ? "Thanks — we'll check this posting." : `${job.title} — disliked`;
  const bg = kind === "reported" ? "var(--color-danger-subtle)" : "var(--color-warning-subtle)";
  const fg = kind === "reported" ? "var(--color-danger)" : "var(--color-foreground)";
  return (
    <div className="flex h-[54px] items-center justify-between bg-[color:var(--color-surface-1)] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px] font-semibold" style={{ background: bg, color: fg }}>
          {kind === "reported" ? "Reported" : "Disliked"}
        </span>
        <span className="truncate text-[13px] text-[color:var(--color-text-secondary)]">{text}</span>
      </div>
      <button type="button" className="text-[13px] font-semibold text-[color:var(--color-green)] hover:underline" onClick={() => setStatus(job.id, "default")}>Undo</button>
    </div>
  );
}

function FullJobCard({ job, onOpen }: { job: EnrichedJob; onOpen: () => void }) {
  const plan = usePlan();
  const pro = isPro(plan);
  const record = useJobRecord(job.id);
  const state = record.status;
  const saved = state === "saved";
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const applyRef = useOutsideClose(applyOpen, () => setApplyOpen(false));

  const direct = DIRECT_BOARDS.has(job.board);

  return (
    <article className="relative bg-[color:var(--color-surface-1)] p-4 transition-colors hover:bg-[color:var(--color-surface-2)]/40">
      <button
        type="button"
        aria-label={`Open details for ${job.title}`}
        onClick={onOpen}
        className="flex w-full items-start gap-4 text-left"
      >
        {job.logo ? (
          <img src={job.logo} alt="" className="h-[52px] w-[52px] shrink-0 rounded-[4px] object-cover" />
        ) : (
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[16px] font-semibold text-white">
            {job.company.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-[color:var(--color-foreground)] group-hover:underline">{job.title}</span>
          <div className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location} · {job.salary}
          </div>
          {pro ? (
            <p className="mt-1 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>{job.why}</p>
          ) : null}
        </div>
        <ScoreRing score={job.score} />
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px] text-[color:var(--color-text-muted)]"
          style={{
            background: direct ? "var(--color-mint)" : "var(--color-surface-2)",
            color: direct ? "var(--color-green)" : undefined,
          }}
        >
          {direct ? "Direct employer" : "Aggregated"}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={dislikeRef}>
            <button
              type="button"
              aria-label="Dislike or report"
              onClick={() => setDislikeOpen((v) => !v)}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <IconBan size={15} strokeWidth={1.6} />
            </button>
            {dislikeOpen ? (
              <div role="menu" className="absolute right-0 top-[34px] z-30 min-w-[240px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
                <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]" onClick={() => { setStatus(job.id, "dismissed"); setDislikeOpen(false); }}>
                  <ThumbsDown size={15} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />
                  Dislike — not a good match
                </button>
                <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]" onClick={() => { setStatus(job.id, "reported"); setDislikeOpen(false); }}>
                  <Flag size={15} strokeWidth={1.6} />
                  Report — looks fake or ghost
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Save"
            aria-pressed={saved}
            onClick={() => setStatus(job.id, saved ? "default" : "saved")}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border transition-colors"
            style={{
              borderColor: saved ? "var(--color-green)" : undefined,
              background: saved ? "var(--color-mint)" : undefined,
              color: saved ? "var(--color-green)" : "var(--color-text-muted)",
            }}
          >
            <Bookmark size={15} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} />
          </button>

          <div className="relative" ref={applyRef}>
            <button
              type="button"
              onClick={() => setApplyOpen((v) => !v)}
              className="inline-flex h-[30px] items-center gap-1 rounded-[4px] bg-[color:var(--color-accent)] px-3 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Apply
              <Zap size={13} strokeWidth={2} fill="currentColor" />
            </button>
            {applyOpen ? (
              <div role="menu" className="absolute right-0 top-[34px] z-30 min-w-[240px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
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
                  onClick={() => { window.open(job.postingUrl ?? "#", "_blank"); setApplyOpen(false); setToast(true); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                >
                  <ExternalLink size={14} strokeWidth={1.6} />
                  Open posting to apply
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {toast ? (
        <div
          className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit items-center gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3 text-[13px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
          role="status"
        >
          <span>Did you apply to {job.title}?</span>
          <button type="button" className="rounded-[4px] bg-[color:var(--color-accent)] px-3 py-1 text-[12px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]" onClick={() => { setStatus(job.id, "applied"); setToast(false); }}>Yes, mark as applied</button>
          <button type="button" className="rounded-[4px] border px-3 py-1 text-[12px] text-[color:var(--color-text-secondary)]" onClick={() => setToast(false)}>Not yet</button>
        </div>
      ) : null}
    </article>
  );
}

function JobRow({ job, onOpen }: { job: EnrichedJob; onOpen: () => void }) {
  const record = useJobRecord(job.id);
  const s = record.status;
  if (s === "reported") return <CompactFeedbackRow job={job} kind="reported" />;
  if (s === "dismissed") return <CompactFeedbackRow job={job} kind="dismissed" />;
  if (s === "applied" || s === "interview" || s === "offer" || s === "rejection") {
    return <CompactPipelineRow job={job} status={s} />;
  }
  return <FullJobCard job={job} onOpen={onOpen} />;
}

// ============================================================
// Filters sidebar
// ============================================================

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-[13px] font-semibold text-[color:var(--color-foreground)]">{title}</span>
        {open ? <ChevronUp size={15} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" /> : <ChevronDown size={15} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />}
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function ProfileChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[4px] bg-[color:var(--color-mint)] px-2 py-1 text-[12px] font-semibold text-[color:var(--color-green)]">
      {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="hover:opacity-70"><X size={12} strokeWidth={2} /></button>
    </span>
  );
}

function AddChip({ options, onAdd }: { options: string[]; onAdd: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useOutsideClose(open, () => setOpen(false));
  const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  return (
    <span className="relative inline-block" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-[4px] border bg-[color:var(--color-surface-1)] px-2 py-1 text-[12px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">
        <IconPlus size={12} strokeWidth={2} /> Add
      </button>
      {open ? (
        <div className="absolute left-0 top-8 z-30 w-[220px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]" style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full border-b bg-transparent px-3 py-2 text-[13px] outline-none" />
          <div className="max-h-[220px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-[color:var(--color-text-muted)]">No matches</div>
            ) : filtered.map((o) => (
              <button key={o} type="button" onClick={() => { onAdd(o); setOpen(false); setQ(""); }} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]">{o}</button>
            ))}
          </div>
        </div>
      ) : null}
    </span>
  );
}

function SelectChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[28px] items-center rounded-[4px] px-2.5 text-[12px] font-medium transition-colors"
      style={
        selected
          ? { background: "var(--color-accent)", color: "var(--color-on-accent)" }
          : { background: "var(--color-surface-1)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }
      }
    >
      {label}
    </button>
  );
}

function FiltersSidebar({
  pending,
  applied,
  onChange,
  onApply,
  onReset,
  onSave,
  open,
  onToggle,
}: {
  pending: FilterState;
  applied: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  onSave: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  const dirty = !filterEqual(pending, applied);
  const p = pending;
  const set = (patch: Partial<FilterState>) => onChange({ ...p, ...patch });

  return (
    <aside
      className={`relative flex flex-col rounded-[6px] bg-[color:var(--color-surface-1)] lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] ${open ? "border" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Collapse filters" : "Expand filters"}
        className="absolute z-20 inline-flex h-[40px] w-[40px] -translate-x-1/2 items-center justify-center rounded-full border bg-[color:var(--color-surface-1)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        style={{ left: 0, top: 12 }}
      >
        <IconAdjustmentsHorizontal size={18} strokeWidth={1.8} />
      </button>
      {open ? (
      <>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <FilterSection title="Field">
          <select
            className="w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-2 py-1.5 text-[13px]"
            value={p.field}
            onChange={(e) => {
              const nf = e.target.value;
              const roles = p.roles.filter((r) => FIELD_ROLES[nf]?.includes(r));
              set({ field: nf, roles });
            }}
          >
            {FIELDS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </FilterSection>

        <FilterSection title="Roles">
          <div className="flex flex-wrap gap-1.5">
            {p.roles.map((r) => (
              <ProfileChip key={r} label={r} onRemove={() => set({ roles: p.roles.filter((x) => x !== r) })} />
            ))}
            <AddChip
              options={(FIELD_ROLES[p.field] ?? []).filter((r) => !p.roles.includes(r))}
              onAdd={(v) => set({ roles: [...p.roles, v] })}
            />
          </div>
        </FilterSection>

        <FilterSection title="Seniority">
          <div className="flex flex-wrap gap-1.5">
            {SENIORITIES.map((s) => (
              <SelectChip
                key={s}
                label={s}
                selected={p.seniority.includes(s)}
                onClick={() => set({ seniority: p.seniority.includes(s) ? p.seniority.filter((x) => x !== s) : [...p.seniority, s] })}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Experience">
          <div className="flex flex-wrap gap-1.5">
            {YEAR_CHIPS.map((y) => (
              <SelectChip key={y} label={y} selected={p.years.includes(y)} onClick={() => set({ years: p.years.includes(y) ? p.years.filter((x) => x !== y) : [...p.years, y] })} />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="English">
          <div className="flex flex-wrap gap-1.5">
            {ENGLISH_LEVELS.map((l) => (
              <SelectChip key={l} label={l} selected={p.english === l} onClick={() => set({ english: l })} />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Location">
          <label className="mb-3 flex items-center justify-between text-[13px]">
            <span>Only Remote</span>
            <button type="button" aria-pressed={p.onlyRemote} onClick={() => set({ onlyRemote: !p.onlyRemote })} className="relative h-5 w-9 rounded-full transition-colors" style={{ background: p.onlyRemote ? "var(--color-green)" : "var(--color-border)" }}>
              <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: p.onlyRemote ? 18 : 2 }} />
            </button>
          </label>
          {!p.onlyRemote && (
            <div className="flex flex-wrap gap-1.5">
              {p.locations.map((r) => (<ProfileChip key={r} label={r} onRemove={() => set({ locations: p.locations.filter((x) => x !== r) })} />))}
              <AddChip options={["Remote (US)", "New York City, NY", "State of New York", "San Francisco, CA", "Los Angeles, CA"].filter((r) => !p.locations.includes(r))} onAdd={(v) => set({ locations: [...p.locations, v] })} />
            </div>
          )}
        </FilterSection>

        <FilterSection title="Sources of search">
          <div className="flex flex-wrap gap-1.5">
            {ALL_BOARDS.map((b) => {
              const selected = p.sources.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => set({ sources: selected ? p.sources.filter((x) => x !== b) : [...p.sources, b] })}
                  className="inline-flex h-[28px] items-center gap-1 rounded-[4px] px-2.5 text-[12px] font-medium"
                  style={selected ? { background: "var(--color-accent)", color: "var(--color-on-accent)" } : { background: "var(--color-surface-1)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
                >
                  {b}
                  {DIRECT_BOARDS.has(b) ? (
                    <span className="ml-1 rounded-[3px] px-1 text-[10px]" style={{ background: selected ? "rgba(255,255,255,.25)" : "var(--color-mint)", color: selected ? "inherit" : "var(--color-green)" }}>Direct</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Min match">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={p.minMatch}
              onChange={(e) => set({ minMatch: Number(e.target.value) })}
              className="w-full accent-[color:var(--color-green)]"
            />
            <span className="w-[42px] text-right text-[13px] font-semibold text-[color:var(--color-foreground)]">{p.minMatch}%</span>
          </div>
        </FilterSection>

        <FilterSection title="Salary">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={10000}
              step={100}
              value={p.minSalary}
              onChange={(e) => set({ minSalary: Number(e.target.value) })}
              className="w-full accent-[color:var(--color-green)]"
            />
            <span className="w-[64px] text-right text-[13px] font-semibold text-[color:var(--color-foreground)]">
              ${p.minSalary.toLocaleString()}
            </span>
          </div>
        </FilterSection>

        <FilterSection title="Posted within">
          <div className="flex flex-wrap gap-1.5">
            {(["any", "24h", "7d", "30d"] as const).map((v) => (
              <SelectChip key={v} label={v === "any" ? "Any time" : v === "24h" ? "24 hours" : v === "7d" ? "7 days" : "30 days"} selected={p.postedWithin === v} onClick={() => set({ postedWithin: v })} />
            ))}
          </div>
        </FilterSection>
      </div>

      <div className="flex items-center gap-2 border-t bg-[color:var(--color-surface-1)] p-3">
        <button type="button" onClick={onSave} className="inline-flex h-[34px] items-center rounded-[4px] border px-3 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]">Save</button>
        <button type="button" onClick={onReset} className="inline-flex h-[34px] items-center rounded-[4px] border px-3 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]">Reset</button>
        <button
          type="button"
          onClick={onApply}
          disabled={!dirty}
          className="inline-flex h-[34px] flex-1 items-center justify-center rounded-[4px] px-3 button-small"
          style={{
            background: dirty ? "var(--color-accent)" : "var(--color-surface-2)",
            color: dirty ? "var(--color-on-accent)" : "var(--color-text-muted)",
            cursor: dirty ? "pointer" : "not-allowed",
          }}
        >
          Apply
        </button>
      </div>
      </>
      ) : null}
    </aside>
  );
}

// ============================================================
// Screen
// ============================================================

function JobsScreen() {
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const plan = usePlan();
  const pro = isPro(plan);
  const { user } = useAuth();
  const quiz = useMemo(() => loadQuiz(), []);
  const seed = useMemo(() => seedFromQuiz(quiz), [quiz]);
  const [applied, setApplied] = useState<FilterState>(seed);
  const [pending, setPending] = useState<FilterState>(seed);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [displayName, setDisplayName] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!cancelled) setDisplayName(data?.display_name ?? null);
    });
    return () => { cancelled = true; };
  }, [user]);
  const firstName = (() => {
    const s = displayName || (user?.user_metadata?.full_name as string | undefined) || (user?.user_metadata?.name as string | undefined) || user?.email?.split("@")[0] || "";
    return s.trim().split(/\s+/)[0] ?? "";
  })();

  const allJobs = useMemo(() => getAllJobs().map(enrich), []);
  const visible = useMemo(() => applyFilters(allJobs, applied), [allJobs, applied]);

  // Lazy loading
  const [count, setCount] = useState(15);
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (count >= visible.length) return;
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setCount((c) => Math.min(c + 10, visible.length));
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [count, visible.length]);
  useEffect(() => setCount(15), [applied]);

  const shown = visible.slice(0, count);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active="digest" />
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-6">
        {!pro ? (
          <div className="mb-6 rounded-[6px] border border-[color:var(--color-green)] bg-[color:var(--color-mint)]/40 px-4 py-3 text-[13px]">
            You're on <span className="font-semibold">Free</span> — weekly digest, top 5 matches. Match scores and the tracker are Pro.
          </div>
        ) : null}
        <div className={`grid gap-6 ${filtersOpen ? "lg:grid-cols-[200px_minmax(0,1fr)_304px]" : "lg:grid-cols-[200px_minmax(0,1fr)_0px]"}`}>
          <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <TrackerWidget />
            <SalaryTeaser />
          </div>

          <div className="min-w-0">
            <h1 className="text-[24px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
              {firstName ? `Good morning, ${firstName}` : "Good morning"}
            </h1>
            <p className="mt-1 text-[14px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
              Your latest digest arrived <span className="font-semibold text-[color:var(--color-text-secondary)]">Today at 9:02</span>
            </p>

            <div className="mt-6 overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]">
              <div className="divide-y">
                {shown.length === 0 ? (
                  <div className="p-8 text-center text-[13px] text-[color:var(--color-text-muted)]">
                    No matches for your current filters. Loosen a filter or reset to your profile defaults.
                  </div>
                ) : shown.map((j) => (
                  <JobRow key={j.id} job={j} onOpen={() => setOpenJob(j)} />
                ))}
              </div>
              {count < visible.length ? (
                <div ref={sentinel} className="border-t px-4 py-4 text-center text-[12px] text-[color:var(--color-text-muted)]">Loading more…</div>
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <FiltersSidebar
              pending={pending}
              applied={applied}
              onChange={setPending}
              onApply={() => setApplied(pending)}
              onReset={() => { setPending(seed); setApplied(seed); }}
              onSave={() => { /* client-side snapshot placeholder */ }}
              open={filtersOpen}
              onToggle={() => setFiltersOpen((v) => !v)}
            />
          </div>
        </div>
      </main>
      <MobileTabBar active="digest" />
      {openJob ? <JobDrawer job={openJob} onClose={() => setOpenJob(null)} /> : null}
    </div>
  );
}
