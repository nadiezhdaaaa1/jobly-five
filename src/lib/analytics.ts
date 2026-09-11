// One place every product event goes through.
// No provider is wired yet, so this is a safe no-op that forwards to whatever
// sink exists at runtime. When a provider lands, only this file changes.

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type Sink = (name: string, props?: AnalyticsProps) => void;

declare global {
  interface Window {
    __joblyAnalytics?: Sink;
  }
}

export function track(name: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;
  try {
    window.__joblyAnalytics?.(name, props);
  } catch {
    // Analytics must never break a flow.
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", name, props ?? {});
  }
}

export const EVENTS = {
  registrationModalOpened: "registration_modal_opened",
  authSucceeded: "auth_succeeded",
  checkoutRedirect: "checkout_redirect",
} as const;
