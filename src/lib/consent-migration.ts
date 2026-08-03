/**
 * One-time migration of consent out of client storage. The database always
 * wins: a channel that already has a row is never overwritten by a client
 * value, and migrated rows are marked with an unrecorded-wording marker so no
 * boolean is silently promoted to real evidence.
 */
import { supabase } from "@/integrations/supabase/client";
import { listMyConsent, recordConsent } from "@/lib/consent.functions";
import { POLICY_VERSION, UNRECORDED_WORDING, type ConsentChannelName } from "@/config/consent";

/** Legacy client keys, mapped to the channel they represented. */
const LEGACY_KEYS: Record<string, ConsentChannelName> = {
  "jobly.consent.digest": "daily_digest",
  "jobly.consent.daily_digest": "daily_digest",
  "jobly.consent.high_match_alerts": "high_match_alerts",
  "jobly.consent.weekly_report": "weekly_report",
  "jobly.consent.product_updates": "product_updates",
  "jobly.consent.marketing": "marketing",
  "jobly.consent.reactivation": "reactivation",
  "jobly.consent.unsubscribed": "marketing",
};

function readLegacy(): { key: string; channel: ConsentChannelName; granted: boolean }[] {
  if (typeof window === "undefined") return [];
  const out: { key: string; channel: ConsentChannelName; granted: boolean }[] = [];
  for (const [key, channel] of Object.entries(LEGACY_KEYS)) {
    const raw = window.localStorage.getItem(key);
    if (raw === null) continue;
    const granted = raw === "true" || raw === "1" || raw === '"true"';
    out.push({ key, channel: key.endsWith("unsubscribed") ? channel : channel, granted: key.endsWith("unsubscribed") ? !granted : granted });
  }
  return out;
}

export async function migrateLegacyConsent(): Promise<{ migrated: number; skipped: number }> {
  const legacy = readLegacy();
  if (legacy.length === 0) return { migrated: 0, skipped: 0 };

  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email;
  if (!email) return { migrated: 0, skipped: legacy.length };

  const existing = await listMyConsent().catch(() => null);
  if (!existing) return { migrated: 0, skipped: legacy.length };
  const known = new Set(existing.map((r) => r.channel));

  let migrated = 0;
  let skipped = 0;
  for (const item of legacy) {
    if (known.has(item.channel)) {
      window.localStorage.removeItem(item.key);
      skipped += 1;
      continue;
    }
    const res = await recordConsent({
      data: {
        email,
        channel: item.channel,
        granted: item.granted,
        source: "localstorage_migration",
        consentText: UNRECORDED_WORDING,
        policyVersion: POLICY_VERSION,
      },
    }).catch(() => ({ ok: false as const }));
    if (res.ok) {
      window.localStorage.removeItem(item.key);
      known.add(item.channel);
      migrated += 1;
    }
  }
  if (migrated || skipped) {
    console.log("[consent-migration]", JSON.stringify({ migrated, skipped }));
  }
  return { migrated, skipped };
}
