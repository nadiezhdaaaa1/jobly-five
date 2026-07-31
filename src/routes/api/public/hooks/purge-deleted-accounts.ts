import { createFileRoute } from "@tanstack/react-router";
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/config/account";

/**
 * Hard-delete job endpoint (STUB — intentionally does not purge anything yet).
 *
 * Scheduling primitive available in this project: Supabase `pg_cron` + `pg_net`,
 * calling this `/api/public/*` route on a daily schedule.
 *
 * TODO before enabling:
 *  1. Migration: add `account_status` ('active' | 'pending_deletion'),
 *     `deletion_requested_at`, `deletion_scheduled_for` to `public.profiles`.
 *     Deletion status must stay a separate column — do NOT merge it into any
 *     plan enum (free | pro | paused); the two are orthogonal.
 *  2. Move account state off localStorage (`src/lib/account-store.ts`) onto
 *     those columns so the server can see pending deletions.
 *  3. Purge profile, resume files (storage bucket), user_job_state, user_roles
 *     and the auth user for rows where `deletion_scheduled_for <= now()`.
 *  4. Confirm the retention/suppression exemptions (billing records, email
 *     suppression list) with a human before the first destructive run.
 *  5. Schedule with pg_cron once the above exist.
 */
export const Route = createFileRoute("/api/public/hooks/purge-deleted-accounts")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          JSON.stringify({
            ok: false,
            implemented: false,
            graceDays: ACCOUNT_DELETION_GRACE_DAYS,
            reason: "Purge job not implemented: account deletion state is not persisted server-side yet.",
          }),
          { status: 501, headers: { "Content-Type": "application/json" } },
        ),
    },
  },
});