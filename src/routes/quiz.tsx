import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Search, X, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { loadQuiz, saveQuiz, type QuizAnswers } from "@/lib/quiz-store";
import { ROLES, ROLE_STACKS, COMMON_STACKS, LEVELS, USA_LOCATIONS, SPOKEN_LANGUAGES } from "@/lib/quiz-data";

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

  // On hydration, resume at the first incomplete step (for returning users).
  // After that, only Continue advances the current step — selections alone must not collapse it.
  useEffect(() => {
    if (!hydrated) return;
    let next: StepKey = "email";
    for (const k of STEP_ORDER) if (!completed[k]) { next = k; break; }
    setCurrent(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const activeStep = editing ?? current;

  function advance(nextFrom: StepKey, patch: Partial<QuizAnswers>) {
    setAnswers((a) => ({ ...a, ...patch }));
    const idx = STEP_ORDER.indexOf(nextFrom);
    const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
    if (editing === nextFrom) {
      setEditing(null);
      setCurrent((c) => (STEP_ORDER.indexOf(next) > STEP_ORDER.indexOf(c) ? next : c));
      return;
    }
    setCurrent(next);
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
                    onChange={(v) => setAnswers((a) => ({ ...a, role: v, stack: undefined }))}
                    onContinue={() => advance("role", {})}
                  />
                )}
                {key === "stack" && (
                  <StackStep
                    role={answers.role}
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
          className="group flex w-full items-center justify-between gap-3 rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-3 text-left transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 min-h-[56px]"
          aria-label={`Edit ${SUMMARY_LABEL[stepKey]}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-primary)]" style={{ aspectRatio: "1 / 1" }}>
              <Check className="h-4 w-4 text-[color:var(--color-foreground)]" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-light leading-5 text-[color:var(--color-text-muted)]">
                {SUMMARY_LABEL[stepKey]}
              </div>
              <div className="truncate text-sm font-light leading-5 text-[color:var(--color-foreground)]">
                {summaryValue(stepKey, answers)}
              </div>
            </div>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] text-[color:var(--color-text-secondary)] group-hover:bg-[color:var(--color-surface-2)]">
            <Pencil className="h-4 w-4" />
          </span>
        </button>
      </li>
    );
  }

  return (
    <li ref={ref} className="jobly-step-reveal">
      <div className="rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5 sm:p-6">
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

      {value && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-2.5 py-1 text-sm">
            <span className="text-[color:var(--color-text-muted)]">Selected role</span>
            <span className="ml-1 text-[color:var(--color-foreground)]">{value}</span>
          </span>
        </div>
      )}

      <div className="mt-4 max-h-[182px] overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-3">
        <div className="flex flex-wrap gap-2">
          {filtered.map((r) => {
            const selected = value === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onChange(r)}
                aria-pressed={selected}
                className={cn(
                  "inline-flex items-center rounded-[4px] border text-sm text-[color:var(--color-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  selected
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] hover:border-[color:var(--color-border-strong)]"
                )}
                style={{ padding: "6px 10px 6px 8px", gap: 8 }}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    selected
                      ? "border-white bg-white"
                      : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)]"
                  )}
                >
                  {selected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-green)]" />
                  )}
                </span>
                {r}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-[color:var(--color-text-muted)]">No matches.</p>
          )}
        </div>
      </div>

      <ContinueRow disabled={!value} onClick={onContinue} />
    </div>
  );
}

// ---------- 2. Stack ----------

function StackStep({
  role,
  value,
  onChange,
  onContinue,
}: {
  role?: string;
  value: string[];
  onChange: (v: string[]) => void;
  onContinue: () => void;
}) {
  const [query, setQuery] = useState("");
  const options = role ? ROLE_STACKS[role] ?? COMMON_STACKS : COMMON_STACKS;
  const filtered = options.filter((s) =>
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

      <div className="mt-4 max-h-[182px] overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-3">
        <div className="flex flex-wrap gap-2">
          {filtered.map((s) => {
            const selected = value.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                aria-pressed={selected}
                className={cn(
                  "inline-flex items-center rounded-[4px] border text-sm text-[color:var(--color-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  selected
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] hover:border-[color:var(--color-border-strong)]"
                )}
                style={{ padding: "6px 10px 6px 8px", gap: 8 }}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-[2px] border",
                    selected
                      ? "border-[#0E735A] bg-[#0E735A]"
                      : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)]"
                  )}
                >
                  {selected && (
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  )}
                </span>
                {s}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-[color:var(--color-text-muted)]">No matches.</p>
          )}
        </div>
      </div>

      <ContinueRow disabled={!canContinue} onClick={onContinue} />
    </div>
  );
}

// ---------- 3. Experience ----------

import junImg from "@/assets/Jun.png.asset.json";
import midImg from "@/assets/Mid.png.asset.json";
import senImg from "@/assets/Sen.png.asset.json";
import leaImg from "@/assets/Lea.png.asset.json";

const LEVEL_IMAGES: Record<string, string> = {
  Junior: junImg.url,
  Mid: midImg.url,
  Senior: senImg.url,
  Lead: leaImg.url,
};

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
  const [langFocused, setLangFocused] = useState(false);
  const [langHighlighted, setLangHighlighted] = useState(0);

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

  const langQuery = langInput.trim().toLowerCase();
  const filteredLangs = useMemo(
    () =>
      langQuery
        ? SPOKEN_LANGUAGES.filter(
            (lang) =>
              lang.toLowerCase().includes(langQuery) &&
              !languages.some((l) => l.toLowerCase() === lang.toLowerCase())
          ).slice(0, 7)
        : [],
    [langQuery, languages]
  );

  useEffect(() => setLangHighlighted(0), [filteredLangs.length]);

  const addLangSuggestion = (lang: string) => {
    if (!languages.some((l) => l.toLowerCase() === lang.toLowerCase())) {
      onChange({ languages: [...languages, lang] });
    }
    setLangInput("");
  };

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
                "relative flex h-[56px] items-center overflow-hidden rounded-[4px] border pl-4 pr-0 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                selected
                  ? "border-[#00F1A9] bg-[#00F1A9]"
                  : "border-[#E3E7E8] bg-white hover:border-[color:var(--color-border-strong)]"
              )}
              aria-pressed={selected}
            >
              <span className="flex items-center gap-2 text-[16px] font-light leading-[1.60] text-[#090B0C]">
                {selected && (
                  <span className="grid h-4 w-4 place-items-center rounded-[2px] bg-[#0E735A]">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                )}
                {l}
              </span>
              <img
                src={LEVEL_IMAGES[l]}
                alt=""
                aria-hidden="true"
                className="absolute right-0 top-0 h-full w-auto object-contain object-right"
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-light text-[#090B0C]">Years of experience</span>
          <span className="text-[16px] font-light leading-[1.60] text-[#090B0C]">
            {formatYears(years)} years
          </span>
        </div>
        <div className="relative mt-4 h-8">
          {/* Track */}
          <div className="absolute left-[11px] right-[11px] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-surface-2)]" />
          {/* Selected range */}
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-green)]"
            style={{
              left: "11px",
              right: `calc(11px + (100% - 22px) * ${1 - years / 20})`,
            }}
          />
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={years}
            onChange={(e) => onChange({ years: Number(e.target.value) })}
            aria-label="Years of experience"
            className="jobly-range absolute inset-0 w-full appearance-none bg-transparent"
          />
        </div>
        <div className="relative mt-2 h-4 text-[11px] text-[color:var(--color-text-muted)]">
          {ticks.map((t) => (
            <span
              key={t}
              data-exp-tick
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `calc(11px + (100% - 22px) * ${t / 20})` }}
            >
              {t === 0 ? "<1" : t === 20 ? "20+" : t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-light text-[#090B0C]">Spoken languages</label>
        <div className="relative mt-1.5">
          <input
            value={langInput}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(",")) {
                const raw = v.replace(/,+$/, "").trim();
                if (
                  raw &&
                  !languages.some((l) => l.toLowerCase() === raw.toLowerCase())
                ) {
                  onChange({ languages: [...languages, raw] });
                }
                setLangInput("");
              } else {
                setLangInput(v);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (langFocused && filteredLangs.length > 0) {
                  addLangSuggestion(filteredLangs[langHighlighted]);
                } else {
                  commitLang();
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setLangHighlighted((i) => Math.min(i + 1, filteredLangs.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setLangHighlighted((i) => Math.max(i - 1, 0));
              } else if (e.key === "Backspace" && langInput === "" && languages.length > 0) {
                onChange({ languages: languages.slice(0, -1) });
              }
            }}
            onFocus={() => setLangFocused(true)}
            onBlur={() => setLangFocused(false)}
            placeholder="e.g. English"
            className="h-11 w-full rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 text-sm outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
          />
          {langFocused && langInput.trim() && filteredLangs.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] py-1 shadow-sm"
              onMouseDown={(e) => e.preventDefault()}
            >
              {filteredLangs.map((lang, idx) => (
                <li
                  key={lang}
                  onMouseDown={() => addLangSuggestion(lang)}
                  onMouseEnter={() => setLangHighlighted(idx)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm transition-colors",
                    idx === langHighlighted ? "bg-[color:var(--color-surface-2)]" : "hover:bg-[color:var(--color-surface-2)]"
                  )}
                >
                  {lang}
                </li>
              ))}
            </ul>
          )}
        </div>
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
  const locations = answers.locations ?? [];
  const [locInput, setLocInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const minVal = answers.salaryMin ?? 100_000;
  const maxVal = answers.salaryMax ?? 160_000;

  const canContinue = (remote || locations.length > 0) && minVal < maxVal;

  const commitLoc = () => {
    const v = locInput.trim().replace(/,+$/, "").trim();
    if (!v) return;
    if (locations.some((l) => l.toLowerCase() === v.toLowerCase())) {
      setLocInput("");
      return;
    }
    onChange({ locations: [...locations, v] });
    setLocInput("");
  };

  const removeLoc = (l: string) =>
    onChange({ locations: locations.filter((x) => x !== l) });

  const locQuery = locInput.trim().toLowerCase();
  const filteredSuggestions = useMemo(
    () =>
      locQuery
        ? USA_LOCATIONS.filter(
            (loc) =>
              loc.toLowerCase().includes(locQuery) &&
              !locations.some((l) => l.toLowerCase() === loc.toLowerCase())
          ).slice(0, 7)
        : [],
    [locQuery, locations]
  );

  useEffect(() => setHighlighted(0), [filteredSuggestions.length]);

  const addSuggestion = (loc: string) => {
    if (!locations.some((l) => l.toLowerCase() === loc.toLowerCase())) {
      onChange({ locations: [...locations, loc] });
    }
    setLocInput("");
  };

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

      <div className="mt-5 flex items-center justify-between rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-3">
        <div>
          <div className="text-base font-light leading-relaxed text-[#090B0C]">Open to remote</div>
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

      <div className="mt-4">
        <label className="block text-sm font-light text-[#090B0C]">Preferred locations</label>
        <div className="relative mt-1.5">
          <input
            value={locInput}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(",")) {
                const raw = v.replace(/,+$/, "").trim();
                if (
                  raw &&
                  !locations.some((l) => l.toLowerCase() === raw.toLowerCase())
                ) {
                  onChange({ locations: [...locations, raw] });
                }
                setLocInput("");
              } else {
                setLocInput(v);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (focused && filteredSuggestions.length > 0) {
                  addSuggestion(filteredSuggestions[highlighted]);
                } else {
                  commitLoc();
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlighted((i) => Math.min(i + 1, filteredSuggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlighted((i) => Math.max(i - 1, 0));
              } else if (e.key === "Backspace" && locInput === "" && locations.length > 0) {
                onChange({ locations: locations.slice(0, -1) });
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. New York City, USA"
            className="h-11 w-full rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 text-sm outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
          />
          {focused && locInput.trim() && filteredSuggestions.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] py-1 shadow-sm"
              onMouseDown={(e) => e.preventDefault()}
            >
              {filteredSuggestions.map((loc, idx) => (
                <li
                  key={loc}
                  onMouseDown={() => addSuggestion(loc)}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm transition-colors",
                    idx === highlighted ? "bg-[color:var(--color-surface-2)]" : "hover:bg-[color:var(--color-surface-2)]"
                  )}
                >
                  {loc}
                </li>
              ))}
            </ul>
          )}
        </div>
        {locations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {locations.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-2.5 py-1 text-sm"
              >
                {l}
                <button
                  type="button"
                  onClick={() => removeLoc(l)}
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

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-light text-[#090B0C]">Salary range</span>
          <span className="text-base font-light leading-relaxed text-[#090B0C]">
            {formatMoney(minVal)} – {formatMoney(maxVal)}
          </span>
        </div>
        <div className="relative mt-4 h-8">
          {/* Track */}
          <div className="absolute left-[11px] right-[11px] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-surface-2)]" />
          {/* Selected range */}
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-green)]"
            style={{
              left: `calc(11px + (100% - 22px) * ${pct(minVal) / 100})`,
              right: `calc(11px + (100% - 22px) * ${1 - pct(maxVal) / 100})`,
            }}
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
        <div className="relative mt-2 h-4 text-[11px] text-[color:var(--color-text-muted)]">
          {[60, 100, 140, 180, 220].map((tick) => (
            <span
              key={tick}
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `calc(11px + (100% - 22px) * ${(tick - 60) / 160})` }}
            >
              ${tick}k
            </span>
          ))}
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
          <span className="text-sm font-light text-[#090B0C]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Enter your email"
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
            !valid || submitting
              ? "bg-[color:var(--color-success-subtle)] text-[color:var(--color-text-muted)] cursor-not-allowed"
              : "bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
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
          disabled
            ? "bg-[color:var(--color-success-subtle)] text-[color:var(--color-text-muted)] cursor-not-allowed"
            : "bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
        )}
      >
        Continue
      </button>
    </div>
  );
}