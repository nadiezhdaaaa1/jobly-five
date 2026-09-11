import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { Wordmark } from "@/components/site/Wordmark";

import { recordConsent } from "@/lib/consent.functions";
import { CONSENT_CHANNELS, POLICY_VERSION } from "@/config/consent";

const NON_ESSENTIAL = CONSENT_CHANNELS.filter(
  (c) => c !== "resume_storage" && c !== "billing_terms",
);

export const Route = createFileRoute("/preferences")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Email preferences — Jobly" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PreferencesPage,
});

function PreferencesPage() {
  // An absent or arbitrary token still renders the page.
  const { token } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const doneHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (done) doneHeading.current?.focus();
  }, [done]);

  async function unsubscribeAll() {
    if (busy) return;
    setBusy(true);
    try {
      if (token) {
        // The path that works for a logged-out visitor arriving from an email.
        // The endpoint writes the withdrawal rows, so no recordConsent loop here.
        await fetch("/api/public/hooks/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } else {
        // Lazy import so the browser client doesn't load during SSR.
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.auth.getUser();
        const email = data.user?.email;
        if (email) {
          await Promise.allSettled(
            NON_ESSENTIAL.map((channel) =>
              recordConsent({
                data: {
                  email,
                  channel,
                  granted: false,
                  source: "unsubscribe_link",
                  policyVersion: POLICY_VERSION,
                  consentText: `Unsubscribed via the preferences page (${channel})`,
                },
              }),
            ),
          );
        }
      }
    } catch {
      // Logged-out visitors must never see a failure.
    }
    setBusy(false);
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <div className="mx-auto w-full max-w-[448px] px-5 py-16">
        <Link to="/" aria-label="Jobly home" className="inline-flex items-center">
          <Wordmark className="!text-[color:var(--color-foreground)]" />
        </Link>

        {done ? (
          <div role="status" aria-live="polite" className="mt-10">
            <h1
              ref={doneHeading}
              tabIndex={-1}
              className="font-[family-name:var(--font-display)] text-[30px] leading-tight outline-none"
            >
              Done - no more emails from us
            </h1>
            <p className="mt-3 text-[18px] text-[color:var(--color-text-secondary)]">
              We won't email you alerts or updates anymore. Your alerts are still saved — turn them
              back on anytime in your account.
            </p>
            <p className="mt-7 text-[color:var(--color-text-secondary)]">
              <Link to="/login" className="underline">
                Log in
              </Link>{" "}
              to manage notifications
            </p>
          </div>
        ) : (
          <div className="mt-10">
            <h1 className="font-[family-name:var(--font-display)] text-[30px] leading-tight">
              Stop all Jobly emails
            </h1>
            <p className="mt-3 text-[14px] text-[color:var(--color-text-secondary)]">
              You'll stop receiving job alerts, updates, and offers. Account and billing emails
              still arrive when needed.
            </p>

            <button
              type="button"
              onClick={unsubscribeAll}
              disabled={busy}
              className="main_accent_button main_accent_button--on-light w-full justify-center h-14 mt-7"
            >
              Unsubscribe from everything
            </button>
            <p className="body-small mt-2.5 text-center text-[color:var(--color-text-muted)]">
              Takes effect immediately
            </p>

            <div className="mt-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[color:var(--color-border)]" />
              <span className="text-[12px] text-[color:var(--color-text-muted)]">or</span>
              <div className="h-px flex-1 bg-[color:var(--color-border)]" />
            </div>

            <p className="mt-7 font-[family-name:var(--font-display)] text-[20px]">
              Too many emails? A less frequent digest might be enough — log in to switch.
            </p>

            <Link
              to="/login"
              className="secondary_button secondary_button--on-light w-full justify-center h-14 mt-4"
            >
              Log in to manage notifications
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
