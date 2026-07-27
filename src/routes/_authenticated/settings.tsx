import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconEye, IconEyeOff, IconInfoCircle, IconLock, IconX } from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { IconTooltip } from "@/components/app/IconTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePlan, setPlan, type Plan } from "@/lib/plan-store";
import { blockCompany, unblockCompany, useBlockedCompanies } from "@/lib/blocked-companies-store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Jobly" },
      { name: "robots", content: "noindex" },
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
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-6">
        <h1 className="text-[24px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Plan, billing, notifications, blocked companies, security and account.
        </p>
        {flash ? (
          <div className="mt-4 rounded-[6px] bg-[color:var(--color-mint)] px-4 py-3 text-[13px] text-[color:var(--color-green)]">
            {flash}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-3">
            <PlanCard plan={plan} onFlash={flashMsg} />
            <NotificationsCard plan={plan} />
            <BlockedCompaniesCard onFlash={flashMsg} />
          </div>
          <aside className="flex flex-col gap-3">
            <BillingCard plan={plan} />
            <SecurityCard onFlash={flashMsg} />
            <DangerZoneCard onFlash={flashMsg} />
          </aside>
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
        <h2 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">{title}</h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-3 py-2 button-large text-[color:var(--color-text-secondary)]">
        Free
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-3 py-2 button-large text-[color:var(--color-green)]">
      {plan === "paused" ? "Paused" : "Pro"}
    </span>
  );
}

function PlanCard({ plan, onFlash }: { plan: Plan; onFlash: (m: string) => void }) {
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2>(0);
  const [period, setPeriod] = useState<"monthly" | "6mo" | "annual">("annual");
  const [switchOpen, setSwitchOpen] = useState<null | "monthly" | "6mo" | "annual">(null);

  const proSummary = "Daily digest · match scores · application tracker";
  const proBilling = "Billed annually · $71.88/yr · renews Aug 20, 2026 · started with a 14-day free trial";
  const pausedLine = "Paused until Jan 20, 2027 · no charges while paused";
  const freeSummary = "Weekly digest · match scores · basic tracker";

  const priceRows: Record<"monthly" | "6mo" | "annual", { price: string; billed: string; save?: string }> = {
    monthly: { price: "$9.99", billed: "Billed monthly" },
    "6mo": { price: "$7.99", billed: "Billed $47.94 every 6 months", save: "Save 20%" },
    annual: { price: "$5.99", billed: "Billed $71.88 per year", save: "Save 40%" },
  };

  return (
    <Card
      title="Plan"
      actions={plan === "pro" ? (
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
              {plan === "pro" ? proBilling : plan === "paused" ? pausedLine : "Free plan — no billing"}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-stretch gap-2">
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

      {/* Two plan cards */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* Free card */}
        <div className="rounded-[12px] bg-[#F1F3F3] p-1">
        <div className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-4" style={{ boxShadow: "0px 1px 4px 0px rgba(12,12,13,0.05)" }}>
          <div className="flex items-baseline justify-between">
            <div className="text-[15px] font-semibold text-[color:var(--color-foreground)]">Free</div>
            <div className="text-[22px] font-semibold text-[color:var(--color-foreground)]">$0</div>
          </div>
          <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            The essentials to job-hunt cleanly.
          </p>
          <ul className="mt-3 space-y-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300, lineHeight: 1.9 }}>
            <li>Weekly job digest</li>
            <li>Match score on every job</li>
            <li>Basic tracker (Saved · Applied · Interview)</li>
            <li>1 resume, 1 cover-letter template</li>
            <li>Report ghost / scam jobs</li>
          </ul>
          <div className="mt-4">
            {plan === "free" ? (
              <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-3 py-2 text-[12px] font-semibold text-[color:var(--color-text-secondary)]">
                Current plan
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setCancelStep(plan === "paused" ? 2 : 1)}
                className="inline-flex h-10 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                Downgrade to Free
              </button>
            )}
          </div>
        </div>
        </div>

        {/* Pro card */}
        <div className="rounded-[12px] bg-[#F1F3F3] p-1">
        <div
          className={`relative rounded-[8px] bg-[color:var(--color-surface-1)] p-4 ${plan === "pro" || plan === "paused" ? "border-2" : "border"}`}
          style={{ borderColor: "var(--color-green)", boxShadow: "0px 1px 4px 0px rgba(12,12,13,0.05)" }}
        >
          {(plan === "pro" || plan === "paused") ? (
            <span
              className="absolute -top-2 right-3 inline-flex items-center rounded-[4px] bg-[color:var(--color-accent)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-on-accent)]"
            >
              Current plan
            </span>
          ) : null}
          <div className="flex items-baseline justify-between">
            <div className="text-[15px] font-semibold" style={{ color: "var(--color-green)" }}>Pro</div>
          </div>

          {/* Billing period switcher */}
          <div className="mt-3 inline-flex items-center gap-1 rounded-[4px] bg-[color:var(--color-surface-2)] p-1">
            {(["monthly", "6mo", "annual"] as const).map((p) => {
              const active = period === p;
              const label = p === "monthly" ? "Monthly" : p === "6mo" ? "6 months" : "Annual";
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    if (plan === "pro" && p !== period) { setSwitchOpen(p); return; }
                    setPeriod(p);
                  }}
                  className={`relative rounded-[4px] px-3 py-1 text-[12px] ${active ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] font-semibold" : "text-[color:var(--color-text-secondary)]"}`}
                >
                  {label}
                  {p === "annual" && !active ? (
                    <span className="ml-1 rounded-[3px] bg-[color:var(--color-mint)] px-1 py-[1px] text-[9px] font-semibold text-[color:var(--color-green)]">
                      Best value
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[22px] font-semibold text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-sans)" }}>
              {priceRows[period].price}
            </span>
            <span className="text-[13px] text-[color:var(--color-text-muted)]">/mo</span>
            {priceRows[period].save ? (
              <span className="ml-1 rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-green)]">
                {priceRows[period].save}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
            {priceRows[period].billed}
          </p>

          <p className="mt-3 text-[13px] font-semibold text-[color:var(--color-foreground)]">Everything in Free, plus:</p>
          <ul className="mt-1 space-y-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300, lineHeight: 1.9 }}>
            <li>Daily digest + instant high-match alerts</li>
            <li>Full "why this match" + "raise your %"</li>
            <li>Customizable tracker pipeline (unlimited stages)</li>
            <li>Up to 5 cover-letter templates (rich text)</li>
            <li>Screening answers + 1-click apply extension</li>
            <li>CV, portfolio & achievements PDF</li>
            <li>Gmail auto-status, follow-ups, interview prep</li>
            <li>Source filters + blocked companies</li>
            <li>Priority support</li>
          </ul>

          <div className="mt-4">
            {plan === "free" ? (
              <>
                <button
                  type="button"
                  onClick={() => { setPlan("pro"); onFlash("Welcome to Pro — your 14-day trial has started."); }}
                  className="inline-flex h-10 w-full items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
                >
                  Start 14-day free trial
                </button>
                <p className="mt-1 text-[11px] text-[color:var(--color-text-muted)]">Cancel anytime before it ends — no charge.</p>
              </>
            ) : null}
          </div>
        </div>
        </div>
      </div>

      {/* Coming soon + info box */}
      <p className="mt-4 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
        <span className="font-semibold">Coming soon (Pro):</span> tailor resume to a job · ATS check · AI cover letter per job.
      </p>
      <div className="mt-3 flex items-start gap-2 rounded-[6px] bg-[color:var(--color-surface-2)] px-3 py-2 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        <IconInfoCircle size={14} strokeWidth={1.6} className="mt-0.5 shrink-0" />
        <span>
          You see the monthly price, but pay for the period up front. <span className="font-semibold">Cancel or pause anytime</span> — found a job? Pause billing for 6 months. We email a reminder 7 days before any renewal.
        </span>
      </div>
      <p className="mt-3 text-[11px] text-[color:var(--color-text-muted)]">
        Payments aren't live in this preview — plan changes are simulated.
      </p>

      {/* Cancel Step 1 (only from active Pro) */}
      {cancelStep === 1 ? (
        <Modal onClose={() => setCancelStep(0)} title="Found a job?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            Congrats! Pause Pro for 6 months instead — no emails, no charges, everything saved exactly as you left it.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setPlan("paused"); setCancelStep(0); onFlash("Pro paused for 6 months."); }}
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
        <Modal onClose={() => setCancelStep(0)} title="Are you sure?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            Your pause will end and you'll move to Free immediately. Your tracker and profile are kept.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setPlan("paused"); setCancelStep(0); }}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Keep my pause
            </button>
            <button
              type="button"
              onClick={() => { setPlan("free"); setCancelStep(0); onFlash("Subscription canceled — moved to Free."); }}
              className="h-11 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
              style={{ borderColor: "#D00D01" }}
            >
              Cancel subscription
            </button>
          </div>
        </Modal>
      ) : null}

      {cancelStep === 2 && plan !== "paused" ? (
        <Modal onClose={() => setCancelStep(0)} title="Cancel your Pro subscription?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            You'll keep Pro until <b>Aug 20, 2026</b>, then move to Free. No more charges. You can resume anytime.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setCancelStep(0)}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Keep Pro
            </button>
            <button
              type="button"
              onClick={() => { setPlan("free"); setCancelStep(0); onFlash("Pro canceled — access until Aug 20."); }}
              className="h-11 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
              style={{ borderColor: "#D00D01" }}
            >
              Cancel subscription
            </button>
          </div>
        </Modal>
      ) : null}

      {/* Period-switch confirm */}
      {switchOpen ? (
        <Modal onClose={() => setSwitchOpen(null)} title="Switch billing period?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            Switch to {switchOpen === "monthly" ? "monthly" : switchOpen === "6mo" ? "6-month" : "annual"} billing at the next renewal?
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setPeriod(switchOpen); onFlash("Billing period updated."); setSwitchOpen(null); }}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setSwitchOpen(null)}
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
  const [freq, setFreq] = useState<"daily" | "weekly">(pro ? "daily" : "weekly");
  useEffect(() => { if (!pro && freq !== "weekly") setFreq("weekly"); }, [pro, freq]);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    digest_ready: true,
    hi_alerts: true,
    weekly_report: true,
    tuned: true,
    interview: true,
    followup: true,
    stale: true,
    gmail: true,
    product: false,
    reengage: true,
  });
  const groups: { label: string; rows: { key: string; label: string; caption?: string }[] }[] = [
    {
      label: "Digest & matches",
      rows: [
        { key: "digest_ready", label: "New digest is ready", caption: "Your recurring batch of clean matches." },
        { key: "hi_alerts", label: "Instant high-match alerts", caption: "A one-off email when a top match posts between digests." },
        { key: "weekly_report", label: "Weekly search report", caption: "Your week in numbers — matches, applied, replies." },
        { key: "tuned", label: `"We tuned your digest"`, caption: "When your feedback changes what you see." },
      ],
    },
    {
      label: "Applications & tracker",
      rows: [
        { key: "interview", label: "Interview reminders & prep", caption: "The day before, plus your prep pack." },
        { key: "followup", label: "Follow-up nudges", caption: "A gentle nudge if an application goes quiet." },
        { key: "stale", label: "Stale-application nudges", caption: "When something's sat untouched for weeks." },
        { key: "gmail", label: "Status detected from Gmail", caption: "Ask to update your tracker when a reply arrives." },
      ],
    },
    {
      label: "Account & lifecycle",
      rows: [
        { key: "product", label: "Product updates & tips" },
        { key: "reengage", label: "Re-engagement when you're away", caption: "A reminder if matches pile up unread." },
      ],
    },
  ];

  return (
    <Card title="Notifications">
      <p className="-mt-2 mb-4 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        Choose what lands in your inbox. We only email what's useful — no spam.
      </p>
      <div>
        <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Digest frequency</div>
        <div className="mt-2 flex flex-col gap-2">
          <RadioRow
            checked={freq === "daily"}
            disabled={!pro}
            onChange={() => pro && setFreq("daily")}
            label={<span className="flex items-center gap-2">Daily{!pro ? <span className="rounded-[4px] bg-[color:var(--color-mint)] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-green)]">Pro</span> : null}</span>}
          />
          <RadioRow
            checked={freq === "weekly"}
            onChange={() => setFreq("weekly")}
            label="Weekly"
          />
        </div>
        <p className="mt-2 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
          Quiet hours 9pm–7am · pause anytime under "Found a job?"
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
                <div key={r.key} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[14px] text-[color:var(--color-foreground)]" style={{ fontWeight: 600 }}>{r.label}</div>
                    {r.caption ? (
                      <div className="text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>{r.caption}</div>
                    ) : null}
                  </div>
                  <Toggle
                    on={!!toggles[r.key]}
                    onChange={(v) => setToggles((t) => ({ ...t, [r.key]: v }))}
                    label={typeof r.label === "string" ? r.label : r.key}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[6px] bg-[color:var(--color-surface-2)] px-3 py-2 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        <span className="font-semibold">Always on:</span> account & security (verify, sign-in, password), billing & receipts (trial, renewal, cancellation, failed payment), and data & legal (export, deletion). These are required and only sent when necessary.
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
      onFlash(`${v} is already blocked.`);
      setValue("");
      return;
    }
    blockCompany(v);
    onFlash(`Blocked ${v}.`);
    setValue("");
  }
  return (
    <Card title="Blocked companies">
      <p className="-mt-2 mb-4 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        Never show jobs from these employers — current employer, past ones, agencies you'd rather skip.
      </p>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder="Company name (e.g. Acme Corp)"
          className="h-10 flex-1 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
        />
        <button
          type="button"
          onClick={submit}
          className="inline-flex h-10 items-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        >
          Block company
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {list.length === 0 ? (
          <p className="text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
            No blocked companies yet.
          </p>
        ) : list.map((c) => (
          <span key={c} className="inline-flex items-center gap-2 rounded-[4px] bg-[color:var(--color-danger-subtle)] px-2.5 py-1 text-[13px] text-[color:var(--color-foreground)]">
            {c}
            <IconTooltip label={`Unblock ${c}`}>
              <button
                type="button"
                aria-label={`Unblock ${c}`}
                onClick={() => { unblockCompany(c); onFlash(`Unblocked ${c}.`); }}
                className="flex h-4 w-4 items-center justify-center rounded-[3px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
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
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(true);
  const [gConfirm, setGConfirm] = useState(false);

  const valid = next.length >= 8 && next === confirm && current.length > 0;
  const mismatch = confirm.length > 0 && confirm !== next;

  return (
    <Card title="Security and sign in">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          setCurrent("");
          setNext("");
          setConfirm("");
          onFlash("Password updated.");
        }}
        className="flex flex-col gap-3"
      >
        <PasswordField label="Current password" value={current} onChange={setCurrent} show={showCur} onToggle={() => setShowCur((v) => !v)} />
        <PasswordField label="New password" value={next} onChange={setNext} show={showNew} onToggle={() => setShowNew((v) => !v)} hint="At least 8 characters" />
        <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} show={showNew} onToggle={() => setShowNew((v) => !v)} error={mismatch ? "Passwords don't match" : undefined} />
        <div>
          <button
            type="submit"
            disabled={!valid}
            className="inline-flex h-10 items-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Update password
          </button>
        </div>
      </form>

      <div className="mt-6 border-t pt-4">
        <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Connected accounts</div>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border bg-white text-[13px] font-bold" aria-hidden>
            G
          </div>
          <div>
            <div className="text-[14px] text-[color:var(--color-foreground)]">Google</div>
            <div className="text-[12px] text-[color:var(--color-text-muted)]">
              {googleConnected ? "Connected as serjkrush@gmail.com" : "Not connected"}
            </div>
          </div>
          <div className="flex justify-start">
            {googleConnected ? (
              <button
                type="button"
                onClick={() => setGConfirm(true)}
                className="text-[13px] text-[color:var(--color-text-muted)] hover:underline"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setGoogleConnected(true); onFlash("Google connected."); }}
                className="inline-flex h-9 items-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {gConfirm ? (
        <Modal onClose={() => setGConfirm(false)} title="Disconnect Google?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            You'll sign in with your email and password instead.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setGoogleConnected(false); setGConfirm(false); onFlash("Google disconnected."); }}
              className="h-11 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
              style={{ borderColor: "#D00D01" }}
            >
              Disconnect
            </button>
            <button
              type="button"
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleted, setDeleted] = useState(false);

  const email = user?.email ?? "";

  if (deleted) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-[color:var(--color-background)] p-6 text-center">
        <h2 className="text-[24px]" style={{ fontFamily: "var(--font-display)" }}>Account deleted</h2>
        <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Your profile, resume, and tracker data have been removed from this preview.
        </p>
        <a href="/" className="text-[14px] font-semibold text-[color:var(--color-green)] hover:underline">
          Back to home
        </a>
      </div>
    );
  }

  return (
    <>
      <Card title="Danger zone">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Delete account</div>
            <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              Permanently deletes your profile, resume, matches, and tracker. This can't be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setConfirmOpen(true); setConfirmText(""); }}
            className="inline-flex h-10 items-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
            style={{ borderColor: "#D00D01" }}
          >
            Delete account
          </button>
        </div>

        <div className="mt-6 border-t pt-4">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/login" });
            }}
            className="text-[13px] text-[color:var(--color-text-secondary)] hover:underline"
          >
            Log out{email ? ` — ${email}` : ""}
          </button>
        </div>
      </Card>

      {confirmOpen ? (
        <Modal onClose={() => setConfirmOpen(false)} title="Delete your account?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            This permanently removes your profile, resume, saved matches, and tracker history. This can't be undone. Type <b>DELETE</b> to confirm.
          </p>
          <input
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            className="mt-4 h-10 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
          />
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={confirmText !== "DELETE"}
              onClick={() => { setConfirmOpen(false); setDeleted(true); onFlash("Account deleted."); }}
              className="h-11 w-full rounded-[4px] px-4 button-small text-white"
              style={{ background: confirmText === "DELETE" ? "#D00D01" : "var(--color-surface-2)", color: confirmText === "DELETE" ? "#fff" : "var(--color-alt-light-mist)", cursor: confirmText === "DELETE" ? "pointer" : "not-allowed" }}
            >
              Delete my account
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="h-11 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
            >
              Cancel
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
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[18px] font-semibold text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
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