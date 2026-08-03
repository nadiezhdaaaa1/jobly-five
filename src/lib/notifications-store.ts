import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ConsentChannel = Database["public"]["Enums"]["consent_channel"];

/** Legal permission to email. Latest record per channel wins. */
export const CONSENT_ROWS = {
  daily_digest: "Email me when a new digest is ready.",
  high_match_alerts: "Email me instantly when a top match posts between digests.",
  weekly_report: "Email me a weekly search report.",
  product_updates: "Email me product updates and tips.",
  reactivation: "Email me a reminder when matches pile up unread.",
} as const satisfies Partial<Record<ConsentChannel, string>>;

export type ConsentKey = keyof typeof CONSENT_ROWS;

/** How and when we send. Never a legal permission. */
export type PreferenceKey =
  | "pref_digest_tuned"
  | "pref_interview_reminders"
  | "pref_followup_nudges"
  | "pref_stale_nudges"
  | "pref_gmail_status";

export type Preferences = {
  digest_frequency: "daily" | "weekly";
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone: string;
} & Record<PreferenceKey, boolean>;

const DEFAULT_PREFS: Preferences = {
  digest_frequency: "weekly",
  quiet_hours_start: 21,
  quiet_hours_end: 7,
  timezone: "UTC",
  pref_digest_tuned: true,
  pref_interview_reminders: true,
  pref_followup_nudges: true,
  pref_stale_nudges: true,
  pref_gmail_status: true,
};

export type NotificationState = {
  consents: Record<ConsentKey, boolean>;
  prefs: Preferences;
  loading: boolean;
  /** Set when the last read or write failed. */
  error: string | null;
  setConsent: (key: ConsentKey, granted: boolean) => Promise<void>;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>;
  reload: () => Promise<void>;
};

const EMPTY_CONSENTS = Object.fromEntries(
  Object.keys(CONSENT_ROWS).map((k) => [k, false]),
) as Record<ConsentKey, boolean>;

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function useNotificationSettings(): NotificationState {
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>(EMPTY_CONSENTS);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [consentRes, prefRes] = await Promise.all([
      supabase.from("current_consent").select("channel, granted"),
      supabase.from("notification_preferences").select("*").maybeSingle(),
    ]);
    if (!mounted.current) return;
    if (consentRes.error || prefRes.error) {
      setError("We couldn't load your notification settings. Try again in a moment.");
      setLoading(false);
      return;
    }
    const next = { ...EMPTY_CONSENTS };
    for (const row of consentRes.data ?? []) {
      const ch = row.channel as ConsentKey | null;
      if (ch && ch in next) next[ch] = row.granted === true;
    }
    setConsents(next);
    const p = prefRes.data;
    setPrefs(
      p
        ? {
            digest_frequency: p.digest_frequency === "daily" ? "daily" : "weekly",
            quiet_hours_start: p.quiet_hours_start,
            quiet_hours_end: p.quiet_hours_end,
            timezone: p.timezone,
            pref_digest_tuned: p.pref_digest_tuned,
            pref_interview_reminders: p.pref_interview_reminders,
            pref_followup_nudges: p.pref_followup_nudges,
            pref_stale_nudges: p.pref_stale_nudges,
            pref_gmail_status: p.pref_gmail_status,
          }
        : { ...DEFAULT_PREFS, timezone: browserTimezone() },
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setConsent = useCallback(async (key: ConsentKey, granted: boolean) => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      setError("You're signed out. Sign in again to change this.");
      return;
    }
    const previous = consents[key];
    setConsents((c) => ({ ...c, [key]: granted }));
    const { error: insertError } = await supabase.from("consent_records").insert({
      user_id: userId,
      channel: key,
      granted,
      wording: CONSENT_ROWS[key],
      source: "settings_notifications",
    });
    if (insertError) {
      setConsents((c) => ({ ...c, [key]: previous }));
      setError("That change didn't save. Try again.");
      return;
    }
    setError(null);
  }, [consents]);

  const setPreference = useCallback(
    async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setError("You're signed out. Sign in again to change this.");
        return;
      }
      const previous = prefs[key];
      setPrefs((p) => ({ ...p, [key]: value }));
      const patch = { user_id: userId, [key]: value } as Database["public"]["Tables"]["notification_preferences"]["Insert"];
      const { data, error: upsertError } = await supabase
        .from("notification_preferences")
        .upsert(patch, { onConflict: "user_id" })
        .select("*")
        .maybeSingle();
      if (upsertError) {
        setPrefs((p) => ({ ...p, [key]: previous }));
        setError("That change didn't save. Try again.");
        return;
      }
      // The database may correct the value (daily digest is Pro-only).
      if (data && key === "digest_frequency" && data.digest_frequency !== value) {
        setPrefs((p) => ({ ...p, digest_frequency: data.digest_frequency === "daily" ? "daily" : "weekly" }));
      }
      setError(null);
    },
    [prefs],
  );

  return { consents, prefs, loading, error, setConsent, setPreference, reload: load };
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_OPTIONS = HOURS.map((h) => ({
  value: h,
  label: `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`,
}));

/** A short, stable list plus whatever the browser reports. */
export function timezoneOptions(current: string): string[] {
  const base = [
    "UTC",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin",
    "Europe/Kyiv",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
  const browser = browserTimezone();
  return Array.from(new Set([current, browser, ...base].filter(Boolean)));
}
