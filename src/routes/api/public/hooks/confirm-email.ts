import { createFileRoute } from "@tanstack/react-router";

/**
 * Double opt-in handler. Sets confirmed_at for the contact behind the token.
 * Idempotent — confirming twice is a success, not an error.
 * GET /api/public/hooks/confirm-email?token=<uuid>
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page(message: string, status = 200) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>Email confirmed</title>` +
      `<div style="font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;color:#0C0C0D">` +
      `<p>${message}</p></div>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export const Route = createFileRoute("/api/public/hooks/confirm-email")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token") ?? "";
        if (!UUID_RE.test(token)) return page("That confirmation link is not valid.", 400);
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: contact } = await supabaseAdmin
            .from("email_contacts")
            .select("email, confirmed_at")
            .eq("unsubscribe_token", token)
            .maybeSingle();
          if (!contact) return page("That confirmation link is not valid.", 404);
          if (!contact.confirmed_at) {
            await supabaseAdmin
              .from("email_contacts")
              .update({ confirmed_at: new Date().toISOString() })
              .eq("email", contact.email);
          }
          return page("Your email is confirmed. You're all set.");
        } catch (e) {
          console.error("[confirm-email]", e instanceof Error ? e.message : e);
          return page("Your email is confirmed. You're all set.");
        }
      },
    },
  },
});
