import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Search, X, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  loadQuiz,
  saveQuiz,
  type QuizAnswers,
  type ProficiencyLevel,
  type WorkMode,
  type AdditionalLanguage,
} from "@/lib/quiz-store";
import {
  LEVELS,
  LEVEL_DEFAULT_YEARS,
  FIELDS,
  FIELD_ROLES,
  skillsForRoles,
  US_STATES,
  CITIES_BY_STATE,
  POPULAR_LANGUAGES,
  PROFICIENCY_LEVELS,
  RELO_TRAVEL_FIELDS,
} from "@/lib/quiz-data";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Set up your Jobly profile — 2 minute quiz" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizPage,
});

type StepKey =
  | "field"
  | "role"
  | "hard"
  | "tools"
  | "soft"
  | "level"
  | "loc"
  | "email";
const STEP_ORDER: StepKey[] = [
  "field",
  "role",
  "hard",
  "tools",
  "soft",
  "level",
  "loc",
  "email",
];

function formatMoney(n: number) {
  return `$${Math.round(n / 1000)}k`;
}

function QuizPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [hydrated, setHydrated] = useState(false);
  const [current, setCurrent] = useState<StepKey>("field");
  const [editing, setEditing] = useState<StepKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAnswers(loadQuiz());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveQuiz(answers);
  }, [answers, hydrated]);

  const rolesList = answers.roles ?? (answers.role ? [answers.role] : []);
  const skillsPool = useMemo(
    () => skillsForRoles(rolesList, answers.field),
    [rolesList, answers.field]
  );
  const hardPoolSet = useMemo(() => new Set(skillsPool.hard), [skillsPool.hard]);
  const toolsPoolSet = useMemo(() => new Set(skillsPool.tools), [skillsPool.tools]);
  const softPoolSet = useMemo(() => new Set(skillsPool.soft), [skillsPool.soft]);

  // Role is invalid if any selected role isn't in the current field's role list.
  const fieldRoles = answers.field ? FIELD_ROLES[answers.field as keyof typeof FIELD_ROLES] : undefined;
  const roleInvalid =
    !!answers.field &&
    rolesList.length > 0 &&
    !!fieldRoles &&
    rolesList.some((r) => !fieldRoles.includes(r));

  // Skill sub-steps: invalid when selection contains items no longer in the pool,
  // emptied when a previous selection was wiped by upstream (field / role) changes.
  const hardSel = answers.hardSkills ?? [];
  const toolsSel = answers.tools ?? [];
  const softSel = answers.softSkills ?? [];
  const hardInvalid =
    hardSel.length > 0 && hardSel.some((s) => !hardPoolSet.has(s));
  const hardEmptied =
    answers.hardSkills !== undefined && answers.hardSkills.length === 0;
  const toolsInvalid =
    toolsSel.length > 0 && toolsSel.some((s) => !toolsPoolSet.has(s));
  const toolsEmptied =
    answers.tools !== undefined && answers.tools.length === 0;
  const softInvalid =
    softSel.length > 0 && softSel.some((s) => !softPoolSet.has(s));
  const softEmptied =
    answers.softSkills !== undefined && answers.softSkills.length === 0;

  // Role step shows collapsed-with-X when field change wiped the roles.
  const roleEmptied =
    answers.roles !== undefined && answers.roles.length === 0;

  const completed: Record<StepKey, boolean> = {
    field: !!answers.field,
    role: rolesList.length > 0 && !roleInvalid,
    hard: (answers.hardSkills?.length ?? 0) > 0 && !hardInvalid,
    tools: (answers.tools?.length ?? 0) > 0 && !toolsInvalid,
    soft: (answers.softSkills?.length ?? 0) > 0 && !softInvalid,
    level: !!answers.level,
    loc:
      !!answers.workMode &&
      (answers.workMode === "remote" || (answers.locations?.length ?? 0) > 0) &&
      answers.salaryMin != null &&
      answers.salaryMax != null,
    email: !!answers.email,
  };

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
      setCurrent(next);
      return;
    }
    setCurrent(next);
  }

  function openEdit(key: StepKey) {
    if (key === "role" && (roleInvalid || roleEmptied)) {
      setAnswers((a) => ({
        ...a,
        roles: (a.roles ?? []).filter((r) => fieldRoles?.includes(r)),
      }));
    }
    if (key === "hard" && (hardInvalid || hardEmptied)) {
      setAnswers((a) => ({
        ...a,
        hardSkills: (a.hardSkills ?? []).filter((s) => hardPoolSet.has(s)),
      }));
    }
    if (key === "tools" && toolsInvalid) {
      setAnswers((a) => ({
        ...a,
        tools: (a.tools ?? []).filter((s) => toolsPoolSet.has(s)),
      }));
    }
    if (key === "soft" && softInvalid) {
      setAnswers((a) => ({
        ...a,
        softSkills: (a.softSkills ?? []).filter((s) => softPoolSet.has(s)),
      }));
    }
    setEditing(key);
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
            const isVisible =
              completed[key] ||
              key === activeStep ||
              (key === "role" && (roleInvalid || roleEmptied)) ||
              (key === "hard" && (hardInvalid || hardEmptied)) ||
              (key === "tools" && toolsInvalid) ||
              (key === "soft" && softInvalid);
            if (!isVisible) return null;
            const isExpanded = key === activeStep;
            const invalid =
              (key === "role" && (roleInvalid || roleEmptied) && !isExpanded) ||
              (key === "hard" && (hardInvalid || hardEmptied) && !isExpanded) ||
              (key === "tools" && toolsInvalid && !isExpanded) ||
              (key === "soft" && softInvalid && !isExpanded);
            return (
              <StepShell
                key={key}
                stepKey={key}
                expanded={isExpanded}
                answers={answers}
                invalid={invalid}
                onEdit={() => openEdit(key)}
              >
                {key === "field" && (
                  <FieldStep
                    value={answers.field}
                    onChange={(field) =>
                      setAnswers((a) => {
                        // Reset roles / skills that no longer fit.
                        const allowedRoles = FIELD_ROLES[field as keyof typeof FIELD_ROLES] ?? [];
                        const prunedRoles = (a.roles ?? []).filter((r) => allowedRoles.includes(r));
                        return {
                          ...a,
                          field,
                          roles: prunedRoles,
                          role: prunedRoles[0],
                        };
                      })
                    }
                    onContinue={() => advance("field", {})}
                  />
                )}
                {key === "role" && (
                  <RoleStep
                    field={answers.field}
                    value={answers.roles ?? []}
                    onChange={(v) =>
                      setAnswers((a) => {
                        const pool = skillsForRoles(v, a.field);
                        const hardSet = new Set(pool.hard);
                        const toolSet = new Set(pool.tools);
                        const softSet = new Set(pool.soft);
                        const prunedHard =
                          a.hardSkills !== undefined
                            ? a.hardSkills.filter((s) => hardSet.has(s))
                            : a.hardSkills;
                        const prunedTools =
                          a.tools !== undefined
                            ? a.tools.filter((s) => toolSet.has(s))
                            : a.tools;
                        const prunedSoft =
                          a.softSkills !== undefined
                            ? a.softSkills.filter((s) => softSet.has(s))
                            : a.softSkills;
                        return {
                          ...a,
                          roles: v,
                          role: v[0],
                          hardSkills: prunedHard,
                          tools: prunedTools,
                          softSkills: prunedSoft,
                        };
                      })
                    }
                    onContinue={() => advance("role", {})}
                  />
                )}
                {key === "hard" && (
                  <SingleSkillStep
                    title="What are your hard skills?"
                    description="Role-specific technical skills you actually work with."
                    label="Hard skills"
                    hint="At least one required"
                    searchPlaceholder="Search hard skills"
                    options={skillsPool.hard}
                    value={answers.hardSkills ?? []}
                    onChange={(v) => setAnswers((a) => ({ ...a, hardSkills: v }))}
                    onContinue={() =>
                      advance("hard", { hardSkills: answers.hardSkills ?? [] })
                    }
                    required
                  />
                )}
                {key === "tools" && (
                  <SingleSkillStep
                    title="Which tools do you use?"
                    description="Software and platforms you work with day to day."
                    label="Tools"
                    hint="Optional"
                    searchPlaceholder="Search tools"
                    options={skillsPool.tools}
                    value={answers.tools ?? []}
                    onChange={(v) => setAnswers((a) => ({ ...a, tools: v }))}
                    onContinue={() =>
                      advance("tools", { tools: answers.tools ?? [] })
                    }
                  />
                )}
                {key === "soft" && (
                  <SingleSkillStep
                    title="What are your soft skills?"
                    description="How you work with people and approach problems."
                    label="Soft skills"
                    hint="Optional"
                    searchPlaceholder="Search soft skills"
                    options={skillsPool.soft}
                    value={answers.softSkills ?? []}
                    onChange={(v) => setAnswers((a) => ({ ...a, softSkills: v }))}
                    onContinue={() =>
                      advance("soft", { softSkills: answers.softSkills ?? [] })
                    }
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
  invalid = false,
  children,
}: {
  stepKey: StepKey;
  expanded: boolean;
  answers: QuizAnswers;
  onEdit: () => void;
  invalid?: boolean;
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
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]",
                invalid ? "bg-[#D0D6D8]" : "bg-[color:var(--color-primary)]"
              )}
              style={{ aspectRatio: "1 / 1" }}
            >
              {invalid ? (
                <X className="h-4 w-4 text-[color:var(--color-foreground)]" />
              ) : (
                <Check className="h-4 w-4 text-[color:var(--color-foreground)]" />
              )}
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
  field: "Field",
  role: "Role",
  hard: "Hard skills",
  tools: "Tools",
  soft: "Soft skills",
  level: "Experience",
  loc: "Location and salary",
  email: "Email",
};

function summaryValue(key: StepKey, a: QuizAnswers): string {
  switch (key) {
    case "field":
      return a.field ?? "";
    case "role":
      {
        const rs = a.roles && a.roles.length ? a.roles : a.role ? [a.role] : [];
        return rs.length ? rs.join(", ") : "-";
      }
    case "hard":
      return a.hardSkills && a.hardSkills.length ? a.hardSkills.join(", ") : "-";
    case "tools":
      return a.tools && a.tools.length ? a.tools.join(", ") : "-";
    case "soft":
      return a.softSkills && a.softSkills.length ? a.softSkills.join(", ") : "-";
    case "level": {
      const parts: string[] = [];
      if (a.level) parts.push(a.level);
      if (a.years != null) parts.push(`${formatYears(a.years)}y`);
      if (a.primaryLanguage) parts.push(`${a.primaryLanguage} (Native)`);
      for (const l of a.additionalLanguages ?? []) parts.push(`${l.lang} (${l.level})`);
      return parts.join(" · ");
    }
    case "loc": {
      const locs = a.locations ?? [];
      const where =
        a.workMode === "remote"
          ? "Anywhere (remote)"
          : locs.length > 0
          ? locs.join(" · ")
          : "";
      const money =
        a.salaryMin != null && a.salaryMax != null
          ? `${formatMoney(a.salaryMin)} – ${formatMoney(a.salaryMax)}`
          : "";
      const extras: string[] = [];
      if (a.openToRelocate) extras.push("open to relocation");
      if (a.openToTravel) extras.push("open to travel");
      return [where, money, ...extras].filter(Boolean).join(" · ");
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

// ---------- 0. Field ----------

function FieldStep({
  value,
  onChange,
  onContinue,
}: {
  value?: string;
  onChange: (f: string) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading>What field are you in?</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        This narrows the roles and skills we'll ask about next.
      </p>
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((f) => {
            const selected = value === f;
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(f)}
                className={cn(
                  "inline-flex items-center rounded-[4px] border text-sm text-[#090B0C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  selected
                    ? "border-[#00F1A9] bg-[#00F1A9]"
                    : "border-[color:var(--color-border)] bg-white hover:border-[color:var(--color-border-strong)]"
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
                  style={selected ? { borderWidth: 1 } : undefined}
                >
                  {selected && (
                    <span className="h-2 w-2 rounded-full bg-[#0E735A]" />
                  )}
                </span>
                <span>{f}</span>
              </button>
            );
          })}
        </div>
      </div>
      <ContinueRow disabled={!value} onClick={onContinue} />
    </div>
  );
}

// ---------- 1. Role ----------

function RoleStep({
  field,
  value,
  onChange,
  onContinue,
}: {
  field?: string;
  value: string[];
  onChange: (v: string[]) => void;
  onContinue: () => void;
}) {
  const [query, setQuery] = useState("");
  const roles = field ? FIELD_ROLES[field as keyof typeof FIELD_ROLES] ?? [] : [];
  const filtered = roles.filter((r) =>
    r.toLowerCase().includes(query.trim().toLowerCase())
  );
  const MAX = 3;
  const toggle = (r: string) => {
    if (value.includes(r)) {
      onChange(value.filter((x) => x !== r));
    } else if (value.length < MAX) {
      onChange([...value, r]);
    }
  };
  return (
    <div>
      <StepHeading>What's your role?</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        Pick up to {MAX} roles that fit you best.
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

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {value.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-2.5 py-1 text-sm"
            >
              {r}
              <button
                type="button"
                onClick={() => toggle(r)}
                aria-label={`Remove ${r}`}
                className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-foreground)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <span className="shrink-0 pt-1 text-xs text-[#4B585B]">
          {value.length}/{MAX}
        </span>
      </div>

      <div className="mt-3 max-h-[182px] overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[#F9FBFB] p-3">
        <div className="flex flex-wrap gap-2">
          {filtered.map((r) => {
            const selected = value.includes(r);
            const atMax = !selected && value.length >= MAX;
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggle(r)}
                disabled={atMax}
                aria-pressed={selected}
                className={cn(
                  "inline-flex items-center rounded-[4px] border text-sm text-[color:var(--color-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
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
                  {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>
                <span>{r}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-[color:var(--color-text-muted)]">No matches.</p>
          )}
        </div>
      </div>

      <ContinueRow disabled={value.length === 0} onClick={onContinue} />
    </div>
  );
}

// ---------- 2. Skills (split: hard / tools / soft) ----------

function SingleSkillStep({
  title,
  description,
  label,
  hint,
  options,
  value,
  onChange,
  onContinue,
  searchPlaceholder,
  required = false,
}: {
  title: string;
  description: string;
  label: string;
  hint: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  onContinue: () => void;
  searchPlaceholder: string;
  required?: boolean;
}) {
  const canContinue = required ? value.length > 0 : true;
  return (
    <div>
      <StepHeading>{title}</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        {description}
      </p>
      <SkillsGroup
        label={label}
        hint={hint}
        options={options}
        value={value}
        onChange={onChange}
        searchPlaceholder={searchPlaceholder}
      />
      <ContinueRow disabled={!canContinue} onClick={onContinue} />
    </div>
  );
}

function SkillsGroup({
  label,
  hint,
  options,
  value,
  onChange,
  searchPlaceholder,
}: {
  label: string;
  hint: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = options.filter((s) =>
    s.toLowerCase().includes(query.trim().toLowerCase())
  );
  const toggle = (s: string) =>
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-light text-[#090B0C]">{label}</span>
        <span className="text-xs text-[color:var(--color-text-muted)]">{hint}</span>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 focus-within:ring-2 focus-within:ring-[color:var(--color-ring)] focus-within:ring-offset-2">
        <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--color-text-muted)]"
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
        <div className="mt-2 flex flex-wrap gap-2">
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

      <div className="mt-2 max-h-[160px] overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[#F9FBFB] p-3">
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
                <span>{s}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-[color:var(--color-text-muted)]">No matches.</p>
          )}
        </div>
      </div>
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
  const primary = answers.primaryLanguage ?? "English";
  const extras: AdditionalLanguage[] = answers.additionalLanguages ?? [];

  // Initialize primary language default on mount.
  useEffect(() => {
    if (!answers.primaryLanguage) onChange({ primaryLanguage: "English" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLevel = (l: string) => {
    const patch: Partial<QuizAnswers> = { level: l };
    // Auto-set years to sensible default (user may override afterwards).
    if (answers.years == null || LEVEL_DEFAULT_YEARS[answers.level ?? ""] === answers.years) {
      patch.years = LEVEL_DEFAULT_YEARS[l];
    } else {
      // Also set when years is currently the default of another level.
      patch.years = LEVEL_DEFAULT_YEARS[l];
    }
    onChange(patch);
  };

  const canContinue = !!level && !!primary;

  const ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

  const setExtraLevel = (lang: string, lvl: ProficiencyLevel) => {
    onChange({
      additionalLanguages: extras.map((e) => (e.lang === lang ? { ...e, level: lvl } : e)),
    });
  };

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
              onClick={() => setLevel(l)}
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
          <div className="absolute left-[11px] right-[11px] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-surface-2)]" />
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
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `calc(11px + (100% - 22px) * ${t / 20})` }}
            >
              {t === 0 ? "<1" : t === 20 ? "20+" : t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-light text-[#090B0C]">Primary language</label>
        <div className="mt-2">
          <select
            value={primary}
            onChange={(ev) => {
              const lang = ev.target.value;
              onChange({
                primaryLanguage: lang,
                additionalLanguages: extras.filter((e) => e.lang !== lang),
              });
            }}
            className="select-native h-10 w-full rounded-[4px] border border-[color:var(--color-border)] bg-white px-3 text-sm text-[#090B0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
            aria-label="Select primary language"
          >
            {POPULAR_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-light text-[#090B0C]">
          Additional language
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={extras[0]?.lang ?? ""}
            onChange={(ev) => {
              const lang = ev.target.value;
              if (!lang) {
                onChange({ additionalLanguages: [] });
                return;
              }
              onChange({
                additionalLanguages: [{ lang, level: "B2" as ProficiencyLevel }],
              });
            }}
            className="select-native h-10 w-full rounded-[4px] border border-[color:var(--color-border)] bg-white px-3 text-sm text-[#090B0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
            aria-label="Select an additional language"
          >
            <option value="">Select a language</option>
            {POPULAR_LANGUAGES.filter((l) => l !== primary).map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          {extras[0] && (
            <select
              value={extras[0].level}
              onChange={(ev) =>
                setExtraLevel(extras[0].lang, ev.target.value as ProficiencyLevel)
              }
              className="select-native h-10 w-full sm:w-auto rounded-[4px] border border-[color:var(--color-border)] bg-white px-3 text-sm text-[#090B0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
              aria-label={`${extras[0].lang} proficiency`}
            >
              {PROFICIENCY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          )}
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
  const workMode = answers.workMode;
  const locations = answers.locations ?? [];
  const minVal = answers.salaryMin ?? 100_000;
  const maxVal = answers.salaryMax ?? 160_000;
  const [stateCode, setStateCode] = useState<string>("");
  const [city, setCity] = useState<string>("");

  const showReloTravel = !!answers.field && RELO_TRAVEL_FIELDS.includes(answers.field as any);

  const canContinue =
    !!workMode &&
    (workMode === "remote" || locations.length > 0) &&
    minVal < maxVal;

  const addLocation = () => {
    if (!stateCode || !city) return;
    const label = `${city}, ${stateCode}`;
    if (locations.some((l) => l.toLowerCase() === label.toLowerCase())) return;
    onChange({ locations: [...locations, label] });
    setCity("");
  };

  const removeLoc = (l: string) =>
    onChange({ locations: locations.filter((x) => x !== l) });

  const setMin = (v: number) => {
    const nv = Math.min(v, maxVal - SAL_STEP);
    onChange({ salaryMin: nv, salaryMax: maxVal });
  };
  const setMax = (v: number) => {
    const nv = Math.max(v, minVal + SAL_STEP);
    onChange({ salaryMin: minVal, salaryMax: nv });
  };
  const pct = (v: number) => ((v - SAL_MIN) / (SAL_MAX - SAL_MIN)) * 100;

  const cities = stateCode ? CITIES_BY_STATE[stateCode] ?? [] : [];

  return (
    <div>
      <StepHeading>Where and how much?</StepHeading>

      <div className="mt-5">
        <span className="block text-sm font-light text-[#090B0C]">Where do you want to work?</span>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[
            { key: "remote" as WorkMode, label: "Remote" },
            { key: "onsite" as WorkMode, label: "On-site / hybrid" },
          ].map((opt) => {
            const selected = workMode === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  const patch: Partial<QuizAnswers> = {
                    workMode: opt.key,
                    remote: opt.key === "remote",
                  };
                  if (opt.key === "remote") patch.locations = [];
                  onChange(patch);
                }}
                aria-pressed={selected}
                className={cn(
                  "flex h-[56px] items-center justify-center rounded-[4px] border px-4 text-[16px] font-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  selected
                    ? "border-[#00F1A9] bg-[#00F1A9]"
                    : "border-[#E3E7E8] bg-white hover:border-[color:var(--color-border-strong)]"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {workMode === "onsite" && (
        <div className="mt-5">
          <label className="block text-sm font-light text-[#090B0C]">Preferred locations</label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select
              value={stateCode}
              onChange={(e) => { setStateCode(e.target.value); setCity(""); }}
              className="select-native h-11 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              aria-label="State"
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!stateCode}
              className="select-native h-11 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:opacity-50"
              aria-label="City"
            >
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addLocation}
              disabled={!stateCode || !city}
              className="h-11 rounded-[4px] border border-[color:var(--color-border-strong)] bg-white px-4 text-sm font-medium transition-colors hover:bg-[color:var(--color-surface-2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
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
      )}

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-light text-[#090B0C]">Annual salary (gross, USD)</span>
          <span className="text-base font-light leading-relaxed text-[#090B0C]">
            {formatMoney(minVal)} – {formatMoney(maxVal)}
          </span>
        </div>
        <div className="relative mt-4 h-8">
          <div className="absolute left-[11px] right-[11px] top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-surface-2)]" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color:var(--color-green)]"
            style={{
              left: `calc(11px + (100% - 22px) * ${pct(minVal) / 100})`,
              right: `calc(11px + (100% - 22px) * ${1 - pct(maxVal) / 100})`,
            }}
          />
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

      {showReloTravel && (
        <div className="mt-6 space-y-3">
          <ToggleRow
            label="Open to relocation?"
            hint="Optional — helps us match roles in other cities."
            checked={!!answers.openToRelocate}
            onChange={(v) => onChange({ openToRelocate: v })}
          />
          <ToggleRow
            label="Open to business travel?"
            hint="Optional — for roles that involve regular travel."
            checked={!!answers.openToTravel}
            onChange={(v) => onChange({ openToTravel: v })}
          />
        </div>
      )}

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

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-3">
      <div>
        <div className="text-base font-light leading-relaxed text-[#090B0C]">{label}</div>
        <div className="text-sm text-[color:var(--color-text-secondary)]">{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
          checked ? "bg-[color:var(--color-green)]" : "bg-[color:var(--color-surface-2)]"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
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
            "button-medium mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-button px-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
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
          "button-medium inline-flex h-12 w-full items-center justify-center rounded-button px-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
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
