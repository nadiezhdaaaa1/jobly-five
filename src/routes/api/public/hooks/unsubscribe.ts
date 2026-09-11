import { createFileRoute } from "@tanstack/react-router";

/**
 * One-click unsubscribe (CAN-SPAM). No auth: the unsubscribe_token is the
 * credential. Idempotent — a repeat click must not 500.
 * GET  /api/public/hooks/unsubscribe?token=<uuid>[&channel=<name>]
 * POST /api/public/hooks/unsubscribe  { token, channel? }  (first-party)
 */
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
        const { suppressByToken } = await import("@/lib/unsubscribe.server");
        const result = await suppressByToken(token, {
          channel,
          userAgent: request.headers.get("user-agent"),
        });
        if (!result.ok) {
          return page("That unsubscribe link is not valid.", result.reason === "not_found" ? 404 : 400);
        }
        return page("You're unsubscribed. You won't receive these emails again.");
      },

      // First-party caller (the /preferences page). The token travels in the
      // body so it stays out of access logs and Referer headers. Always 200:
      // the page never surfaces a failure, and a 4xx would just be console noise.
      POST: async ({ request }) => {
        let token = "";
        let channel: string | null = null;
        try {
          const body: unknown = await request.json();
          if (body && typeof body === "object") {
            const b = body as { token?: unknown; channel?: unknown };
            if (typeof b.token === "string") token = b.token;
            if (typeof b.channel === "string") channel = b.channel;
          }
        } catch (e) {
          console.error("[unsubscribe] bad JSON body", e instanceof Error ? e.message : e);
        }

        const { suppressByToken } = await import("@/lib/unsubscribe.server");
        const result = await suppressByToken(token, {
          channel,
          userAgent: request.headers.get("user-agent"),
        });
        if (!result.ok) console.error("[unsubscribe] POST rejected:", result.reason);
        return Response.json(result.ok ? { ok: true } : { ok: false, reason: result.reason });
      },
    },
  },
});
