import { createFileRoute } from "@tanstack/react-router";

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
 * Scheduled daily with Supabase `pg_cron` + `pg_net` against this route.
 * Caller must present the project's publishable/anon key in `apikey`.
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

export const Route = createFileRoute("/api/public/hooks/apply-plan-changes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
        const presented = request.headers.get("apikey") ?? "";
        if (!expected || presented !== expected) {
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
