import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { usePlan } from "@/lib/plan-store";
import {
  acceptPolicies,
  listReconsentNeeded,
  type ReconsentItem,
} from "@/lib/policy-consent.functions";

const DOC_LABEL: Record<string, { name: string; to: string }> = {
  terms: { name: "Terms of Service", to: "/legal/terms" },
  privacy: { name: "Privacy Policy", to: "/legal/privacy" },
  billing_terms: { name: "Subscription and Billing Terms", to: "/legal/billing" },
  cancellation: { name: "Cancellation Policy", to: "/legal/cancellation" },
  email: { name: "Email and Communications Consent", to: "/legal/email" },
  cookies: { name: "Cookie Policy", to: "/legal/cookies" },
  disclaimer: { name: "Service Disclaimer", to: "/legal/disclaimer" },
  dmca: { name: "DMCA Policy", to: "/legal/dmca" },
};

/**
 * Tier 2/3 re-consent. One prompt, one click, one `consent_records` row per
 * document — three banners in a row would train people to dismiss them.
 * There is no dismiss control: the duty must not be dodgeable.
 */
export function ReconsentBanner() {
  const [items, setItems] = useState<ReconsentItem[]>([]);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const plan = usePlan();
  const hasPlan = plan === "pro" || plan === "watch" || plan === "paused";

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listReconsentNeeded());
      } catch {
        // Never block the app on this.
      }
    })();
  }, []);

  if (items.length === 0) return null;

  const named = items.map((i) => ({
    ...i,
    name: DOC_LABEL[i.documentKey]?.name ?? i.documentKey,
    to: DOC_LABEL[i.documentKey]?.to ?? null,
  }));
  const names = named.map((i) => i.name);
  const headline = `We have updated our ${
    names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0]
  }`;
  // The stored record names each document and version, and repeats the
  // arbitration sentence: the evidence should show what was on screen.
  const terms = named.find((i) => i.documentKey === "terms");
  const cancellation = named.find((i) => i.documentKey === "cancellation");
  const consentText = [
    `I accept the updated ${named.map((i) => `${i.name} (version ${i.version})`).join(", ")}.`,
    cancellation
      ? "I understand the Cancellation Policy forms part of the Terms of Service."
      : null,
    terms
      ? "I understand the Terms include an arbitration clause and a class-action waiver."
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  async function onAccept() {
    setBusy(true);
    try {
      await acceptPolicies({
        data: { documentKeys: items.map((i) => i.documentKey), consentText, source: "settings" },
      });
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3"
      role="dialog"
      aria-modal="false"
      aria-label={headline}
    >
      <div
        className="mx-auto max-h-[calc(100dvh-24px)] max-w-[720px] overflow-y-auto border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5 shadow-[0_4px_16px_rgba(12,12,13,0.10)]"
        style={{ borderRadius: 20 }}
      >
        <p
          className="text-[15px] text-[color:var(--color-foreground)]"
          style={{ fontWeight: 500 }}
        >
          {headline}
        </p>

        {terms ? (
          <p
            className="mt-2 text-[14px] leading-[21px] text-[color:var(--color-foreground)]"
            style={{ fontWeight: 500 }}
          >
            The new Terms include an arbitration clause and a class-action waiver: disputes are
            settled individually, not in court or as part of a group.
          </p>
        ) : null}

        <ul className="mt-3 flex flex-col gap-2">
          {named.map((i) => (
            <li
              key={i.documentKey}
              className="text-[13px] leading-[19.5px] text-[color:var(--color-text-secondary)]"
              style={{ fontWeight: 300 }}
            >
              <span className="text-[color:var(--color-foreground)]">
                {i.name} ({i.version})
              </span>{" "}
              — {i.changeSummary}{" "}
              {i.to ? (
                <Link
                  to={i.to}
                  className="whitespace-nowrap text-[color:var(--color-foreground)] underline"
                >
                  Read
                </Link>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onAccept}
            disabled={busy}
            className="main_accent_button main_accent_button--on-light inline-flex button-small"
            style={{
              borderRadius: 12,
              fontSize: 14,
              height: 40,
              padding: "0 16px",
              justifyContent: "center",
            }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {names.length > 1 ? `I accept all ${names.length === 3 ? "three" : names.length}` : "I accept"}
          </button>
          {hasPlan ? (
            <button
              type="button"
              onClick={() => void navigate({ to: "/settings", search: { cancel: true } })}
              className="secondary_button secondary_button--on-light inline-flex button-small"
              style={{
                borderRadius: 12,
                fontSize: 14,
                height: 40,
                padding: "0 16px",
                justifyContent: "center",
              }}
            >
              I don't accept — cancel my plan
            </button>
          ) : null}
        </div>

        <p
          className="mt-3 text-[12px] leading-[18px] text-[color:var(--color-text-muted)]"
          style={{ fontWeight: 300 }}
        >
          If you do nothing, this notice stays and your plan continues as normal, including renewal
          — but you will keep being asked.
        </p>
      </div>
    </div>
  );
}
