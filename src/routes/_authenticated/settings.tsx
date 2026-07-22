import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconEye, IconEyeOff, IconLock, IconX } from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePlan, setPlan, type Plan } from "@/lib/plan-store";

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
      <main className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <h1 className="text-[24px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
          Settings
        </h1>
        {flash ? (
          <div className="mt-4 rounded-[6px] bg-[color:var(--color-mint)] px-4 py-3 text-[13px] text-[color:var(--color-green)]">
            {flash}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <PlanCard plan={plan} onFlash={flashMsg} />
          <BillingCard plan={plan} />
          <NotificationsCard plan={plan} />
          <SecurityCard onFlash={flashMsg} />
          <DangerZoneCard onFlash={flashMsg} />
        </div>
      </main>
      <MobileTabBar active="settings" />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
      <h2 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-4 py-3 button-small text-[color:var(--color-text-secondary)]">
        Free
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-4 py-3 button-small text-[color:var(--color-green)]">
      {plan === "paused" ? "Paused" : "Pro"}
    </span>
  );
}

function PlanCard({ plan, onFlash }: { plan: Plan; onFlash: (m: string) => void }) {
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2>(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const summary =
    plan === "pro"
      ? "Daily digest · match scores · application tracker · renews Aug 20, 2026"
      : plan === "paused"
      ? "Paused for 6 months — digests off, Pro data preserved"
      : "Weekly digest · top 5 matches";

  return (
    <Card title="Plan">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PlanBadge plan={plan} />
          </div>
          <p className="mt-2 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {summary}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-stretch gap-2">
          {plan === "free" ? (
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="inline-flex h-10 items-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Upgrade to Pro — $9.99/mo
            </button>
          ) : (
            <>
              {plan === "paused" ? (
                <button
                  type="button"
                  onClick={() => {
                    setPlan("pro");
                    onFlash("Pro resumed.");
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
                >
                  Unpause
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setCancelStep(plan === "paused" ? 2 : 1)}
                className="inline-flex h-10 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              >
                Cancel subscription
              </button>
            </>
          )}
        </div>
      </div>
      {plan === "free" ? (
        <p className="mt-1 text-[11px] text-[color:var(--color-text-muted)]">3-day free trial</p>
      ) : null}
      <p className="mt-4 text-[11px] text-[color:var(--color-text-muted)]">
        Payments aren't live in this preview — plan changes are simulated.
      </p>

      {cancelStep === 1 ? (
        <Modal onClose={() => setCancelStep(0)} title="Found a job?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            If you did, pause Pro instead. We'll turn off digests for 6 months and keep your data — no emails while paused.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setPlan("paused");
                setCancelStep(0);
                onFlash("Pro paused for 6 months.");
              }}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Yes — pause instead
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

      {cancelStep === 2 ? (
        <Modal onClose={() => setCancelStep(0)} title="Downgrade to Free?">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            You'll lose match scores, the daily digest, and the tracker at the end of the period.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setPlan("free");
                setCancelStep(0);
                onFlash("Downgraded to Free.");
              }}
              className="h-11 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 button-small text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
              style={{ borderColor: "#D00D01" }}
            >
              Downgrade to Free
            </button>
            <button
              type="button"
              onClick={() => setCancelStep(0)}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Keep Pro
            </button>
          </div>
        </Modal>
      ) : null}

      {upgradeOpen ? (
        <Modal onClose={() => setUpgradeOpen(false)} title="Start your 3-day Pro trial">
          <p className="text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            No card needed in this preview — you can cancel any time.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setPlan("pro");
                setUpgradeOpen(false);
                onFlash("Welcome to Pro.");
              }}
              className="h-11 w-full rounded-[4px] bg-[color:var(--color-accent)] px-4 button-small text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Start free trial
            </button>
            <button
              type="button"
              onClick={() => setUpgradeOpen(false)}
              className="h-11 w-full rounded-[4px] border px-4 button-small text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
            >
              Not now
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
      <Card title="Billing & payment">
        <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          No billing yet. Upgrade to Pro to see invoices here.
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
    <Card title="Billing & payment">
      <div className="flex items-center justify-between rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-12 items-center justify-center rounded-[4px] bg-[color:var(--color-surface-2)] text-[11px] font-semibold text-[color:var(--color-text-muted)]">
            CARD
          </div>
          <div className="text-[13px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300 }}>
            •••• 4242 · expires 08/27
          </div>
        </div>
        <div className="flex items-center gap-2">
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
              <span className="text-[color:var(--color-text-muted)]">Receipt</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NotificationsCard({ plan }: { plan: Plan }) {
  const pro = plan !== "free";
  const [freq, setFreq] = useState<"daily" | "weekdays" | "weekly">(pro ? "daily" : "weekly");
  useEffect(() => {
    if (!pro && freq !== "weekly") setFreq("weekly");
  }, [pro, freq]);
  const [toggles, setToggles] = useState({
    digest: true,
    interview: true,
    followup: true,
    product: false,
  });
  const rows: { key: keyof typeof toggles; label: string; caption: string }[] = [
    { key: "digest", label: "New digest is ready", caption: "Email you when a fresh batch of matches is out." },
    { key: "interview", label: "Interview reminders", caption: "The day of and an hour before." },
    { key: "followup", label: "Follow-up nudges", caption: "Gentle nudge if applications go quiet." },
    { key: "product", label: "Product updates", caption: "Occasional updates on new Jobly features." },
  ];
  return (
    <Card title="Notifications">
      <div>
        <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Digest frequency</div>
        <div className="mt-2">
          <select
            value={freq}
            onChange={(e) => setFreq(e.target.value as "daily" | "weekdays" | "weekly")}
            className="w-full max-w-xs rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 py-2 text-[14px] text-[color:var(--color-foreground)]"
          >
            <option value="daily" disabled={!pro}>Daily{!pro ? " (Pro)" : ""}</option>
            <option value="weekdays" disabled={!pro}>Weekdays only{!pro ? " (Pro)" : ""}</option>
            <option value="weekly">Weekly</option>
          </select>
          {!pro ? (
            <div className="mt-2 text-[12px] text-[color:var(--color-text-muted)]">Daily and Weekdays only are Pro features.</div>
          ) : null}
        </div>
      </div>
      <div className="mt-5 divide-y">
        {rows.map((r) => (
          <div key={r.key} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className="text-[14px] text-[color:var(--color-foreground)]" style={{ fontWeight: 400 }}>{r.label}</div>
              <div className="text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>{r.caption}</div>
            </div>
            <Toggle
              on={toggles[r.key]}
              onChange={(v) => setToggles((t) => ({ ...t, [r.key]: v }))}
              label={r.label}
            />
          </div>
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-[4px] transition-colors ${
        on ? "bg-[color:var(--color-green)]" : "bg-[color:var(--color-surface-2)]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-[3px] bg-white shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-[2px]"}`}
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
    <Card title="Security & sign-in">
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
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border bg-white text-[13px] font-bold" aria-hidden>
              G
            </div>
            <div>
              <div className="text-[14px] text-[color:var(--color-foreground)]">Google</div>
              <div className="text-[12px] text-[color:var(--color-text-muted)]">
                {googleConnected ? "Connected as serjkrush@gmail.com" : "Not connected"}
              </div>
            </div>
          </div>
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
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          {show ? <IconEyeOff size={15} strokeWidth={1.6} /> : <IconEye size={15} strokeWidth={1.6} />}
        </button>
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