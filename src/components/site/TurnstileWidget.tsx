import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY, captchaConfigured } from "@/config/turnstile";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __joblyTurnstileLoading?: Promise<void>;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (window.__joblyTurnstileLoading) return window.__joblyTurnstileLoading;
  window.__joblyTurnstileLoading = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(el);
  });
  return window.__joblyTurnstileLoading;
}

/**
 * Cloudflare Turnstile in managed mode — silent for almost every visitor, an
 * interactive check only when Cloudflare is suspicious. Renders nothing when no
 * site key is configured, so the forms keep working untouched.
 */
export function TurnstileWidget({
  onToken,
  className,
}: {
  onToken: (token: string | null) => void;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!captchaConfigured) return;
    let widgetId: string | null = null;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(hostRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: "interaction-only",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* widget already gone */
        }
      }
    };
  }, []);

  if (!captchaConfigured) return null;
  return <div ref={hostRef} className={className} />;
}
