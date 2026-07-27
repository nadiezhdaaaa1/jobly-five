## Problem

Profile has Designer roles (e.g., "Product Designer"), but the Digest still surfaces "Product Manager" jobs.

Root cause (confirmed in `src/lib/match.ts`): `rolesOverlap` has a loose fallback that matches by the first token of the user role against the **job title**. For a user role "Product Designer", the fallback token is `"product"` (length > 3), so any job whose title contains "product" — including every "Product Manager" listing — passes. This runs both in the match scorer and in the Digest's role hard-filter (`applyFilters` in `src/routes/_authenticated/dashboard.tsx`), so PM roles leak into a Designer's Digest.

Additional gap: the `field` filter value (e.g. "Design") is tracked in filter state but never actually applied inside `applyFilters` — only counted in `activeFilterCount`.

## Fix

1. **Tighten `rolesOverlap` in `src/lib/match.ts`** so a role only matches when the job's own role tags say so:
   - Match if any user role equals a job role (case-insensitive), OR
   - Match if a user role's `roleId` (or normalized slug) is present in `job.roleIds`.
   - Remove the loose "first token appears in job title" fallback that lets "Product Designer" match "Product Manager".
2. **Enforce `field` in `applyFilters`** (`src/routes/_authenticated/dashboard.tsx`): when `f.field !== "Any"`, require at least one of the job's roles to belong to `FIELD_ROLES[f.field]`. This gives a second guardrail so a "Design" selection can never surface a Product/Engineering row even if a stray tag overlaps.
3. **Sanity check the sample data**: run a quick read against `public.jobs` to confirm the designer-titled rows actually carry designer role tags (not PM ones); if any rows are mis-tagged, note it but do not change data as part of this plan.

No UI, styling, or data-model changes. Behavior is stricter role filtering only.
