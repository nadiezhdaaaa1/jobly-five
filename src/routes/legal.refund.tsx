import { createFileRoute } from "@tanstack/react-router";

/**
 * The Refund Policy was replaced by the Cancellation Policy (September 2026 legal
 * package). The old URL is in the sitemap and in sent email, so it must keep
 * working as a real server-side 301 rather than a client-side bounce.
 */
export const Route = createFileRoute("/legal/refund")({
  server: {
    handlers: {
      GET: async () =>
        new Response(null, {
          status: 301,
          headers: { Location: "/legal/cancellation", "Cache-Control": "public, max-age=3600" },
        }),
    },
  },
});
