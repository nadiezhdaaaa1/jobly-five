import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconLoader2 as Loader2, IconX } from "@tabler/icons-react";

import {
  acceptPolicies,
  listReconsentNeeded,
  type ReconsentItem,
} from "@/lib/policy-consent.functions";

const DOC_LABEL: Record<string, { name: string; to: string }> = {
  terms: { name: "Terms of Service", to: "/legal/terms" },
  privacy: { name: "Privacy Policy", to: "/legal/privacy" },
};

/**
 * Tier 2 re-consent: a non-blocking bar for policy updates that are not
 * billing terms. Acceptance is an explicit click — never implied by usage.
 */
export function ReconsentBanner() {
  const [items, setItems] = useState<ReconsentItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const rows = await listReconsentNeeded();
        setItems(rows.filter((r) => r.documentKey !== "billing_terms"));
      } catch {
        // Never block the app on this.
      }
    })();
  }, []);

  if (dismissed || items.length === 0) return null;

  const names = items.map((i) => DOC_LABEL[i.documentKey]?.name ?? i.documentKey);
  const consentText = `I accept the updated ${names.join(" and ")} (version ${items[0].version}).`;

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
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="mx-auto flex max-w-[880px] flex-col gap-3 rounded-[8px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4 shadow-[0_4px_16px_rgba(12,12,13,0.10)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[15px] font-medium">We have updated our {names.join(" and ")}</p>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            {items[0].changeSummary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {items.map((i) =>
            DOC_LABEL[i.documentKey] ? (
              <Link
                key={i.documentKey}
                to={DOC_LABEL[i.documentKey].to}
                className="button-small inline-flex h-9 items-center rounded-[4px] border border-[color:var(--color-border)] px-3 hover:bg-[color:var(--color-surface-2)]"
              >
                Read {DOC_LABEL[i.documentKey].name}
              </Link>
            ) : null,
          )}
          <button
            type="button"
            onClick={onAccept}
            disabled={busy}
            className="button-small inline-flex h-9 items-center gap-2 rounded-[4px] bg-[color:var(--color-primary)] px-4 text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Accept
          </button>
          <button
            type="button"
            aria-label="Hide for now"
            onClick={() => setDismissed(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
