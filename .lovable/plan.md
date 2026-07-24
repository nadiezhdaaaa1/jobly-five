## Scope

Edit in place across Tracker + Job Drawer + tracker store. Reuse existing Apply modal, popup/dialog primitives, `InterviewReminderDialog`, and current design tokens/columns. No rebuilds.

## Files touched

- `src/lib/tracker-store.ts` — add `HistoryEntry` type + `history` on `JobRecord`; log helpers; extend `markApplied` / `setStatus` / `setReminder` / `setInterviewStage` / `setOfferStatus` and add `setRejectionDetails` / `setOfferDetails` to write entries.
- `src/routes/_authenticated/tracker.tsx` — reuse `ApplyModal` from Saved cards; route every column entry (drag OR "Move to") through the new transition popups; on Cancel, revert to source column.
- `src/components/app/JobDrawer.tsx` — replace the current PipelinePanel/OfferPanel/RejectionPanel layout with the spec's blocks: Header · Status (with Move to) · Stage block (contextual) · Reminder · Documents used · History.
- `src/components/app/TrackerTransitionDialogs.tsx` (new) — three small dialogs: `InterviewTransitionDialog`, `RejectedTransitionDialog`, `OfferTransitionDialog`. Built with existing `Dialog` primitive; Interview/Offer reuse the current `InterviewReminderDialog` date+time picker inline via a "Set reminder" toggle that opens it.
- `src/components/app/JobHistory.tsx` (new) — reverse-chronological list with `Jul 23 • 04:32 PM` format, hairline separators, muted timestamp + secondary description, empty state "No activity yet".

## PART A — Apply from Saved

Saved-column card's `Apply` button opens the shared `ApplyModal` (same as Digest) instead of the current inline dropdown. Confirming `markApplied` moves the job to Applied and records the chosen resume/cover letter — already wired in `markApplied`; we only add a history entry ("Applied (resume: X, cover letter: Y)").

## PART B — Transition popups (drag + "Move to")

Introduce a single dispatcher in `tracker.tsx`:

```
requestMove(jobId, target)
  target === "applied"   → open ApplyModal (source-of-truth for applied)
  target === "interview" → open InterviewTransitionDialog
  target === "rejection" → open RejectedTransitionDialog
  target === "offer"     → open OfferTransitionDialog
  target === "saved"     → apply immediately (no popup)
```

Both drag drop AND the card's "Move to" dropdown call `requestMove`. The dispatcher stashes the source column so Cancel can revert; status is only committed on Save.

Dialogs:

- Interview: required select prefilled `Recruiter screen` (options in spec order, no empty option, Save always enabled); "Set a reminder?" toggle revealing date+time picker; Save/Cancel.
- Rejected: optional textarea "What happened? (optional)"; Save/Cancel.
- Offer: required select prefilled `Waiting for my reply` (options: Waiting for my reply, Negotiating, Accepted, Declined); optional reminder; optional details textarea; Save/Cancel.

Cancel = no state change (source column preserved). Save = commit status, write stage/details/reminder, log history.

## PART C — Job drawer restructure

Drawer sections top-to-bottom:

1. Header (title, company, location, salary, match, applied date).
2. Status — current column + "Move to" control (routes through the same `requestMove` dispatcher; popups fire when applicable).
3. Stage block, contextual to current status:
   - Interview: stage select (same options, mandatory, pre-filled).
   - Offer: stage select + Offer details textarea.
   - Rejected: Rejection details textarea.
4. Reminder block: view/set/edit/remove using the existing `InterviewReminderDialog`.
5. Documents used (Applied+): resume + cover letter names from `record.appliedResumeName` / `appliedCoverLetterName`; "Generate follow-up letter" launches existing `FollowUpDialog`.
6. History (always last).

Editing any stage/details/reminder inline writes the same history entries as the popups.

The current Apply/Report/Dislike/Save row and Notes (Saved only) remain untouched.

## PART D — History log

Add `history: HistoryEntry[]` to `JobRecord` (default `[]`). Entry shape:

```
{ id: string; at: string /* ISO */; kind: HistoryKind; description: string }
```

Central `logHistory(id, description)` helper prepends new entries. Wire it into:

- `setStatus` → "Moved from {A} to {B}" (with human labels; skip on initial seed).
- `setInterviewStage` → "Interview stage changed from {A} to {B}".
- `setOfferStatus` → "Offer stage changed from {A} to {B}".
- `setReminder` → "Reminder was set on {date}", "Reminder changed to {date}", or "Reminder was removed".
- `markApplied` → "Applied (resume: X, cover letter: Y)".
- Saved/Unsaved via `setStatus` transitions in/out of `saved`.
- New setters `setRejectionDetails` / `setOfferDetails` → log a short "Rejection details updated" / "Offer details updated" line (kept short, not the full text).

`JobHistory` renders newest first with `MMM DD • hh:MM AM/PM` (add `shortDateTimeAmpm` to `dateHelpers`). Style: 1px `--border` hairlines between rows, `--text-muted` for timestamp, `--text-secondary` for description. Empty → "No activity yet".

## Acceptance mapping

1. Apply-on-Saved uses shared `ApplyModal`, lands job in Applied — handled by `requestMove` + `ApplyModal` + `markApplied`.
2/3/4. Interview / Rejected / Offer popups fire for both drag and Move to; Cancel reverts (source column preserved by dispatcher).
5. Interview + Offer selects are prefilled and never empty → Save always enabled.
6. Card click opens the restructured drawer with all six sections.
7. Drawer edits go through the same store setters used by popups → identical history entries.
8. History reverse-chronological, formatted per spec, covers status/stage/reminder events.

## Out of scope

- No new persistence layer, no schema changes; history lives in the existing in-memory tracker store alongside other fields.
- No visual redesign of columns, cards, or footer controls beyond swapping the Saved-card Apply flow.
- Notes field on Saved cards stays as-is.
