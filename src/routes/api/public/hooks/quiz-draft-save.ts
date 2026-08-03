import { createFileRoute } from "@tanstack/react-router";

/**
 * Raw-HTTP twin of `saveQuizDraft`, for `navigator.sendBeacon` on tab close.
 * Anonymous by design: the quiz runs before an account exists.
 */
export const Route = createFileRoute("/api/public/hooks/quiz-draft-save")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { rateLimited, saveDraft } = await import("@/lib/quiz-draft.server");
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        if (rateLimited(ip)) {
          return new Response(JSON.stringify({ ok: false }), { status: 429 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ ok: false }), { status: 400 });
        }
        const result = await saveDraft(body as never);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
