import { createFileRoute } from "@tanstack/react-router";

/**
 * Postmark bounce and spam-complaint webhook. Suppresses the address; never
 * deletes consent history. Caller must present the project's anon key in
 * `apikey` (configure it on the Postmark webhook URL as a header).
 */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/postmark-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
        if (!expected || (request.headers.get("apikey") ?? "") !== expected) {
          return json({ ok: false, error: "Unauthorized" }, 401);
        }
        let payload: Record<string, unknown>;
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ ok: false, error: "Invalid JSON" }, 400);
        }

        const email = typeof payload["Email"] === "string" ? payload["Email"].trim().toLowerCase() : "";
        const recordType = String(payload["RecordType"] ?? "");
        const bounceType = String(payload["Type"] ?? "");
        if (!email) return json({ ok: true, ignored: "no email" });

        let reason: string | null = null;
        if (recordType === "SpamComplaint") reason = "spam_complaint";
        else if (recordType === "Bounce" && /HardBounce|BadEmailAddress|Blocked/i.test(bounceType))
          reason = "hard_bounce";
        if (!reason) return json({ ok: true, ignored: recordType || "unhandled" });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: existing } = await supabaseAdmin
            .from("email_contacts")
            .select("email, suppressed_at")
            .eq("email", email)
            .maybeSingle();
          if (!existing) {
            await supabaseAdmin.from("email_contacts").insert({
              email,
              suppressed_at: new Date().toISOString(),
              suppression_reason: reason,
            });
          } else if (!existing.suppressed_at) {
            await supabaseAdmin
              .from("email_contacts")
              .update({ suppressed_at: new Date().toISOString(), suppression_reason: reason })
              .eq("email", email);
          }
          return json({ ok: true, suppressed: reason });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Webhook failed";
          console.error("[postmark-webhook]", message);
          return json({ ok: false, error: message }, 500);
        }
      },
    },
  },
});
