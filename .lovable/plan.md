## Problem

You reported: when you click Edit on any earlier step, the "Location and salary" step is no longer visible as a collapsed summary card.

I could not reproduce it in scripted flows (seeded state + Edit Field/Role both leave the collapsed "Location and salary · Anywhere (remote) · $100k – $160k" card in place). That means the trigger is a specific answer combination I haven't hit yet. Rather than guess the root cause, I'll:

1. Harden the visibility rules so the step cannot silently vanish, and
2. Ask you for a quick repro so we confirm the underlying data condition.

## Changes in `src/routes/quiz.tsx`

### 1. Relax the `loc` completeness rule

Current rule (line 124–128):

```
loc:
  !!answers.workMode &&
  (answers.workMode === "remote" || (answers.locations?.length ?? 0) > 0) &&
  answers.salaryMin != null &&
  answers.salaryMax != null,
```

Change to: `loc` counts as completed as soon as `workMode` is set (plus a location if on-site). Missing `salaryMin` / `salaryMax` will no longer hide the step; the summary already handles missing values gracefully.

### 2. Persist salary defaults the moment `loc` becomes valid

When the user picks Remote or adds a location, if `salaryMin` / `salaryMax` are still null, immediately set them to the defaults (`100_000` / `160_000`) via `onChange`, so the answer state matches what's shown in the collapsed summary and downstream consumers (matches, submit payload) don't see nulls.

### 3. Add a `loc` visibility fallback

Mirror the pattern used for `role`/`hard`/`tools`/`soft`: introduce a `locEmptied` flag (set when `workMode` was previously chosen but then cleared) so the step still renders — collapsed with an "X" — instead of disappearing. This guarantees "Location and salary" is present in every rendered list once the user has touched it, no matter what upstream edits do.

### 4. Verify

After the change, walk both flows in the preview:
- Complete the full quiz, click Edit on each earlier step in turn, confirm the "Location and salary" summary card stays in the list.
- Reach `loc`, pick Remote → Continue without touching the sliders, then edit an earlier step; confirm the summary still shows "$100k – $160k".

## Follow-up question

To be sure we're fixing the right underlying cause, could you share one of:
- The exact order of clicks that makes the Location card disappear (e.g. "chose On-site, added Austin, TX, Continue, then clicked Edit Role"), or
- A screen recording / screenshots of the before-and-after states.

I'll incorporate that into the fix before flipping to build.
