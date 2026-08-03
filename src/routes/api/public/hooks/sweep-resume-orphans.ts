import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily orphan sweep for the private `resumes` bucket.
 *
 * An upload that succeeds but fails registration leaves a file with no
 * `resume_documents` row. Anything older than 24h without a row is deleted.
 * Caller must present the project's publishable/anon key in `apikey`.
 */
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/sweep-resume-orphans")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
        const presented = request.headers.get("apikey") ?? "";
        if (!expected || presented !== expected) {
          return json({ ok: false, error: "Unauthorized" }, 401);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: rows, error: rowsError } = await supabaseAdmin
          .from("resume_documents")
          .select("file_path")
          .is("deleted_at", null);
        if (rowsError) return json({ ok: false, error: rowsError.message }, 500);
        const known = new Set((rows ?? []).map((r) => r.file_path));

        const { data: prefixes, error: prefixError } = await supabaseAdmin.storage
          .from("resumes")
          .list("", { limit: 1000 });
        if (prefixError) return json({ ok: false, error: prefixError.message }, 500);

        const cutoff = Date.now() - ORPHAN_MIN_AGE_MS;
        const orphans: string[] = [];

        for (const folder of prefixes ?? []) {
          const { data: files } = await supabaseAdmin.storage
            .from("resumes")
            .list(folder.name, { limit: 1000 });
          for (const f of files ?? []) {
            const path = `${folder.name}/${f.name}`;
            if (known.has(path)) continue;
            const created = f.created_at ? Date.parse(f.created_at) : 0;
            if (created && created > cutoff) continue;
            orphans.push(path);
          }
        }

        let removed = 0;
        if (orphans.length) {
          const { error: removeError } = await supabaseAdmin.storage.from("resumes").remove(orphans);
          if (removeError) return json({ ok: false, scanned: known.size, orphans: orphans.length, error: removeError.message }, 500);
          removed = orphans.length;
        }

        console.log(`[resumes] orphan sweep removed ${removed} file(s)`);
        return json({ ok: true, knownRows: known.size, removed });
      },
    },
  },
});
