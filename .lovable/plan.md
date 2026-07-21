Refine the existing `/dashboard` Digest screen per the uploaded spec. Only files touched: `src/routes/_authenticated/dashboard.tsx`, `src/lib/jobs-data.ts` (new Yesterday data), and `src/routes/__root.tsx` (font `<link>` in head). No changes to header tabs, three-col grid, greeting, Applied chip, dismissed treatment, Tracker card, or mobile bar.

## Changes

1. **Ungroup cards** — Remove per-day wrapper container. Render each `JobCard` as a standalone white card (1px border, 6px radius) stacked with 12px gaps. Date header ("Today, Mon, Jul 20" left, "5 matches" right) becomes plain text on background (no card chrome).

2. **Profile card header** — Drop the "Parameters" H2. Header row: 56px avatar (6px radius, gradient `#00F1A9 → #0E735A`, white "S") on the left; 30px pencil icon-button (1px border, 4px radius) on the right.

3. **Profile card content** — Remove the "Field" row. Rows become: Role → Frontend Engineer; Stack → React, Vue, TypeScript; Experience → Senior · 13y · English · Spanish · Dutch; Location and salary → NYC · Baltimore · Philadelphia · $100k–$160k. Resume block unchanged.

4. **Match ring** — 52px SVG, 4px stroke, track `#E3E7E8`, arc `#0E735A` starting 12 o'clock, square line caps. Centered label 14px Stack Sans weight 400 color `#090B0C` (dark, not green, not bold). Dismissed inherits card 55% opacity.

5. **Saved bookmark** — Active: border `#0E735A`, icon stroke `#0E735A`, glyph fill `#D8FBEF`. Inactive: muted gray outline (unchanged).

6. **Yesterday data** — Replace duplicates with the 5 specified frontend roles (Vercel, Figma, GitLab, Chromatic, Deno) with exact salary/score/source/postedDays and profile-referencing "why it fits" lines. Update `TODAY_JOBS` to be frontend-flavored so "why it fits" matches the new Frontend profile (titles/why lines rewritten, other fields kept).

7. **Collapsed older days** — Two collapsed rows below Yesterday ("Fri, Jul 17 · 5 matches", "Thu, Jul 16 · 5 matches"): full-width white card (6px radius, 1px border, 14px padding), chevron-down right, hover `--surface-2`. Expand shows that day's cards (reuse yesterday entries). Existing `OlderDayRow` already implements most of this — tighten padding to 14px and label format.

8. **Typography** — Add Google Fonts link in `__root.tsx` head for the requested faces (weights 300/400/600). Note: "Stack Sans" is not a real Google font; will use the closest available families already in the project's design tokens (`--font-display` / `--font-sans`) and wire them to the same weight rules (300 default body, 600 emphasis, 400 for buttons/ring/wordmark). Will confirm with user if a specific substitute is required.

9. **Right-rail copy** — "Your range vs the markets." → "Your range vs the market."

10. **Menus** — Verify thumbs-down and Apply menus (already built) match: 6px radius, 1px border, shadow `0 8px 24px rgba(0,0,0,.12)`, min-width 230px, close on outside click + Escape. Confirm Report → collapses to "Thanks — we'll check this posting." with Undo (already present). Apply menu items: Tailor resume (disabled + Coming soon tag), Generate cover letter (same), separator, Open posting to apply (active, opens new tab).

## Open question
"Stack Sans" isn't published on Google Fonts. Options: (a) keep current project fonts and just apply the weight rules, (b) substitute a similar family (e.g. Instrument Sans / DM Sans / Manrope), (c) load from a specific source you have in mind. Defaulting to (a) unless you say otherwise.