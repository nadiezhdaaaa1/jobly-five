## Scope

Edit in place. Reuse existing tokens/components. No new screens outside the two new Profile sub-tabs.

## 1. Store layer

**`src/lib/profile-store.ts`** — extend existing store:
- `ResumeFile { id, name, size, uploadedAt, dataUrl?, isDefault }[]` — replaces the single `portfolioFile`/`cvFile` shape for Apply purposes. Keep old fields for back-compat.
- `CoverLetter` — already exists; add `isDefault: boolean`.
- Actions: `addResume`, `deleteResume`, `setDefaultResume`, `setDefaultCoverLetter`.

**`src/lib/tracker-store.ts`** — extend `JobRecord`:
- `appliedResumeName?: string`
- `appliedCoverLetterName?: string`
- Action `markApplied(id, { resumeName, coverLetterName })` that sets status=applied + fields + `appliedAt`/`movedAt`.

**New `src/lib/digest-session-store.ts`** — session-only (not localStorage) map `jobId → "applied" | "disliked" | "reported"`. Cleared on reload. Actions: `setSession`, `clearSession`, `useSessionState(id)`.

## 2. Apply modal

**New `src/components/app/ApplyModal.tsx`**:
- Props: `{ job, open, onClose, onApplied }`.
- Reads resumes + cover letters from profile store; default-selected = the default-flagged entry (fallback: first).
- Layout per spec: header (title · company truncated), Resume select + Download, Cover letter select + Download, empty-state links to `/profile?tab=documents` / `/profile?tab=cover-letters`, two buttons.
- "Apply on company site" → `window.open(job.applyUrl ?? '#', '_blank')`; on window focus return, show inline `<AlertDialog>` "Did you apply?" (Yes / Not yet). Yes → `onApplied`; Not yet → close, no state.
- "I already applied" → `onApplied` immediately.
- `onApplied` calls `markApplied(...)` in tracker store + `setSession(job.id, "applied")` if invoked from Digest.

## 3. Digest wall (`src/routes/_authenticated/dashboard.tsx`)

- Wire Apply button on `FullJobCard` and any Save-card variant to open ApplyModal (replace the current inline choice).
- Card state selection: read from tracker record + session store.
  - Persistent: `default` or `saved` only.
  - If session state exists → render collapsed one-line card (`CompactAppliedRow`, `CompactDisliked`, `CompactReported`).
  - All tracker states other than saved that don't have a session entry → still render Default (fresh feed on reload). Since seeds set some cards to applied/interview etc., ignore those on Digest — treat as default for card variant selection.
- Thumbs-down popover:
  - "Dislike reasons": 3 items → `setSession(id, 'disliked')` (no tracker write).
  - "Report this job": 3 items → `setSession(id, 'reported')`.
- Collapsed cards: 6px radius, muted surface, one-line, session-only. "Applied" → link "View in Tracker".

## 4. Filter defaults from profile

- `defaultFilters()` becomes `defaultFiltersFromProfile(quiz)`:
  - roles = quiz roles (all selected, unselect-only). Add hint "To add a role, edit your Profile."
  - minMatch 50, salary floor from quiz lowest, posted "any", locations from quiz (remote only if none), english from quiz, experience from quiz, sources = all boards.
- Reset restores this profile-derived default.
- Remove UI for adding roles in the Roles filter block.

## 5. Tracker (`src/routes/_authenticated/tracker.tsx`)

- Saved column: Save toggle already unsaves (verify) — leaves column, becomes available again on Digest.
- Apply on Saved card → open ApplyModal → on applied, move to Applied column with resume/cover letter used.
- Applied cards:
  - Show `appliedAt` + resume + cover letter names (small meta line).
  - "Move to" dropdown (Saved | Interview | Rejected | Offers).
  - "Generate follow-up letter" → open small dialog with a generated template body + Copy / Download .txt.
- X button remains on Applied+.

## 6. JobDrawer (`src/components/app/JobDrawer.tsx`)

- Apply button opens ApplyModal instead of current dropdown.
- Keep "Already applied" no longer needed inline — it's a modal button now.

## 7. Profile (`src/routes/_authenticated/profile.tsx`)

Two tabs already stubbed (`documents`, cover letters block exists in Cover Letters tab). Upgrade to spec:

**Documents tab:**
- Drop-zone + file picker (PDF/DOCX, ≤5MB). Multi-file.
- List: name, upload date, size, per-row Download / Delete / Set as default (star or "Default" tag on active).
- Empty state.

**Cover Letters tab:**
- Templates list with Edit / Delete / Set as default.
- Editor: name + textarea body (existing rich-text OK), with legend "Available placeholders: `{{company}}`, `{{hr_name}}`".
- "New template" button.
- Limit 5 (existing).

## Acceptance

Matches the 9 acceptance points in the request. No visual/design token changes.

## Technical notes

- Files stored as base64 dataURLs in localStorage — reuse existing pattern from resume-store; cap total profile storage to avoid quota, warn if exceeded.
- ApplyModal built on existing `Dialog` component (`components/ui/dialog`).
- "Did you apply?" uses `window.addEventListener('focus', once)` scheduled after `window.open`.
- Session store uses a plain module-level `Map` + `useSyncExternalStore`; nothing persisted.
