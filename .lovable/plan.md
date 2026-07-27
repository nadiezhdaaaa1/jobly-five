# Real jobs via ATS direct feeds (Greenhouse + Lever + Ashby)

Replace the current mock/seeded jobs in the `jobs` table with real, live postings pulled directly from company Applicant Tracking Systems. No third-party aggregator, no API keys required for Greenhouse and Lever; Ashby uses the existing connector gateway.

## How it works

1. Maintain a small curated list of ~80–120 companies with their ATS handles (e.g. `stripe` on Greenhouse, `netflix` on Lever). Stored in a new `job_sources` table so we can add/remove companies later without a code deploy.
2. A scheduled sync endpoint fetches each company's public job feed, normalizes the response into Jobly's job shape, and upserts into the existing `jobs` table.
3. A cron job (pg_cron + pg_net) hits the endpoint every 6 hours.
4. Postings not seen in the latest sync for >48h get pruned so stale jobs disappear.

## Data sources

- **Greenhouse Job Board API** — `https://boards-api.greenhouse.io/v1/boards/{handle}/jobs?content=true`. Public, no auth, returns title, location, department, content (HTML description), absolute_url.
- **Lever Postings API** — `https://api.lever.co/v0/postings/{handle}?mode=json`. Public, no auth, returns categories (team, location, commitment), descriptionPlain, hostedUrl.
- **Ashby** — via existing connector gateway (`POST /job.list`). Optional; only enabled if the user later links an Ashby connection. Not required for launch.

All three are **"Direct employer"** — the `source` field will reflect the ATS (`greenhouse` / `lever` / `ashby`) and Jobly's existing Direct/Aggregated badge stays truthful.

## Schema changes (migration)

```text
job_sources
  id            uuid pk
  ats           text  ('greenhouse' | 'lever' | 'ashby')
  handle        text  (company slug on the ATS)
  company_name  text
  company_domain text
  company_sector text
  enabled       boolean default true
  last_synced_at timestamptz
  unique (ats, handle)

jobs (additive columns)
  external_id      text   (e.g. 'greenhouse:stripe:4567890')
  external_url     text   (apply link — hostedUrl / absolute_url)
  source_ats       text
  last_seen_at     timestamptz
  raw_description  text   (HTML/plain from the ATS, used for the drawer)
  unique (external_id)
```

`jobs.id` stays `text` (matches current schema). New rows use `external_id` as `id`. Existing seeded mock rows get deleted in the same migration since we're replacing.

RLS: `job_sources` — admin-only writes, no public read (managed via SQL/admin). `jobs` — existing "readable by everyone" policy is kept.

## Sync endpoint

`POST /api/public/hooks/sync-jobs` (TanStack server route, `src/routes/api/public/hooks/sync-jobs.ts`)

- Authenticated with Supabase anon `apikey` header (cron pattern).
- For each enabled row in `job_sources`:
  - Fetch feed with a 10s timeout and small concurrency (e.g. 5 parallel).
  - Normalize each posting → Jobly job shape (title, location, work_mode inferred from location string, company, stack/hard_skills/tools/roles derived from title + description via a lightweight keyword extractor already used by the mock generator, salary parsed when the ATS exposes it — Greenhouse/Lever rarely do, so `salary_min/max` stay nullable).
  - Upsert on `external_id`, set `last_seen_at = now()`.
- After all sources processed: `DELETE FROM jobs WHERE last_seen_at < now() - interval '48 hours' AND external_id IS NOT NULL`.
- Return `{ synced, inserted, updated, pruned, errors }`.

Normalization lives in `src/lib/job-sync/` (server-only, `.server.ts` files): `greenhouse.server.ts`, `lever.server.ts`, `ashby.server.ts`, `normalize.server.ts`. The existing keyword-extraction logic from the mock generator moves here.

## Cron

pg_cron every 6 hours calling the endpoint via pg_net with the anon `apikey` header. First run triggered manually right after deploy so the user sees real jobs immediately.

## Curated company seed list

Seeded in the migration — a mix of well-known tech employers across sectors so the Digest feels alive on day one. Roughly:

- Greenhouse: Stripe, Airbnb, DoorDash, Instacart, Robinhood, Coinbase, Figma, Notion, Vercel, Cloudflare, Anthropic, Scale AI, Ramp, Brex, Retool, Linear, Zapier, Discord, Reddit, Shopify, Pinterest, Twilio, Datadog, Snowflake, Confluent, MongoDB, HashiCorp, Elastic, GitLab, DigitalOcean… (~50)
- Lever: Netflix, Spotify, KAYAK, Blockchain.com, Eventbrite, Attentive, Fivetran, Ironclad, Angi, Rippling… (~30)
- Ashby: (empty at launch; grows if user links Ashby connector)

User can add/remove companies later via a small admin surface (out of scope for this change — direct SQL edits to `job_sources` for now).

## Frontend impact

Minimal. `src/lib/jobs-store.ts` already reads from the `jobs` Supabase table, so the Digest, Matches, Job Drawer, and Tracker keep working. Two small changes:

- `JobDrawer.tsx` "Open original job posting" and Digest "Apply" buttons use `external_url` when present (falls back to current behavior otherwise).
- Company logo lookup: current asset archive stays; unmatched companies fall back to a generated monogram avatar so a job without a bundled logo still renders cleanly.

## Rollout

1. Migration: add columns, `job_sources` table, delete existing mock jobs, seed `job_sources`.
2. Add server route + normalizers.
3. Wire `external_url` in the two UI spots.
4. Add pg_cron schedule.
5. Trigger a manual sync and verify the Digest shows real jobs.

## Technical details

- No new secrets required for Greenhouse/Lever. Ashby uses `LOVABLE_API_KEY` + `ASHBY_API_KEY` via the connector gateway, only if a connection is linked.
- Fetches run in the Cloudflare Worker runtime — plain `fetch`, no Node-only deps.
- Per-source failures are caught and reported in the response; one bad feed does not fail the whole sync.
- Rate-safe: at ~120 companies × 1 request each every 6h, we're well under any ATS's fair-use limit.
- No frontend changes to filters, match logic, or Tracker — the normalized rows keep the same shape as today's mock rows.
