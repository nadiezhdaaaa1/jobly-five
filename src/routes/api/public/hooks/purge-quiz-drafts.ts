import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily retention purge for anonymous quiz drafts. These hold role, location
 * and salary expectations with no account behind them, so they stay short-lived.
 * Caller must present the project's publishable/anon key in `apikey`.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/purge-quiz-drafts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
        const presented = request.headers.get("apikey") ?? "";
        if (!expected || presented !== expected) {
          return json({ ok: false, error: "Unauthorized" }, 401);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = Date.now();
        const thirtyDaysAgo = new Date(now - 30 * DAY_MS).toISOString();
        const sevenDaysAgo = new Date(now - 7 * DAY_MS).toISOString();

        async function purge(build: () => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
          const { data, error } = await build();
          if (error) throw new Error(error.message);
          return data?.length ?? 0;
        }

        try {
          const staleInProgress = await purge(() =>
            supabaseAdmin
              .from("quiz_drafts")
              .delete()
              .eq("status", "in_progress")
              .lt("last_seen_at", thirtyDaysAgo)
              .select("id"),
          );
          // Claimed drafts are redundant: the answers live on the profile now.
          const claimed = await purge(() =>
            supabaseAdmin
              .from("quiz_drafts")
              .delete()
              .eq("status", "claimed")
              .lt("claimed_at", sevenDaysAgo)
              .select("id"),
          );
          const completedUnclaimed = await purge(() =>
            supabaseAdmin
              .from("quiz_drafts")
              .delete()
              .eq("status", "completed")
              .lt("last_seen_at", thirtyDaysAgo)
              .select("id"),
          );
          const abandoned = await purge(() =>
            supabaseAdmin
              .from("quiz_drafts")
              .delete()
              .eq("status", "abandoned")
              .lt("updated_at", sevenDaysAgo)
              .select("id"),
          );

          const counts = { staleInProgress, claimed, completedUnclaimed, abandoned };
          console.log("[purge-quiz-drafts]", JSON.stringify(counts));
          return json({ ok: true, ...counts });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Purge failed";
          console.error("[purge-quiz-drafts]", message);
          return json({ ok: false, error: message }, 500);
        }
      },
    },
  },
});
