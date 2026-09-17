import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  IconBookmark as Bookmark,
  IconChevronLeft,
  IconChevronRight,
  IconArrowUpRight as ExternalLink,
  IconFlag as Flag,
  IconThumbDown as ThumbsDown,
  IconPlus,
  IconX as X,
  IconAdjustmentsHorizontal,
  IconCheck as Check,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { JobDrawer } from "@/components/app/JobDrawer";
import { IconTooltip } from "@/components/app/IconTooltip";
import { ApplyModal } from "@/components/app/ApplyModal";
import { ScoreRing as SharedScoreRing } from "@/components/app/ScoreRing";

import { useJobs } from "@/lib/jobs-store";
import { getDbJobById } from "@/lib/jobs-store";
import { rolesOverlap } from "@/lib/match";
import type { Job } from "@/lib/jobs-data";
import { usePlan, isPro } from "@/lib/plan-store";
import { useEntitlements } from "@/lib/entitlements-provider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { setStatus, removeFromTracker, useCounts, useJobRecord, useTrackerHiddenIds, type JobStatus } from "@/lib/tracker-store";
import { useQuiz, useQuizHydrated, type QuizAnswers } from "@/lib/quiz-store";
import { setDigestSession, useDigestSession, clearDigestSession, type DigestSessionState } from "@/lib/digest-session-store";
import { useBlockedCompanies, blockCompany } from "@/lib/blocked-companies-store";
import {
  setJobInteraction,
  clearJobInteraction,
  useHiddenJobIds,
  type InteractionKind,
} from "@/lib/job-interactions-store";
import { HideJobDialog } from "@/components/app/HideJobDialog";
import { formatDigestArrival, useLatestDigestAt } from "@/lib/digest-delivery-store";
import { US_CITY_DATA, ALL_CITY_LABELS } from "@/lib/us-cities";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Jobs — Jobly" },
      { name: "description", content: "Your live wall of matched roles. Filter by role, skills, level, sources, and match score." },
      { name: "robots", content: "noindex, nofollow" },
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

const SENIORITIES = ["Junior", "Middle", "Senior", "Lead", "Executive"] as const;
type Seniority = (typeof SENIORITIES)[number];

function inferSeniority(title: string): Seniority {
  const t = title.toLowerCase();
  if (/\b(principal|staff)\b/.test(t)) return "Lead";
  if (/\blead|head|director|vp\b/.test(t)) return "Lead";
  if (/\bexec|chief|cto|cpo\b/.test(t)) return "Executive";
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
  onlyRemote: boolean;
  locations: string[];
  sources: Board[];
  minMatch: number;
  minSalary: number;
  postedWithin: PostedRange;
};

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
  "Data and AI / ML": [
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
  "Infrastructure, DevOps and Cloud": [
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
  "QA and Testing": ["QA Engineer (Manual)", "QA Automation Engineer", "SDET"],
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
  "Engineering Leadership and Architecture": [
    "Tech Lead",
    "Staff / Principal Engineer",
    "Engineering Manager",
    "Software / Solutions Architect",
    "Director / VP Engineering / CTO",
  ],
  "Program, Project and Technical-Adjacent": [
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
    onlyRemote: false,
    locations: [],
    sources: [...ALL_BOARDS] as Board[],
    minMatch: 50,
    minSalary: 0,
    postedWithin: "any",
  };
}

const SALARY_STEPS = [0, 60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000];
function nearestSalaryStep(v: number): number {
  let best = SALARY_STEPS[0];
  let d = Infinity;
  for (const s of SALARY_STEPS) {
    const nd = Math.abs(v - s);
    if (nd < d) { d = nd; best = s; }
  }
  return best;
}

function defaultsFromQuiz(q: QuizAnswers): FilterState {
  const base = defaultFilters();
  const roles = q.roles?.length ? q.roles : q.role ? [q.role] : [];
  const locs = q.locations ?? [];
  const onlyRemote = locs.length === 0;
  const minSalary = typeof q.salaryMin === "number" ? nearestSalaryStep(q.salaryMin < 1000 ? q.salaryMin * 1000 : q.salaryMin) : 0;
  const seniority = levelToSeniority(q.level);
  return {
    ...base,
    roles,
    onlyRemote,
    locations: locs,
    minSalary,
    seniority: seniority ? [seniority] : [],
  };
}

function levelToSeniority(level: string | undefined): Seniority | null {
  if (!level) return null;
  if (level === "Junior") return "Junior";
  if (level === "Mid") return "Middle";
  if (level === "Senior" || level === "Staff" || level === "Principal") return "Senior";
  if (["Lead", "Manager", "Head", "Director", "VP"].includes(level)) return "Lead";
  if (level === "Exec") return "Executive";
  return null;
}

function filterEqual(a: FilterState, b: FilterState) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function applyFilters(jobs: EnrichedJob[], f: FilterState): EnrichedJob[] {
  return jobs.filter((j) => {
    // Blocked companies filter (managed in Settings)
    if (j.score < f.minMatch) return false;
    if (f.sources.length && !f.sources.includes(j.board)) return false;
    const postedDaysCap = f.postedWithin === "24h" ? 1 : f.postedWithin === "7d" ? 7 : f.postedWithin === "30d" ? 30 : Infinity;
    if (j.postedDays > postedDaysCap) return false;
    if (f.onlyRemote && !j.remote) return false;
    if (!f.onlyRemote && f.locations.length) {
      const jobLoc = j.location.toLowerCase();
      const hit = f.locations.some((l) => {
        if (/^remote\s*\(us\)$/i.test(l)) return j.remote;
        const stateMatch = /^state of (.+)$/i.exec(l);
        if (stateMatch) {
          const stateName = stateMatch[1].trim().toLowerCase();
          const entry = US_CITY_DATA.find((s) => s.name.toLowerCase() === stateName);
          if (!entry) return false;
          const code = entry.code.toLowerCase();
          // Match ", CA" suffix or bare state name in location string
          return (
            new RegExp(`,\\s*${code}\\b`).test(jobLoc) ||
            jobLoc.includes(entry.name.toLowerCase())
          );
        }
        return jobLoc.includes(l.toLowerCase());
      });
      if (!hit) return false;
    }
    if (f.seniority.length && !f.seniority.includes(j.seniority)) return false;
    if (f.minSalary > 0) {
      const nums = (j.salary.match(/\d[\d,]*/g) ?? []).map((s) => Number(s.replace(/,/g, "")));
      const hasK = /k/i.test(j.salary);
      const scaled = nums.map((n) => (hasK ? n * 1000 : n));
      const maxSal = scaled.length ? Math.max(...scaled) : 0;
      // Slider is annual; compare against parsed annual salary.
      if (maxSal > 0 && maxSal < f.minSalary) return false;
    }
    if (f.roles.length) {
      const db = getDbJobById(j.id);
      if (!db) return false;
      if (!rolesOverlap(f.roles, db)) return false;
    }
    if (f.field && f.field !== FIELD_ANY) {
      const db = getDbJobById(j.id);
      const allowed = (FIELD_ROLES[f.field] ?? []).map((r) => r.toLowerCase());
      if (!db || !allowed.length) return false;
      const jobRolesLc = db.roles.map((r) => r.toLowerCase());
      if (!jobRolesLc.some((jr) => allowed.includes(jr))) return false;
    }
    return true;
  });
}

// ============================================================
// UI primitives
// ============================================================

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  // Same entitlement read as before — no new request, no new gating rule.
  const plan = usePlan();
  const { loading: entLoading } = useEntitlements();
  return (
    <SharedScoreRing
      score={score}
      size={size}
      stroke={3}
      trackColor="var(--color-border)"
      accentColor="var(--color-green)"
      ariaLabel={`${score}%`}
      loading={entLoading}
      locked={!isPro(plan)}
    />
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
    <aside className="rounded-[20px] border bg-[color:var(--color-surface-1)] shadow-[0_1px_4px_0_rgba(12,12,13,0.05)]">
      <div className="flex items-center justify-between px-4 pt-4">
        <h3 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Tracker</h3>
        <IconTooltip label="Open Tracker">
          <Link
            to="/tracker"
            aria-label="Open Tracker"
            className="inline-flex h-[24px] w-[24px] items-center justify-center rounded-[8px] text-[color:var(--color-green)] hover:bg-[color:var(--color-surface-2)]"
          >
            <IconArrowUpRight size={18} stroke={2} />
          </Link>
        </IconTooltip>
      </div>
      <div className="mt-3 grid grid-cols-2">
        {items.map((s, i) => (
          <div
            key={s.l}
            className={`px-4 py-3 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-t border-b" : ""}`}
          >
            <div className="text-[26px] leading-none text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>{s.n}</div>
            <div className="mt-1 text-[12px] font-light text-[#4B585B]">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="border-t px-4 py-3">
        <div className="text-[26px] leading-none text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>{c.offer}</div>
        <div className="mt-1 text-[12px] font-light text-[#4B585B]">Offers</div>
      </div>
    </aside>
  );
}

function TrackerUpsell() {
  return (
    <aside className="rounded-[20px] bg-[#F1F3F3] p-[4px]">
      <div
        data-tracker-upsell-mini
        className="relative isolate flex flex-col items-start gap-4 overflow-hidden rounded-[16px] border border-white bg-white/80"
        style={{ boxShadow: "0 1px 4px rgba(12, 12, 13, 0.05)", padding: 16 }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute z-[1]"
          style={{
            right: -60,
            top: -60,
            width: 160,
            height: 160,
            background: "radial-gradient(circle, #2CFF8E 0%, rgba(44,255,142,0) 70%)",
            filter: "blur(40px)",
            opacity: 0.45,
          }}
        />
        <div className="relative z-[3] flex flex-col gap-1">
          <div className="text-[16px] leading-[24px] text-[#090B0C]" style={{ fontWeight: 400 }}>
            Track applications with Pro
          </div>
          <div className="text-[14px] leading-[20px] text-[#67787C]" style={{ fontWeight: 300 }}>
            Unlock the tracker to manage every job from saved to offer.
          </div>
        </div>
        <Link
          to="/settings"
          className="main_accent_button main_accent_button--on-light main_accent_button--block relative z-[2] shrink-0"
        >
          Upgrade to Pro
        </Link>
      </div>
    </aside>
  );
}

function SalaryTeaser() {
  return (
    <aside className="rounded-[20px] border bg-[color:var(--color-surface-1)] p-4 opacity-55" aria-disabled>
      <span className="inline-flex items-center rounded-[12px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[color:var(--color-text-muted)]">In development</span>
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
    <span className="inline-flex items-center rounded-[12px] px-2 py-0.5 text-[14px] font-light leading-[1.5]" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
  );
}

function CompactPipelineRow({ job, status }: { job: EnrichedJob; status: JobStatus }) {
  return (
    <div className="flex h-[54px] items-center gap-3 bg-[color:var(--color-surface-1)] px-4">
      <StatusTag status={status} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">{job.title}</span>
      <Link
        to="/tracker"
        className="text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
      >
        To tracker
      </Link>
    </div>
  );
}

function CompactSessionRow({ job, kind }: { job: EnrichedJob; kind: DigestSessionState }) {
  const label = kind === "applied" ? "Applied" : kind === "disliked" ? "Disliked" : "Reported";
  const bg =
    kind === "applied" ? "var(--color-mint)" :
    kind === "reported" ? "var(--color-danger-subtle)" :
    "var(--color-warning-subtle)";
  const fg =
    kind === "applied" ? "var(--color-green)" :
    kind === "reported" ? "var(--color-danger)" :
    "var(--color-warning)";
  return (
    <div className="flex h-[54px] items-center justify-between rounded-[16px] bg-[color:var(--color-surface-1)] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex items-center rounded-[12px] px-2 py-0.5 text-[13px] font-light leading-[1.5]" style={{ background: bg, color: fg }}>
          {label}
        </span>
        <span className="truncate text-[13px] text-[color:var(--color-text-secondary)]">{job.title}</span>
      </div>
      {kind === "applied" ? (
        <Link to="/tracker" className="text-[13px] font-semibold text-[color:var(--color-green)] hover:underline">View in Tracker</Link>
      ) : (
        <button type="button" className="text-[13px] font-semibold text-[color:var(--color-green)] hover:underline" onClick={() => clearDigestSession(job.id)}>Undo</button>
      )}
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
  const [flagOpen, setFlagOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [pendingHide, setPendingHide] = useState<{ kind: InteractionKind; reason: string } | null>(null);
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const flagRef = useOutsideClose(flagOpen, () => setFlagOpen(false));
  const flagBtnRef = useRef<HTMLButtonElement | null>(null);
  const dislikeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [flagPos, setFlagPos] = useState<{ top: number; right: number } | null>(null);
  const [dislikePos, setDislikePos] = useState<{ top: number; right: number } | null>(null);
  useEffect(() => {
    if (!flagOpen) return;
    const update = () => {
      const r = flagBtnRef.current?.getBoundingClientRect();
      if (r) setFlagPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [flagOpen]);
  useEffect(() => {
    if (!dislikeOpen) return;
    const update = () => {
      const r = dislikeBtnRef.current?.getBoundingClientRect();
      if (r) setDislikePos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [dislikeOpen]);

  return (
    <article
      className="relative cursor-pointer rounded-[16px] border p-5"
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        borderColor: "#FFFFFF",
        boxShadow: "0 1px 4px 0 rgba(12, 12, 13, 0.05)",
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${job.title}`}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
    >
      <div className="w-full text-left">
        <div className="flex w-full items-center gap-4">
          {job.logo ? (
            <img src={job.logo} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[color:var(--color-foreground)] text-[16px] font-semibold text-white">
              {job.company.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-[color:var(--color-foreground)]">{job.title}</span>
            <div className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              {job.company} · {job.location}
            </div>
          </div>
          <ScoreRing score={job.score} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 300, color: "var(--color-foreground)" }}>
          {job.salary}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div
            className={
              "relative transition-opacity duration-150 max-lg:opacity-100 " +
              (flagOpen ? "opacity-100" : "max-lg:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100")
            }
          >
            <IconTooltip label="Report this job">
              <button
                ref={flagBtnRef}
                type="button"
                aria-label="Report this job"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setFlagOpen((v) => !v); }}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
              >
                <Flag size={15} strokeWidth={1.6} />
              </button>
            </IconTooltip>
            {flagOpen && flagPos ? createPortal(
              <div ref={flagRef as unknown as React.RefObject<HTMLDivElement>} role="menu" className="fixed z-[100] min-w-[240px] overflow-hidden rounded-[16px] border bg-[color:var(--color-surface-1)]" style={{ top: flagPos.top, right: flagPos.right, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
                {["Spam or scam", "Incorrect match (wrong role)", "Ghost or expired posting", "Duplicate posting"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
                    onClick={(e) => { e.stopPropagation(); setFlagOpen(false); setPendingHide({ kind: "reported", reason: label }); }}
                  >
                    {label}
                  </button>
                ))}
              </div>,
              document.body
            ) : null}
          </div>

          <div
            className={
              "relative -ml-1 transition-opacity duration-150 max-lg:opacity-100 " +
              (dislikeOpen ? "opacity-100" : "max-lg:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100")
            }
          >
            <IconTooltip label="Not interested">
              <button
                ref={dislikeBtnRef}
                type="button"
                aria-label="Not interested"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setDislikeOpen((v) => !v); }}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
              >
                <ThumbsDown size={15} strokeWidth={1.6} />
              </button>
            </IconTooltip>
            {dislikeOpen && dislikePos ? createPortal(
              <div ref={dislikeRef as unknown as React.RefObject<HTMLDivElement>} role="menu" className="fixed z-[100] min-w-[240px] overflow-hidden rounded-[16px] border bg-[color:var(--color-surface-1)]" style={{ top: dislikePos.top, right: dislikePos.right, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
                {["Not relevant to my role", "Wrong seniority", "Compensation too low", "Don't recommend the company"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDislikeOpen(false);
                      setPendingHide({ kind: "disliked", reason: label });
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>,
              document.body
            ) : null}
          </div>

          <IconTooltip label={saved ? "Saved" : "Save"}>
            <button
              type="button"
              aria-label="Save"
              aria-pressed={saved}
              onClick={(e) => {
                e.stopPropagation();
                if (saved) removeFromTracker(job.id);
                else setStatus(job.id, "saved");
                if (!saved) toast("Saved to the Tracker");
              }}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] border transition-colors hover:bg-[color:var(--color-surface-2)]"
              style={{
                borderColor: saved ? "var(--color-green)" : undefined,
                background: saved ? "var(--color-mint)" : undefined,
                color: saved ? "var(--color-green)" : "var(--color-text-muted)",
              }}
            >
              <Bookmark size={15} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} />
            </button>
          </IconTooltip>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setApplyOpen(true); }}
            className="main_accent_button main_accent_button--on-light h-[30px] button-small"
            // The design-system class sets border-radius: 14px, font-size: 16px
            // and padding: 12px 20px as plain CSS rules, and sets no
            // justify-content, all of which beat Tailwind utilities; the card's
            // radius is 8, its label is 14px and its padding is 0 12px.
            // button-small stays: its letter-spacing (-0.07px) does apply.
            style={{ borderRadius: 8, fontSize: 14, padding: "0 12px", justifyContent: "center" }}
          >
            <ExternalLink size={14} strokeWidth={1.8} className="mr-1" />
            Apply
          </button>
        </div>
      </div>

      <ApplyModal
        job={job}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onApplied={() => setDigestSession(job.id, "applied")}
      />

      {pendingHide ? (
        <div onClick={(e) => e.stopPropagation()}>
          <HideJobDialog
            open
            kind={pendingHide.kind}
            reason={pendingHide.reason}
            jobTitle={job.title}
            wasSaved={saved}
            onCancel={() => setPendingHide(null)}
            onConfirm={() => {
              const { kind, reason } = pendingHide;
              // Reporting or disliking a saved job unsaves it first.
              if (saved) removeFromTracker(job.id);
              if (reason === "Don't recommend the company") blockCompany(job.company);
              setJobInteraction(job.id, kind, reason);
              setPendingHide(null);
              toast(kind === "reported" ? "Job reported and hidden" : "Job hidden", {
                action: { label: "Undo", onClick: () => clearJobInteraction(job.id) },
              });
            }}
          />
        </div>
      ) : null}
    </article>
  );
}

function JobRow({ job, onOpen }: { job: EnrichedJob; onOpen: () => void }) {
  const session = useDigestSession(job.id);
  if (session === "applied") return <CompactSessionRow job={job} kind={session} />;
  return <FullJobCard job={job} onOpen={onOpen} />;
}

function JobRowCard({ job, onOpen }: { job: EnrichedJob; onOpen: () => void }) {
  return (
    <div className="rounded-[20px] bg-[#F1F3F3] p-1">
      <div className="group rounded-[16px] border border-[#E3E7E8] bg-white shadow-[0_1px_6px_0_rgba(12,12,13,0.08)] transition-[box-shadow,border-color,background-color] hover:border-[#D0D6D8] hover:bg-[#F9FBFB] hover:shadow-[0_2px_10px_0_rgba(12,12,13,0.10)]">
        <JobRow job={job} onOpen={onOpen} />
      </div>
    </div>
  );
}

function JobRowSkeleton() {
  return <JobRowSkeletonInner />;
}

function EmptyMatchesState() {
  return (
    <div className="w-full rounded-[20px] bg-[color:var(--color-surface-2)] p-2">
      <div className="flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6 md:p-10">
        <img
          src={emptyStateAsset.url}
          alt=""
          aria-hidden="true"
          className="pointer-events-none h-12 w-12 shrink-0 object-cover opacity-50"
        />
        <p
          className="px-4 text-center text-[14px] leading-[20px] text-[color:var(--color-text-muted)] md:px-10"
          style={{ fontWeight: 300 }}
        >
          No matches for your current filters
        </p>
      </div>
    </div>
  );
}

function JobRowSkeletonInner() {
  return (
    <div className="rounded-[20px] bg-[#F1F3F3] p-1" aria-hidden>
      <div className="rounded-[16px] border border-[#E3E7E8] bg-white p-5 shadow-[0_1px_6px_0_rgba(12,12,13,0.08)]">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-[12px] skeleton" />
          <div className="min-w-0 flex-1">
            <div className="h-[15px] w-[52%] rounded-[4px] skeleton" />
            <div className="mt-2 h-[13px] w-[34%] rounded-[4px] skeleton" />
          </div>
          <div className="h-[52px] w-[52px] shrink-0 rounded-full skeleton" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="h-[18px] w-[110px] rounded-[4px] skeleton" />
          <div className="ml-auto flex items-center gap-1">
            <div className="h-[30px] w-[30px] rounded-[12px] skeleton" />
            <div className="h-[30px] w-[30px] rounded-[12px] skeleton" />
            <div className="h-[30px] w-[84px] rounded-[12px] skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Filters sidebar
// ============================================================

function FilterSection({ title, children }: { title: string; children: React.ReactNode; defaultOpen?: boolean; collapseSignal?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 lg:px-1 pt-3 pb-2">
        <span className="text-[13px] font-semibold text-[color:var(--color-foreground)]">{title}</span>
      </div>
      <div className="px-4 lg:px-1 pb-4">{children}</div>
    </div>
  );
}

function ProfileChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[8px] bg-[color:var(--color-mint)] px-2 py-1 text-[12px] font-semibold text-[color:var(--color-green)]">
      {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="hover:opacity-70"><X size={12} strokeWidth={2} /></button>
    </span>
  );
}

function AddChip({ options, groups, onAdd }: { options: string[]; groups?: { label: string; items: string[] }[]; onAdd: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useOutsideClose(open, () => setOpen(false));
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);
  const ql = q.toLowerCase();
  const filteredGroups = groups
    ? groups
        .map((g) => ({ label: g.label, items: g.items.filter((o) => o.toLowerCase().includes(ql)) }))
        .filter((g) => g.items.length)
    : null;
  const filtered = options.filter((o) => o.toLowerCase().includes(ql)).slice(0, 12);
  return (
    <span className="relative inline-block" ref={ref}>
      <button ref={btnRef} type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-[8px] border bg-[color:var(--color-surface-1)] px-2 py-1 text-[12px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">
        <IconPlus size={12} strokeWidth={2} /> Add
      </button>
      {open && pos ? createPortal(
        <div className="fixed z-[100] w-[260px] overflow-hidden rounded-[16px] border bg-[color:var(--color-surface-1)]" style={{ top: pos.top, right: pos.right, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }} ref={ref as unknown as React.RefObject<HTMLDivElement>}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full border-b bg-transparent px-3 py-2 text-[13px] outline-none" />
          <div className="max-h-[260px] overflow-y-auto">
            {filteredGroups ? (
              filteredGroups.length === 0 ? (
                <div className="px-3 py-2 text-[12px] text-[color:var(--color-text-muted)]">No matches</div>
              ) : filteredGroups.map((g) => (
                <div key={g.label}>
                  <div className="bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">{g.label}</div>
                  {g.items.map((o) => (
                    <button key={o} type="button" onClick={() => { onAdd(o); setOpen(false); setQ(""); }} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]">{o}</button>
                  ))}
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-[color:var(--color-text-muted)]">No matches</div>
            ) : filtered.map((o) => (
              <button key={o} type="button" onClick={() => { onAdd(o); setOpen(false); setQ(""); }} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]">{o}</button>
            ))}
          </div>
        </div>,
        document.body
      ) : null}
    </span>
  );
}

function SelectChip({ label, selected, onClick, disabled }: { label: string; selected: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-[28px] items-center rounded-[8px] px-2.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed"
      style={
        selected
          ? { background: "var(--color-green)", color: "#fff" }
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
  open,
  onToggle,
  collapseSignal,
}: {
  pending: FilterState;
  applied: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  open: boolean;
  onToggle: () => void;
  collapseSignal: number;
}) {
  // Roles universe comes from the user's profile (quiz). The filter can only
  // toggle which of those roles are active — never add/remove them here.
  // Read reactively: the profile hydrates from the server after mount.
  const quiz = useQuiz();
  const quizHydrated = useQuizHydrated();
  const profileRoles = useMemo(() => {
    return quiz.roles?.length ? quiz.roles : quiz.role ? [quiz.role] : [];
  }, [quiz]);
  const dirty = !filterEqual(pending, applied);
  const p = pending;
  const set = (patch: Partial<FilterState>) => onChange({ ...p, ...patch });

  return (
    <aside className="contents lg:block lg:relative lg:sticky lg:top-20">
      {/* Floating toggle — always on mobile/tablet; on desktop only when closed */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Close filters" : "Open filters"}
        className={`fixed top-[72px] right-4 lg:right-[max(24px,calc((100vw-1200px)/2+24px))] z-40 h-[44px] w-[44px] items-center justify-center rounded-full border bg-[color:var(--color-surface-1)] text-[color:var(--color-foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[color:var(--color-surface-2)] ${open ? "hidden" : "inline-flex"}`}
      >
        <IconAdjustmentsHorizontal size={22} strokeWidth={1.8} />
      </button>
      {/* Mobile/Tablet drawer backdrop */}
      {open ? (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={onToggle}
          aria-hidden
        />
      ) : null}
      {open ? (
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[340px] max-w-[85vw] flex flex-col border-l bg-[color:var(--color-surface-1)] overflow-hidden lg:static lg:w-auto lg:max-w-none lg:rounded-[20px] lg:border lg:border-[#E3E7E8] lg:bg-white lg:p-[12px] lg:shadow-[0_1px_4px_0_rgba(12,12,13,0.05)] lg:max-h-[calc(100vh-6rem)]">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 flex items-center gap-1 border-b bg-[color:var(--color-surface-1)] px-4 py-3 lg:border-b-0 lg:bg-white lg:px-0 lg:pt-0">
          <h2 className="flex-1 min-w-0 text-[16px] font-semibold text-[color:var(--color-foreground)]">
            Filters
          </h2>
          {/* Desktop-only inline toggle inside sticky header, right-aligned */}
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse filters"
            className="inline-flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[12px] bg-transparent text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
          >
            <IconChevronRight size={20} strokeWidth={1.8} />
          </button>
        </div>
        <FilterSection title="Roles" collapseSignal={collapseSignal}>
          {!quizHydrated ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Loading your roles">
              {[86, 64, 108, 72].map((w) => (
                <div key={w} className="h-[28px] rounded-[4px] skeleton" style={{ width: w }} />
              ))}
            </div>
          ) : profileRoles.length === 0 ? (
            <p className="text-[12px] text-[color:var(--color-text-muted)]">
              Add roles in your{" "}
              <Link to="/profile" className="font-semibold text-[color:var(--color-green)] hover:underline">profile</Link>
              {" "}to filter by role.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profileRoles.map((r) => {
                const selected = p.roles.includes(r);
                const lastOne = selected && p.roles.length === 1;
                return (
                  <SelectChip
                    key={r}
                    label={r}
                    selected={selected}
                    disabled={lastOne}
                    onClick={() =>
                      set({
                        roles: selected
                          ? p.roles.filter((x) => x !== r)
                          : [...p.roles, r],
                      })
                    }
                  />
                );
              })}
            </div>
          )}
        </FilterSection>

        <FilterSection title="Min match" collapseSignal={collapseSignal}>
          <div className="flex items-center gap-3 -mb-4">
            <div className="relative h-8 flex-1">
              <div className="absolute left-[11px] right-[11px] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-surface-2)]" />
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-green)]"
                style={{ left: "0px", right: `calc(11px + (100% - 22px) * ${1 - p.minMatch / 95})` }}
              />
              <input
                type="range"
                min={0}
                max={95}
                step={5}
                value={p.minMatch}
                onChange={(e) => set({ minMatch: Number(e.target.value) })}
                className="jobly-range absolute inset-0 w-full"
              />
            </div>
            <span className="w-[48px] text-right text-[13px] font-semibold text-[color:var(--color-foreground)]">{p.minMatch}%</span>
          </div>
        </FilterSection>

        <FilterSection title="Salary (annual)" collapseSignal={collapseSignal}>
          {!quizHydrated ? (
            <div className="flex items-center gap-3" aria-label="Loading salary filter">
              <div className="h-[6px] flex-1 rounded-full skeleton" />
              <div className="h-[13px] w-[64px] rounded-[4px] skeleton" />
            </div>
          ) : (
          <div className="flex items-center gap-3">
            {(() => {
              const steps = [0, 60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 200000];
              const idx = Math.max(0, steps.indexOf(p.minSalary));
              const currentIdx = idx === -1 ? 0 : idx;
              const maxIdx = steps.length - 1;
              return (
                <>
                  <div className="relative h-8 flex-1">
                    <div className="absolute left-[11px] right-[11px] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-surface-2)]" />
                    <div
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-green)]"
                      style={{ left: "0px", right: `calc(11px + (100% - 22px) * ${1 - currentIdx / maxIdx})` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={maxIdx}
                      step={1}
                      value={currentIdx}
                      onChange={(e) => set({ minSalary: steps[Number(e.target.value)] })}
                      className="jobly-range absolute inset-0 w-full"
                    />
                  </div>
                  <span className="w-[64px] text-right text-[13px] font-semibold text-[color:var(--color-foreground)]">
                    {p.minSalary === 0 ? "Off" : `$${(p.minSalary / 1000).toLocaleString()}k/yr`}
                  </span>
                </>
              );
            })()}
          </div>
          )}
        </FilterSection>

        <FilterSection title="Posted within" collapseSignal={collapseSignal}>
          <div className="flex flex-wrap gap-1.5">
            {(["any", "24h", "7d", "30d"] as const).map((v) => (
              <SelectChip key={v} label={v === "any" ? "Any time" : v === "24h" ? "24 hours" : v === "7d" ? "7 days" : "30 days"} selected={p.postedWithin === v} onClick={() => set({ postedWithin: v })} />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Location" collapseSignal={collapseSignal}>
          {!quizHydrated ? (
            <div className="flex flex-col gap-3" aria-label="Loading location filter">
              <div className="flex items-center justify-between">
                <div className="h-[13px] w-[88px] rounded-[4px] skeleton" />
                <div className="h-5 w-9 rounded-full skeleton" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[96, 120].map((w) => (
                  <div key={w} className="h-[28px] rounded-[4px] skeleton" style={{ width: w }} />
                ))}
              </div>
            </div>
          ) : (
          <>
          <label className="mb-3 flex items-center justify-between text-[13px]">
            <span>Only Remote</span>
            <button type="button" aria-pressed={p.onlyRemote} onClick={() => set({ onlyRemote: !p.onlyRemote })} className="relative h-5 w-9 rounded-full transition-colors" style={{ background: p.onlyRemote ? "var(--color-green)" : "var(--color-border)" }}>
              <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: p.onlyRemote ? 18 : 2 }} />
            </button>
          </label>
          {!p.onlyRemote && (
            <div className="flex flex-wrap gap-1.5">
              {p.locations.map((r) => (<ProfileChip key={r} label={r} onRemove={() => set({ locations: p.locations.filter((x) => x !== r) })} />))}
              <AddChip
                groups={[
                  { label: "Remote", items: ["Remote (US)"] },
                  { label: "States", items: US_CITY_DATA.map((s) => `State of ${s.name}`) },
                  { label: "Cities", items: ALL_CITY_LABELS },
                ]
                  .map((g) => ({ label: g.label, items: g.items.filter((i) => !p.locations.includes(i)) }))
                  .filter((g) => g.items.length)}
                options={[]}
                onAdd={(v) => set({ locations: [...p.locations, v] })}
              />
            </div>
          )}
          </>
          )}
        </FilterSection>

        <FilterSection title="Seniority" collapseSignal={collapseSignal}>
          {!quizHydrated ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Loading seniority filter">
              {[64, 72, 58, 80].map((w) => (
                <div key={w} className="h-[28px] rounded-[4px] skeleton" style={{ width: w }} />
              ))}
            </div>
          ) : (
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
          )}
        </FilterSection>

        <FilterSection title="Sources of search" collapseSignal={collapseSignal}>
          <div className="flex flex-wrap gap-1.5">
            {ALL_BOARDS.map((b) => {
              const selected = p.sources.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => set({ sources: selected ? p.sources.filter((x) => x !== b) : [...p.sources, b] })}
                  className="inline-flex h-[28px] items-center gap-1 rounded-[8px] px-2.5 text-[12px] font-medium"
                  style={selected ? { background: "var(--color-green)", color: "#fff" } : { background: "var(--color-surface-1)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
                >
                  {b}
                  {DIRECT_BOARDS.has(b) ? (
                    <span className="ml-1 rounded-[4px] px-1 text-[10px]" style={{ background: selected ? "rgba(255,255,255,.25)" : "var(--color-mint)", color: selected ? "#fff" : "var(--color-green)" }}>Direct</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </FilterSection>
      </div>

      <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t bg-[color:var(--color-surface-1)] p-3 lg:border-t-0 lg:bg-white lg:px-0 lg:pb-0">
        <button type="button" onClick={onReset} className="secondary_button secondary_button--on-light">Reset</button>
        <button
          type="button"
          onClick={onApply}
          disabled={!dirty}
          className="main_accent_button main_accent_button--on-light flex-1 justify-center"
        >
          Apply
        </button>
      </div>
      </div>
      ) : null}
    </aside>
  );
}

// ============================================================
// Screen
// ============================================================

function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (p: number) => void }) {
  const pages: (number | "…")[] = [];
  const push = (v: number | "…") => pages.push(v);
  const window = 1;
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || (i >= page - window && i <= page + window)) push(i);
    else if (pages[pages.length - 1] !== "…") push("…");
  }
  const btn = "inline-flex h-[32px] min-w-[32px] items-center justify-center rounded-[12px] border border-[#E3E7E8] bg-[color:var(--color-surface-1)] px-2 text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)] disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="Pagination" className="mt-2 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={btn}
      >
        <IconChevronLeft size={16} strokeWidth={1.8} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-[13px] text-[color:var(--color-text-muted)]">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={
              p === page
                ? "inline-flex h-[32px] min-w-[32px] items-center justify-center rounded-[12px] bg-[color:var(--color-main-accent)] px-2 text-[13px] font-semibold text-[color:var(--on-main-accent)]"
                : btn
            }
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className={btn}
      >
        <IconChevronRight size={16} strokeWidth={1.8} />
      </button>
    </nav>
  );
}

function JobsScreen() {
  const [openJob, setOpenJob] = useState<Job | null>(null);
  const plan = usePlan();
  const pro = isPro(plan);
  // Scored matches are the page; an account with no plan sees the locked screen.
  const { loading: lockEntLoading } = useEntitlements();
  const { user } = useAuth();
  const quiz = useQuiz();
  const profileRoles = useMemo(() => {
    return quiz.roles?.length ? quiz.roles : quiz.role ? [quiz.role] : [];
  }, [quiz]);
  const seed = useMemo(() => ({ ...defaultsFromQuiz(quiz), roles: [...profileRoles] }), [quiz, profileRoles]);
  const [applied, setApplied] = useState<FilterState>(seed);
  const [pending, setPending] = useState<FilterState>(seed);
  // The profile hydrates from the server after mount, so the initial seed can
  // be empty. Re-seed once real answers arrive, unless the user already
  // touched the filters.
  const touched = useRef(false);
  const seeded = useRef(Object.keys(quiz).length > 0);
  useEffect(() => {
    if (seeded.current || touched.current) return;
    if (Object.keys(quiz).length === 0) return;
    seeded.current = true;
    setApplied(seed);
    setPending(seed);
  }, [quiz, seed]);
  const [filtersOpen, setFiltersOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024,
  );
  const [collapseSignal, setCollapseSignal] = useState(0);

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

  const { jobs: allJobsRaw, loaded } = useJobs();
  const { at: digestAt, loading: digestLoading } = useLatestDigestAt();
  const allJobs = useMemo(() => allJobsRaw.map(enrich), [allJobsRaw]);
  const blocked = useBlockedCompanies();
  const hiddenIds = useTrackerHiddenIds();
  const interactionHidden = useHiddenJobIds();
  const visible = useMemo(() => {
    const list = applyFilters(allJobs, applied);
    const blockedSet = new Set(blocked.map((c) => c.toLowerCase()));
    return list.filter(
      (j) => !hiddenIds.has(j.id) && !interactionHidden.has(j.id) && !blockedSet.has(j.company.toLowerCase()),
    );
  }, [allJobs, applied, blocked, hiddenIds, interactionHidden]);

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [applied]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const shown = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (lockEntLoading) return <PlanLockedSkeleton active="digest" />;
  if (plan === "free") {
    return (
      <PlanLockedScreen
        active="digest"
        heading={PLAN_LOCKED_COPY.digest.heading}
        body={PLAN_LOCKED_COPY.digest.body}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active="digest" />
      <main className="mx-auto max-w-[1200px] px-6 pt-6">
        <div className={`grid gap-6 lg:gap-8 ${filtersOpen ? "lg:grid-cols-[200px_minmax(0,1fr)_304px]" : "lg:grid-cols-[200px_minmax(0,1fr)_0px]"}`}>
          <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            {pro ? <TrackerWidget /> : <TrackerUpsell />}
            <SalaryTeaser />
          </div>

          <div className="min-w-0 pb-10">
            <h1 className="text-[24px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
              {(() => {
                const h = new Date().getHours();
                const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
                return firstName ? `${g}, ${firstName}` : g;
              })()}
            </h1>
            <p className="mt-1 text-[14px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
              {digestLoading ? (
                <span className="inline-block h-[14px] w-[220px] animate-pulse rounded-[4px] bg-[color:var(--color-border)] align-middle" aria-hidden />
              ) : digestAt ? (
                <>
                  Your latest digest arrived{" "}
                  <span className="font-semibold text-[color:var(--color-text-secondary)]">
                    {formatDigestArrival(digestAt).replace("Your latest digest arrived ", "")}
                  </span>
                </>
              ) : (
                formatDigestArrival(null)
              )}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {!loaded && allJobs.length === 0 ? (
                <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy="true">
                  <span className="sr-only">Loading jobs…</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <JobRowSkeleton key={i} />
                  ))}
                </div>
              ) : shown.length === 0 ? (
                <EmptyMatchesState />
              ) : shown.map((j) => (
                <div key={j.id} className="animate-fade-in">
                  <JobRowCard job={j} onOpen={() => setOpenJob(j)} />
                </div>
              ))}
              {pageCount > 1 ? (
                <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <FiltersSidebar
              pending={pending}
              applied={applied}
              onChange={(f) => {
                touched.current = true;
                setPending(f);
              }}
              onApply={() => setApplied(pending)}
              onReset={() => {
                touched.current = false;
                setPending(seed);
                setApplied(seed);
                setCollapseSignal((v) => v + 1);
              }}
              open={filtersOpen}
              onToggle={() => setFiltersOpen((v) => !v)}
              collapseSignal={collapseSignal}
            />
          </div>
        </div>
      </main>
      <MobileTabBar active="digest" />
      {openJob ? <JobDrawer job={openJob} onClose={() => setOpenJob(null)} /> : null}
    </div>
  );
}
