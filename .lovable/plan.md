
# Plan — Rework the "Let's set up your matches" quiz

All edits are in `src/routes/quiz.tsx` (with a tiny type addition in `src/lib/quiz-store.ts`). Header, page title/subtitle, tokens, and `StepShell` collapsed-summary layout stay as-is. No new dependencies.

## Global behavior

- Remove auto-advance everywhere. Every step gets a single `Continue` button (email step keeps its "Get my matches" primary).
- Add a shared `ContinueRow` used by Role, Stack, Experience, Location:
  - Disabled state: `bg-[color:var(--color-success-subtle)] text-[color:var(--color-text-muted)] cursor-not-allowed`.
  - Enabled state: `bg-[color:var(--color-green)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]`.
  - Full-width, height 48px, 4px radius, same focus ring as other buttons.
- `advance(step, patch)` merges the patch, clears `editing`, and lets `derivedCurrent` recompute so the next incomplete step opens. Editing via pencil re-expands in place without wiping later answers.

## Step 1 — Role (full-row scroll list)

- Keep search input.
- Replace chip grid with a bordered, internally scrollable container: `rounded-[4px] border ... max-h-[320px] overflow-y-auto divide-y divide-[color:var(--color-border)]`.
- Each row: full-width button, left radio circle + label. Selected row: green filled radio dot, subtle mint background, semibold text. Single-select.
- Filter rows by search query. Empty-state "No matches." row.
- `Continue` disabled until `answers.role` set. Click writes role and advances.
- Summary label `ROLE`, value = role name.

## Step 2 — Stack (full-row scroll checklist, role-independent)

- Keep search input.
- Selected chips row above the container (removable, `×` clears from selection).
- Container: bordered, scrollable (same styles as Role). Rows show a square checkbox + label; multi-select toggle. Shows the full `STACK_OPTIONS` list regardless of role — drop the role-derived pool idea from the earlier plan.
- Filter by search. `Continue` enabled once `value.length > 0`.
- Summary label `STACK`, value = selection in order joined by `, `.

## Step 3 — Experience (replaces Level)

- Extend `QuizAnswers` in `src/lib/quiz-store.ts`:
  ```ts
  years?: number;      // 0 = "<1", 20 = "20+"
  languages?: string[];
  ```
- Heading: "What's your experience?"
- 2×2 grid of Level cards (Junior/Mid/Senior/Lead). Each card: label left, small cube illustration right (inline SVG placeholder using tokens — no new assets). Selected card: solid green fill, checkbox mark left of label, dark text.
- "Years of experience" — single-range `<input type="range" min={0} max={20}>`. Right-aligned live readout: `<1 years`, `N years`, or `20+ years`. Tick row: `<1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20+` styled as muted labels beneath the track.
- "Spoken languages" — text input (`placeholder="e.g. English"`). Enter/comma adds a trimmed, deduped chip; Backspace on empty removes last chip. Chips shown below input with `×`.
- `Continue` enabled once a level is selected (years defaults to 0 = "<1"; languages optional per new spec — spec says "enabled once a level is chosen").
- Summary label `EXPERIENCE`, value = `{Level} · {years}y · {langs joined by " · "}` (skip empty parts). Years formatted as `<1y` at 0, `20+y` at 20.

## Step 4 — Location & salary (multi-select locations)

- "Open to remote" toggle row unchanged.
- Replace single `location` input with a multi-select:
  - Text input, placeholder `e.g. New York City, USA`.
  - Enter or comma commits trimmed, deduped chip; Backspace on empty removes last.
  - Chips row below input with `×` remove buttons, 4px radius, surface-1 background, border token.
  - Stored in `answers.locations: string[]` (add to `QuizAnswers`); stop reading/writing the old `location` field from this step.
- Salary range: keep dual-handle slider (already dual). Tick labels: `$60k, $100k, $140k, $180k, $220k`. Right-aligned readout `$100k – $160k`.
- `canContinue = (remote || locations.length > 0) && salaryMin < salaryMax`.
- Summary label `LOCATION AND SALARY`, value = locations joined by ` · ` (or `Remote` when remote and no locations) + ` · $100k–$160k`.
- Update `completed.loc` to require `remote || (locations && locations.length > 0)`.

## Step 5 — Email (unchanged behavior)

- Keep heading, subtitle, email input, "Get my matches" button with the same disabled→enabled mint/emerald states used by `ContinueRow`. No content changes.

## Summary labels

Update `SUMMARY_LABEL`:
```
role: "Role", stack: "Stack", level: "Experience",
loc: "Location and salary", email: "Email"
```
Update `summaryValue()` for `level` and `loc` per above.

## Verification

- `bunx tsgo --noEmit`.
- Playwright at 1280×1800: walk role → stack → experience → location → email; screenshot each expanded step and the final all-collapsed state; verify Continue disabled/enabled transitions and that pencil re-expands a step without discarding later answers.
