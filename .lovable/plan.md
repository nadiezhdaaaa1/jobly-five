## Profile screen — plan

Build the Profile tab at `/profile` behind `_authenticated`. Frontend-only, sharing state with the existing resume and quiz stores so edits sync across Digest, Resume, and Profile.

### Files

**New** `src/routes/_authenticated/profile.tsx`
- `AppHeader active="profile"` + `MobileTabBar`. Update `AppNav.tsx` Profile tab `to: "/profile"`.
- Layout: max-w-1200, 24px gutters. ≥1024px main + 280px sticky rail; single column below.
- Page header: H1 "Profile"; avatar row = 64px gradient (accent→green) with initial "S", name "Serhii Kovalenko" (18/600), email 13 muted, pencil to edit name only (avatar stays initials — spec forbids photo upload).
- Dismissible mint banner at top after saving any match-relevant section: "Updated — your next digest will use these preferences."
- Editing pattern reused across all cards: 8px radius, 20px padding, pencil top-right, one section editing at a time, Save primary + Cancel text, subtle "Saved" flash, `aria-expanded`, focus moves to first field / back to pencil.

**Card 1 — Match preferences** (reads/writes `useQuizState`)
- View: label/value rows with 1px separators. Stack rendered as mint 4px rectangular tags.
- Edit: Role single-select+search (from `ROLE_STACKS` keys), Stack tag input with typeahead, Level segmented (Junior/Mid/Senior/Staff+), Work type checkboxes (Remote/Hybrid/On-site), Locations tag input (hidden when only Remote), Salary Min/Target with $ prefix and inline "Minimum can't exceed target".
- 12px muted microcopy in edit mode: "These preferences directly shape your match scores."
- Saving triggers the top banner.

**Card 2 — Previous jobs** (shared with Resume experience via `resume-store`)
- Maps `ResumeExperience` (role/company/dates/bullets). Add optional `descriptionText` field for the profile textarea (falls back to joined bullets). Extend `resume-store` with helpers: `addExperience`, `updateExperience`, `removeExperience`, `reorderExperience`.
- View entries separated by 1px lines: position 14/600 · company secondary · optional years muted; description ≤4 lines with "Show more".
- Edit per entry: Position, Company, Years From/To selects (with "Present"), Responsibilities textarea 4 rows + live counter soft-cap 600. Drag handle (⋮⋮) + up/down keyboard buttons. `Remove` link with inline confirm ("Remove this job? / Remove / Keep").
- `Add previous job` text button appends blank entry in edit mode. Empty state copy per spec.

**Card 3 — Education** (shared with Resume education)
- Extend `ResumeEducation` with `degreeType` (Bachelor's / Master's / PhD / Bootcamp / Certificate / Other) and `field`. Helpers `addEducation`, `updateEducation`, `removeEducation`.
- Same entry pattern, fields per spec, inline remove confirm, `Add education`, empty state.

**Card 4 — Account** (no edit mode)
- Rows: Email (from `useAuth().user.email` fallback to mock), Plan (mint `Pro` tag + muted renews date), then chevron link rows: "Subscription & billing", "Notifications & digest frequency", "Security & sign-in" (placeholder buttons, no navigation). Final `Log out` text button — calls `supabase.auth.signOut()` + navigates `/login`.

**Right rail**
1. Profile strength card: heading, 4px square-ended progress bar (`--green` on `--surface-2`) at 70%, `role="progressbar"` with value text. Checklist rows: "Quiz completed ✓", "Resume added ✓" (reads `useResumeState().hasResume`), "Previous jobs — add at least one" ✓ if any, "Education — add at least one" ✓ if any, plus one intentionally-incomplete demo row "Verify your email" that scrolls to the account card. Incomplete rows are buttons that scroll+open the matching section. 12px muted caption.
2. Info card "How matching works" — muted body copy per spec, no CTA.

### Shared state changes

**Edit** `src/lib/resume-store.ts`
- Add per-entry mutation helpers (add/update/remove/reorder for experience and education).
- Extend `ResumeExperience` with optional `description?: string`; `ResumeEducation` with optional `degreeType?` and `field?`. Update `DEFAULT_RESUME` to match the profile mock (Nimbus 2019–Present, Wavelabs 2013–2019, Bachelor's CS Kyiv Polytechnic 2009–2013) — Resume screen consumes the same records so both views stay aligned.

**Edit** `src/lib/quiz-store.ts`
- No shape change needed; profile reads/writes existing fields (roles, hardSkills/tools, level, workMode, locations, salaryMin/Max). Add small `updateQuiz(patch)` helper to merge+persist.

**Edit** `src/routes/_authenticated/dashboard.tsx`
- `ProfileCard`'s existing quiz-derived rows already reflect the store; no logic change beyond confirming it re-renders after `updateQuiz`. Point "Edit profile" link (if any) to `/profile`.

**Edit** `src/components/app/AppNav.tsx`
- Profile tab `to: "/profile"`.

### Accessibility
Per spec — `aria-expanded` on edit toggles, focus management, keyboard reorder buttons, tag chips removable via Backspace / × with `aria-label`, focusable inline confirms, `role="progressbar"` on the strength bar, inline `aria-describedby` validation.

### Out of scope
No password/2FA/billing forms, no CV formatting controls, no photo upload, no score rings, no "matches X jobs" counter, no new colors/shadows.
