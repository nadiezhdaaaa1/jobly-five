## Tracker: new stages + custom columns

### 1. Column model refactor
Move from the fixed DB enum (`default | saved | applied | interview | offer | rejection | ...`) to a two-layer model:

- **Stage** = stable canonical bucket used for logic, reminders, tags, history. Extend to:
  `saved`, `applied`, `interview_screen`, `interview_tech`, `test_task`, `offer`, `rejection`, `dismissed`, `reported`.
- **Board columns** = per-user ordered list of columns; each column maps to one stage. Default order:
  `Saved → Applied → Screen interview → Tech interview → Test task → Offer → Rejected`.

Stored in a new `src/lib/board-columns-store.ts` (localStorage, per-user), shape:
```ts
type BoardColumn = { id: string; title: string; stage: Stage; };
```

Users can:
- Rename a column (title only, stage unchanged).
- Reorder columns (drag or ↑/↓ buttons in an "Edit columns" dialog).
- Add a custom column (choose which stage it belongs to; multiple columns can share a stage, cards keep a `columnId` preference).
- Delete a custom column (its cards fall back to the default column for that stage).
- Reset to defaults.

### 2. Database migration
Extend `job_status` enum with `interview_screen`, `interview_tech`, `test_task`. Keep old `interview` value for backward compatibility; existing `interview` rows are migrated to `interview_screen` in the same migration. Add optional `column_id text` to `user_job_state` so cards remember which custom column they sit in.

### 3. Reminders + status logic
- Reminders currently gated to `interview` and `offer` → extend to `interview_screen`, `interview_tech`, `test_task`, `offer`.
- Transition dialogs (`TrackerTransitionDialogs.tsx`): rename "Interview" flow into two triggers (Screen / Tech) plus a new "Test task" flow (deadline reminder like interview). Rejection dialog unchanged, applied to any active stage.
- History labels + tag colors updated for the new stages (mint like interview/offer).

### 4. UI
- `tracker.tsx`: render columns from the store instead of a hard-coded array. Existing DnD keeps working; drop target = column, which resolves stage.
- New **Edit columns** dialog opened from a small pencil/settings button in the Tracker header. Lists columns with drag handles, rename input, delete (custom only), "Add column" (title + stage select), and "Reset to defaults". Mobile: same dialog, columns still stack vertically.
- Column headers show the user-defined title; default titles for the new stages: "Screen interview", "Tech interview", "Test task", "Rejected" (moved to last).
- Job Drawer "Move to" menu: uses the same column list; rejection stays last.
- Dashboard hides jobs that are in any active tracker stage (same rule, extended to new stages).

### 5. Migration for existing users
On first load after this change, if the local board-columns store is empty, seed with the new default order. Any locally saved `interview` cards get remapped to `interview_screen` client-side too (mirrors the DB migration).

### Files touched
- `supabase` migration (enum + column)
- `src/lib/tracker-store.ts` — extend `JobStatus`, mappers, reminder logic, dashboard filter
- `src/lib/board-columns-store.ts` — NEW
- `src/routes/_authenticated/tracker.tsx` — columns from store, header edit button
- `src/components/app/BoardColumnsDialog.tsx` — NEW (edit columns UI)
- `src/components/app/TrackerTransitionDialogs.tsx` — new flows for screen/tech/test-task
- `src/components/app/JobDrawer.tsx` — updated Move-to list, reminder gating, tag colors
- `src/routes/_authenticated/dashboard.tsx` — active-stage filter update

### Open question before I build
Do you want the split-interview + test-task rollout for **all users automatically** (with the default order I described), or should it be opt-in via the "Edit columns" dialog while existing users keep a single "Interview" column? Default plan is: auto-apply the new default order for everyone, existing "Interview" cards land in "Screen interview".
