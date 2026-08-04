import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCheck, IconEye, IconEyeOff, IconInfoCircle, IconLock, IconPlus, IconX } from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { GoogleMark } from "@/components/site/GoogleMark";
import { IconTooltip } from "@/components/app/IconTooltip";
import { logSecurityEvent } from "@/lib/security-events.functions";
import { supabase } from "@/integrations/supabase/client";
import { clearUserStateForSignOut } from "@/lib/sign-out";
import { useAuth } from "@/hooks/use-auth";
import { useEntitlements } from "@/lib/entitlements-provider";
import {
  usePlan,
  setPlan,
  useHasHadPro,
  setHasHadPro,
  useSubscription,
  scheduleCancelAtPeriodEnd,
  resumeSubscription,
  devDowngradeNow,
  devRestorePro,
  type Plan,
} from "@/lib/plan-store";
import { blockCompany, unblockCompany, useBlockedCompanies } from "@/lib/blocked-companies-store";
import { CANCEL_REASONS, recordCancelFeedback, type CancelReason } from "@/lib/cancel-feedback-store";
import { PRICING, TRIAL_DAYS, money, savings as annualSavings, total, usd } from "@/config/pricing";
import { toast } from "sonner";
import { DELETION_COPY, deletionDateFrom, formatDeletionDate } from "@/config/account";
import {
  requestAccountDeletionServer,
  restoreAccountServer,
  devSetPendingDeletion,
  devFastForwardPastGrace,
  useAccount,
} from "@/lib/account-store";
import { lovable } from "@/integrations/lovable/index";
import {
  HOUR_OPTIONS,
  timezoneOptions,
  useNotificationSettings,
  type ConsentKey,
  type PreferenceKey,
} from "@/lib/notifications-store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Jobly" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const plan = usePlan();
  const [flash, setFlash] = useState<string | null>(null);
  function flashMsg(m: string) {
    setFlash(m);
    window.setTimeout(() => setFlash((f) => (f === m ? null : f)), 2200);
  }
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] pb-24 md:pb-8">
      <AppHeader active="settings" />
      <main className="mx-auto max-w-[880px] px-6 pb-24 pt-6">
        <h1 className="text-[24px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Plan, billing, notifications, hidden companies, security and account.
        </p>
        {flash ? (
          <div className="mt-4 rounded-[6px] bg-[color:var(--color-mint)] px-4 py-3 text-[13px] text-[color:var(--color-green)]">
            {flash}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-5">
          <PlanCard plan={plan} onFlash={flashMsg} />
          <NotificationsCard plan={plan} />
          <BlockedCompaniesCard onFlash={flashMsg} />
          <SecurityCard onFlash={flashMsg} />
          <DangerZoneCard onFlash={flashMsg} />
        </div>
      </main>
      <MobileTabBar active="settings" />
    </div>
  );
}

function Card({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
      <div className="flex items-center justify-between gap-4">
        <h2
          className="text-[18px] text-[color:var(--color-foreground)]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400, letterSpacing: "-0.01em" }}
        >
          {title}
        </h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center rounded-[8px] bg-[color:var(--color-surface-2)] px-3 py-2 button-large text-[color:var(--color-text-secondary)]">
        Free
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-[8px] bg-[color:var(--color-mint)] px-3 py-2 button-large text-[color:var(--color-green)]">
      {plan === "paused" ? "Paused" : "Pro"}
    </span>
  );
}

function PlanCard({ plan, onFlash }: { plan: Plan; onFlash: (m: string) => void }) {
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2>(0);
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [reasonOther, setReasonOther] = useState("");
  const reasonReady = reason !== null && (reason !== "Other" || reasonOther.trim().length > 0);
  function closeCancel() {
    setCancelStep(0);
    setReason(null);
    setReasonOther("");
  }
  function saveReason() {
    if (reason) recordCancelFeedback(reason, reason === "Other" ? reasonOther : undefined);
  }
  const sub = useSubscription();
  const { loading: entLoading } = useEntitlements();
  // Dates are rendered only when we actually know them, in the account's zone.
  const periodEndLabel = useDateLabel(sub.currentPeriodEnd);
  const pauseEndLabel = useDateLabel(sub.pauseEndsAt ?? null);
  const scheduledEnd = sub.cancelAtPeriodEnd && plan === "pro";
  // No billing provider owns this row, so there is no real renewal date to show.
  const providerBilled = sub.activationSource === "provider";

  const proSummary = "Daily digest · match scores · application tracker";
  const proBilling =
    providerBilled && periodEndLabel
      ? `Billed annually · ${usd(total(PRICING.annual))}/yr · renews ${periodEndLabel}`
      : `Billed annually · ${usd(total(PRICING.annual))}/yr`;
  const scheduledLine = periodEndLabel
    ? `Pro until ${periodEndLabel} · then Free`
    : "Pro until your current period ends · then Free";
  const pausedLine = pauseEndLabel
    ? `Paused until ${pauseEndLabel} · no charges while paused`
    : "Paused · no charges while paused";
  const freeSummary = "Weekly digest · match scores · basic tracker";

  if (entLoading) {
    return (
      <Card title="Plan">
        <div className="animate-pulse space-y-3" aria-label="Loading your plan">
          <div className="h-5 w-32 rounded-[4px] bg-[color:var(--color-surface-2)]" />
          <div className="h-4 w-64 rounded-[4px] bg-[color:var(--color-surface-2)]" />
          <div className="h-9 w-40 rounded-[4px] bg-[color:var(--color-surface-2)]" />
        </div>
      </Card>
    );
  }


  return (
    <Card
      title="Plan"
      actions={plan === "pro" && !scheduledEnd ? (
        <button
          type="button"
          onClick={() => setCancelStep(1)}
          className="inline-flex h-9 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        >
          Cancel subscription
        </button>
      ) : null}
    >
      {/* Current-plan row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <PlanBadge plan={plan} />
          <div className="min-w-0">
            <p className="text-[13px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300 }}>
              {plan === "free" ? freeSummary : proSummary}
            </p>
            <p className="mt-1 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
              {scheduledEnd
                ? scheduledLine
                : plan === "pro"
                  ? proBilling
                  : plan === "paused"
                    ? pausedLine
                    : "Free plan — no billing"}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-stretch gap-2">
          {scheduledEnd ? (
            <button
              type="button"
              onClick={() => { resumeSubscription(); onFlash("Cancellation undone — your Pro subscription continues."); }}
              className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Resume subscription
            </button>
          ) : null}
          {plan === "paused" ? (
            <>
              <button
                type="button"
                onClick={() => { setPlan("pro"); onFlash("Welcome back — your matches start arriving tomorrow morning."); }}
                className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
              >
                Restart my search
              </button>
              <button
                type="button"
                onClick={() => setCancelStep(2)}
                className="inline-flex h-10 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                Cancel subscription
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Two plan cards — Pro (wide, left) + Free (narrow, right) */}
      <PlanCardsBlock plan={plan} onFlash={onFlash} onDowngrade={() => setCancelStep(plan === "paused" ? 2 : 1)} />

      <p className="mt-3 text-[11px] text-[color:var(--color-text-muted)]">
        Payments aren't live in this preview — plan changes are simulated.
      </p>

      {/* Cancel Step 1 (only from active Pro) */}
      {cancelStep === 1 ? (
        <Modal onClose={closeCancel} title="Found a job?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            Congrats! Pause Pro for 6 months instead — no emails, no charges, everything saved exactly as you left it.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setPlan("paused"); closeCancel(); onFlash("Pro paused for 6 months."); }}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Pause Pro for 6 months
            </button>
            <button
              type="button"
              onClick={() => setCancelStep(2)}
              className="text-[13px] text-[color:var(--color-text-muted)] hover:underline"
            >
              No — continue to cancel
            </button>
          </div>
        </Modal>
      ) : null}

      {/* Cancel Step 2 — differs by plan state */}
      {cancelStep === 2 && plan === "paused" ? (
        <Modal onClose={closeCancel} title="Are you sure?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            Your pause will end and you'll move to Free immediately. Your tracker and profile are kept.
          </p>
          <CancelReasonPicker
            reason={reason}
            onReason={setReason}
            other={reasonOther}
            onOther={setReasonOther}
          />
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setPlan("paused"); closeCancel(); }}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Keep my pause
            </button>
            <button
              type="button"
              disabled={!reasonReady}
              onClick={() => { saveReason(); setPlan("free"); closeCancel(); onFlash("Subscription canceled — moved to Free."); }}
              className="h-11 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              style={{ borderColor: "#D00D01" }}
            >
              Cancel subscription
            </button>
          </div>
        </Modal>
      ) : null}

      {cancelStep === 2 && plan !== "paused" ? (
        <Modal onClose={closeCancel} title="Cancel your Pro subscription?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            You'll keep Pro until <b>{periodEndLabel}</b>, then move to Free. No more charges. You can resume anytime.
          </p>
          <CancelReasonPicker
            reason={reason}
            onReason={setReason}
            other={reasonOther}
            onOther={setReasonOther}
          />
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={closeCancel}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Keep Pro
            </button>
            <button
              type="button"
              disabled={!reasonReady}
              onClick={() => { saveReason(); scheduleCancelAtPeriodEnd(); closeCancel(); onFlash(`Pro canceled — access until ${periodEndLabel}.`); }}
              className="h-11 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[color:var(--color-surface-1)]"
              style={{ borderColor: "#D00D01" }}
            >
              Cancel subscription
            </button>
          </div>
        </Modal>
      ) : null}

      <DevPlanOverrideRow onFlash={onFlash} />
    </Card>
  );
}

function CancelReasonPicker({
  reason,
  onReason,
  other,
  onOther,
}: {
  reason: CancelReason | null;
  onReason: (r: CancelReason) => void;
  other: string;
  onOther: (v: string) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-[13px] text-[color:var(--color-foreground)]" style={{ fontWeight: 500 }}>
        Why are you canceling?
      </legend>
      <p className="mt-1 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
        This helps us improve Jobly.
      </p>
      <div className="mt-3 flex flex-col gap-1">
        {CANCEL_REASONS.map((r) => (
          <label
            key={r}
            className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
            style={{ fontWeight: 300 }}
          >
            <input
              type="radio"
              name="cancel-reason"
              checked={reason === r}
              onChange={() => onReason(r)}
              className="h-4 w-4 accent-[color:var(--color-accent)]"
            />
            <span>{r}</span>
          </label>
        ))}
      </div>
      {reason === "Other" ? (
        <textarea
          autoFocus
          value={other}
          onChange={(e) => onOther(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Tell us what happened"
          aria-label="Tell us why you're canceling"
          className="mt-2 w-full resize-none rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 py-2 text-[13px] text-[color:var(--color-foreground)] outline-none focus:border-[color:var(--color-accent)]"
          style={{ fontWeight: 300 }}
        />
      ) : null}
    </fieldset>
  );
}

function DevPlanOverrideRow({ onFlash }: { onFlash: (m: string) => void }) {
  if (!import.meta.env.DEV) return null;
  return <DevPlanOverrideRowInner onFlash={onFlash} />;
}

function DevPlanOverrideRowInner({ onFlash }: { onFlash: (m: string) => void }) {
  const plan = usePlan();
  const hasHadPro = useHasHadPro();
  const account = useAccount();
  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
          Dev tools
        </span>
        <span className="text-[11px] text-[color:var(--color-text-muted)] opacity-60">plan: {plan}</span>
        <span className="flex-1" />
        <label className="inline-flex items-center gap-1.5 text-[11px] text-[color:var(--color-text-muted)]">
          <input
            type="checkbox"
            className="h-3.5 w-3.5"
            checked={hasHadPro}
            onChange={(e) => setHasHadPro(e.target.checked)}
          />
          <span>hasHadPro</span>
        </label>
        <button
          type="button"
          onClick={() => { devDowngradeNow(); onFlash("DEV ONLY — downgraded to Free instantly."); }}
          className="inline-flex h-7 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-2 text-[11px] font-medium text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          Free now
        </button>
        <button
          type="button"
          onClick={() => { devRestorePro(); onFlash("DEV ONLY — Pro restored."); }}
          className="inline-flex h-7 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-2 text-[11px] font-medium text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          Restore Pro
        </button>
        <label className="inline-flex items-center gap-1.5 text-[11px] text-[color:var(--color-text-muted)]">
          <input
            type="checkbox"
            className="h-3.5 w-3.5"
            checked={account.accountStatus === "pending_deletion"}
            onChange={(e) => { devSetPendingDeletion(e.target.checked); onFlash("DEV ONLY — account status changed."); }}
          />
          <span>pending_deletion</span>
        </label>
        <button
          type="button"
          onClick={() => { devFastForwardPastGrace(); onFlash("DEV ONLY — grace period moved into the past."); }}
          className="inline-flex h-7 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-2 text-[11px] font-medium text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          Fast-forward past grace
        </button>
        <button
          type="button"
          onClick={async () => {
            const res = await fetch("/api/public/hooks/purge-deleted-accounts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
              },
              body: "{}",
            });
            const body = (await res.json()) as { purged?: number; due?: number };
            onFlash(`DEV ONLY — purge run: ${body.purged ?? 0}/${body.due ?? 0} accounts deleted.`);
          }}
          className="inline-flex h-7 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-2 text-[11px] font-medium text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          Run purge now
        </button>
      </div>
    </div>
  );
}

const PRO_MONTHLY = PRICING.monthly.perMonth;
const PRO_ANNUAL_MONTHLY = PRICING.annual.perMonth;
const PRO_ANNUAL_TOTAL = total(PRICING.annual);

function PlanCardsBlock({
  plan,
  onFlash,
  onDowngrade,
}: {
  plan: Plan;
  onFlash: (m: string) => void;
  onDowngrade: () => void;
}) {
  const hasHadPro = useHasHadPro();
  const [period, setPeriod] = useState<"annual" | "monthly">("annual");
  const tabsRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number; height: number; top: number }>({ left: 0, width: 0, height: 0, top: 0 });
  const segments = ["annual", "monthly"] as const;

  useEffect(() => {
    const measure = () => {
      const idx = segments.indexOf(period);
      const btn = btnRefs.current[idx];
      if (!btn) return;
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth, height: btn.offsetHeight, top: btn.offsetTop });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (tabsRef.current) ro.observe(tabsRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [period]);

  const isPlanFree = plan === "free";
  const isPlanPro = plan === "pro" || plan === "paused";

  const savings = money(annualSavings(PRICING.annual));

  const proLabel =
    isPlanPro
      ? "Current plan"
      : !hasHadPro
        ? `Start free ${TRIAL_DAYS}-day trial`
        : "Upgrade to Pro";

  const freeFeatures: Array<{ label: string; included: boolean }> = [
    { label: "Matches per digest — Top 5", included: true },
    { label: "Digest frequency — Weekly", included: true },
    { label: "AI match score and \u201Cwhy it fits\u201D", included: false },
    { label: "Application tracker", included: false },
    { label: "Follow-up reminders", included: false },
    { label: "\u201CFound a job\u201D pause", included: false },
  ];
  const proFeatures: string[] = [
    "Matches per digest — Top 5",
    "Digest frequency — Daily",
    "AI match score and \u201Cwhy it fits\u201D",
    "Application tracker",
    "Follow-up reminders",
    "\u201CFound a job\u201D pause",
  ];

  function onProClick() {
    if (isPlanPro) return;
    if (!hasHadPro) {
      setPlan("pro");
      onFlash(`Welcome to Pro — your ${TRIAL_DAYS}-day trial has started.`);
    } else {
      setPlan("pro");
      onFlash("Welcome back to Pro.");
    }
  }

  return (
    <div className="mt-5 w-full max-w-[800px]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
        {/* Pro card — left, wider */}
        <div
          className="rounded-[12px] p-2 md:p-3 lg:min-w-0"
          style={{ background: "#F1F3F3", flex: "504 0 0" }}
        >
          <div
            className="relative flex h-full flex-col gap-4 rounded-[8px] p-5 md:p-[21px]"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid #FFFFFF",
              boxShadow: "0 1px 4px rgba(12,12,13,0.05)",
              overflow: "hidden",
              isolation: "isolate",
            }}
          >
            {/* Glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                width: 200,
                height: 200,
                top: -64,
                right: -64,
                zIndex: 1,
                background: "radial-gradient(circle, #00F1A9 0%, rgba(0,241,169,0) 70%)",
                filter: "blur(40px)",
                opacity: 0.45,
              }}
            />

            {/* Head */}
            <div className="relative flex-1" style={{ zIndex: 2 }}>
              {/* Toggle (top-right on desktop; static on mobile) */}
              <div
                ref={tabsRef}
                role="tablist"
                aria-label="Billing period"
                className="relative mb-3 flex w-full items-center gap-1 rounded-[10px] p-1 md:absolute md:right-0 md:top-0 md:mb-0 md:w-auto"
                style={{ background: "rgba(0,0,0,0.08)" }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    setPeriod((p) => (p === "annual" ? "monthly" : "annual"));
                  }
                }}
              >
                <span
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    left: indicator.left,
                    top: indicator.top,
                    width: indicator.width,
                    height: indicator.height,
                    background: "#FFFFFF",
                    borderRadius: 6,
                    boxShadow: "0 1px 2px rgba(12,12,13,0.05)",
                    transition: "left 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
                {segments.map((seg, idx) => {
                  const active = period === seg;
                  const label = seg === "annual" ? "Annual" : "Monthly";
                  return (
                    <button
                      key={seg}
                      ref={(el) => { btnRefs.current[idx] = el; }}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => setPeriod(seg)}
                      className="relative flex-1 md:flex-none inline-flex items-center justify-center gap-1 rounded-[6px]"
                      style={{
                        background: "transparent",
                        padding: seg === "annual" ? "4px 4px 4px 8px" : "5px 8px",
                        zIndex: 1,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontWeight: 400,
                          fontSize: 12,
                          lineHeight: "16px",
                          color: active ? "#090B0C" : "#4B585B",
                          transition: "color 200ms ease",
                        }}
                      >
                        {label}
                      </span>
                      {seg === "annual" ? (
                        <span
                          className="inline-flex items-center"
                          style={{
                            background: "var(--color-mint, #D8FBEF)",
                            color: "var(--color-green, #0E735A)",
                            borderRadius: 4,
                            padding: "2px 4px",
                            height: 16,
                            fontFamily: "var(--font-sans)",
                            fontWeight: 300,
                            fontSize: 12,
                            lineHeight: "16px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Best value
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Plan name */}
              <div
                style={{
                  fontFamily: "var(--font-display, var(--font-sans))",
                  fontWeight: 400,
                  fontSize: 16,
                  lineHeight: "24px",
                  color: "#090B0C",
                }}
              >
                {period === "annual" ? "Annual" : "Monthly"}
              </div>

              {/* Price group — pinned near bottom of head */}
              <div className="mt-6 flex flex-col gap-1 relative">
                {/* Struck row (always rendered) */}
                <div style={{ height: 20 }}>
                  {period === "annual" ? (
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 300,
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: "#67787C",
                        textDecoration: "line-through",
                      }}
                    >
                      ${PRO_MONTHLY.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-display, var(--font-sans))",
                      fontWeight: 400,
                      fontSize: 32,
                      lineHeight: 1.05,
                      color: "#090B0C",
                    }}
                  >
                    ${period === "annual" ? PRO_ANNUAL_MONTHLY.toFixed(2) : PRO_MONTHLY.toFixed(2)}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 300,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#67787C",
                    }}
                  >
                    per month
                  </span>
                  {period === "annual" ? (
                    <span
                      className="ml-1 hidden md:inline-flex items-center md:absolute md:right-0 md:bottom-0"
                      style={{
                        background: "#0E735A",
                        color: "#FFFFFF",
                        borderRadius: 24,
                        padding: "4px 8px",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 400,
                        fontSize: 12,
                        lineHeight: "16px",
                      }}
                    >
                      Save ${savings}
                    </span>
                  ) : null}
                </div>
                {period === "annual" ? (
                  <span
                    className="md:hidden inline-flex items-center self-start"
                    style={{
                      background: "#0E735A",
                      color: "#FFFFFF",
                      borderRadius: 24,
                      padding: "4px 8px",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 400,
                      fontSize: 12,
                      lineHeight: "16px",
                    }}
                  >
                    Save ${savings}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Feature list */}
            <ul className="relative flex flex-col gap-3 py-2" style={{ zIndex: 2 }}>
              {proFeatures.map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className="inline-flex shrink-0 items-center justify-center rounded-full"
                    style={{ width: 16, height: 16, background: "#00F1A9" }}
                  >
                    <IconCheck size={11} strokeWidth={2.5} style={{ color: "#090B0C" }} />
                  </span>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: 13, lineHeight: "19.5px", color: "#090B0C" }}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <div className="relative" style={{ zIndex: 2 }}>
              <button
                type="button"
                onClick={onProClick}
                disabled={isPlanPro}
                className="w-full inline-flex items-center justify-center"
                style={{
                  background: "#00F1A9",
                  border: "1px solid #00F1A9",
                  color: "#090B0C",
                  borderRadius: 4,
                  padding: "13px 17px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: "20px",
                  opacity: isPlanPro ? 0.6 : 1,
                  cursor: isPlanPro ? "default" : "pointer",
                }}
              >
                {proLabel}
              </button>
              {!isPlanPro && !hasHadPro ? (
                <p
                  className="mt-2 text-center"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 300,
                    fontSize: 12,
                    lineHeight: "16px",
                    color: "#67787C",
                  }}
                >
                  {TRIAL_DAYS} days free, then {period === "annual"
                    ? `$${PRO_ANNUAL_MONTHLY.toFixed(2)}/mo billed annually ($${PRO_ANNUAL_TOTAL.toFixed(2)})`
                    : `$${PRO_MONTHLY.toFixed(2)}/mo`}
                  . Cancel anytime.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Free card — right, narrower */}
        <div
          className="rounded-[12px] p-2 md:p-3 lg:min-w-0"
          style={{ background: "#F1F3F3", flex: "280 0 0" }}
        >
          <div
            className="flex h-full flex-col gap-4 rounded-[8px] p-5 md:p-[21px]"
            style={{
              background: "#F9FBFB",
              border: "1px solid #FFFFFF",
              boxShadow: "0 1px 2px rgba(12,12,13,0.05)",
            }}
          >
            <div className="flex-1">
              <div
                style={{
                  fontFamily: "var(--font-display, var(--font-sans))",
                  fontWeight: 400,
                  fontSize: 16,
                  lineHeight: "24px",
                  color: "#090B0C",
                }}
              >
                Free
              </div>
              <div className="mt-6 flex flex-col gap-1">
                <div style={{ height: 20 }} />
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-display, var(--font-sans))",
                      fontWeight: 400,
                      fontSize: 32,
                      lineHeight: 1.05,
                      color: "#090B0C",
                    }}
                  >
                    $0
                  </span>
                </div>
              </div>
            </div>

            <ul className="flex flex-col gap-3 py-2">
              {freeFeatures.map((f) => (
                <li key={f.label} className="flex items-center gap-2">
                  {f.included ? (
                    <span
                      className="inline-flex shrink-0 items-center justify-center rounded-full"
                      style={{ width: 16, height: 16, background: "#E3E7E8" }}
                    >
                      <IconCheck size={11} strokeWidth={2.5} style={{ color: "#67787C" }} />
                    </span>
                  ) : (
                    <span
                      className="inline-flex shrink-0 items-center justify-center"
                      style={{ width: 16, height: 16 }}
                      aria-hidden
                    >
                      <span style={{ width: 10, height: 2, background: "#D0D6D8", display: "block" }} />
                    </span>
                  )}
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: 13, lineHeight: "19.5px", color: "#4B585B" }}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <div>
              <button
                type="button"
                onClick={() => {
                  if (isPlanFree) return;
                  onDowngrade();
                }}
                disabled={isPlanFree}
                className="w-full inline-flex items-center justify-center"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E3E7E8",
                  color: "#090B0C",
                  borderRadius: 4,
                  padding: "13px 17px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: "20px",
                  opacity: isPlanFree ? 0.6 : 1,
                  cursor: isPlanFree ? "default" : "pointer",
                }}
              >
                {isPlanFree ? "Current plan" : "Downgrade to Free"}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function BillingCard({ plan }: { plan: Plan }) {
  if (plan === "free") {
    return (
      <Card title="Billing and payment">
        <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          No billing yet. Start a Pro trial to see invoices here.
        </p>
      </Card>
    );
  }
  const invoices = [
    { date: "Jul 20, 2026", label: "Jobly Pro — monthly", amount: "$9.99" },
    { date: "Jun 20, 2026", label: "Jobly Pro — monthly", amount: "$9.99" },
    { date: "May 20, 2026", label: "Jobly Pro — monthly", amount: "$9.99" },
  ];
  return (
    <Card title="Billing and payment">
      <div className="flex flex-col gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-4">
        <div className="flex h-8 w-12 items-center justify-center rounded-[4px] bg-[color:var(--color-surface-2)] text-[11px] font-semibold text-[color:var(--color-text-muted)]">
          CARD
        </div>
        <div className="text-[13px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300 }}>
          •••• 4242 · expires 08/27
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px] text-[color:var(--color-text-muted)]">Soon</span>
          <span className="text-[13px] text-[color:var(--color-text-muted)]">Change</span>
        </div>
      </div>
      <ul className="mt-4 divide-y">
        {invoices.map((r) => (
          <li key={r.date} className="flex items-center justify-between py-3 text-[13px]">
            <div className="text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              {r.date} · {r.label}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[color:var(--color-foreground)]">{r.amount}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NotificationsCard({ plan }: { plan: Plan }) {
  const pro = plan !== "free";
  const { consents, prefs, loading, error, setConsent, setPreference, reload } = useNotificationSettings();
  const freq = prefs.digest_frequency;
  type Row =
    | { kind: "consent"; key: ConsentKey; label: string; caption?: string }
    | { kind: "pref"; key: PreferenceKey; label: string; caption?: string };
  const groups: { label: string; rows: Row[] }[] = [
    {
      label: "Digest and matches",
      rows: [
        { kind: "consent", key: "daily_digest", label: "New digest is ready", caption: "Your recurring batch of clean matches." },
        { kind: "consent", key: "high_match_alerts", label: "Instant high-match alerts", caption: "A one-off email when a top match posts between digests." },
        { kind: "consent", key: "weekly_report", label: "Weekly search report", caption: "Your week in numbers — matches, applied, replies." },
        { kind: "pref", key: "pref_digest_tuned", label: `"We tuned your digest"`, caption: "When your feedback changes what you see." },
      ],
    },
    {
      label: "Applications and tracker",
      rows: [
        { kind: "pref", key: "pref_interview_reminders", label: "Interview reminders and prep", caption: "The day before, plus your prep pack." },
        { kind: "pref", key: "pref_followup_nudges", label: "Follow-up nudges", caption: "A gentle nudge if an application goes quiet." },
        { kind: "pref", key: "pref_stale_nudges", label: "Stale-application nudges", caption: "When something's sat untouched for weeks." },
      ],
    },
    {
      label: "Account and lifecycle",
      rows: [
        { kind: "consent", key: "product_updates", label: "Product updates and tips" },
        { kind: "consent", key: "reactivation", label: "Re-engagement when you're away", caption: "A reminder if matches pile up unread." },
      ],
    },
  ];

  return (
    <Card title="Notifications">
      <p className="-mt-2 mb-4 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        Choose what lands in your inbox. We only email what's useful — no spam.
      </p>
      {error ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[4px] px-3 py-2 text-[12px]" style={{ background: "#FFE2E2", color: "#D00D01" }}>
          <span>{error}</span>
          <button type="button" onClick={() => void reload()} className="shrink-0 underline">
            Retry
          </button>
        </div>
      ) : null}
      <div>
        <h6 className="text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 16, lineHeight: 1.4 }}>Digest frequency</h6>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!pro || loading}
            onClick={() => pro && void setPreference("digest_frequency", "daily")}
            className={`inline-flex h-10 items-center gap-1.5 rounded-[4px] border px-4 text-[14px] transition-colors ${
              freq === "daily"
                ? "border-[color:var(--color-green)] bg-[color:var(--color-green)] text-white"
                : "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
            } ${!pro || loading ? "cursor-not-allowed opacity-60" : ""}`}
          >
            Daily
            {!pro ? (
              <span className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold ${freq === "daily" ? "bg-white/20 text-white" : "bg-[color:var(--color-mint)] text-[color:var(--color-green)]"}`}>Pro</span>
            ) : null}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void setPreference("digest_frequency", "weekly")}
            className={`inline-flex h-10 items-center rounded-[4px] border px-4 text-[14px] transition-colors ${
              freq === "weekly"
                ? "border-[color:var(--color-green)] bg-[color:var(--color-green)] text-white"
                : "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
            } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
          >
            Weekly
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-[color:var(--color-text-muted)]">
            <span>Quiet hours from</span>
            <select
              disabled={loading}
              value={prefs.quiet_hours_start}
              onChange={(e) => void setPreference("quiet_hours_start", Number(e.target.value))}
              className="h-10 w-[110px] rounded-[4px] border bg-[color:var(--color-surface-1)] pl-3 pr-7 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
            >
              {HOUR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[color:var(--color-text-muted)]">
            <span>to</span>
            <select
              disabled={loading}
              value={prefs.quiet_hours_end}
              onChange={(e) => void setPreference("quiet_hours_end", Number(e.target.value))}
              className="h-10 w-[110px] rounded-[4px] border bg-[color:var(--color-surface-1)] pl-3 pr-7 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
            >
              {HOUR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-[12px] text-[color:var(--color-text-muted)]">
            <span>Timezone</span>
            <select
              disabled={loading}
              value={prefs.timezone}
              onChange={(e) => void setPreference("timezone", e.target.value)}
              className="h-10 w-[220px] max-w-full rounded-[4px] border bg-[color:var(--color-surface-1)] pl-3 pr-7 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
            >
              {timezoneOptions(prefs.timezone).map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
          We hold emails during quiet hours · pause anytime under "Found a job?"
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-muted)]" style={{ fontWeight: 600 }}>
              {g.label}
            </div>
            <div className="mt-2 divide-y">
              {g.rows.map((r) => (
                <div
                  key={r.key}
                  className={`flex items-center justify-between gap-4 py-3 ${loading || error ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0">
                    <h6 className="text-[16px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)", fontWeight: 400, lineHeight: 1.4 }}>{r.label}</h6>
                    {r.caption ? (
                      <div className="text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>{r.caption}</div>
                    ) : null}
                  </div>
                  {loading || (error && r.kind === "consent") ? (
                    // Neutral state: no on/off position is implied while unknown.
                    <div className="skeleton h-6 w-11 shrink-0 rounded-full" aria-hidden />
                  ) : (
                    <Toggle
                      on={r.kind === "consent" ? consents[r.key] : prefs[r.key]}
                      onChange={(v) =>
                        r.kind === "consent"
                          ? void setConsent(
                              r.key,
                              v,
                              r.caption ? `${r.label} — ${r.caption}` : r.label,
                            )
                          : void setPreference(r.key, v)
                      }
                      label={r.label}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[6px] bg-[color:var(--color-surface-2)] px-3 py-2 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        <span className="font-semibold">Always on:</span> account and security (verify, sign-in, password), billing and receipts (trial, renewal, cancellation, failed payment), and data and legal (export, deletion). These are required and only sent when necessary.
      </div>
    </Card>
  );
}

function BlockedCompaniesCard({ onFlash }: { onFlash: (m: string) => void }) {
  const list = useBlockedCompanies();
  const [value, setValue] = useState("");
  function submit() {
    const v = value.trim();
    if (!v) return;
    if (list.some((c) => c.toLowerCase() === v.toLowerCase())) {
      onFlash(`${v} is already hidden.`);
      setValue("");
      return;
    }
    blockCompany(v);
    onFlash(`Hidden jobs from ${v}.`);
    setValue("");
  }
  return (
    <Card title="Hide jobs from companies">
      <p className="-mt-2 mb-4 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        These companies won't appear in your digest or search results — your current employer, past ones, agencies you'd rather skip.
      </p>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder="Add a company to hide from"
          className="h-10 min-w-0 flex-1 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
        />
        <button
          type="button"
          onClick={submit}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        >
          <IconPlus size={14} strokeWidth={1.8} />
          Add company
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {list.length === 0 ? (
          <p className="text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
            No hidden companies yet.
          </p>
        ) : list.map((c) => (
          <span key={c} className="inline-flex items-center gap-2 rounded-[4px] bg-[color:var(--color-danger-subtle)] px-2.5 py-1 text-[13px] text-[color:var(--color-foreground)]">
            {c}
            <IconTooltip label={`Show jobs from ${c} again`}>
              <button
                type="button"
                aria-label={`Show jobs from ${c} again`}
                onClick={() => { unblockCompany(c); onFlash(`${c} is visible again.`); }}
                className="flex h-4 w-4 items-center justify-center rounded-[3px] text-[color:var(--color-text-muted)] hover:bg-[rgba(0,0,0,0.08)]"
              >
                <IconX size={12} strokeWidth={1.8} />
              </button>
            </IconTooltip>
          </span>
        ))}
      </div>
    </Card>
  );
}

function RadioRow({ checked, onChange, label, caption, disabled }: {
  checked: boolean; onChange: () => void; label: React.ReactNode; caption?: string; disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 rounded-[6px] border px-3 py-2 text-[14px] ${checked ? "border-[color:var(--color-accent)] bg-[color:var(--color-mint)]/40" : ""} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
      <input
        type="radio"
        className="mt-1 h-4 w-4 accent-[color:var(--color-accent)]"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="min-w-0">
        <span className="block text-[color:var(--color-foreground)]">{label}</span>
        {caption ? <span className="mt-0.5 block text-[12px] text-[color:var(--color-text-muted)]">{caption}</span> : null}
      </span>
    </label>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
      style={{ background: on ? "#0E735A" : "#E3E7E8" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: `translateX(${on ? 18 : 2}px)` }}
      />
    </button>
  );
}

function SecurityCard({ onFlash }: { onFlash: (m: string) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [gConfirm, setGConfirm] = useState(false);
  // null = still reading the account's sign-in methods.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleIdentity, setGoogleIdentity] = useState<{ identity_id?: string } | null>(null);
  const [settingPw, setSettingPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  const loadIdentities = async () => {
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error) {
      setIdentityError("We couldn't read your sign-in methods. Reload the page to try again.");
      return;
    }
    const ids = data?.identities ?? [];
    setHasPassword(ids.some((i) => i.provider === "email"));
    const g = ids.find((i) => i.provider === "google");
    setGoogleIdentity((g as { identity_id?: string } | undefined) ?? null);
    setGoogleEmail(
      g ? ((g.identity_data?.["email"] as string | undefined) ?? user?.email ?? null) : null
    );
  };

  useEffect(() => {
    void loadIdentities();
  }, []);

  const needsCurrent = hasPassword === true;
  const mismatch = confirm.length > 0 && confirm !== next;
  const valid = next.length >= 8 && next === confirm && (!needsCurrent || current.length > 0);
  const canDisconnectGoogle = hasPassword === true;

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setFormError(null);
    setBusy(true);
    try {
      if (needsCurrent) {
        const email = user?.email ?? "";
        const { error: reauth } = await supabase.auth.signInWithPassword({
          email,
          password: current,
        });
        if (reauth) {
          setFormError("That current password doesn't match. Try again.");
          return;
        }
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        setFormError(error.message);
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setSettingPw(false);
      await loadIdentities();
      onFlash(needsCurrent ? "Password updated." : "Password set. You can now sign in with your email too.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Security and sign in">
      {hasPassword === null ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <div className="h-4 w-[130px] animate-pulse rounded-[4px] bg-[color:var(--color-surface-2)]" />
          <div className="h-10 w-full animate-pulse rounded-[4px] bg-[color:var(--color-surface-2)]" />
          <div className="h-10 w-[160px] animate-pulse rounded-[4px] bg-[color:var(--color-surface-2)]" />
        </div>
      ) : hasPassword === false && !settingPw ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            You sign in with Google. You don&apos;t have a password yet — you can add one as a second
            way in, and Google will keep working.
          </p>
          <button
            type="button"
            onClick={() => setSettingPw(true)}
            className="inline-flex h-10 items-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
          >
            Set a password
          </button>
        </div>
      ) : (
        <form onSubmit={submitPassword} className="flex flex-col gap-3">
          {needsCurrent ? (
            <PasswordField label="Current password" value={current} onChange={setCurrent} show={showCur} onToggle={() => setShowCur((v) => !v)} />
          ) : (
            <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              Choose a password for {user?.email ?? "your email"}. Google sign-in keeps working.
            </p>
          )}
          <PasswordField label="New password" value={next} onChange={setNext} show={showNew} onToggle={() => setShowNew((v) => !v)} hint="At least 8 characters" />
          <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} show={showNew} onToggle={() => setShowNew((v) => !v)} error={mismatch ? "Passwords don't match" : undefined} />
          {formError ? <span className="text-[12px] text-[color:var(--color-danger)]">{formError}</span> : null}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!valid || busy}
              className="inline-flex h-10 items-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
            >
              {busy ? "Saving…" : needsCurrent ? "Update password" : "Save password"}
            </button>
            {!needsCurrent ? (
              <button
                type="button"
                onClick={() => {
                  setSettingPw(false);
                  setNext("");
                  setConfirm("");
                  setFormError(null);
                }}
                className="inline-flex h-10 items-center rounded-[4px] px-3 button-small text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      )}

      <div className="mt-6 border-t pt-4">
        <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Connected accounts</div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border bg-white" aria-hidden>
            <GoogleMark size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] text-[color:var(--color-foreground)]">Google</div>
            {hasPassword === null ? (
              <div className="mt-1 h-3 w-[160px] animate-pulse rounded-[4px] bg-[color:var(--color-surface-2)]" aria-hidden />
            ) : (
              <div className="truncate text-[12px] text-[color:var(--color-text-muted)]">
                {googleIdentity ? `Connected as ${googleEmail ?? "your Google account"}` : "Not connected"}
              </div>
            )}
          </div>
          <div className="flex shrink-0 justify-end">
            {hasPassword === null || !googleIdentity || !canDisconnectGoogle ? null : (
              <button
                type="button"
                disabled={identityBusy}
                onClick={() => {
                  setIdentityError(null);
                  setGConfirm(true);
                }}
                className="text-[13px] text-[color:var(--color-text-muted)] hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
              >
                {identityBusy ? "Removing…" : "Remove sign-in"}
              </button>
            )}
          </div>
        </div>
        {hasPassword === false && googleIdentity ? (
          <p className="mt-2 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
            Google is your only way to sign in. Set a password first, then you can remove it.{" "}
            <button
              type="button"
              onClick={() => setSettingPw(true)}
              className="underline hover:text-[color:var(--color-foreground)]"
            >
              Set a password
            </button>
          </p>
        ) : null}
        {identityError ? (
          <p className="mt-2 text-[12px] text-[color:var(--color-danger)]">{identityError}</p>
        ) : null}
      </div>

      <div className="mt-6 border-t pt-4">
        <button
          type="button"
          onClick={async () => {
            clearUserStateForSignOut();
            await supabase.auth.signOut();
            navigate({ to: "/login" });
          }}
          className="text-[13px] text-[color:var(--color-text-secondary)] hover:underline"
        >
          Log out{user?.email ? ` — ${user.email}` : ""}
        </button>
      </div>

      {gConfirm ? (
        <Modal onClose={() => setGConfirm(false)} title="Remove Google sign-in?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            This removes Google as a way to sign in to Jobly. You&apos;ll sign in with{" "}
            {user?.email ?? "your email"} and your password instead. Nothing changes in your Google account.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={identityBusy}
              onClick={async () => {
                if (identityBusy) return;
                setIdentityBusy(true);
                setIdentityError(null);
                try {
                  // Re-check against the server right before acting: never unlink
                  // the last usable way in.
                  const { data: fresh, error: readErr } = await supabase.auth.getUserIdentities();
                  if (readErr) {
                    setIdentityError("We couldn't check your sign-in methods. Nothing was changed.");
                    return;
                  }
                  const ids = fresh?.identities ?? [];
                  const google = ids.find((i) => i.provider === "google");
                  const hasOtherCredential = ids.some((i) => i.provider === "email");
                  if (!google || ids.length < 2 || !hasOtherCredential) {
                    setGConfirm(false);
                    await loadIdentities();
                    setIdentityError(
                      "Google is your only way to sign in. Set a password first, then you can remove it."
                    );
                    void logSecurityEvent({
                      data: { event: "identity_unlink_refused", reason: "no_other_credential" },
                    }).catch(() => {});
                    return;
                  }
                  const { error } = await supabase.auth.unlinkIdentity(google as never);
                  if (error) {
                    setGConfirm(false);
                    setIdentityError(`We couldn't remove Google sign-in. ${error.message}`);
                    void logSecurityEvent({
                      data: { event: "identity_unlink_refused", reason: error.message },
                    }).catch(() => {});
                    return;
                  }
                  setGConfirm(false);
                  await loadIdentities();
                  void logSecurityEvent({ data: { event: "identity_unlinked" } }).catch(() => {});
                  onFlash("Google sign-in removed.");
                } finally {
                  setIdentityBusy(false);
                }
              }}
              className="h-11 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
              style={{ borderColor: "#D00D01" }}
            >
              {identityBusy ? "Removing…" : "Remove Google sign-in"}
            </button>
            <button
              type="button"
              disabled={identityBusy}
              onClick={() => setGConfirm(false)}
              className="h-11 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
            >
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, hint, error }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; hint?: string; error?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[12px] text-[color:var(--color-text-muted)]">
      <span>{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 pr-10 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)] ${error ? "border-[color:var(--color-danger)]" : ""}`}
        />
        <IconTooltip label={show ? "Hide password" : "Show password"}>
          <button
            type="button"
            onClick={onToggle}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
          >
            {show ? <IconEyeOff size={15} strokeWidth={1.6} /> : <IconEye size={15} strokeWidth={1.6} />}
          </button>
        </IconTooltip>
      </div>
      {error ? <span className="text-[12px] text-[color:var(--color-danger)]">{error}</span> : hint ? <span>{hint}</span> : null}
    </label>
  );
}

function DangerZoneCard({ onFlash }: { onFlash: (m: string) => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [reauthOk, setReauthOk] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const scheduledFor = formatDeletionDate(deletionDateFrom(new Date()));

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setEmail(user?.email ?? null);
      const providers = (user?.identities ?? []).map((i) => i.provider);
      setHasPassword(providers.includes("email"));
    });
  }, []);

  // Returning from the Google re-authentication round trip.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("reauth") !== "google") return;
    params.delete("reauth");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    setReauthOk(true);
    setConfirmOpen(true);
  }, []);

  async function verifyPassword() {
    if (!email) return;
    setBusy(true);
    setReauthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setReauthError("That password doesn't match. Try again.");
      return;
    }
    setPassword("");
    setReauthOk(true);
  }

  async function reauthWithGoogle() {
    setReauthError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/settings?reauth=google`,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setReauthError("Google confirmation failed. Try again.");
      return;
    }
    if (result.redirected) return;
    setReauthOk(true);
  }

  async function confirmDeletion() {
    const now = new Date();
    setBusy(true);
    try {
      await requestAccountDeletionServer(now);
    } catch {
      setBusy(false);
      setReauthError("We couldn't schedule the deletion. Try again.");
      return;
    }
    setBusy(false);
    const date = formatDeletionDate(deletionDateFrom(now));
    setConfirmOpen(false);
    toast.success(DELETION_COPY.scheduledToast(date), {
      action: {
        label: "Undo",
        onClick: () => {
          void restoreAccountServer().then(() => toast.success(DELETION_COPY.restoredToast));
        },
      },
    });
    // Logged out immediately — server data stays intact for the grace window,
    // but nothing about this account may linger in the browser.
    clearUserStateForSignOut();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const canDelete = confirmText === "DELETE" && reauthOk && !busy;

  return (
    <>
      <Card title="Danger zone">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Delete account</div>
            <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              {DELETION_COPY.dangerCaption}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmOpen(true);
              setConfirmText("");
              setPassword("");
              setReauthOk(false);
              setReauthError(null);
            }}
            className="inline-flex h-10 items-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
            style={{ borderColor: "#D00D01" }}
          >
            Delete account
          </button>
        </div>

      </Card>

      {confirmOpen ? (
        <Modal onClose={() => setConfirmOpen(false)} title="Delete your account?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {DELETION_COPY.confirmBody(scheduledFor)} Type <b>DELETE</b> to confirm.
          </p>
          <input
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            className="mt-4 h-10 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
          />
          {reauthOk ? (
            <p className="mt-4 flex items-center gap-1.5 text-[13px] text-[color:var(--color-green)]" style={{ fontWeight: 300 }}>
              <IconCheck size={15} strokeWidth={1.8} /> Identity confirmed
            </p>
          ) : hasPassword === null ? null : hasPassword ? (
            <div className="mt-4">
              <label className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
                Confirm your password
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label="Confirm your password"
                  autoComplete="current-password"
                  className="h-10 min-w-0 flex-1 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
                />
                <button
                  type="button"
                  disabled={!password || busy}
                  onClick={() => { void verifyPassword(); }}
                  className="h-10 shrink-0 rounded-[4px] border px-3 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
                Your account uses Google sign-in. Confirm it's you before we schedule the deletion.
              </p>
              <button
                type="button"
                onClick={() => { void reauthWithGoogle(); }}
                className="mt-2 h-10 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                Confirm with Google
              </button>
            </div>
          )}
          {reauthError ? (
            <p className="mt-2 text-[12px] text-[color:var(--color-danger)]">{reauthError}</p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={!canDelete}
              onClick={() => { void confirmDeletion(); }}
              className="h-11 w-full rounded-[4px] px-4 button-small text-white"
              style={{ background: canDelete ? "#D00D01" : "var(--color-surface-2)", color: canDelete ? "#fff" : "var(--color-alt-light-mist)", cursor: canDelete ? "pointer" : "not-allowed" }}
            >
              Delete account
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="h-11 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
            >
              Keep my account
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={onClose} aria-hidden />
      <div
        className="relative z-10 w-full max-w-[440px] rounded-[8px] border bg-[color:var(--color-surface-1)] p-6"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
      >
        <div className="flex items-start justify-between gap-4 pr-10">
          <h2 className="text-[18px] font-semibold text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
          >
            <IconX size={16} strokeWidth={1.6} />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

// Suppress unused imports if any.
void IconCheck;
void IconLock;
void useMemo;