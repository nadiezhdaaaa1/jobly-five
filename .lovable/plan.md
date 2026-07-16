## Refine "How Jobly works" cards to match reference

Scope: `src/routes/index.tsx`, `HowItWorks` section only. No token or business-logic changes.

### 1. Fixed card composition (`HowCard`)

- Card container stays a single rounded-[20px] shell with 0.5px `--border` and `overflow-hidden`, but the background becomes `--surface-1` (white) so the bottom preview inherits it seamlessly.
- Force uniform card height via `md:grid-rows-[auto]` + `h-full` on each `HowCard`, and split the inside into two rows using `grid grid-rows-[auto_1fr]`:
  - Top zone: `--surface-2` (Alt Light), fixed `min-h` (~200px desktop, ~180px mobile) so all three previews start at the same Y baseline. Contains the Step badge + heading (inline) and body text below. Consistent padding `p-6`.
  - Bottom zone: `--surface-1` white, full-bleed (no inner padding on the wrapper — each preview manages its own internal padding). No inner rounding, no border between zones beyond a 0.5px `--border` top line. Fills remaining height (`1fr`).
- Step badge: rectangular `rounded-[8px]`, `--green` fill, white text, `px-3 py-1`, sits inline before the heading (no gap change).

### 2. Card 1 – QuizPreview

- Wrap contents in `p-5` (consistent internal padding). Structure stays but:
  - 2×2 checkbox chip grid (unchanged content, checked green boxes).
  - Slider: green track segment between two round handles on a light rail; axis row `$60k · $100k · $140k · $180k` under it.
  - Bottom row: "Salary Range **$100k – $150k**" left, "Next" button right (`--accent` bg, `--on-accent` text, `rounded-md`).

### 3. Card 2 – MatchPreview

- Remove the inner white nested card + stacked-shadow siblings so the preview sits directly on the white full-bleed zone with `p-5`.
- Top row: rounded-square logo tile on `--mint` bg with green "S", mint pill "1 hour ago" (green text), "1/5" right-aligned; below it bold "UX/UI Designer".
- Row of three `ScoreRing` (95 / 93 / 96), same component used in hero, evenly spaced (`justify-around`).

### 4. Card 3 – InboxPreview

- Remove outer padding + nested rounded border so the inbox chrome is full-bleed inside the white zone (only top border from the card split).
- Toolbar row (checkbox + chevron, refresh icon, 3-dot more) with a bottom hairline.
- "Primary" tab with blue text and 2px blue underline.
- Rows use checkboxes + star icon:
  - Bold "Jobly daily digest" with filled gold star (no preview on right).
  - "Emily Johnson" — "eDeliv…" (muted right).
  - "Michael Smith" — "Hi, just…" (muted right).
- Gmail "M" logo tile with green "5" badge floats top-right, overlapping the split line (absolute, translated up so it straddles zones like the reference).

### 5. Responsive

- Grid stays `grid gap-5 md:grid-cols-3`; on mobile cards stack and each preview keeps its own internal padding so it stays legible. Top-zone `min-h` reduces on mobile.

### Files
- `src/routes/index.tsx` — rewrite `HowCard`, `QuizPreview`, `MatchPreview`, `InboxPreview`, `InboxRow` (keep `QuizChip`, `ScoreRing`).

### Verification
- `bunx tsgo --noEmit`.
- Playwright screenshot at 1280×1800 to confirm equal card heights, shared preview baseline, and full-bleed preview zones; mobile viewport screenshot to confirm stacking.
