import { createFileRoute } from "@tanstack/react-router";

/**
 * One-click unsubscribe (CAN-SPAM). No auth: the unsubscribe_token is the
 * credential. Idempotent — a repeat click must not 500.
 * GET /api/public/hooks/unsubscribe?token=<uuid>[&channel=<name>]
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page(message: string, status = 200) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>Email preferences</title>` +
      `<div style="font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;color:#0C0C0D">` +
      `<p>${message}</p></div>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export const Route = createFileRoute("/api/public/hooks/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token") ?? "";
        const channel = url.searchParams.get("channel");
        if (!UUID_RE.test(token)) return page("That unsubscribe link is not valid.", 400);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { CONSENT_CHANNELS, POLICY_VERSION } = await import("@/config/consent");
          const { data: contact } = await supabaseAdmin
            .from("email_contacts")
            .select("email, user_id, suppressed_at")
            .eq("unsubscribe_token", token)
            .maybeSingle();
          if (!contact) return page("That unsubscribe link is not valid.", 404);

          const requested =
            channel && (CONSENT_CHANNELS as readonly string[]).includes(channel)
              ? [channel]
              : [...CONSENT_CHANNELS].filter((c) => c !== "resume_storage" && c !== "billing_terms");

          // Withdrawal is a new row per channel; history is never rewritten.
          await supabaseAdmin.from("consent_records").insert(
            requested.map((c) => ({
              user_id: contact.user_id,
              email: contact.email,
              channel: c as never,
              granted: false,
              lawful_basis: "consent",
              source: "unsubscribe_link",
              consent_text: `Unsubscribed via one-click email link (${c})`,
              policy_version: POLICY_VERSION,
              user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
            })),
          );

          if (!contact.suppressed_at) {
            await supabaseAdmin
              .from("email_contacts")
              .update({ suppressed_at: new Date().toISOString(), suppression_reason: "unsubscribe" })
              .eq("email", contact.email);
          }
          return page("You're unsubscribed. You won't receive these emails again.");
        } catch (e) {
          console.error("[unsubscribe]", e instanceof Error ? e.message : e);
          return page("You're unsubscribed. You won't receive these emails again.");
        }
      },
    },
  },
});
