// Mock checkout. No payment provider is wired yet, so confirming writes the
// subscription row through the existing server action and hands off to
// /checkout/confirmation. Every price shown is derived from src/config/pricing.ts.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { Wordmark } from "@/components/site/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { PRICING, TRIAL_DAYS, discountPct, total, usd } from "@/config/pricing";
import { applySubscriptionAction } from "@/lib/subscription.functions";
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

  async function pay() {
    if (!intent) return;
    setPaying(true);
    setError(null);
    try {
      await applySubscriptionAction({
        data:
          intent.plan === "trial"
            ? { action: "start_trial" }
            : {
                action: "activate",
                cycle: intent.cycle,
                // Only a decision made in Settings -> Plan may change the cycle
                // of a live subscription; the server enforces the same rule.
                allowCycleChange: intent.manage === true,
              },
      });

      // The decision has been acted on: it must not outlive this checkout.
      clearPlanIntent();
      void navigate({
        to: "/checkout/confirmation",
        search: { plan: intent.plan, cycle: intent.cycle },
      });
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

  const tier = intent.cycle === "annual" ? PRICING.annual : PRICING.monthly;
  const isTrial = intent.plan === "trial";

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
                {isTrial ? `Pro — ${TRIAL_DAYS}-day free trial` : "Jobly Pro"}
              </span>
              <span className="text-[15px] font-light text-[color:var(--color-foreground)]">
                {isTrial ? usd(0) : usd(total(tier))}
              </span>
            </div>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              {isTrial
                ? `Free for ${TRIAL_DAYS} days, then ${usd(PRICING.monthly.perMonth)} per month. Cancel any time before it ends.`
                : intent.cycle === "annual"
                  ? `${usd(PRICING.annual.perMonth)} per month, billed yearly — ${discountPct(PRICING.annual)}% off.`
                  : `${usd(PRICING.monthly.perMonth)} per month, billed monthly.`}
            </p>
            <p className="text-xs text-[color:var(--color-text-muted)]">
              {isTrial
                ? `Auto-renews at ${usd(PRICING.monthly.perMonth)} until cancelled. Cancel anytime in Settings → Plan in two steps.`
                : intent.cycle === "annual"
                  ? `Auto-renews at ${usd(total(PRICING.annual))} until cancelled. Cancel anytime in Settings → Plan in two steps.`
                  : `Auto-renews at ${usd(PRICING.monthly.perMonth)} until cancelled. Cancel anytime in Settings → Plan in two steps.`}
            </p>
          </div>
          {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
          <button
            type="button"
            onClick={() => void pay()}
            disabled={paying}
            className="main_accent_button main_accent_button--on-light w-full justify-center gap-2"
          >
            {paying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : isTrial ? (
              "Start free trial"
            ) : (
              "Pay and activate"
            )}
          </button>
          <p className="text-center text-xs text-[color:var(--color-text-muted)]">
            No card is charged — payments are not live yet.
          </p>
        </div>
      </main>
    </div>
  );
}
