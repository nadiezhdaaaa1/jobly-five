import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "jobly.cookie-consent.v1";

type Consent = "accepted" | "essential";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (!existing) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function persist(value: Consent) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() })
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[1200] px-4 pb-4 md:px-6 md:pb-6"
    >
      <div className="mx-auto max-w-[1000px] rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5 shadow-lg md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="max-w-2xl text-sm text-[color:var(--color-text-secondary)]">
            <div className="text-sm font-semibold text-[color:var(--color-foreground)]">
              We use cookies
            </div>
            <p className="mt-1">
              We use essential cookies to run Jobly, and optional analytics cookies to
              improve the product. See our{" "}
              <Link
                to="/legal/cookies"
                className="underline hover:text-[color:var(--color-foreground)]"
              >
                Cookie Policy
              </Link>{" "}
              for details.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => persist("essential")}
              className="button-small inline-flex h-10 items-center justify-center rounded-button border border-[color:var(--color-border)] px-4 text-[color:var(--color-foreground)] transition-colors hover:bg-[color:var(--color-surface-2)]"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => persist("accepted")}
              className="button-small inline-flex h-10 items-center justify-center rounded-button bg-[color:var(--color-accent)] px-4 text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)]"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}