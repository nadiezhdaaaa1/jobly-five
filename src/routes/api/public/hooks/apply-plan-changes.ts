import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Applies everything that has come due on subscription rows: a plan change
 * scheduled for the end of a paid period (Cancellation Policy §5), a scheduled
 * cancellation, a trial that has converted, a period that has renewed.
 *
 * The app also reconciles lazily whenever an account reads its own row, so this
 * exists for accounts that never open the app — without it, a deferred downgrade
 * would only take effect on the member's next visit, which is wrong once a real
 * charge depends on the date.
 *
 * Scheduled daily with `pg_cron` + `pg_net` against this route.
 * Caller must present PLAN_CRON_SECRET in `x-plan-cron-secret`.
 *
 * Banked days are never touched here: §3 loses them only on cancellation or
 * account deletion.
 */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function secretMatches(expected: string | undefined, presented: string | null) {
  if (!expected || !presented) return false;

  const expectedDigest = createHash("sha256").update(expected).digest();
  const presentedDigest = createHash("sha256").update(presented).digest();
  return timingSafeEqual(expectedDigest, presentedDigest);
}

export const Route = createFileRoute("/api/public/hooks/apply-plan-changes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["PLAN_CRON_SECRET"];
        const presented = request.headers.get("x-plan-cron-secret");
        if (!secretMatches(expected, presented)) {
          return json({ ok: false, error: "Unauthorized" }, 401);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("apply_all_due_subscription_changes");
        if (error) return json({ ok: false, error: error.message }, 500);

        return json({ ok: true, applied: Number(data ?? 0) });
      },
    },
  },
});
