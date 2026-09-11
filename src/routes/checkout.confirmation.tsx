// Confirmation step of the mock checkout. It only reports what /checkout just
// wrote; the plan intent has already been cleared by then, so the summary
// travels in the URL. Nothing here grants access — the server owns that.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconCheck as Check, IconLoader2 as Loader2 } from "@tabler/icons-react";
import { z } from "zod";

import { Wordmark } from "@/components/site/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { PRICING, TRIAL_DAYS, total, usd } from "@/config/pricing";
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

function ConfirmationPage() {
  const navigate = useNavigate();
  const { plan, cycle } = Route.useSearch();
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

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

  const isTrial = plan === "trial";
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
