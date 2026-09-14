import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  IconLoader2 as Loader2,
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/site/Wordmark";
import { loadQuiz, type QuizAnswers } from "@/lib/quiz-store";
import { useMatchedJobs, loadJobs } from "@/lib/jobs-store";
import type { Job } from "@/lib/jobs-data";
import { MatchLine } from "@/components/app/MatchLine";

import { RegistrationModal } from "@/components/auth/RegistrationModal";
import { PlanPaywall } from "@/components/site/PlanPaywall";
import { usePlanFlow } from "@/lib/onboarding/usePlanFlow";
import { supabase } from "@/integrations/supabase/client";
import { hasPlanStatus } from "@/lib/entitlements";
import { TRIAL_SKU, isSkuId, type SkuId } from "@/config/pricing";
import { readPlanIntent, savePlanIntent } from "@/lib/onboarding/planIntent";

export const Route = createFileRoute("/matches")({
  // `?sku=` is untrusted input: anything unrecognised, malformed or absent is
  // ignored silently. A valid value only preselects which card is DISPLAYED —
  // prices, totals and intervals still come from @/config/pricing, so the URL
  // can never influence what anything costs, and it never starts a purchase.
  validateSearch: (search: Record<string, unknown>): { sku?: SkuId } =>
    isSkuId(search["sku"]) ? { sku: search["sku"] } : {},
  head: () => ({
    meta: [{ title: "Your top matches — Jobly" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: MatchesPage,
});

/**
 * Whether the plan section shows the paywall or the Digest CTA.
 * "unknown" holds the plan section only — never the matches list.
 */
type PlanAccess = "unknown" | "paywall" | "has-plan";

/** Cheap synchronous hint that a Supabase session exists in this browser, so an
 *  anonymous visitor never waits on any read before seeing the paywall. */
function maybeSignedInSync(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
    }
  } catch {
    /* blocked storage: treat as anonymous */
  }
  return false;
}

function ago(days: number) {
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

const SEARCH_STEPS = [
  "Scanning fresh job postings…",
  "Comparing your stack and seniority…",
  "Checking salary and location fit…",
  "Ranking your best matches…",
];

function MatchesSearching() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % SEARCH_STEPS.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <li
        className="flex items-center gap-3 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4 text-[13px] text-[color:var(--color-text-secondary)]"
        aria-live="polite"
      >
        <Loader2 className="size-4 shrink-0 animate-spin text-[color:var(--color-green)]" />
        <span key={step} className="animate-fade-in">
          {SEARCH_STEPS[step]}
        </span>
      </li>
      {[0, 1, 2].map((i) => (
        <li
          key={`sk-${i}`}
          className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4"
          style={{ opacity: 1 - i * 0.25 }}
          aria-hidden
        >
          <div className="flex items-center gap-3">
            <div className="skeleton size-12 shrink-0 rounded-[12px]" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-1/2 rounded-[4px]" />
              <div className="skeleton h-3 w-1/3 rounded-[4px]" />
            </div>
            <div className="skeleton size-12 shrink-0 rounded-full" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="skeleton h-5 w-20 rounded-[4px]" />
            <div className="skeleton h-5 w-16 rounded-[4px]" />
            <div className="skeleton h-5 w-24 rounded-[4px]" />
          </div>
        </li>
      ))}
    </>
  );
}

function MatchesPage() {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const search = Route.useSearch();
  // The plan decision after the quiz. Registration and checkout both live in
  // the flow hook, so this screen no longer creates accounts on its own.
  const flow = usePlanFlow("matches_plan_step");
  const [access, setAccess] = useState<PlanAccess>(() =>
    maybeSignedInSync() ? "unknown" : "paywall",
  );
  // A valid ?sku wins over any older saved intent (it is the more recent
  // decision); otherwise the quiz -> matches handoff rides on the saved intent.
  const [initialSku] = useState<SkuId | undefined>(() => {
    if (search.sku) {
      savePlanIntent({ sku: search.sku, trial: search.sku === TRIAL_SKU });
      return search.sku;
    }
    return readPlanIntent()?.sku;
  });

  useEffect(() => {
    setAnswers(loadQuiz());
    void loadJobs();
  }, []);

  // This page sells, so an unreadable entitlement renders the paywall — the
  // opposite of OnboardingGate, which treats an unknown state as no access.
  // Both are correct: that one guards the app, this one guards a sales page.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      // Anonymous: no entitlements request at all.
      if (!data.session) {
        setAccess("paywall");
        return;
      }
      try {
        const { data: ent, error } = await supabase.rpc("get_entitlements");
        if (error) throw error;
        if (!alive) return;
        const status = (ent as { status?: string } | null)?.status;
        setAccess(hasPlanStatus(status) ? "has-plan" : "paywall");
      } catch {
        if (alive) setAccess("paywall");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const matched = useMatchedJobs(70);
  const topJobs = matched.slice(0, 5);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="pt-6 pb-6">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" aria-label="Jobly home" className="flex items-center">
            <Wordmark className="!text-current" />
          </Link>
          <Link
            to="/login"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 rounded-[12px] px-2 py-1"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div>
          <p className="text-sm text-[color:var(--color-green)] font-light">Matches ready</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">Your top matches</h1>
          <p className="mt-2 text-[color:var(--color-text-secondary)]">
            Ranked by fit against{" "}
            {(answers.roles && answers.roles.length ? answers.roles.join(", ") : answers.role) ||
              "your role"}
            {answers.level ? `, ${answers.level.toLowerCase()} level` : ""}.
          </p>
        </div>

        <ol className="mt-6 flex flex-col gap-3">
          {topJobs.length === 0 ? (
            <MatchesSearching />
          ) : (
            topJobs.map((j) => <JobCard key={j.id} job={j} />)
          )}
        </ol>

        {access === "unknown" ? null : access === "has-plan" ? (
          <section className="mt-10">
            <Link
              to="/dashboard"
              className="main_accent_button main_accent_button--on-light main_accent_button--block h-[48px]"
              style={{ width: 200 }}
            >
              Go to your Digest
            </Link>
          </section>
        ) : (
          <section className="mt-10">
            <h2 className="text-2xl">Pick a plan to keep these matches</h2>

            <div className="mt-6">
              <PlanPaywall
                initialSku={initialSku}
                onSelect={(card) => void flow.selectPlan(card.choice)}
              />
            </div>
          </section>
        )}


      </main>

      <RegistrationModal
        open={flow.modalOpen}
        onOpenChange={(v) => {
          if (!v) flow.closeModal();
        }}
        onAuthed={flow.onAuthed}
        googleRedirectPath={flow.googleRedirectPath}
        source="matches_plan_step"
      />
    </div>
  );
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  // A perfect match reads as a solid disc rather than a closed ring. Filling
  // the progress circle lands exactly: radius r plus the 4px stroke centred on
  // that path comes to size / 2, so the disc fills the box with no seam.
  const perfect = score >= 100;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${score} percent match`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#E3E7E8"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#0E735A"
          strokeWidth={stroke}
          fill={perfect ? "#0E735A" : "none"}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="butt"
        />
      </svg>
      <span
        className="absolute text-[14px]"
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 400,
          color: perfect ? "#FFFFFF" : "#090B0C",
        }}
      >
        {score}%
      </span>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <li className="rounded-[20px] bg-[#F1F3F3] p-1">
      <article className="group relative rounded-[16px] border border-[#E3E7E8] bg-white p-5 shadow-[0_1px_6px_0_rgba(12,12,13,0.08)] transition-[box-shadow,border-color,background-color] hover:border-[#D0D6D8] hover:bg-[#F9FBFB] hover:shadow-[0_2px_10px_0_rgba(12,12,13,0.10)]">
        <div className="flex w-full items-center gap-4">
          {job.logo ? (
            <img src={job.logo} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[color:var(--color-foreground)] text-[16px] font-normal text-white">
              {job.company.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="block text-[15px] font-normal text-[color:var(--color-foreground)]">
              {job.title}
            </span>
            <div
              className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]"
              style={{ fontWeight: 300 }}
            >
              {job.company} · {job.location}
            </div>
          </div>
          <ScoreRing score={job.score} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="body-medium text-[color:var(--color-foreground)]">{job.salary}</div>
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
            className="ml-auto inline-flex items-center gap-1 text-[13px] font-light text-[color:var(--color-green)] hover:underline"
          >
            {detailsOpen ? "Hide details" : "Match details"}
            {detailsOpen ? (
              <ChevronUp size={14} strokeWidth={2} />
            ) : (
              <ChevronDown size={14} strokeWidth={2} />
            )}
          </button>
        </div>
        {detailsOpen ? (
          <div className="mt-5 border-t border-[color:var(--color-border)] pt-5">
            <MatchLine job={job} wrap />
          </div>
        ) : null}
      </article>
    </li>
  );
}
