import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { fetchGreenhouse } from "@/lib/job-sync/greenhouse.server";
import { fetchLever } from "@/lib/job-sync/lever.server";
import type { JobSourceRow, NormalizedJob } from "@/lib/job-sync/types.server";

function admin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function runWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<Array<{ item: T; result?: R; error?: string }>> {
  const results: Array<{ item: T; result?: R; error?: string }> = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      try {
        const result = await fn(item);
        results.push({ item, result });
      } catch (e) {
        results.push({ item, error: e instanceof Error ? e.message : String(e) });
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function runSync() {
  const sb = admin();
  const { data: sources, error } = await sb
    .from("job_sources")
    .select("id, ats, handle, company_name, company_sector, company_domain")
    .eq("enabled", true);
  if (error) throw new Error(`load sources: ${error.message}`);
  const rows = (sources ?? []) as JobSourceRow[];

  const perSource = await runWithConcurrency(rows, 5, async (src) => {
    let jobs: NormalizedJob[] = [];
    if (src.ats === "greenhouse") jobs = await fetchGreenhouse(src);
    else if (src.ats === "lever") jobs = await fetchLever(src);
    return jobs;
  });

  const allJobs: NormalizedJob[] = [];
  const errors: Array<{ handle: string; ats: string; error: string }> = [];
  const now = new Date().toISOString();

  for (const p of perSource) {
    if (p.error) {
      errors.push({ handle: p.item.handle, ats: p.item.ats, error: p.error });
      await sb.from("job_sources").update({ last_error: p.error, last_synced_at: now }).eq("id", p.item.id);
      continue;
    }
    allJobs.push(...(p.result ?? []));
    await sb.from("job_sources").update({ last_error: null, last_synced_at: now }).eq("id", p.item.id);
  }

  // Upsert in chunks of 500 (id already equals external_id)
  let inserted = 0;
  const upsertRows = allJobs.map((j) => {
    const { external_id: _ignore, ...rest } = j;
    return { ...rest, last_seen_at: now };
  });
  for (let k = 0; k < upsertRows.length; k += 500) {
    const chunk = upsertRows.slice(k, k + 500);
    const { error: upErr } = await sb.from("jobs").upsert(chunk, { onConflict: "id" });
    if (upErr) errors.push({ handle: "-", ats: "upsert", error: upErr.message });
    else inserted += chunk.length;
  }

  // Prune anything not seen in 48h that has a source_ats set
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { count: pruned, error: pruneErr } = await sb
    .from("jobs")
    .delete({ count: "exact" })
    .lt("last_seen_at", cutoff)
    .not("source_ats", "is", null);
  if (pruneErr) errors.push({ handle: "-", ats: "prune", error: pruneErr.message });

  return {
    ok: true,
    sources_synced: rows.length,
    jobs_upserted: inserted,
    pruned: pruned ?? 0,
    errors,
  };
}

export const Route = createFileRoute("/api/public/hooks/sync-jobs")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await runSync();
          return Response.json(result);
        } catch (e) {
          return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
      GET: async () => {
        try {
          const result = await runSync();
          return Response.json(result);
        } catch (e) {
          return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});