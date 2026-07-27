import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck as Check, IconPencil as Pencil, IconSearch as Search, IconX as X, IconLoader2 as Loader2 } from "@tabler/icons-react";

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
  BASE_LEVELS,
  IC_LEVELS,
  MGMT_LEVELS,
  EXEC_LEVELS,
  FIELDS,
  FIELD_ROLES,
  skillsForRoles,
  US_STATES,
  CITIES_BY_STATE,
  POPULAR_LANGUAGES,
  PROFICIENCY_LEVELS,
  RELO_TRAVEL_FIELDS,
} from "@/lib/quiz-data";
import {
  getGroups,
  getRolesByGroup,
  searchRoles,
  getChip,
  softVocab,
  axes as TAX_AXES,
  levelLadder,
  titleComposition,
  type Chip,
  type ChipFlag,
  type ChipType,
  type Role as TaxRole,
} from "@/data/taxonomy";
import rawTaxonomy from "@/data/jobly_taxonomy.json";

const ALL_TAX_ROLES = (rawTaxonomy as unknown as { roles: TaxRole[] }).roles;

function taxRoleDefs(positions: string[]): TaxRole[] {
  return positions
    .map((p) => ALL_TAX_ROLES.find((r) => r.position === p))
    .filter((r): r is TaxRole => !!r);
}

type SkillSectionKey = "stack" | "hard" | "tools" | "soft";

function unionSectionFlag(defs: TaxRole[], key: SkillSectionKey): ChipFlag {
  let seen: ChipFlag = "na";
  for (const d of defs) {
    const f = d.sections?.[key]?.flag;
    if (f === "required") return "required";
    if (f === "optional") seen = "optional";
  }
  return seen;
}

function taxPool(defs: TaxRole[], key: "stack" | "hard" | "tools"): string[] {
  const set = new Set<string>();
  for (const d of defs) for (const s of d[key] ?? []) set.add(s);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function taxSoftSuggested(defs: TaxRole[]): string[] {
  const set = new Set<string>();
  for (const d of defs) for (const s of d.soft ?? []) set.add(s);
  return Array.from(set);
}

function firstStackNote(defs: TaxRole[]): string | undefined {
  for (const d of defs) if (d.stackNote) return d.stackNote;
  return undefined;
}

const CHIP_TYPE_FOR_SECTION: Record<SkillSectionKey, ChipType> = {
  stack: "Stack",
  hard: "Hard / Method",
  tools: "Tools",
  soft: "Soft",
};

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Set up your Jobly profile — 2 minute quiz" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizPage,
});

export type StepKey =
  | "field"
  | "role"
  | "stack"
  | "hard"
  | "tools"
  | "soft"
  | "axes"
  | "level"
  | "loc"
  | "email";
export const STEP_ORDER: StepKey[] = [
  "field",
  "role",
  "stack",
  "hard",
  "tools",
  "soft",
  "axes",
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
  const roleDefs = useMemo(() => taxRoleDefs(rolesList), [rolesList]);
  const stackPool = useMemo(() => taxPool(roleDefs, "stack"), [roleDefs]);
  const hardPool = useMemo(() => taxPool(roleDefs, "hard"), [roleDefs]);
  const toolsPool = useMemo(() => taxPool(roleDefs, "tools"), [roleDefs]);
  const softPool = useMemo(() => softVocab.slice(), []);
  const softSuggested = useMemo(() => taxSoftSuggested(roleDefs), [roleDefs]);
  const stackNote = useMemo(() => firstStackNote(roleDefs), [roleDefs]);
  const sectionFlag: Record<SkillSectionKey, ChipFlag> = {
    stack: roleDefs.length ? unionSectionFlag(roleDefs, "stack") : "required",
    hard: roleDefs.length ? unionSectionFlag(roleDefs, "hard") : "required",
    tools: roleDefs.length ? unionSectionFlag(roleDefs, "tools") : "required",
    soft: roleDefs.length ? unionSectionFlag(roleDefs, "soft") : "required",
  };
  // stackNote roles skip the pool but still keep the section as complete
  // (we treat it as auto-complete since there's nothing to pick).
  const stackPoolSuppressed = !!stackNote;

  // ---- Axes visibility (Scope / Segment / Motion) --------------------------
  const scopeAppliesRoles = roleDefs.some(
    (d) => d.sections?.scope && d.sections.scope.flag !== "na"
  );
  const scopeAppliesLevel =
    !!answers.level && ["Director", "VP", "Exec"].includes(answers.level);
  const showScope = scopeAppliesRoles || scopeAppliesLevel;
  const showSegment = roleDefs.some((d) => d.group === "Sales");
  const showMotion = roleDefs.some(
    (d) => d.group === "Sales" || d.group === "Marketing"
  );
  const showAxes = showScope || showSegment || showMotion;
  const axesComplete = (() => {
    if (!showAxes) return true;
    if (showScope) {
      const s = answers.scope ?? {};
      const fields = TAX_AXES.scope.fields ?? [];
      for (const f of fields) {
        if (!s[f.key as "orgSize" | "budget" | "stage"]) return false;
      }
    }
    if (showSegment && !answers.segment) return false;
    if (showMotion && !answers.motion) return false;
    return true;
  })();

  const stackPoolSet = useMemo(() => new Set(stackPool), [stackPool]);
  const hardPoolSet = useMemo(() => new Set(hardPool), [hardPool]);
  const toolsPoolSet = useMemo(() => new Set(toolsPool), [toolsPool]);
  const softPoolSet = useMemo(() => new Set(softPool), [softPool]);

  // Role is invalid if any selected role isn't in the current field's role list.
  const fieldRoles = answers.field
    ? getRolesByGroup(answers.field).map((r) => r.position)
    : undefined;
  const roleInvalid =
    !!answers.field &&
    rolesList.length > 0 &&
    !!fieldRoles &&
    rolesList.some((r) => !fieldRoles.includes(r));

  // Skill sub-steps: invalid when selection contains items no longer in the pool,
  // emptied when a previous selection was wiped by upstream (field / role) changes.
  const stackSel = answers.stackSkills ?? [];
  const stackCustom = answers.stackCustom ?? [];
  const hardCustom = answers.hardCustom ?? [];
  const toolsCustom = answers.toolsCustom ?? [];
  const softCustom = answers.softCustom ?? [];
  const hardSel = answers.hardSkills ?? [];
  const toolsSel = answers.tools ?? [];
  const softSel = answers.softSkills ?? [];
  const stackInvalid =
    !stackPoolSuppressed &&
    stackSel.length > 0 &&
    stackSel.some((s) => !stackPoolSet.has(s) && !stackCustom.includes(s));
  const stackEmptied =
    !stackPoolSuppressed &&
    sectionFlag.stack === "required" &&
    answers.stackSkills !== undefined &&
    answers.stackSkills.length === 0;
  const hardInvalid =
    hardSel.length > 0 &&
    hardSel.some((s) => !hardPoolSet.has(s) && !hardCustom.includes(s));
  const hardEmptied =
    sectionFlag.hard === "required" &&
    answers.hardSkills !== undefined && answers.hardSkills.length === 0;
  const toolsInvalid =
    toolsSel.length > 0 &&
    toolsSel.some((s) => !toolsPoolSet.has(s) && !toolsCustom.includes(s));
  const toolsEmptied =
    sectionFlag.tools === "required" &&
    answers.tools !== undefined && answers.tools.length === 0;
  const softInvalid =
    softSel.length > 0 &&
    softSel.some((s) => !softPoolSet.has(s) && !softCustom.includes(s));
  const softEmptied =
    sectionFlag.soft === "required" &&
    answers.softSkills !== undefined && answers.softSkills.length === 0;

  // Role step shows collapsed-with-X when field change wiped the roles.
  const roleEmptied =
    answers.roles !== undefined && answers.roles.length === 0;

  // Loc step shows collapsed-with-X when workMode was previously set but is now cleared.
  const locEmptied =
    answers.workMode === undefined
      ? false
      : !answers.workMode ||
        (answers.workMode === "onsite" && (answers.locations?.length ?? 0) === 0);

  const visitedOptional = new Set(answers.visitedOptional ?? []);
  const sectionComplete = (k: SkillSectionKey): boolean => {
    if (sectionFlag[k] === "na") return true;
    if (k === "stack" && stackPoolSuppressed) return true;
    if (sectionFlag[k] === "optional") {
      // Optional: complete once user has visited/continued past, even if empty.
      const hasVal =
        (k === "stack" && stackSel.length > 0) ||
        (k === "hard" && hardSel.length > 0) ||
        (k === "tools" && toolsSel.length > 0) ||
        (k === "soft" && softSel.length > 0);
      return hasVal || visitedOptional.has(k);
    }
    // required
    switch (k) {
      case "stack": return stackSel.length > 0 && !stackInvalid;
      case "hard": return hardSel.length > 0 && !hardInvalid;
      case "tools": return toolsSel.length > 0 && !toolsInvalid;
      case "soft": return softSel.length > 0 && !softInvalid;
    }
  };
  const completed: Record<StepKey, boolean> = {
    field: !!answers.field,
    role: rolesList.length > 0 && !roleInvalid,
    stack: sectionComplete("stack"),
    hard: sectionComplete("hard"),
    tools: sectionComplete("tools"),
    soft: sectionComplete("soft"),
    axes: axesComplete,
    level: !!answers.level,
    loc:
      !!answers.workMode &&
      (answers.workMode === "remote" || (answers.locations?.length ?? 0) > 0),
    email: !!answers.email,
  };

  const isSkillStepHidden = (k: SkillSectionKey): boolean => {
    if (sectionFlag[k] === "na") return true;
    if (k === "stack" && stackPoolSuppressed) return true;
    return false;
  };

  const isStepHidden = (k: StepKey): boolean => {
    if (k === "stack" || k === "hard" || k === "tools" || k === "soft") {
      return isSkillStepHidden(k as SkillSectionKey);
    }
    if (k === "axes") return !showAxes;
    return false;
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
    setAnswers((a) => {
      const merged = { ...a, ...patch };
      // Mark optional skill sections as visited when the user continues past them.
      if (
        (nextFrom === "stack" || nextFrom === "hard" || nextFrom === "tools" || nextFrom === "soft") &&
        sectionFlag[nextFrom] === "optional"
      ) {
        const set = new Set(merged.visitedOptional ?? []);
        set.add(nextFrom);
        merged.visitedOptional = Array.from(set);
      }
      return merged;
    });
    const idx = STEP_ORDER.indexOf(nextFrom);
    // Skip any hidden ('na' / stackNote-suppressed) skill sections.
    let nextIdx = Math.min(idx + 1, STEP_ORDER.length - 1);
    while (
      nextIdx < STEP_ORDER.length - 1 &&
      isStepHidden(STEP_ORDER[nextIdx])
    ) {
      nextIdx += 1;
    }
    const next = STEP_ORDER[nextIdx];
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
    if (key === "stack" && (stackInvalid || stackEmptied)) {
      setAnswers((a) => ({
        ...a,
        stackSkills: (a.stackSkills ?? []).filter(
          (s) => stackPoolSet.has(s) || (a.stackCustom ?? []).includes(s)
        ),
      }));
    }
    if (key === "hard" && (hardInvalid || hardEmptied)) {
      setAnswers((a) => ({
        ...a,
        hardSkills: (a.hardSkills ?? []).filter(
          (s) => hardPoolSet.has(s) || (a.hardCustom ?? []).includes(s)
        ),
      }));
    }
    if (key === "tools" && (toolsInvalid || toolsEmptied)) {
      setAnswers((a) => ({
        ...a,
        tools: (a.tools ?? []).filter(
          (s) => toolsPoolSet.has(s) || (a.toolsCustom ?? []).includes(s)
        ),
      }));
    }
    if (key === "soft" && (softInvalid || softEmptied)) {
      setAnswers((a) => ({
        ...a,
        softSkills: (a.softSkills ?? []).filter(
          (s) => softPoolSet.has(s) || (a.softCustom ?? []).includes(s)
        ),
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

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl">Let's set up your matches</h1>
          <p className="mt-2 text-[color:var(--color-text-secondary)]">
            Answer a few quick questions. Takes about 2 minutes.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {STEP_ORDER.map((key) => {
            // Hide skill sections whose union flag is 'na', stack for roles with
            // a `stackNote`, and axes if none of scope/segment/motion apply.
            if (isStepHidden(key)) return null;
            const isVisible =
              completed[key] ||
              key === activeStep ||
              (key === "role" && (roleInvalid || roleEmptied)) ||
              (key === "stack" && (stackInvalid || stackEmptied)) ||
              (key === "hard" && (hardInvalid || hardEmptied)) ||
              (key === "tools" && (toolsInvalid || toolsEmptied)) ||
              (key === "soft" && (softInvalid || softEmptied)) ||
              (key === "loc" && locEmptied);
            if (!isVisible) return null;
            const isExpanded = key === activeStep;
            const invalid =
              (key === "role" && (roleInvalid || roleEmptied) && !isExpanded) ||
              (key === "stack" && (stackInvalid || stackEmptied) && !isExpanded) ||
              (key === "hard" && (hardInvalid || hardEmptied) && !isExpanded) ||
              (key === "tools" && (toolsInvalid || toolsEmptied) && !isExpanded) ||
              (key === "soft" && (softInvalid || softEmptied) && !isExpanded) ||
              (key === "loc" && locEmptied && !isExpanded);
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
                        const allowedRoles = getRolesByGroup(field).map((r) => r.position);
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
                        const defs = taxRoleDefs(v);
                        const stackSet = new Set(taxPool(defs, "stack"));
                        const hardSet = new Set(taxPool(defs, "hard"));
                        const toolSet = new Set(taxPool(defs, "tools"));
                        const softSet = new Set(softVocab);
                        const prunedStack =
                          a.stackSkills !== undefined
                            ? a.stackSkills.filter(
                                (s) => stackSet.has(s) || (a.stackCustom ?? []).includes(s)
                              )
                            : a.stackSkills;
                        const prunedHard =
                          a.hardSkills !== undefined
                            ? a.hardSkills.filter(
                                (s) => hardSet.has(s) || (a.hardCustom ?? []).includes(s)
                              )
                            : a.hardSkills;
                        const prunedTools =
                          a.tools !== undefined
                            ? a.tools.filter(
                                (s) => toolSet.has(s) || (a.toolsCustom ?? []).includes(s)
                              )
                            : a.tools;
                        const prunedSoft =
                          a.softSkills !== undefined
                            ? a.softSkills.filter(
                                (s) => softSet.has(s) || (a.softCustom ?? []).includes(s)
                              )
                            : a.softSkills;
                        return {
                          ...a,
                          roles: v,
                          role: v[0],
                          stackSkills: prunedStack,
                          hardSkills: prunedHard,
                          tools: prunedTools,
                          softSkills: prunedSoft,
                        };
                      })
                    }
                    onContinue={() => advance("role", {})}
                  />
                )}
                {key === "stack" && (
                  <CategorizedSkillStep
                    title="What's your stack?"
                    description="Languages, frameworks, databases and cloud platforms you work with."
                    chipType="Stack"
                    options={stackPool}
                    withCategories
                    value={answers.stackSkills ?? []}
                    customs={answers.stackCustom ?? []}
                    onChange={(v) => setAnswers((a) => ({ ...a, stackSkills: v }))}
                    onCustomsChange={(c) => setAnswers((a) => ({ ...a, stackCustom: c }))}
                    required={sectionFlag.stack === "required"}
                    onContinue={() =>
                      advance("stack", { stackSkills: answers.stackSkills ?? [] })
                    }
                  />
                )}
                {key === "hard" && (
                  <CategorizedSkillStep
                    title="What are your hard skills?"
                    description="Role-specific technical skills and methods you actually work with."
                    chipType="Hard / Method"
                    options={hardPool}
                    withCategories={false}
                    value={answers.hardSkills ?? []}
                    customs={answers.hardCustom ?? []}
                    onChange={(v) => setAnswers((a) => ({ ...a, hardSkills: v }))}
                    onCustomsChange={(c) => setAnswers((a) => ({ ...a, hardCustom: c }))}
                    required={sectionFlag.hard === "required"}
                    onContinue={() =>
                      advance("hard", { hardSkills: answers.hardSkills ?? [] })
                    }
                  />
                )}
                {key === "tools" && (
                  <CategorizedSkillStep
                    title="Which tools do you use?"
                    description="Software and platforms you work with day to day."
                    chipType="Tools"
                    options={toolsPool}
                    withCategories
                    value={answers.tools ?? []}
                    customs={answers.toolsCustom ?? []}
                    onChange={(v) => setAnswers((a) => ({ ...a, tools: v }))}
                    onCustomsChange={(c) => setAnswers((a) => ({ ...a, toolsCustom: c }))}
                    required={sectionFlag.tools === "required"}
                    onContinue={() =>
                      advance("tools", { tools: answers.tools ?? [] })
                    }
                  />
                )}
                {key === "soft" && (
                  <CategorizedSkillStep
                    title="What are your soft skills?"
                    description="How you work with people and approach problems."
                    chipType="Soft"
                    options={softPool}
                    withCategories={false}
                    suggested={softSuggested}
                    value={answers.softSkills ?? []}
                    customs={answers.softCustom ?? []}
                    onChange={(v) => setAnswers((a) => ({ ...a, softSkills: v }))}
                    onCustomsChange={(c) => setAnswers((a) => ({ ...a, softCustom: c }))}
                    required={sectionFlag.soft === "required"}
                    onContinue={() =>
                      advance("soft", { softSkills: answers.softSkills ?? [] })
                    }
                  />
                )}
                {key === "axes" && (
                  <AxesStep
                    answers={answers}
                    showScope={showScope}
                    showSegment={showSegment}
                    showMotion={showMotion}
                    onChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
                    onContinue={() => advance("axes", {})}
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
                    onContinue={() =>
                      advance("loc", {
                        salaryMin: answers.salaryMin ?? 100_000,
                        salaryMax: answers.salaryMax ?? 160_000,
                      })
                    }
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

export function StepShell({
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
          className="group flex w-full items-center justify-between gap-3 rounded-[8px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-3 text-left transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 min-h-[56px]"
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
      <div className="rounded-[8px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5 sm:p-8">
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

export const SUMMARY_LABEL: Record<StepKey, string> = {
  field: "Field",
  role: "Role",
  stack: "Stack",
  hard: "Hard skills",
  tools: "Tools",
  soft: "Soft skills",
  axes: "Scope & focus",
  level: "Experience",
  loc: "Location and salary",
  email: "Email",
};

export function summaryValue(key: StepKey, a: QuizAnswers): string {
  switch (key) {
    case "field":
      return a.field ?? "";
    case "role":
      {
        const rs = a.roles && a.roles.length ? a.roles : a.role ? [a.role] : [];
        if (!rs.length) return "-";
        const defs = taxRoleDefs(rs);
        return rs
          .map((name) => {
            const g = defs.find((d) => d.position === name)?.group;
            return g ? `${name} (${g})` : name;
          })
          .join(", ");
      }
    case "stack":
      return a.stackSkills && a.stackSkills.length ? a.stackSkills.join(", ") : "-";
    case "hard":
      return a.hardSkills && a.hardSkills.length ? a.hardSkills.join(", ") : "-";
    case "tools":
      return a.tools && a.tools.length ? a.tools.join(", ") : "-";
    case "soft":
      return a.softSkills && a.softSkills.length ? a.softSkills.join(", ") : "-";
    case "axes": {
      const parts: string[] = [];
      const s = a.scope;
      if (s?.orgSize) parts.push(`Team ${s.orgSize}`);
      if (s?.budget) parts.push(`Budget ${s.budget}`);
      if (s?.stage) parts.push(s.stage);
      if (a.segment) parts.push(a.segment);
      if (a.motion) parts.push(a.motion);
      return parts.length ? parts.join(" · ") : "-";
    }
    case "level": {
      const parts: string[] = [];
      if (a.track) parts.push(a.track === "IC" ? "IC" : a.track === "Mgmt" ? "Management" : "Executive");
      if (a.level) {
        const title = composedTitle(a.field, a.level);
        parts.push(title || a.level);
      }
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
      return [money, where].filter(Boolean).join(" · ");
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

export function FieldStep({
  value,
  onChange,
  onContinue,
  submitLabel,
  onCancel,
}: {
  value?: string;
  onChange: (f: string) => void;
  onContinue: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const FIELD_ORDER = [
    "Engineering",
    "Data & AI / ML",
    "Product",
    "Design",
    "Infrastructure, DevOps & Cloud",
    "QA & Testing",
    "Security",
    "Engineering Leadership & Architecture",
    "Sales",
    "Marketing",
    "Program, Project & Technical-Adjacent",
    "C-level / Executive",
    "Support & Customer Success",
    "HR & Recruitment / People",
    "Emerging / Specialized",
  ];
  const available = getGroups();
  const groups = [
    ...FIELD_ORDER.filter((g) => available.includes(g)),
    ...available.filter((g) => !FIELD_ORDER.includes(g)),
  ];
  return (
    <div>
      <StepHeading>What's your field?</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        This narrows the roles and skills we'll ask about next.
      </p>
      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {groups.map((f) => {
            const selected = value === f;
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(f)}
                className={cn(
                  "inline-flex h-11 items-center rounded-[4px] border px-5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                  selected
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[#090B0C]"
                    : "border-[color:var(--color-border)] bg-white text-[#090B0C] hover:border-[color:var(--color-border-strong)]"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2">
        <ContinueRow disabled={!value} onClick={onContinue} label={submitLabel} onCancel={onCancel} />
      </div>
    </div>
  );
}

// ---------- 1. Role ----------

export function RoleStep({
  field,
  value,
  onChange,
  onContinue,
  submitLabel,
  onCancel,
}: {
  field?: string;
  value: string[];
  onChange: (v: string[]) => void;
  onContinue: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [query, setQuery] = useState("");
  const MAX = 3;
  const q = query.trim();
  // Default: roles in current field. Search: match across ALL roles.
  const results: TaxRole[] = q
    ? searchRoles(q)
    : field
    ? getRolesByGroup(field)
    : [];
  // Group results by group, sort groups alphabetically, roles A–Z within group.
  const grouped = useMemo(() => {
    const map = new Map<string, TaxRole[]>();
    for (const r of results) {
      const arr = map.get(r.group) ?? [];
      arr.push(r);
      map.set(r.group, arr);
    }
    const entries = Array.from(map.entries()).map(
      ([g, list]) =>
        [g, list.slice().sort((a, b) => a.position.localeCompare(b.position))] as const
    );
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [results]);

  // Look up group for any selected role (search may pick roles outside the field).
  const groupForRole = (position: string) => {
    for (const [g, list] of grouped) {
      if (list.some((r) => r.position === position)) return g;
    }
    const all = searchRoles(position);
    return all.find((r) => r.position === position)?.group;
  };

  const toggle = (r: string) => {
    if (value.includes(r)) {
      onChange(value.filter((x) => x !== r));
    } else if (value.length < MAX) {
      onChange([...value, r]);
    }
  };
  const atMaxAll = value.length >= MAX;
  return (
    <div>
      <StepHeading>What's your role?</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        Pick up to {MAX} roles that fit you best. Search across all roles.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 focus-within:ring-2 focus-within:ring-[color:var(--color-ring)] focus-within:ring-offset-2">
        <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all roles"
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
          {value.map((r) => {
            const g = groupForRole(r);
            return (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-2.5 py-1 text-sm"
              >
                <span>{r}</span>
                {g && (
                  <span className="rounded-[2px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)]">
                    {g}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  aria-label={`Remove ${r}`}
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
        <span className="shrink-0 pt-1 text-xs text-[#4B585B]">
          {value.length}/{MAX}
          {atMaxAll && <span className="ml-1 text-[color:var(--color-text-muted)]">· max 3</span>}
        </span>
      </div>

      <div className="mt-3 rounded-[4px] border border-[color:var(--color-border)] bg-[#F9FBFB] p-3">
        {grouped.length === 0 && (
          <p className="text-sm text-[color:var(--color-text-muted)]">No matches.</p>
        )}
        <div className="flex flex-col gap-3">
          {grouped.map(([g, list]) => (
            <div key={g}>
              <div className="mb-1.5 text-[11px] uppercase tracking-wide text-[color:var(--color-text-muted)]">
                {g}
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((r) => {
                  const selected = value.includes(r.position);
                  const atMax = !selected && value.length >= MAX;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggle(r.position)}
                      disabled={atMax}
                      aria-pressed={selected}
                      title={atMax ? "max 3" : undefined}
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
                      <span>{r.position}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ContinueRow disabled={value.length === 0} onClick={onContinue} label={submitLabel} onCancel={onCancel} />
    </div>
  );
}

// ---------- 2. Skills (split: hard / tools / soft) ----------

export function SingleSkillStep({
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
  submitLabel,
  onCancel,
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
  submitLabel?: string;
  onCancel?: () => void;
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
      <ContinueRow disabled={!canContinue} onClick={onContinue} label={submitLabel} onCancel={onCancel} />
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
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const filtered = options.filter((s) =>
    s.toLowerCase().includes(query.trim().toLowerCase())
  );
  const toggle = (s: string) =>
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-light text-[#090B0C]">{label}</span>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => onChange(Array.from(new Set([...value, ...options])))}
            className="text-[color:var(--color-foreground)] underline-offset-2 hover:underline"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[color:var(--color-foreground)] underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div ref={wrapRef} className="relative">
      <div className="mt-2 flex items-center gap-2 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 focus-within:ring-2 focus-within:ring-[color:var(--color-ring)] focus-within:ring-offset-2">
        <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
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

      {open && (
      <div
        className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[240px] overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-white p-3 shadow-[0px_8px_24px_-4px_rgba(12,12,13,0.18),0px_2px_6px_0px_rgba(12,12,13,0.08)]"
      >
        <div className="flex flex-col gap-[4px]">
          {filtered.map((s) => {
            const selected = value.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-center rounded-[4px] border text-sm text-[color:var(--color-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
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
    </div>
  );
}

// ---------- 2b. Categorized skills (Stack / Hard / Tools / Soft) ----------

export function CategorizedSkillStep({
  title,
  description,
  chipType,
  options,
  value,
  customs,
  onChange,
  onCustomsChange,
  withCategories,
  suggested,
  required = true,
  onContinue,
  submitLabel,
  onCancel,
}: {
  title: string;
  description: string;
  chipType: ChipType;
  options: string[];
  value: string[];
  customs: string[];
  onChange: (v: string[]) => void;
  onCustomsChange: (c: string[]) => void;
  withCategories: boolean;
  suggested?: string[];
  required?: boolean;
  onContinue: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = options.filter((s) => (q ? s.toLowerCase().includes(q) : true));

  // Group by chip.category (from the shared chipLibrary — never guessed).
  const groups: [string, string[]][] = useMemo(() => {
    if (!withCategories) {
      // Soft: sort suggested items first, then alphabetical.
      if (suggested && suggested.length) {
        const sug = new Set(suggested);
        const sorted = filtered
          .slice()
          .sort((a, b) => {
            const sa = sug.has(a) ? 0 : 1;
            const sb = sug.has(b) ? 0 : 1;
            if (sa !== sb) return sa - sb;
            return a.localeCompare(b);
          });
        return [["", sorted]];
      }
      return [["", filtered.slice().sort((a, b) => a.localeCompare(b))]];
    }
    const map = new Map<string, string[]>();
    for (const label of filtered) {
      const chip: Chip | undefined = getChip(chipType, label);
      const cat = chip?.category ?? "Other";
      const arr = map.get(cat) ?? [];
      arr.push(label);
      map.set(cat, arr);
    }
    return Array.from(map.entries())
      .map(([cat, list]) => [cat, list.slice().sort((a, b) => a.localeCompare(b))] as [string, string[]])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, withCategories, suggested, chipType]);

  const suggestedSet = useMemo(() => new Set(suggested ?? []), [suggested]);

  const toggle = (s: string) => {
    if (value.includes(s)) onChange(value.filter((x) => x !== s));
    else onChange([...value, s]);
  };

  const selectAll = () => {
    const merged = new Set(value);
    for (const s of options) merged.add(s);
    for (const c of customs) merged.add(c);
    onChange(Array.from(merged));
  };
  const clearAll = () => {
    onChange([]);
    onCustomsChange([]);
  };

  const commitCustom = () => {
    const label = pending.trim();
    if (!label) return;
    // No duplicates against pool or existing customs.
    const lower = label.toLowerCase();
    if (options.some((o) => o.toLowerCase() === lower)) {
      // Just select the matching pool item.
      const match = options.find((o) => o.toLowerCase() === lower)!;
      if (!value.includes(match)) onChange([...value, match]);
    } else if (!customs.some((c) => c.toLowerCase() === lower)) {
      onCustomsChange([...customs, label]);
      onChange([...value, label]);
    }
    setPending("");
    setAdding(false);
  };

  const removeCustom = (label: string) => {
    onCustomsChange(customs.filter((c) => c !== label));
    onChange(value.filter((v) => v !== label));
  };

  const canContinue = required ? value.length > 0 : true;

  const renderChip = (
    s: string,
    opts: { custom?: boolean } = {}
  ) => {
    const selected = value.includes(s);
    const isSuggested = !opts.custom && suggestedSet.has(s);
    return (
      <button
        key={s}
        type="button"
        onClick={() => (opts.custom ? toggle(s) : toggle(s))}
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
          {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </span>
        <span>{s}</span>
        {isSuggested && !selected && (
          <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[color:var(--color-green)]" aria-label="suggested" />
        )}
        {opts.custom && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Remove ${s}`}
            onClick={(e) => {
              e.stopPropagation();
              removeCustom(s);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                removeCustom(s);
              }
            }}
            className="ml-1 grid h-4 w-4 place-items-center rounded-[2px] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-foreground)]"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>
    );
  };

  return (
    <div>
      <StepHeading>{title}</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{description}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-sm font-light text-[#090B0C]">
          {required ? "At least one required" : "Optional"}
          <span className="ml-2 text-xs text-[color:var(--color-text-muted)]">
            {value.length} selected
          </span>
        </span>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={selectAll}
            className="text-[color:var(--color-text-secondary)] underline-offset-2 hover:text-[color:var(--color-foreground)] hover:underline"
          >
            Select all
          </button>
          <span className="text-[color:var(--color-text-muted)]">·</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-[color:var(--color-text-secondary)] underline-offset-2 hover:text-[color:var(--color-foreground)] hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 focus-within:ring-2 focus-within:ring-[color:var(--color-ring)] focus-within:ring-offset-2">
        <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${chipType.toLowerCase()}`}
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

      <div className="mt-3 max-h-[280px] overflow-y-auto rounded-[4px] border border-[color:var(--color-border)] bg-[#F9FBFB] p-3">
        {filtered.length === 0 && !customs.length && (
          <p className="text-sm text-[color:var(--color-text-muted)]">No matches.</p>
        )}
        <div className="flex flex-col gap-3">
          {groups.map(([cat, list]) => (
            <div key={cat || "flat"}>
              {cat && (
                <div className="mb-1.5 text-[11px] uppercase tracking-wide text-[color:var(--color-text-muted)]">
                  {cat}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {list.map((s) => renderChip(s))}
              </div>
            </div>
          ))}

          {customs.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-wide text-[color:var(--color-text-muted)]">
                Custom
              </div>
              <div className="flex flex-wrap gap-2">
                {customs.map((s) => renderChip(s, { custom: true }))}
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-wrap gap-2">
              {adding ? (
                <span className="inline-flex items-center rounded-[4px] border border-dashed border-[color:var(--color-border-strong)] bg-white px-2 py-1">
                  <input
                    autoFocus
                    value={pending}
                    onChange={(e) => setPending(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitCustom();
                      } else if (e.key === "Escape") {
                        setPending("");
                        setAdding(false);
                      }
                    }}
                    onBlur={() => {
                      if (pending.trim()) commitCustom();
                      else setAdding(false);
                    }}
                    placeholder="Type and press Enter"
                    className="h-6 w-40 bg-transparent text-sm outline-none placeholder:text-[color:var(--color-text-muted)]"
                  />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="inline-flex items-center gap-1 rounded-[4px] border border-dashed border-[color:var(--color-border-strong)] bg-white px-2.5 py-1 text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
                >
                  + Add your own
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ContinueRow disabled={!canContinue} onClick={onContinue} label={submitLabel} onCancel={onCancel} />
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

// --- Level track helpers (taxonomy-driven fork at Senior) ------------------

function rolesAllowMgmt(defs: TaxRole[]): boolean {
  return defs.some((r) => (r.track ?? "").includes("Mgmt"));
}
function rolesAllowExec(defs: TaxRole[]): boolean {
  return defs.some(
    (r) => r.group === "C-level / Executive" || (r.track ?? "").includes("Exec"),
  );
}

// Compose a display title from field + selected level using taxonomy.
export function composedTitle(field?: string, level?: string): string {
  if (!level) return "";
  const row = field ? titleComposition.find((r) => r.function === field) : undefined;
  if (row) {
    if (level === "Head" && row.head && row.head !== "—") return row.head;
    if (level === "VP" && row.vp && row.vp !== "—") return row.vp;
    if (level === "Exec" && row.exec && row.exec !== "—") return row.exec;
  }
  const rung = levelLadder.find((r) => r.level === level);
  if (rung && rung.titlePattern && rung.titlePattern !== "—" && rung.titlePattern !== "fork point") {
    return rung.titlePattern.replace("{Function}", field ?? "").trim();
  }
  return field ? `${level} ${field}` : level;
}

// Parse levelLadder.yearsHint like "0", "0–2", "4–8", "8+" into [min,max].
function parseYearsHint(hint: string): [number, number] {
  const s = hint.replace(/\s/g, "");
  const plus = s.match(/^(\d+)\+$/);
  if (plus) return [Number(plus[1]), 99];
  const range = s.match(/^(\d+)[–-](\d+)$/);
  if (range) return [Number(range[1]), Number(range[2])];
  const single = s.match(/^(\d+)$/);
  if (single) return [Number(single[1]), Number(single[1])];
  return [0, 99];
}

function yearsHintNote(level: string | undefined, years: number): string | null {
  if (!level) return null;
  const rung = levelLadder.find((r) => r.level === level);
  if (!rung) return null;
  const [lo, hi] = parseYearsHint(rung.yearsHint);
  // Soft window: allow ±2 outside the hint before nudging.
  if (years + 2 < lo || years - 2 > hi) {
    return `${level} roles typically fall around ${rung.yearsHint} years — double-check this is right.`;
  }
  return null;
}

export function ExperienceStep({
  answers,
  onChange,
  onContinue,
  submitLabel,
  onCancel,
}: {
  answers: QuizAnswers;
  onChange: (p: Partial<QuizAnswers>) => void;
  onContinue: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const ENGLISH_LEVELS = [
    "Native speaker",
    "Proficient • C2",
    "Advanced • C1",
    "Upper-intermediate • B2",
    "Intermediate • B1",
    "Pre-intermediate • A2",
    "Beginner • A1",
    "No English",
  ] as const;
  const level = answers.level;
  const years = answers.years ?? 0;
  const primary = answers.primaryLanguage ?? "Native speaker";
  const extras: AdditionalLanguage[] = answers.additionalLanguages ?? [];
  const [pendingLang, setPendingLang] = useState<string>("");
  const [pendingLevel, setPendingLevel] = useState<ProficiencyLevel>("B2");

  // Track fork lives here so selecting a base rung can reveal or hide it.
  const selectedRoleNames = answers.roles && answers.roles.length ? answers.roles : answers.role ? [answers.role] : [];
  const roleDefs = taxRoleDefs(selectedRoleNames);
  const hasMgmt = rolesAllowMgmt(roleDefs);
  const hasExec = rolesAllowExec(roleDefs);

  const isBase = level ? (BASE_LEVELS as readonly string[]).includes(level) : false;
  const isIC = level ? (IC_LEVELS as readonly string[]).includes(level) : false;
  const isMgmt = level ? (MGMT_LEVELS as readonly string[]).includes(level) : false;
  const isExec = level ? (EXEC_LEVELS as readonly string[]).includes(level) : false;
  const baseSelected = isBase ? level : isIC || isMgmt || isExec ? "Senior" : undefined;
  const showTrackFork = baseSelected === "Senior" && (hasMgmt || hasExec);

  const track: "IC" | "Mgmt" | "Exec" | undefined = isIC
    ? "IC"
    : isExec
    ? "Exec"
    : isMgmt
    ? "Mgmt"
    : answers.track;

  // Initialize English level default on mount.
  useEffect(() => {
    if (!answers.primaryLanguage) onChange({ primaryLanguage: "Native speaker" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLevel = (l: string) => {
    const patch: Partial<QuizAnswers> = { level: l };
    // Keep track in sync with the chosen level.
    if ((IC_LEVELS as readonly string[]).includes(l)) patch.track = "IC";
    else if ((EXEC_LEVELS as readonly string[]).includes(l)) patch.track = "Exec";
    else if ((MGMT_LEVELS as readonly string[]).includes(l)) patch.track = "Mgmt";
    else patch.track = undefined;
    // Auto-set years to sensible default (user may override afterwards).
    if (answers.years == null || LEVEL_DEFAULT_YEARS[answers.level ?? ""] === answers.years) {
      patch.years = LEVEL_DEFAULT_YEARS[l];
    } else {
      // Also set when years is currently the default of another level.
      patch.years = LEVEL_DEFAULT_YEARS[l];
    }
    onChange(patch);
  };

  const setTrack = (t: "IC" | "Mgmt" | "Exec") => {
    // Switching tracks clears the fork-level so the user picks one from the new list.
    onChange({ track: t, level: "Senior", years: LEVEL_DEFAULT_YEARS.Senior });
  };

  const canContinue = !!level && !!primary;

  const ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

  const usedLangs = new Set(extras.map((e) => e.lang));
  const availableLangs = POPULAR_LANGUAGES.filter((l) => l !== "English" && !usedLangs.has(l));
  const addExtra = () => {
    if (!pendingLang) return;
    onChange({
      additionalLanguages: [...extras, { lang: pendingLang, level: pendingLevel }],
    });
    setPendingLang("");
    setPendingLevel("B2");
  };
  const removeExtra = (lang: string) => {
    onChange({ additionalLanguages: extras.filter((e) => e.lang !== lang) });
  };

  return (
    <div>
      <StepHeading>What's your experience?</StepHeading>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BASE_LEVELS.map((l) => {
          const selected = baseSelected === l;
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
              {LEVEL_IMAGES[l] && (
                <img
                  src={LEVEL_IMAGES[l]}
                  alt=""
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-full w-auto object-contain object-right"
                />
              )}
            </button>
          );
        })}
      </div>

      {showTrackFork && (
        <div className="mt-4">
          <div className="text-sm font-light text-[#090B0C]">Track</div>
          <div className="mt-2 inline-flex rounded-[4px] border border-[#E3E7E8] bg-white p-1">
            {(["IC", "Mgmt"] as const).map((t) => {
              const label = t === "IC" ? "Individual contributor" : "Management";
              const active = track === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrack(t)}
                  className={cn(
                    "rounded-[4px] px-3 py-1.5 text-sm font-light transition-colors",
                    active
                    ? "bg-[color:var(--color-green)] text-white"
                      : "text-[#67787C] hover:text-[#090B0C]",
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
            {hasExec && (
              <button
                type="button"
                onClick={() => setTrack("Exec")}
                className={cn(
                  "rounded-[4px] px-3 py-1.5 text-sm font-light transition-colors",
                  track === "Exec"
                    ? "bg-[color:var(--color-green)] text-white"
                    : "text-[#67787C] hover:text-[#090B0C]",
                )}
                aria-pressed={track === "Exec"}
              >
                Executive
              </button>
            )}
          </div>

          {track && track !== "Exec" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(track === "IC" ? IC_LEVELS : MGMT_LEVELS).map((l) => {
                const selected = level === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 text-sm font-light transition-colors",
                      selected
                        ? "border-[#00F1A9] bg-[#00F1A9] text-[#090B0C]"
                        : "border-[#E3E7E8] bg-white text-[#090B0C] hover:border-[color:var(--color-border-strong)]",
                    )}
                    aria-pressed={selected}
                  >
                    {selected && (
                      <span className="grid h-4 w-4 place-items-center rounded-[2px] bg-[#0E735A]">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                    {l}
                  </button>
                );
              })}
            </div>
          )}

          {track === "Exec" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {EXEC_LEVELS.map((l) => {
                const selected = level === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 text-sm font-light transition-colors",
                      selected
                        ? "border-[#00F1A9] bg-[#00F1A9] text-[#090B0C]"
                        : "border-[#E3E7E8] bg-white text-[#090B0C] hover:border-[color:var(--color-border-strong)]",
                    )}
                    aria-pressed={selected}
                  >
                    {selected && (
                      <span className="grid h-4 w-4 place-items-center rounded-[2px] bg-[#0E735A]">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                    {l}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {composedTitle(answers.field, level) && (
        <div className="mt-3 text-xs text-[#67787C]">
          Reads as <span className="text-[#090B0C]">{composedTitle(answers.field, level)}</span>
        </div>
      )}

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
        {yearsHintNote(level, years) && (
          <div className="mt-2 text-xs text-[#67787C]">{yearsHintNote(level, years)}</div>
        )}
      </div>

      <div className="mt-6">
        <label className="block text-sm font-light text-[#090B0C]">English level</label>
        <div className="mt-2">
          <select
            value={primary}
            onChange={(ev) => onChange({ primaryLanguage: ev.target.value })}
            className="select-native h-10 w-full rounded-[4px] border border-[color:var(--color-border)] bg-white pl-3 pr-8 text-sm text-[#090B0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
            aria-label="Select English level"
          >
            {ENGLISH_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
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
            value={pendingLang}
            onChange={(ev) => setPendingLang(ev.target.value)}
            className="select-native h-10 w-full flex-1 rounded-[4px] border border-[color:var(--color-border)] bg-white pl-3 pr-8 text-sm text-[#090B0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
            aria-label="Select an additional language"
          >
            <option value="">Language</option>
            {availableLangs.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <select
            value={pendingLevel}
            onChange={(ev) => setPendingLevel(ev.target.value as ProficiencyLevel)}
            className="select-native h-10 w-full sm:w-[140px] rounded-[4px] border border-[color:var(--color-border)] bg-white pl-3 pr-8 text-sm text-[#090B0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
            aria-label="Proficiency level"
          >
            {PROFICIENCY_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addExtra}
            disabled={!pendingLang}
            className="h-10 rounded-[4px] bg-[#090B0C] px-4 text-sm font-light text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 sm:w-auto"
          >
            Add
          </button>
        </div>
        {extras.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {extras.map((e) => (
              <span
                key={e.lang}
                className="inline-flex items-center gap-2 rounded-[4px] border border-[#E3E7E8] bg-white py-1.5 pl-3 pr-1.5 text-sm font-light text-[#090B0C]"
              >
                {e.lang} • {e.level}
                <button
                  type="button"
                  onClick={() => removeExtra(e.lang)}
                  aria-label={`Remove ${e.lang}`}
                  className="grid h-6 w-6 place-items-center rounded-[4px] text-[#67787C] hover:bg-[#F9FBFB] hover:text-[#090B0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
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

      <ContinueRow disabled={!canContinue} onClick={onContinue} label={submitLabel} onCancel={onCancel} />
    </div>
  );
}

// ---------- 4. Location & salary ----------

const SAL_MIN = 60_000;
const SAL_MAX = 220_000;
const SAL_STEP = 5_000;

export function LocationStep({
  answers,
  onChange,
  onContinue,
  submitLabel,
  onCancel,
}: {
  answers: QuizAnswers;
  onChange: (p: Partial<QuizAnswers>) => void;
  onContinue: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const workMode = answers.workMode;
  const locations = answers.locations ?? [];
  const minVal = answers.salaryMin ?? 100_000;
  const maxVal = answers.salaryMax ?? 160_000;
  const [locQuery, setLocQuery] = useState<string>("");
  const [locOpen, setLocOpen] = useState<boolean>(false);
  const [locHighlight, setLocHighlight] = useState<number>(0);
  const locBoxRef = useRef<HTMLDivElement | null>(null);

  const showReloTravel = !!answers.field && RELO_TRAVEL_FIELDS.includes(answers.field as any);

  const canContinue =
    !!workMode &&
    (workMode === "remote" || locations.length > 0) &&
    minVal < maxVal;

  const addLocationLabel = (label: string) => {
    if (locations.some((l) => l.toLowerCase() === label.toLowerCase())) {
      setLocQuery("");
      setLocOpen(false);
      return;
    }
    const patch: Partial<QuizAnswers> = { locations: [...locations, label] };
    if (answers.salaryMin == null) patch.salaryMin = 100_000;
    if (answers.salaryMax == null) patch.salaryMax = 160_000;
    onChange(patch);
    setLocQuery("");
    setLocOpen(false);
    setLocHighlight(0);
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

  const locSuggestions = (() => {
    const q = locQuery.trim().toLowerCase();
    if (!q) return [] as { label: string; key: string }[];
    const taken = new Set(locations.map((l) => l.toLowerCase()));
    const out: { label: string; key: string }[] = [];
    for (const s of US_STATES) {
      if (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase() === q
      ) {
        const label = `State of ${s.name}`;
        if (!taken.has(label.toLowerCase())) out.push({ label, key: `state:${s.code}` });
      }
    }
    for (const s of US_STATES) {
      const cs = CITIES_BY_STATE[s.code] ?? [];
      for (const c of cs) {
        if (c.toLowerCase().includes(q)) {
          const label = `${c}, ${s.code}`;
          if (!taken.has(label.toLowerCase())) out.push({ label, key: `city:${s.code}:${c}` });
        }
      }
      if (out.length >= 40) break;
    }
    return out.slice(0, 8);
  })();

  useEffect(() => {
    if (!locOpen) return;
    const onDown = (e: MouseEvent) => {
      if (locBoxRef.current && !locBoxRef.current.contains(e.target as Node)) {
        setLocOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [locOpen]);

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
                  if (answers.salaryMin == null) patch.salaryMin = 100_000;
                  if (answers.salaryMax == null) patch.salaryMax = 160_000;
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
          <div ref={locBoxRef} className="relative mt-2">
            <input
              type="text"
              value={locQuery}
              onChange={(e) => {
                setLocQuery(e.target.value);
                setLocOpen(true);
                setLocHighlight(0);
              }}
              onFocus={() => { if (locQuery.trim()) setLocOpen(true); }}
              onKeyDown={(e) => {
                if (!locOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
                  if (locSuggestions.length) setLocOpen(true);
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setLocHighlight((h) => Math.min(h + 1, Math.max(locSuggestions.length - 1, 0)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setLocHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const s = locSuggestions[locHighlight];
                  if (s) addLocationLabel(s.label);
                } else if (e.key === "Escape") {
                  setLocOpen(false);
                }
              }}
              placeholder="Search city or state…"
              aria-label="Search city or state"
              autoComplete="off"
              className="h-11 w-full rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
            />
            {locOpen && locSuggestions.length > 0 && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-64 overflow-auto rounded-[4px] border border-[color:var(--color-border)] bg-white shadow-md"
              >
                {locSuggestions.map((s, i) => (
                  <li
                    key={s.key}
                    role="option"
                    aria-selected={i === locHighlight}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addLocationLabel(s.label);
                    }}
                    onMouseEnter={() => setLocHighlight(i)}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm",
                      i === locHighlight
                        ? "bg-[color:var(--color-surface-2)]"
                        : "bg-white"
                    )}
                  >
                    {s.label}
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

      <ContinueRow disabled={!canContinue} onClick={onContinue} label={submitLabel} onCancel={onCancel} />
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
            "bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
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

export function AxesStep({
  answers,
  showScope,
  showSegment,
  showMotion,
  onChange,
  onContinue,
  submitLabel,
  onCancel,
}: {
  answers: QuizAnswers;
  showScope: boolean;
  showSegment: boolean;
  showMotion: boolean;
  onChange: (patch: Partial<QuizAnswers>) => void;
  onContinue: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const scope = answers.scope ?? {};
  const scopeFields = TAX_AXES.scope.fields ?? [];
  const segmentField = TAX_AXES.segment.field;
  const motionField = TAX_AXES.motion.field;

  const scopeComplete = !showScope || scopeFields.every(
    (f) => !!scope[f.key as "orgSize" | "budget" | "stage"]
  );
  const canContinue =
    scopeComplete &&
    (!showSegment || !!answers.segment) &&
    (!showMotion || !!answers.motion);

  const setScope = (key: string, value: string) =>
    onChange({ scope: { ...scope, [key]: value } });

  const Row = ({
    label,
    options,
    value,
    onPick,
  }: {
    label: string;
    options: string[];
    value?: string;
    onPick: (v: string) => void;
  }) => (
    <div>
      <div className="text-sm font-light text-[color:var(--color-text-secondary)]">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(opt)}
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
              >
                {selected && <span className="h-2 w-2 rounded-full bg-[#0E735A]" />}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <StepHeading>Scope & focus</StepHeading>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        A few details we use to weight matches.
      </p>
      <div className="mt-5 flex flex-col gap-5">
        {showScope &&
          scopeFields.map((f) => (
            <Row
              key={f.key}
              label={f.label}
              options={f.options}
              value={scope[f.key as "orgSize" | "budget" | "stage"]}
              onPick={(v) => setScope(f.key, v)}
            />
          ))}
        {showSegment && segmentField && (
          <Row
            label={segmentField.label}
            options={segmentField.options}
            value={answers.segment}
            onPick={(v) => onChange({ segment: v })}
          />
        )}
        {showMotion && motionField && (
          <Row
            label={motionField.label}
            options={motionField.options}
            value={answers.motion}
            onPick={(v) => onChange({ motion: v })}
          />
        )}
      </div>
      <ContinueRow disabled={!canContinue} onClick={onContinue} label={submitLabel} onCancel={onCancel} />
    </div>
  );
}

function ContinueRow({
  disabled,
  onClick,
  label,
  onCancel,
}: {
  disabled: boolean;
  onClick: () => void;
  label?: string;
  onCancel?: () => void;
}) {
  const primaryLabel = label ?? (onCancel ? "Save" : "Continue");
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        onCancel
          ? "sticky bottom-0 z-10 -mx-5 mt-6 rounded-b-[8px] border-t border-[color:var(--color-border)] bg-white px-5 py-4"
          : "mt-6"
      )}
    >
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="button-medium inline-flex h-12 items-center justify-center rounded-button border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-5 text-[color:var(--color-foreground)] transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
        >
          Cancel
        </button>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "button-medium inline-flex h-12 flex-1 items-center justify-center rounded-button px-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
          "bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
        )}
      >
        {primaryLabel}
      </button>
    </div>
  );
}
