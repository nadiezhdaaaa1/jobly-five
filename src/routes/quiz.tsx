import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Search, X, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { loadQuiz, saveQuiz, type QuizAnswers } from "@/lib/quiz-store";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Set up your Jobly profile — 2 minute quiz" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizPage,
});

type StepKey = "role" | "stack" | "level" | "loc" | "email";
const STEP_ORDER: StepKey[] = ["role", "stack", "level", "loc", "email"];

const ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Mobile Engineer",
  "iOS Engineer",
  "Android Engineer",
  "Software Engineer",
  "Staff Engineer",
  "Engineering Manager",
  "Tech Lead",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Platform Engineer",
  "Cloud Engineer",
  "Security Engineer",
  "QA Engineer",
  "Test Automation Engineer",
  "Data Engineer",
  "Data Scientist",
  "Data Analyst",
  "Analytics Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  "MLOps Engineer",
  "Research Engineer",
  "Product Manager",
  "Technical Product Manager",
  "Product Designer",
  "UX Designer",
  "UI Designer",
  "UX Researcher",
  "Design Engineer",
  "Solutions Architect",
  "Systems Architect",
  "Database Administrator",
  "Embedded Engineer",
  "Firmware Engineer",
  "Game Developer",
  "Blockchain Engineer",
  "Developer Advocate",
  "Technical Writer",
  "IT Support Engineer",
];
const LEVELS = ["Junior", "Mid", "Senior", "Lead"];
const STACK_OPTIONS = [
  "React",
  "Node",
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "Kotlin",
  "Swift",
  "SQL",
  "PostgreSQL",
  "GraphQL",
  "AWS",
  "GCP",
  "Docker",
  "Kubernetes",
  "Figma",
  "Next.js",
  "Vue",
  "Django",
  "Rails",
];

function formatMoney(n: number) {
  return `$${Math.round(n / 1000)}k`;
}

function QuizPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [hydrated, setHydrated] = useState(false);
  const [current, setCurrent] = useState<StepKey>("role");
  const [editing, setEditing] = useState<StepKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAnswers(loadQuiz());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveQuiz(answers);
  }, [answers, hydrated]);

  // Determine which steps are visible: all completed + first pending (= current or editing)
  const completed: Record<StepKey, boolean> = {
    role: !!answers.role,
    stack: !!(answers.stack && answers.stack.length > 0),
    level: !!answers.level,
    loc:
      answers.salaryMin != null &&
      answers.salaryMax != null &&
      (answers.remote || (answers.locations?.length ?? 0) > 0),
    email: !!answers.email,
  };

  // Derive the current step from completion, unless the user is actively editing
  const derivedCurrent: StepKey = useMemo(() => {
    for (const k of STEP_ORDER) if (!completed[k]) return k;
    return "email";
  }, [completed]);

  useEffect(() => {
    if (!editing) setCurrent(derivedCurrent);
  }, [derivedCurrent, editing]);

  const activeStep = editing ?? current;

  function advance(nextFrom: StepKey, patch: Partial<QuizAnswers>) {
    setAnswers((a) => ({ ...a, ...patch }));
    if (editing === nextFrom) {
      setEditing(null);
    }
    // Focus/scroll handled by step effect
  }

  async function handleSubmit(email: string) {
    setAnswers((a) => ({ ...a, email }));
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    navigate({ to: "/matches" });
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="pt-6 pb-6">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            to="/"
            className="text-[30px] font-bold text-[color:var(--color-green)]"
            style={{ fontFamily: "var(--font-logo)" }}
          >
            jobly
          </Link>

          <Link
            to="/login"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 rounded-[10px] px-2 py-1"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl">Let's set up your matches</h1>
          <p className="mt-2 text-[color:var(--color-text-secondary)]">
            Answer a few quick questions. Takes about 2 minutes.
          </p>
        </div>

        <ol className="flex flex-col gap-4">
          {STEP_ORDER.map((key) => {
            const isVisible = completed[key] || key === activeStep;
            if (!isVisible) return null;
            const isExpanded = key === activeStep;
            return (
              <StepShell
                key={key}
                stepKey={key}
                expanded={isExpanded}
                answers={answers}
                onEdit={() => setEditing(key)}
              >
                {key === "role" && (
                  <RoleStep
                    value={answers.role}
                    onChange={(v) => setAnswers((a) => ({ ...a, role: v }))}
                    onContinue={() => advance("role", {})}
                  />
                )}
                {key === "stack" && (
                  <StackStep
                    value={answers.stack ?? []}
                    onChange={(stack) => setAnswers((a) => ({ ...a, stack }))}
                    onContinue={() => advance("stack", {})}
                  />
                )}
                {key === "level" && (
                  <ExperienceStep
                    answers={answers}
                    onChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
                    onContinue={() => advance("level", {})}
                  />
                )}
                {key === "loc" && (
                  <LocationStep
                    answers={answers}
                    onChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
                    onContinue={() => advance("loc", {})}
                  />
                )}
                {key === "email" && (
                  <EmailStep
                    answers={answers}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                  />
                )}
              </StepShell>
            );
          })}
        </ol>
      </main>
    </div>
  );
}

// ---------- Step shell (expanded card OR collapsed summary) ----------

function StepShell({
  stepKey,
  expanded,
  answers,
  onEdit,
  children,
}: {
  stepKey: StepKey;
  expanded: boolean;
  answers: QuizAnswers;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const prev = useRef(expanded);

  useEffect(() => {
    if (expanded && !prev.current && ref.current) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      ref.current.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "center",
      });
    }
    prev.current = expanded;
  }, [expanded]);

  if (!expanded) {
    return (
      <li ref={ref}>
        <button
          type="button"
          onClick={onEdit}
          className="group flex w-full items-center justify-between gap-3 rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-3 text-left transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 min-h-[56px]"
          aria-label={`Edit ${SUMMARY_LABEL[stepKey]}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--color-green)]">
              <Check className="h-3.5 w-3.5" style={{ color: "var(--color-on-accent)" }} strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)]">
                {SUMMARY_LABEL[stepKey]}
              </div>
              <div className="truncate text-sm font-semibold text-[color:var(--color-foreground)]">
                {summaryValue(stepKey, answers)}
              </div>
            </div>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] group-hover:border-[color:var(--color-border-strong)]">
            <Pencil className="h-4 w-4" />
          </span>
        </button>
      </li>
    );
  }

  return (
    <li ref={ref} className="jobly-step-reveal">
      <div className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5 sm:p-6">
        {children}
      </div>
      <style>{`
        @keyframes joblyReveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .jobly-step-reveal { animation: joblyReveal 180ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .jobly-step-reveal { animation: none; }
        }
      `}</style>
    </li>
  );
}

const SUMMARY_LABEL: Record<StepKey, string> = {
  role: "Role",
  stack: "Stack",
  level: "Experience",
  loc: "Location and salary",
  email: "Email",
};

function summaryValue(key: StepKey, a: QuizAnswers): string {
  switch (key) {
    case "role":
      return a.role ?? "";
    case "stack":
      return (a.stack ?? []).join(", ");
    case "level": {
      const parts: string[] = [];
      if (a.level) parts.push(a.level);
      if (a.years != null) parts.push(`${formatYears(a.years)}y`);
      if (a.languages && a.languages.length > 0) parts.push(...a.languages);
      return parts.join(" · ");
    }
    case "loc": {
      const locs = a.locations ?? [];
      const where = locs.length > 0 ? locs.join(" · ") : a.remote ? "Remote" : "";
      const money =
        a.salaryMin != null && a.salaryMax != null
          ? `${formatMoney(a.salaryMin)}–${formatMoney(a.salaryMax)}`
          : "";
      return [where, money].filter(Boolean).join(" · ");
    }
    case "email":
      return a.email ?? "";
  }
}

function formatYears(n: number): string {
  if (n <= 0) return "<1";
  if (n >= 20) return "20+";
  return String(n);
}

// ---------- Heading helper ----------

function StepHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl sm:text-[28px]">{children}</h2>;
}

// ---------- 1. Role ----------

function RoleStep({
  value,
  onChange,
  onContinue,
}: {
  value?: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = ROLES.filter((r) =>
    r.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <div>
      <StepHeading>What's your role?</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        Search and pick the role that fits you best.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 focus-within:ring-2 focus-within:ring-[color:var(--color-ring)] focus-within:ring-offset-2">
        <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--color-text-muted)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[color:var(--color-text-muted)]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 max-h-[320px] overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] divide-y divide-[color:var(--color-border)]">
        {filtered.map((r) => {
          const selected = value === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-[color:var(--color-surface-2)]",
                selected
                  ? "bg-[color:var(--color-success-subtle)] font-semibold text-[color:var(--color-foreground)]"
                  : "hover:bg-[color:var(--color-surface-2)]"
              )}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  selected
                    ? "border-[color:var(--color-green)]"
                    : "border-[color:var(--color-border-strong)]"
                )}
              >
                {selected && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-green)]" />
                )}
              </span>
              {r}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-4 py-3 text-sm text-[color:var(--color-text-muted)]">No matches.</p>
        )}
      </div>

      <ContinueRow disabled={!value} onClick={onContinue} />
    </div>
  );
}

// ---------- 2. Stack ----------

function StackStep({
  value,
  onChange,
  onContinue,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onContinue: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = STACK_OPTIONS.filter((s) =>
    s.toLowerCase().includes(query.trim().toLowerCase())
  );
  const toggle = (s: string) =>
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);

  const canContinue = value.length > 0;

  return (
    <div>
      <StepHeading>What's your stack?</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        Pick the tools you actually work with. Select at least one.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 focus-within:ring-2 focus-within:ring-[color:var(--color-ring)] focus-within:ring-offset-2">
        <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search technologies"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--color-text-muted)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[color:var(--color-text-muted)]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-2.5 py-1 text-sm"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                aria-label={`Remove ${s}`}
                className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-foreground)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 max-h-[320px] overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] divide-y divide-[color:var(--color-border)]">
        {filtered.map((s) => {
          const selected = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-[color:var(--color-surface-2)]",
                selected
                  ? "bg-[color:var(--color-success-subtle)] font-semibold text-[color:var(--color-foreground)]"
                  : "hover:bg-[color:var(--color-surface-2)]"
              )}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border-2",
                  selected
                    ? "border-[color:var(--color-green)] bg-[color:var(--color-green)]"
                    : "border-[color:var(--color-border-strong)]"
                )}
              >
                {selected && (
                  <Check className="h-3 w-3" style={{ color: "var(--color-on-accent)" }} strokeWidth={3} />
                )}
              </span>
              {s}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-4 py-3 text-sm text-[color:var(--color-text-muted)]">No matches.</p>
        )}
      </div>

      <ContinueRow disabled={!canContinue} onClick={onContinue} />
    </div>
  );
}

// ---------- 3. Experience ----------

function CubeIcon({ selected }: { selected: boolean }) {
  const fill = selected ? "var(--color-on-accent)" : "var(--color-green)";
  const stroke = selected ? "var(--color-on-accent)" : "var(--color-border-strong)";
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" stroke={stroke} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M20 4 L20 20 L6 12 Z" fill={fill} opacity="0.85" />
      <path d="M20 20 L34 12 L34 28 L20 36 Z" fill={fill} opacity="0.35" />
    </svg>
  );
}

function ExperienceStep({
  answers,
  onChange,
  onContinue,
}: {
  answers: QuizAnswers;
  onChange: (p: Partial<QuizAnswers>) => void;
  onContinue: () => void;
}) {
  const level = answers.level;
  const years = answers.years ?? 0;
  const languages = answers.languages ?? [];
  const [langInput, setLangInput] = useState("");

  const commitLang = () => {
    const v = langInput.trim().replace(/,+$/, "").trim();
    if (!v) return;
    if (languages.some((l) => l.toLowerCase() === v.toLowerCase())) {
      setLangInput("");
      return;
    }
    onChange({ languages: [...languages, v] });
    setLangInput("");
  };

  const removeLang = (l: string) =>
    onChange({ languages: languages.filter((x) => x !== l) });

  const canContinue = !!level;

  const ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

  return (
    <div>
      <StepHeading>What's your experience?</StepHeading>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {LEVELS.map((l) => {
          const selected = level === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => onChange({ level: l })}
              className={cn(
                "flex min-h-[72px] items-center justify-between rounded-[4px] border px-4 py-3 text-left text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                selected
                  ? "border-[color:var(--color-green)] bg-[color:var(--color-green)] text-[color:var(--color-on-accent)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] hover:border-[color:var(--color-border-strong)]"
              )}
              aria-pressed={selected}
            >
              <span className="flex items-center gap-2">
                {selected && (
                  <span className="grid h-5 w-5 place-items-center rounded-[4px] border-2 border-[color:var(--color-on-accent)]">
                    <Check className="h-3 w-3" style={{ color: "var(--color-on-accent)" }} strokeWidth={3} />
                  </span>
                )}
                {l}
              </span>
              <CubeIcon selected={selected} />
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">Years of experience</span>
          <span className="text-sm text-[color:var(--color-foreground)] font-semibold">
            {formatYears(years)} years
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={years}
          onChange={(e) => onChange({ years: Number(e.target.value) })}
          aria-label="Years of experience"
          className="jobly-single-range mt-3 h-2 w-full appearance-none rounded-full"
          style={{
            background: `linear-gradient(to right, var(--color-green) 0%, var(--color-green) ${(years / 20) * 100}%, var(--color-surface-2) ${(years / 20) * 100}%, var(--color-surface-2) 100%)`,
          }}
        />
        <div className="mt-2 flex justify-between text-[11px] text-[color:var(--color-text-muted)]">
          {ticks.map((t) => (
            <span key={t}>{t === 0 ? "<1" : t === 20 ? "20+" : t}</span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="block">
          <span className="text-sm font-semibold">Spoken languages</span>
          <input
            value={langInput}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(",")) {
                setLangInput(v);
                commitLang();
              } else {
                setLangInput(v);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitLang();
              } else if (e.key === "Backspace" && langInput === "" && languages.length > 0) {
                onChange({ languages: languages.slice(0, -1) });
              }
            }}
            placeholder="e.g. English"
            className="mt-1.5 h-11 w-full rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 text-sm outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
          />
        </label>
        {languages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {languages.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-2.5 py-1 text-sm"
              >
                {l}
                <button
                  type="button"
                  onClick={() => removeLang(l)}
                  aria-label={`Remove ${l}`}
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .jobly-single-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px; width: 20px; border-radius: 9999px;
          background: var(--color-green);
          border: 3px solid var(--color-surface-1);
          box-shadow: 0 0 0 1px var(--color-green);
          cursor: pointer;
        }
        .jobly-single-range::-moz-range-thumb {
          height: 20px; width: 20px; border-radius: 9999px;
          background: var(--color-green);
          border: 3px solid var(--color-surface-1);
          box-shadow: 0 0 0 1px var(--color-green);
          cursor: pointer;
        }
      `}</style>

      <ContinueRow disabled={!canContinue} onClick={onContinue} />
    </div>
  );
}

// ---------- 4. Location & salary ----------

const SAL_MIN = 60_000;
const SAL_MAX = 220_000;
const SAL_STEP = 5_000;

function LocationStep({
  answers,
  onChange,
  onContinue,
}: {
  answers: QuizAnswers;
  onChange: (p: Partial<QuizAnswers>) => void;
  onContinue: () => void;
}) {
  const remote = answers.remote ?? false;
  const location = answers.location ?? "";
  const minVal = answers.salaryMin ?? 100_000;
  const maxVal = answers.salaryMax ?? 160_000;

  const canContinue = (remote || location.trim().length > 0) && minVal < maxVal;

  const setMin = (v: number) => {
    const nv = Math.min(v, maxVal - SAL_STEP);
    onChange({ salaryMin: nv, salaryMax: maxVal });
  };
  const setMax = (v: number) => {
    const nv = Math.max(v, minVal + SAL_STEP);
    onChange({ salaryMin: minVal, salaryMax: nv });
  };

  const pct = (v: number) => ((v - SAL_MIN) / (SAL_MAX - SAL_MIN)) * 100;

  return (
    <div>
      <StepHeading>Where and how much?</StepHeading>

      <div className="mt-5 flex items-center justify-between rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-3">
        <div>
          <div className="text-[15px] font-semibold">Open to remote</div>
          <div className="text-sm text-[color:var(--color-text-secondary)]">
            Include fully remote roles
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={remote}
          onClick={() => onChange({ remote: !remote })}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
            remote ? "bg-[color:var(--color-green)]" : "bg-[color:var(--color-surface-2)]"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
              remote ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">Preferred location</span>
        <input
          value={location}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder={remote ? "Optional if remote" : "e.g. Berlin, Germany"}
          className="mt-1.5 h-11 w-full rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 text-sm outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
        />
      </label>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">Salary range</span>
          <span className="text-sm text-[color:var(--color-green)] font-semibold">
            {formatMoney(minVal)} – {formatMoney(maxVal)}
          </span>
        </div>
        <div className="relative mt-4 h-8">
          {/* Track */}
          <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-surface-2)]" />
          {/* Selected range */}
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-green)]"
            style={{ left: `${pct(minVal)}%`, right: `${100 - pct(maxVal)}%` }}
          />
          {/* Inputs stacked */}
          <input
            type="range"
            min={SAL_MIN}
            max={SAL_MAX}
            step={SAL_STEP}
            value={minVal}
            onChange={(e) => setMin(Number(e.target.value))}
            aria-label="Minimum salary"
            className="jobly-range absolute inset-0 w-full appearance-none bg-transparent"
          />
          <input
            type="range"
            min={SAL_MIN}
            max={SAL_MAX}
            step={SAL_STEP}
            value={maxVal}
            onChange={(e) => setMax(Number(e.target.value))}
            aria-label="Maximum salary"
            className="jobly-range absolute inset-0 w-full appearance-none bg-transparent"
          />
        </div>
      </div>

      <style>{`
        .jobly-range { pointer-events: none; }
        .jobly-range::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          height: 22px; width: 22px; border-radius: 9999px;
          background: var(--color-surface-1);
          border: 2px solid var(--color-green);
          box-shadow: 0 0 0 1px var(--color-green);
          cursor: pointer;
        }
        .jobly-range::-moz-range-thumb {
          pointer-events: auto;
          height: 22px; width: 22px; border-radius: 9999px;
          background: var(--color-surface-1);
          border: 2px solid var(--color-green);
          cursor: pointer;
        }
        .jobly-range:focus-visible::-webkit-slider-thumb {
          outline: 2px solid var(--color-ring);
          outline-offset: 2px;
        }
      `}</style>

      <ContinueRow disabled={!canContinue} onClick={onContinue} />
    </div>
  );
}

// ---------- 5. Email gate ----------

function EmailStep({
  answers,
  submitting,
  onSubmit,
}: {
  answers: QuizAnswers;
  submitting: boolean;
  onSubmit: (email: string) => void;
}) {
  const [email, setEmail] = useState(answers.email ?? "");
  const [touched, setTouched] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showError = touched && !valid;

  return (
    <div>
      <StepHeading>Where should we send your matches?</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        Your first digest arrives within 24 hours. No spam, unsubscribe anytime.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (valid && !submitting) onSubmit(email.trim());
        }}
        className="mt-5"
      >
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="you@company.com"
            aria-invalid={showError}
            className={cn(
              "mt-1.5 h-12 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
              showError
                ? "border-[color:var(--color-danger)]"
                : "border-[color:var(--color-border)]"
            )}
          />
          {showError && (
            <span className="mt-1.5 block text-sm text-[color:var(--color-danger)]">
              Enter a valid email address.
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={!valid || submitting}
          className={cn(
            "mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-button px-5 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
            "bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding your matches…
            </>
          ) : (
            "Get my matches"
          )}
        </button>
      </form>
    </div>
  );
}

// ---------- Continue button row ----------

function ContinueRow({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center rounded-button px-5 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
          "bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        Continue
      </button>
    </div>
  );
}