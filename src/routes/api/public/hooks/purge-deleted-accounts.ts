import { createFileRoute } from "@tanstack/react-router";
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/config/account";

/**
 * Hard-delete job. Purges accounts whose grace window has fully elapsed.
 *
 * Scheduled daily with Supabase `pg_cron` + `pg_net` against this route.
 * Caller must present the project's publishable/anon key in `apikey`.
 *
 * Deletes, per account: avatar objects, user_job_state, user_roles, the
 * profile row and finally the auth user (cascades cover the rest).
 * Nothing else is retained today because no billing/email provider is wired
 * in — when Stripe or an ESP lands, invoices and the email suppression list
 * must be exempted here.
 */
const BATCH = 100;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/purge-deleted-accounts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
        const presented = request.headers.get("apikey") ?? "";
        if (!expected || presented !== expected) {
          return json({ ok: false, error: "Unauthorized" }, 401);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: due, error } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("account_status", "pending_deletion")
          .lte("deletion_scheduled_for", new Date().toISOString())
          .limit(BATCH);
        if (error) return json({ ok: false, error: error.message }, 500);

        const purged: string[] = [];
        const failed: { id: string; error: string }[] = [];

        for (const row of due ?? []) {
          const id = row.id;
          try {
            const { data: files } = await supabaseAdmin.storage.from("avatars").list(id);
            if (files?.length) {
              await supabaseAdmin.storage.from("avatars").remove(files.map((f) => `${id}/${f.name}`));
            }
            await supabaseAdmin.from("user_job_state").delete().eq("user_id", id);
            await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
            await supabaseAdmin.from("profiles").delete().eq("id", id);
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) throw authError;
            purged.push(id);
          } catch (e) {
            failed.push({ id, error: e instanceof Error ? e.message : String(e) });
          }
        }

        return json({
          ok: failed.length === 0,
          graceDays: ACCOUNT_DELETION_GRACE_DAYS,
          due: due?.length ?? 0,
          purged: purged.length,
          failed,
        });
      },
    },
  },
});