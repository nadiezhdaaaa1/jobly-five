// Confirmation step of the mock checkout. What it reports is read back from the
// account's own subscription row — never from the URL: /checkout/confirmation
// with hand-typed search params must not be able to render a success page.
// The params only seed the display while that read is in flight.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconCheck as Check, IconLoader2 as Loader2 } from "@tabler/icons-react";
import { z } from "zod";

import { Wordmark } from "@/components/site/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { PRICING, TRIAL_DAYS, total, usd } from "@/config/pricing";
import { getSubscriptionRow } from "@/lib/subscription.functions";
import { getDraftToken } from "@/lib/quiz-draft-store";

const searchSchema = z.object({
  plan: z.enum(["trial", "pro"]).catch("trial"),
  cycle: z.enum(["monthly", "annual"]).catch("monthly"),
});

export const Route = createFileRoute("/checkout/confirmation")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Plan confirmed — Jobly" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Your Jobly plan is confirmed." },
    ],
  }),
  component: ConfirmationPage,
});

/** States that mean the account really is on a plan right now. */
const LIVE = ["trialing", "active", "past_due", "paused"];

function ConfirmationPage() {
  const navigate = useNavigate();
  const seed = Route.useSearch();
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  // Server-derived truth. Seeded from the URL for the first paint only.
  const [isTrial, setIsTrial] = useState(seed.plan === "trial");
  const [cycle, setCycle] = useState<"monthly" | "annual">(seed.cycle);
  const [live, setLive] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        void navigate({ to: "/login" });
        return;
      }
      try {
        const { data: ent } = await supabase.rpc("get_entitlements");
        setOnboarded(Boolean((ent as { onboarded?: boolean } | null)?.onboarded));
      } catch {
        setOnboarded(false);
      }
      try {
        const row = await getSubscriptionRow();
        setLive(LIVE.includes(row.status));
        setIsTrial(row.status === "trialing");
        setCycle(row.cycle === "annual" ? "annual" : "monthly");
      } catch {
        // An unknown state is never reported as a success.
        setLive(false);
      }
      setReady(true);
    })();
  }, [navigate]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-[color:var(--color-text-muted)]" />
      </main>
    );
  }

  // An un-onboarded account still has to answer the quiz before a Digest
  // exists — unless the answers already sit in an unclaimed draft (S1), which
  // the app claims on entry.
  const hasDraft = getDraftToken() !== null;
  const nextPath = onboarded || hasDraft ? "/dashboard" : "/quiz";
  const renewal = isTrial
    ? usd(PRICING.monthly.perMonth)
    : cycle === "annual"
      ? usd(total(PRICING.annual))
      : usd(PRICING.monthly.perMonth);

  if (!live) {
    return (
      <div className="min-h-screen bg-[color:var(--color-surface-0)]">
        <header className="flex items-center px-6 py-6 lg:px-12">
          <Wordmark className="!text-[color:var(--color-foreground)]" />
        </header>
        <main className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-6 pb-20">
          <div className="flex flex-col gap-4 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6">
            <h1 className="text-[24px] font-light text-[color:var(--color-foreground)]">
              No plan on this account yet
            </h1>
            <p className="text-[15px] text-[color:var(--color-text-secondary)]">
              We couldn't find an active plan for you. Pick one and we'll get your matches going.
            </p>
            <button
              type="button"
              onClick={() => void navigate({ to: "/settings" })}
              className="main_accent_button main_accent_button--on-light w-full justify-center"
            >
              Choose a plan
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-surface-0)]">
      <header className="flex items-center px-6 py-6 lg:px-12">
        <Wordmark className="!text-[color:var(--color-foreground)]" />
      </header>
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-6 pb-20">
        <div className="flex flex-col gap-4 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-green)]">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </span>
          <h1 className="text-[24px] font-light text-[color:var(--color-foreground)]">
            You're all set
          </h1>
          <p className="text-[15px] text-[color:var(--color-text-secondary)]">
            {isTrial
              ? `Your ${TRIAL_DAYS}-day free trial has started. We'll remind you before it ends.`
              : "Your Pro plan is active."}
          </p>
          <p className="text-xs text-[color:var(--color-text-muted)]">
            Auto-renews at {renewal} until cancelled. Cancel anytime in Settings → Plan in two
            steps.
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: nextPath })}
            className="main_accent_button main_accent_button--on-light w-full justify-center"
          >
            {onboarded ? "Go to your Digest" : "Set up your matches"}
          </button>
        </div>
      </main>
    </div>
  );
}
