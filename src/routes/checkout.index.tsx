// Mock checkout. No payment provider is wired yet, so confirming writes the
// subscription row through the existing server action and hands off to
// /thank-you. Every price shown is derived from src/config/pricing.ts.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { Wordmark } from "@/components/site/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import {
  SHARED_PLAN_DISCLOSURE,
  SKUS,
  TRIAL_DAYS,
  discountPct,
  renewalPhrase,
  skuTotal,
  usd,
  type SkuId,
} from "@/config/pricing";
import { SKU_SWITCHER_LABEL } from "@/components/site/planSpecs";
import {
  applySubscriptionAction,
  getSubscriptionRow,
  type SubscriptionRow,
} from "@/lib/subscription.functions";
import { clearPlanIntent, readPlanIntent, type PlanIntent } from "@/lib/onboarding/planIntent";

export const Route = createFileRoute("/checkout/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Checkout — Jobly" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Confirm your Jobly plan." },
    ],
  }),
  component: CheckoutPage,
});

const PLAN_NAMES = {
  watch_monthly: "Jobly Watch — monthly",
  watch_annual: "Jobly Watch — yearly",
  pro_monthly: "Jobly Pro — monthly",
  pro_3month: "Jobly Pro — 3 months",
  pro_6month: "Jobly Pro — 6 months",
} as const;

const DAY = 86_400_000;

/**
 * What a SKU change costs this account, read from its own row. The server's
 * `activate` starts a fresh period and zeroes banked days on any SKU change,
 * so those facts are stated before the confirm button. Empty when nothing is
 * given up (a lapsed plan, or the same SKU).
 */
function switchLosses(row: SubscriptionRow, next: SkuId): string[] {
  const out: string[] = [];
  if (row.status === "trialing") {
    out.push(
      `Your ${TRIAL_DAYS}-day free trial ends today. ${usd(skuTotal(next))} is charged now.`,
    );
  }
  if (row.sku !== null && row.sku !== next) {
    const left = row.currentPeriodEnd
      ? Math.floor((new Date(row.currentPeriodEnd).getTime() - Date.now()) / DAY)
      : 0;
    // While trialing, currentPeriodEnd IS the trial end: the trial line above
    // already accounts for those days.
    if (left > 0 && row.status !== "trialing") {
      out.push(
        `You have ${left} day${left === 1 ? "" : "s"} left on ${SKU_SWITCHER_LABEL[row.sku]}. They do not carry over — the new plan starts a fresh period today.`,
      );
    }

    const bankedLive =
      !row.bankedDaysExpireAt || new Date(row.bankedDaysExpireAt).getTime() > Date.now();
    const banked = row.bankedDays > 0 && bankedLive ? row.bankedDays : 0;
    if (banked > 0) {
      out.push(
        `Your ${banked} banked day${banked === 1 ? "" : "s"} are cleared and are not added to the new plan.`,
      );
    }
  }
  return out;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [intent, setIntent] = useState<PlanIntent | null>(null);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Checkout never opens the registration modal itself; the plan surfaces do.
        void navigate({ to: "/signup" });
        return;
      }
      const saved = readPlanIntent();
      if (!saved) {
        void navigate({ to: "/" });
        return;
      }
      setIntent(saved);
      setReady(true);
    })();
  }, [navigate]);

  // Only a Settings -> Plan decision can change a live SKU, so only that path
  // reads the current row. A fresh purchase never fetches it and never shows a
  // notice.
  const managing = intent?.manage === true;
  const [current, setCurrent] = useState<SubscriptionRow | null>(null);
  // Fail closed: while managing, the confirm stays inert until this row is
  // known. An unresolved or failed read must never let a charge through
  // without the notice below.
  const [rowState, setRowState] = useState<"loading" | "ready" | "error">("loading");
  const [rowAttempt, setRowAttempt] = useState(0);
  useEffect(() => {
    if (!managing) return;
    let live = true;
    setRowState("loading");
    void getSubscriptionRow()
      .then((row) => {
        if (!live) return;
        setCurrent(row);
        setRowState("ready");
      })
      .catch(() => {
        if (!live) return;
        setCurrent(null);
        setRowState("error");
      });
    return () => {
      live = false;
    };
  }, [managing, rowAttempt]);



  async function pay() {
    if (!intent) return;
    setPaying(true);
    setError(null);
    try {
      await applySubscriptionAction({
        data: intent.trial
          ? { action: "start_trial", sku: intent.sku }
          : {
              action: "activate",
              sku: intent.sku,
              // Only a decision made in Settings -> Plan may change the SKU of a
              // live subscription; the server enforces the same rule.
              allowSkuChange: intent.manage === true,
            },
      });

      // The decision has been acted on: it must not outlive this checkout.
      clearPlanIntent();
      void navigate({ to: "/thank-you", search: { sku: intent.sku } });
    } catch {
      setError("We couldn't confirm that just now. Please try again.");
      setPaying(false);
    }
  }

  if (!ready || !intent) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-[color:var(--color-text-muted)]" />
      </main>
    );
  }

  const sku = SKUS[intent.sku];
  const isTrial = intent.trial;
  const discount = discountPct(sku.id);
  const losses =
    managing && rowState === "ready" && current ? switchLosses(current, sku.id) : [];
  // Managing: nothing is actionable until the row resolves.
  const rowBlocked = managing && rowState !== "ready";



  return (
    <div className="min-h-screen bg-[color:var(--color-surface-0)]">
      <header className="flex items-center px-6 py-6 lg:px-12">
        <Wordmark className="!text-[color:var(--color-foreground)]" />
      </header>
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-6 pb-20">
        <div className="flex flex-col gap-5 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6">
          <h1 className="text-[24px] font-light text-[color:var(--color-foreground)]">
            Confirm your plan
          </h1>
          <div className="flex flex-col gap-3 rounded-[12px] bg-[color:var(--color-surface-0)] p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] text-[color:var(--color-foreground)]">
                {isTrial ? `${PLAN_NAMES[sku.id]} — ${TRIAL_DAYS}-day free trial` : PLAN_NAMES[sku.id]}
              </span>
              <span className="text-[15px] font-light text-[color:var(--color-foreground)]">
                {isTrial ? usd(0) : usd(skuTotal(sku.id))}
              </span>
            </div>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              {isTrial
                ? `Free for ${TRIAL_DAYS} days, then ${renewalPhrase(sku.id)}. Cancel any time before it ends.`
                : discount > 0
                  ? `${renewalPhrase(sku.id)} — ${discount}% off the monthly rate.`
                  : `${renewalPhrase(sku.id)}.`}
            </p>
            <p className="text-xs text-[color:var(--color-text-muted)]">
              Auto-renews at {renewalPhrase(sku.id)} until cancelled.
            </p>
          </div>
          {losses.length > 0 ? (
            <div
              className="flex flex-col gap-2 rounded-[12px] border p-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              <p className="text-[13px] text-[color:var(--color-foreground)]" style={{ fontWeight: 500 }}>
                What changes on this account today
              </p>
              <ul className="flex flex-col gap-1.5">
                {losses.map((line) => (
                  <li
                    key={line}
                    className="text-[13px] leading-[19.5px] text-[color:var(--color-text-secondary)]"
                    style={{ fontWeight: 300 }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {rowState === "error" && managing ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-[color:var(--color-danger)]">
                We couldn't read your current plan just now, so we can't show what this change
                does to it. Nothing has been charged.
              </p>
              <button
                type="button"
                onClick={() => setRowAttempt((n) => n + 1)}
                className="secondary_button secondary_button--on-light secondary_button--sm self-start"
              >
                Try again
              </button>
            </div>
          ) : null}
          {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
          <button
            type="button"
            onClick={() => void pay()}
            disabled={paying || rowBlocked}

            className="main_accent_button main_accent_button--on-light w-full justify-center gap-2"
          >
            {paying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : managing && rowState === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : isTrial ? (
              "Start free trial"
            ) : (
              "Pay and activate"
            )}

          </button>
          <p className="text-center text-xs text-[color:var(--color-text-muted)]">
            {SHARED_PLAN_DISCLOSURE}
          </p>
          <p className="text-center text-xs text-[color:var(--color-text-muted)]">
            No card is charged — payments are not live yet.
          </p>
        </div>
      </main>
    </div>
  );
}
