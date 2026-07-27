## Goal

Replace the current stage-as-column model in Tracker with a **column type** model:

- **Singletons** (mandatory, one per board, rename-only, cannot delete): `Saved`, `Applied`, `Offer`, `Rejected`.
- **Interview** (type): multiple allowed, rename + delete, at least one must always exist. Each Interview column owns its own **stage list** (CRUD).
- **Offer** (singleton) also owns a stage list (CRUD).
- When a card moves into an Interview or Offer column, prompt for a **stage** from that column's list. The chosen stage shows on the card and is editable inline via a stage dropdown.

## Default board


| Order | Type      | Title            | Stages (default)                        |
| ----- | --------- | ---------------- | --------------------------------------- |
| 1     | saved     | Saved            | —                                       |
| 2     | applied   | Applied          | —                                       |
| 3     | interview | Screen interview | Recruiter screen, Hiring manager screen |
| 4     | interview | Tech interview   | Tech screen, System design              |
| 5     | interview | Take-home        | Assigned, In progress, Submitted        |
| 6     | interview | Final interview  | Onsite, Panel, Culture, Executive       |
| 7     | offer     | Offer            | Received, Negotiating, Accepted         |
| 8     | rejected  | Rejected         | —                                       |


Take-home ships as an Interview-type column by default (user can rename/delete like any other).

## Data model changes (`src/lib/board-columns-store.ts`)

Replace `BoardStage` with a `ColumnKind`:

```text
ColumnKind = "saved" | "applied" | "interview" | "offer" | "rejected"
BoardColumn = { id, kind, title, stages: string[] }  // stages only used for interview | offer
```

Store shape (localStorage `jobly:board-columns:v2`, with one-time migration from v1):

- Enforce invariants inside the store:
  - Singletons (`saved`, `applied`, `offer`, `rejected`) always present exactly once.
  - `deleteColumn(id)` refuses to delete a singleton and refuses to delete the last remaining `interview` column.
  - `moveColumn` allowed for any column (including singletons — user asked for reorder freedom).
- Stage CRUD API: `addStage(colId, name)`, `renameStage(colId, oldName, newName)`, `deleteStage(colId, name)`, `reorderStages(colId, orderedNames)`. No-op on non-interview / non-offer columns.
- Migration: legacy stages `saved/applied/rejection/offer` map 1:1 to the singletons; legacy `interview_screen`, `interview_tech`, `test_task` become the default Interview columns above; any existing card `columnId` remaps to the new column ids.

## Card ↔ column changes (`src/lib/tracker-store.ts`)

- Replace `JobRecord.status`/stage-based routing with `columnId` as the single source of truth for board placement (status-based fallbacks stay only for archived / dismissed / reported flows).
- Add `JobRecord.stage?: string` — the chosen stage label within the current interview/offer column. Cleared when moved to a non-stage column.
- Update `setCardColumn(jobId, columnId, stage?)` to accept an optional stage; existing `setInterviewStage`/`setOfferStatus` collapse into `setStage(jobId, stage)`.
- History entries record column + stage transitions in plain English (e.g. "Moved to Tech interview · System design").

## UI: Edit columns dialog (`src/components/app/BoardColumnsDialog.tsx`)

- List all columns with reorder up/down, rename inline, delete button (disabled for singletons and for the last remaining interview column with a tooltip explaining why).
- "Add column" collapses to a single action: **Add Interview column** (only Interview type is user-addable). New column starts with an empty stage list.
- Below each interview/offer row, a **Stages** subsection: chip-style list with rename (inline), delete (X), reorder (drag or arrows), and an "Add stage" input. Deleting a stage that's in use on cards leaves those cards with the stage cleared (documented in a tiny helper line).
- "Reset to defaults" restores the default board above.

## UI: Move-in stage picker (`src/components/app/TrackerTransitionDialogs.tsx`)

- Replace the fixed `SCREEN_INTERVIEW_STAGES` / `TECH_INTERVIEW_STAGES` / offer-status dialogs with a single `StagePickerDialog` that reads the target column's stage list.
- Triggered from card `Move to` menu and from drag-drop into an interview/offer column. If the target column has zero stages, skip the dialog and just move.
- Existing Rejection dialog stays as-is (reason capture).

## UI: Kanban card (`src/routes/_authenticated/tracker.tsx`)

- Row 3 gains a stage chip for interview/offer cards: `{stage}` in Mint (interview) / Green-tinted (offer), clickable to open a small stage dropdown scoped to that card's column (same list as Edit columns).
- Column header stays as-is; column identity is now `column.title` + kind, no more hard-coded stage labels.
- `KANBAN_STAGES` array and stage-based rendering swap to iterating `columns` directly. `Row3` switches on `column.kind` not `stage`.

## Guardrails

- Deleting an interview column with cards inside: prompt "Move cards to …" (default = leftmost remaining interview column) or Archive them. Reuses the existing archive-reason dialog pattern.
- Renaming preserves ids, so all card `columnId` links remain valid.
- Filter/Digest code that reads `record.status` keeps working because we keep `status` for archive/dismiss/report flows; only board placement moves to `columnId`.

## Out of scope

- No changes to job matching, filters, digest, drawer content beyond stage display, or DB schema.
- No visual redesign of columns (bg, radius, gaps, header styles all stay).