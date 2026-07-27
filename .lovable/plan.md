
## Problem

The Digest is showing jobs that don't line up with the roles the user picked in their profile. Two confirmed root causes:

1. **The sync extractor is too coarse.** Of 5,584 synced jobs, 3,234 are labeled `"Other"` and 1,921 as `"Software Engineer"` (generic bucket that catches every title containing "engineer"). Granular titles the quiz offers — "Frontend Engineer", "ML Engineer", "UX Researcher", etc. — either get collapsed into "Software Engineer" or fall through to "Other".
2. **The matcher only compares role labels.** `rolesOverlap` in `src/lib/match.ts` does substring compares between the user's role labels and `job.roles`. So a user who picked "Frontend Engineer" gets no overlap against a job labeled "Software Engineer", even when its title clearly says "Senior Frontend Engineer".

Result: most jobs fall into the generic bucket, and strict role filtering ends up showing near-random results.

## Fix

### 1. Taxonomy-driven role patterns (new file)

Add `src/lib/role-patterns.ts` — one export mapping each quiz-taxonomy role label (from `src/data/jobly_taxonomy.json`, ~110 roles) to an ordered list of title-keyword regexes. Ordered most-specific first so "Frontend Engineer" wins over "Software Engineer", "ML Engineer" over "Data Engineer", etc.

Client-safe module (no server imports) so both the extractor and the matcher can use it.

### 2. Smarter server-side extraction

Update `src/lib/job-sync/keywords.server.ts`:
- Replace the hand-written `ROLE_MAP` with a scan through the new patterns file, in order, collecting all roles whose regex matches the title.
- Only fall back to "Software Engineer" when the title still contains a generic "engineer/developer" token; otherwise fall back to "Other".
- Keep the `group` inference (Engineering / Data / Design / Product / …).

### 3. Title-aware client matcher

Update `rolesOverlap` in `src/lib/match.ts`:
- For each user role, look up its patterns and test them against `job.title` directly.
- Keep the existing label-vs-label check as a secondary path (covers taxonomy roles that don't appear in the title but are still labeled correctly).
- Everything else (score weighting, English/seniority/skills) stays untouched.

### 4. Backfill existing rows

After the code lands, re-run the sync endpoint once. `sync-jobs` upserts by `id`, so live listings get their `roles` / `role_ids` / `group` overwritten with the new, more accurate values. No migration needed. Stale rows that are no longer in an ATS feed keep old labels but are pruned on the next 48h cycle.

## Files touched

- `src/lib/role-patterns.ts` — new, client-safe patterns map
- `src/lib/job-sync/keywords.server.ts` — use the patterns for `extractRoles`
- `src/lib/match.ts` — `rolesOverlap` matches user role → job title via patterns
- Trigger `/api/public/hooks/sync-jobs` once to backfill

## Verification

- `SELECT unnest(roles), count(*)` should show a much flatter distribution (Frontend / Backend / ML / etc.) with far fewer rows in "Other" or "Software Engineer".
- In the UI, a profile with only "Frontend Engineer" selected should return only frontend-shaped titles in the Digest; switching to "Data Scientist" should swap the list.

## Out of scope

- No schema changes.
- No changes to filter UI, match-score formula, or skills extraction.
- Adding a similarity/embedding matcher — the pattern approach is enough for the taxonomy we ship.
