// Dev-only hard purge of one test account, so a signup/checkout run can start
// from zero. Three independent guards: non-production build, a one-address
// allowlist, and an authenticated caller.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The only address this tool may ever touch. Exact match, no patterns. */
export const DEV_PURGE_ALLOWLIST = ["sergekrush@gmail.com"] as const;

export type DevPurgeResult = {
  ok: boolean;
  status: "purged" | "nothing-to-purge" | "refused" | "error";
  message: string;
  clean?: boolean;
  counts?: Record<string, number>;
};

/** Tables that can hold this account's data, keyed by the column to match on. */
const USER_ID_TABLES = [
  "subscriptions",
  "quiz_drafts",
  "consent_records",
  "email_contacts",
  "notification_preferences",
  "user_job_state",
  "user_roles",
  "cancel_feedback",
  "blocked_companies",
  "board_columns",
  "job_interactions",
  "resume_documents",
  "saved_filters",
  "security_events",
] as const;

const EMAIL_TABLES = ["quiz_drafts", "consent_records", "email_contacts"] as const;

export const devPurgeAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => ({ email: String(input.email).trim().toLowerCase() }))
  .handler(async ({ data }): Promise<DevPurgeResult> => {
    // Guard 1 — never in a production build. import.meta.env.DEV is statically
    // replaced at build time, so a production bundle contains `false` here.
    if (!import.meta.env.DEV || process.env["NODE_ENV"] === "production") {
      return { ok: false, status: "refused", message: "Disabled outside development." };
    }

    // Guard 2 — exact-match allowlist.
    if (!DEV_PURGE_ALLOWLIST.includes(data.email as (typeof DEV_PURGE_ALLOWLIST)[number])) {
      return { ok: false, status: "refused", message: "Email is not on the dev allowlist." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { purgeAccount } = await import("@/lib/purge-account.server");

    // Resolve email -> user id.
    let userId: string | null = null;
    for (let page = 1; page <= 20 && !userId; page += 1) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return { ok: false, status: "error", message: error.message };
      if (!list.users.length) break;
      userId = list.users.find((u) => u.email?.toLowerCase() === data.email)?.id ?? null;
      if (list.users.length < 200) break;
    }

    if (!userId) {
      return { ok: true, status: "nothing-to-purge", message: "No account exists for that email." };
    }

    const result = await purgeAccount(userId);
    if (!result.ok) {
      return { ok: false, status: "error", message: result.error ?? "Purge failed." };
    }

    // Verify: re-count every table that could still reference this account.
    const counts: Record<string, number> = {};
    const profileCount = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("id", userId);
    counts["profiles"] = profileCount.count ?? 0;

    for (const table of USER_ID_TABLES) {
      const { count } = await supabaseAdmin
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      counts[`${table} (user_id)`] = count ?? 0;
    }

    for (const table of EMAIL_TABLES) {
      const { count } = await supabaseAdmin
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("email", data.email);
      counts[`${table} (email)`] = count ?? 0;
    }

    const clean = Object.values(counts).every((n) => n === 0);
    return {
      ok: true,
      status: "purged",
      clean,
      counts,
      message: clean
        ? "Account purged — no rows remain."
        : "Account purged, but some rows remain (cascade gap).",
    };
  });
