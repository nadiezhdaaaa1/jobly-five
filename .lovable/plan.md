## Resume tab — plan

Build the Resume screen at `/resume` behind the `_authenticated` layout, matching the spec. Keep it purely frontend/mock — no backend, resume state stored in a shared client store so the Digest profile card can react.

### Files

**New** `src/routes/_authenticated/resume.tsx`
- Route with `AppHeader active="resume"` + `MobileTabBar`.
- Layout: max-w-1200 / 24px gutters. ≥1024px: main column + 280px sticky right rail; below: single column with rail after main.
- H1 "Resume" (Stack Sans 400, 24px). Muted 13px "Used to score your matches since Jul 20" only when a resume exists.
- Two states driven by shared store (`hasResume`):
  - **Empty**: intro line + two entry cards (Upload / LinkedIn import), 6px radius, 20px padding, hover border→`--border-strong`, 34px mint square icon (4px).
    - Card 1 click → inline dropzone panel replacing cards (dashed 1px `--border-strong`, 8px radius, 160px, "Drop your resume here or **browse**", subtext), required consent checkbox gating browse/drop, Back link.
    - Card 2 click → instruction panel: heading, 4 numbered ordered-list steps (22px `--surface-2` circles + 14px text, 1px separators), secondary "Open my profile" button (new tab), same dropzone + consent + muted "We read the file you give us…" note.
  - **Upload → parse states**: uploading (thin 4px `--accent` progress on `--surface-2`), parsing (editor skeleton + "Reading your resume…"), success (transition to editor with dismissible mint banner), error (`--danger-subtle` hint + "Try again"). Simulated with timeouts.
  - **Editor**: stacked section cards (8px radius, 20px padding, 16px gaps). Section heading 15px/600 + pencil top-right, one-at-a-time edit (aria-expanded, focus mgmt). Per-section Save (primary) + Cancel (text), subtle "Saved" flash. Sections: Contact, Summary, Experience (entries with separators + Add/Remove), Education, Skills (rectangular 4px gray tags; skills matching quiz stack render mint + tiny caption), Languages.
- Right rail (both states):
  1. Tailoring teaser card at 55% opacity, non-interactive: gray `Coming soon` tag, "Tailor to a job" heading + body copy from spec.
  2. File card (has-resume only): document icon, filename `resume_serhii.pdf`, added date, `Replace` (re-open upload) and `Delete` text links. Delete → focus-trapped confirm dialog ("Delete your resume?… / Delete danger / Keep it").

**New** `src/lib/resume-store.ts`
- Minimal module-level singleton + `useSyncExternalStore` hook: `useResumeState()` returning `{ hasResume, filename, addedDate, data }` and setters. Persists to `sessionStorage` (matches quiz store pattern).
- Mock parsed content per spec (Serhii, Frontend Engineer Senior, 13y, React/Vue/TypeScript, NYC/Baltimore/Philadelphia, $100–160k; 3 experience entries, 1 education, ~11 skills, 3 languages).

**Edit** `src/components/app/AppNav.tsx`
- Change resume tab `to: "/resume"`.

**Edit** `src/routes/_authenticated/dashboard.tsx`
- `ProfileCard` reads `useResumeState()`. When `hasResume`: replace the "Add your resume" block with filename row + mint `Added` tag + "Manage" link → `/resume`. When empty: existing CTA, `Add resume` button links to `/resume`.

### Accessibility
Dropzone as `<button>` (browse) + drag handlers, `role="status"` for upload/parse/success/error, real `<input type="checkbox">` with label, ordered list for steps, section pencils with `aria-expanded`, focus moves to first field on open and back to pencil on save/cancel, delete dialog is focus-trapped.

### Do NOT
No builder, template gallery, photo upload, AI rewriting, export/download, LinkedIn URL input, or new shadows/colors. No backend persistence.