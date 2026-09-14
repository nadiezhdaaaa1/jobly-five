// Confirmation step of the mock checkout. What it reports is read back from the
// account's own subscription row — never from the URL: /checkout/confirmation
// with hand-typed search params must not be able to render a success page.
// The param only seeds the display while that read is in flight.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconCheck as Check, IconLoader2 as Loader2 } from "@tabler/icons-react";
import { z } from "zod";

import { Wordmark } from "@/components/site/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import {
  SHARED_PLAN_DISCLOSURE,
  SKUS,
  SKU_IDS,
  TRIAL_DAYS,
  TRIAL_SKU,
  renewalPhrase,
  type SkuId,
} from "@/config/pricing";
import { getSubscriptionRow } from "@/lib/subscription.functions";
import { getDraftToken } from "@/lib/quiz-draft-store";

const searchSchema = z.object({
  sku: z.enum(SKU_IDS as [SkuId, ...SkuId[]]).catch(TRIAL_SKU),
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
const LIVE = ["trialing", "active", "past_due"];

function ConfirmationPage() {
  const navigate = useNavigate();
  const seed = Route.useSearch();
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  // Server-derived truth. Seeded from the URL for the first paint only.
  const [isTrial, setIsTrial] = useState(false);
  const [sku, setSku] = useState<SkuId>(seed.sku);
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
        if (row.sku) setSku(row.sku);
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
  const setUp = onboarded || hasDraft;
  const nextPath = setUp ? "/dashboard" : "/quiz";
  const isWatch = SKUS[sku].tier === "watch";

  if (!live) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)]">
        <header className="flex items-center px-6 py-6 lg:px-12">
          <Wordmark className="!text-[color:var(--color-foreground)]" />
        </header>
        <main className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-8 px-6 pb-20">
          <div className="flex flex-col items-center gap-3 px-4 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-[48px] font-normal leading-[1.3] tracking-[-1.45px] text-[color:var(--color-foreground)]">
              No plan yet
            </h1>
            <p className="text-[18px] font-extralight leading-[1.6] text-[color:var(--color-text-secondary)]">
              We couldn't find an active plan on this account. Pick one and we'll get your matches
              going.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void navigate({ to: "/settings" })}
            className="main_accent_button main_accent_button--on-light main_accent_button--block h-[48px] shrink-0"
            style={{ width: 200 }}
          >
            Choose a plan
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="flex items-center px-6 py-6 lg:px-12">
        <Wordmark className="!text-[color:var(--color-foreground)]" />
      </header>
      <main className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-8 px-6 pb-20">
        <div className="flex flex-col items-center gap-3 px-4 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-[48px] font-normal leading-[1.3] tracking-[-1.45px] text-[color:var(--color-foreground)]">
            Thank you!
          </h1>
          <p className="text-[18px] font-extralight leading-[1.6] text-[color:var(--color-text-secondary)]">
            {isTrial
              ? `Your ${TRIAL_DAYS}-day free trial is running. Full Pro access from now — nothing has been charged.`
              : isWatch
                ? "Your Watch plan is active. One email a week, scored matches only."
                : "Your Pro plan is active. Jobly now scores every new posting against your profile."}
          </p>
        </div>

        <div className="w-full rounded-[20px] bg-[color:var(--color-surface-2)] p-[4px]">
          <div
            className="flex items-center gap-10 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-6 py-5"
            style={{ filter: "drop-shadow(0 1px 3px rgba(12,12,13,0.08))" }}
          >
            <p className="flex-1 text-[16px] font-normal leading-[1.6] text-[color:var(--color-text-secondary)]">
              Every match is scored before it reaches you —{" "}
              <span className="text-[color:var(--color-foreground)]">ghost jobs never do</span>.
            </p>
            <span
              className="grid shrink-0 place-items-center rounded-full bg-[color:var(--color-green)]"
              style={{ width: 52, height: 52 }}
            >
              <Check className="h-6 w-6 text-white" strokeWidth={3} />
            </span>
          </div>
        </div>

        <p className="max-w-[488px] text-center text-[16px] font-extralight leading-[1.6] text-[color:var(--color-text-secondary)]">
          {setUp
            ? "Your digest is already set up from your quiz answers. Change roles, seniority, salary or location any time in Settings — every change re-scores your matches."
            : "Next, answer a few questions about the role you want: stack, seniority, salary, location. Jobly turns that into a live search and scores new postings the moment they appear."}
        </p>

        <p className="max-w-[420px] text-center text-[14px] font-extralight leading-[1.2] text-[color:var(--color-text-secondary)]">
          Stop refreshing job boards. We'll email you when something is worth your time.
        </p>

        <button
          type="button"
          onClick={() => void navigate({ to: nextPath })}
          className="main_accent_button main_accent_button--on-light main_accent_button--block h-[48px] shrink-0"
          style={{ width: 200 }}
        >
          {setUp ? "Go to your Digest" : "Set up your matches"}
        </button>

        <div className="flex flex-col items-center gap-2 text-center text-[12px] font-extralight leading-[1.6] text-[color:var(--color-text-muted)]">
          <p>Auto-renews at {renewalPhrase(sku)} until cancelled.</p>
          <p>{SHARED_PLAN_DISCLOSURE}</p>
        </div>
      </main>
    </div>
  );
}
