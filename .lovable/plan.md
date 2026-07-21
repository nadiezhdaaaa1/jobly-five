# Job Detail Drawer — Digest screen

Add a right-side drawer that opens when a user clicks a job card's body on the Digest screen. Replace the previous "title links to posting" behavior — the posting link now lives inside the drawer and Apply menu only.

## Scope
All work happens in `src/routes/_authenticated/dashboard.tsx` plus one new component file. No route changes, no data-model changes beyond enriching seed jobs.

## Changes

### 1. `src/routes/_authenticated/dashboard.tsx` — JobCard
- Make the card body (logo, title, meta, why-line, ring area) a clickable region that opens the drawer with this job. Footer controls (dislike, bookmark, Apply, and their menus) stop propagation and continue to work as today.
- Remove any `<a href>` on the title; render it as text. Add hover state: border shifts to `--border-strong` and title underlines.
- Lift `saved` / `applied` / `dismissed` state to the parent feed so the drawer and card share it (a `Map<jobId, JobState>` in the dashboard component). JobCard reads/writes via props.
- Dismissed (thank-you row) cards do not open the drawer.

### 2. New `src/components/app/JobDrawer.tsx`
Right-side floating panel, `role="dialog"`, `aria-modal="true"`, labelled by job title.

- Container: 480px wide, full-height, white, 1px left `--border`, shadow `0 8px 24px rgba(0,0,0,.12)`, 8px radius on the left edge only (or square — flat). Slide-in 160ms ease-out; respects `prefers-reduced-motion`. Scrim `rgba(9,11,12,.32)`. Body scroll lock. Escape / scrim / X close. Focus trap; focus returns to originating card.
- Mobile <768px: full-screen bottom sheet, sticky close.
- Sticky header: 48px dark company square (4px radius, initial), title (18px/600, wraps), X icon-button. Meta line 13px `--text-secondary`: "Company · Location · Salary · Employment". Tag row: source tag (`Direct employer` mint / `Aggregated` gray) + `Posted N days ago` gray.
- Sticky action row (1px bottom border): reuse the same dislike icon-button + menu, bookmark icon-button, and primary Apply split-button with menu (`Tailor your resume` — Coming soon, `Generate a cover letter` — Coming soon, separator, `Open posting to apply`). Bidirectional state sync with card. When applied: Apply replaced by mint `✓ Applied` chip. When saved: bookmark shows saved state.
- Match section (first in scroll body): `--surface-2` fill, 8px radius, 16px padding. Left: 64px match ring (same spec as card ring). Right: "Why this matches you" (15px/600) + 3–5 criteria rows (13px), each with green ✓ (full match) or muted ~ (partial). Criteria derived from job data.
- Job description: 14px body / 1.6 line-height on white. Subheadings 13px/600 `--text-secondary`: About the role / What you'll do / Requirements / Benefits. Bulleted lists allowed. No summarizing.
- Details block: two-column definition rows with 1px separators — Employment type, Experience level, Workplace, Posted date, Job ID.
- Sources block: small card (6px radius). "Sources" heading, primary source row with dot + name + external-link icon (e.g. "Greenhouse — company careers page"); if merged, secondary "Also found on: Adzuna, Jooble".
- Footer: 12px `--text-muted` disclaimer + danger red 13px text button "Report — looks fake or ghost" (same flow as menu: card collapses to thank-you row with Undo, drawer closes).
- Missing data: "Salary not listed" muted; if no description sections show "The employer provided a short listing." Never invent.

### 3. Seed data enrichment
Extend the existing 10 seed jobs (in `dashboard.tsx`) with drawer fields: `description` (sections), `details`, `sources[]`, `criteria[]` (with `full | partial` status). Full plausible content for Nimbus Corp (95%), Orion Tech (86%), Vertex Solutions (74%) — 2–3 description sections, 4–5 criteria echoing the profile (Frontend Engineer · React/Vue/TS · Senior · NYC/Baltimore/Philadelphia or remote · $100–160k). Nimbus via Greenhouse + Adzuna duplicate; Vertex via Adzuna only (Aggregated). Remaining 7 use a shorter shared template.

## Do NOT
No tabs, no similar-jobs, no comments/reviews, no AI-rewritten copy, no extra shadows beyond drawer + its nested menus, no route change for the drawer.

## Accessibility
`role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the title. Focus trap while open; Escape closes; focus returns to card. Ring accessible name "N percent match". Criteria icons `aria-hidden`. Action row buttons keep their existing aria-labels.
