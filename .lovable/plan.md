# Tracker v2 Rebuild

Rewrite `src/routes/_authenticated/tracker.tsx` from scratch against the v2 spec. Reuse the shared `tracker-store`, existing `JobDrawer`, and `InterviewReminderDialog`. Do NOT touch design tokens, Digest, drawer internals, or reminder popup internals.

## 1. Data source: shared store, not local state

Delete the local `Application[]` / `INITIAL` array and local `useState`. The tracker reads jobs from `TODAY_JOBS`/`YESTERDAY_JOBS` (+ any older days already exposed in `jobs-data`) joined with `useJobRecord` from `@/lib/tracker-store`. Status, dates, reminders, notes all come from the store — the same source the Digest and Drawer already mutate. This is what makes drag/drop, dropdowns, and drawer edits stay in sync.

If the current mock jobs pool doesn't have ~15 items distributed across states (5 Saved, 4 Applied, 3 Interview incl. one with reminder today + one upcoming + one none, 2 Offer, 1 Rejection), extend `src/lib/jobs-data.ts` seed `initialState`s and add a small seed pass in `tracker-store` for reminders (one today ISO, one future ISO) so the target distribution is guaranteed on first load.

## 2. Header

- H1 "Tracker" + muted counter `{total} applications` where total = count of records whose status ∈ {saved, applied, interview, offer, rejection}. Drop the "· N need a follow-up" fragment.
- Right: segmented tabs `Ongoing · Received offers · Rejections` (dark fill active, plain inactive in a 1px bordered container, 4px radius). Local `useState` `tab: "ongoing" | "offers" | "rejections"`, default `ongoing`.

## 3. Tab 1 — Ongoing (Kanban)

Three equal columns `Saved · Applied · Interview` with header (name + gray count tag), 12px vertical gaps.

**Sorting:** newest-first by the timestamp of the current status (`savedAt` / `appliedAt` / `interviewAt`), descending. Cards freshly moved land on top automatically.

**Drag & drop:** HTML5 DnD. On `dragover` set `dropTarget = column`; render a 2px dashed placeholder slot **above** the first card (never bottom). On drop → `setStatus(id, target)`. Dropping into Interview also opens `InterviewReminderDialog` (same shared dialog).

**Card:** reuse the Digest card anatomy (logo square, title, meta, 52px ScoreRing, tags). Card body click opens `JobDrawer`.

**Footer controls (regime by status):**
- Saved: thumbs-down dropdown (Dislike → `dismissed`; Report → `reported`), bookmark active (green stroke, mint fill) which un-saves (`setStatus(id, "default")`), Apply dropdown (Tailor resume disabled + Coming soon, Cover letter disabled + Coming soon, divider, Open posting → new tab + "Did you apply?" toast → Yes moves to Applied).
- Applied & Interview: X dropdown (Remove from tracker → `default`; Report → `reported`), no bookmark, Status dropdown button (`Applied ⌄` / `Interview ⌄`) with options Applied · Interview · Received offer · Rejection. Selecting Interview opens reminder dialog. Offer/Rejection move card off the Ongoing board.
- Interview cards also show reminder chip in footer: calendar + `shortDateTime(reminderAt)`, mint/gray if upcoming, `#FFEDD4` if today (use `dateHelpers.isSameLocalDay`). Omit if no reminder.

**Empty states:** per column dashed slot "Nothing here yet"; board fully empty → centered "Nothing tracked yet" + accent `Open digest` link to `/dashboard`.

## 4. Tab 2 — Received offers

CSS grid, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, gap 12px. Header row inside content area: "Received offers" + count tag. Sorted newest-first by `offerAt`.

Card footer: X dropdown (Remove / Report), Status dropdown `Offer ⌄` with same 4 options (moves back to Ongoing board if Applied/Interview). Mint date tag: `Received {shortDate(offerAt)}`. No thumbs-down, no bookmark, no Apply.

## 5. Tab 3 — Rejections

Same grid as offers. Header "Rejections" + count. Sorted newest-first by `rejectionAt`. Card footer: X dropdown, Status dropdown `Rejection ⌄`. Red-subtle date tag (`#FFE2E2` bg, `#D00D01` text): `Received {shortDate(rejectionAt)}`. Media/title dimmed ~70% opacity, controls full opacity.

## 6. Shared bits to add

- A small `StatusDropdown` component (bordered button, chevron, options list) used in Applied/Interview/Offer/Rejection footers.
- An `IconMenu` popover for the thumbs-down and X menus (danger red on Report).
- An `ApplyMenu` popover matching the Digest's (same three items and confirm toast). If a reusable one exists in the Digest file, extract it into `src/components/app/` and import from both; otherwise copy the pattern here.
- Reminder dialog is triggered via the same `InterviewReminderDialog` already in the drawer flow; opening it on drop or on status→Interview writes `reminderAt` via `setReminder`.

## 7. Drawer wiring

Card body click sets `openId`. Render existing `JobDrawer` (unchanged). All its mutations already flow through the store, so Kanban/tabs/counts refresh automatically.

## 8. Files touched

- `src/routes/_authenticated/tracker.tsx` — full rewrite.
- `src/lib/jobs-data.ts` — only if needed to guarantee the 5/4/3/2/1 mock distribution and reminder ISOs.
- `src/lib/tracker-store.ts` — optionally add a small seed for two interview reminders (one today, one upcoming) so the orange/gray chips both show on first load.

Untouched: AppNav, JobDrawer internals, InterviewReminderDialog internals, Digest, design tokens.
