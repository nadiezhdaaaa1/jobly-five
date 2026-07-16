# Rebuild "The problem" section

Scope: `src/routes/index.tsx` → `JobSearchBroken` component only. No token changes.

## Layout

Replace the current 3-card grid with one large rounded container that holds a 2-column layout and a rotated chip wall bleeding off the edges.

- Outer `<section>`: keep as page section wrapper (same vertical padding, max-width shell).
- Inner container: `rounded-[24px]`, `bg-[color:var(--color-surface-2)]`, `border-[0.5px] border-[color:var(--color-border)]`, `overflow-hidden`, `relative`, generous inner padding (`p-8 md:p-14`), min height ~560px on desktop.
- Grid inside: `md:grid-cols-[45%_55%]`, gap enough so text isn't overlapped by chips.

## Left column (text)

- H2 "The job search is broken" (Stack Sans Headline, same size scale as other H2s).
- Subhead in `--text-secondary`: "Candidate experience is at an all-time low. Here is why your current routine feels like a second full-time job."
- Three problem items stacked vertically, no cards/boxes — just:
  - small line icon (~20px, `--text-secondary`) in a plain inline slot (no filled tile)
  - bold heading (Stack Sans Headline, ~text-lg)
  - body text in `--text-secondary`
  - generous vertical spacing between items (`space-y-8` or `mt-10` between)
- Items: ListFilter → "Hours on LinkedIn with no results"; Ghost → "Ghost jobs waste your time"; ClipboardList → "Hundreds of irrelevant listings" (bodies unchanged).

## Right column — rotated chip wall

- Absolutely positioned wrapper covering right ~55% of container, extending beyond top/right/bottom edges; parent `overflow-hidden` clips it.
- Inner `<div>` with `transform: rotate(-32deg)`, `transform-origin: center`, sized ~150% of the visible area, positioned so it bleeds off top/right/bottom.
- Content: 6–7 rows × 4–5 chips per row = ~22 chips, staggered horizontally (alternating rows offset by ~40px). Uses flex-col with `gap-3`; each row is a flex-row with `gap-3`.
- Optional fade: `mask-image: linear-gradient(to top right, black 40%, transparent 90%)` on the rotated wrapper for the recede effect.
- Hidden on `sm` (`hidden md:block`) OR reduced to a short decorative band; per user note, hide on smallest screens — use `hidden md:block`.

### Chip

- White `bg-[color:var(--color-surface-1)]`, `rounded-[10px]`, `border-[0.5px] border-[color:var(--color-border)]`, `px-3 py-2`, `inline-flex items-center gap-2`, `whitespace-nowrap`.
- Small role icon (14–16px, `--text-secondary`).
- Title in `text-[13px]` Stack Sans Text.
- Optional status tag rendered as an inline span after the title with color:
  - `no match` → `#E17100` (warning)
  - `ghost` / `irrelevant` / `outdated` → `#D00D01` (danger)

### Role → icon mapping (semantic, from lucide-react)

- QA Engineer → `Bug`
- Senior Backend Engineer → `Server`
- DevOps Engineer → `Terminal`
- Solutions Architect → `Network`
- UX Researcher → `UserSearch`
- Android Developer → `Smartphone`
- Scrum Master → `RefreshCw`
- Product Designer → `PenTool`
- Data Engineer → `Database`
- UI Designer → `Palette`
- Technical Writer → `FileText`
- Mobile Developer → `Smartphone` (or `TabletSmartphone`)
- Product Manager → `ClipboardList`
- Site Reliability Engineer → `ShieldCheck` (or `Activity`)
- Growth Marketing → `TrendingUp`
- Data Scientist → `BarChart3`
- Frontend Engineer → `Code2`
- CTO → `Crown`

Chip list rendered as a data array `{ title, tag?, tagColor?, icon }[]`, split across rows with a small offset for staggering.

## Responsive

- `md:`: two-column with rotated wall visible.
- Below `md`: single column, chip wall hidden; text section reads clean and full-width.

## Files

- `src/routes/index.tsx` — rewrite `JobSearchBroken`; add new lucide imports (`Bug, Server, Terminal, Network, UserSearch, Smartphone, RefreshCw, PenTool, Database, Palette, FileText, TrendingUp, BarChart3, Code2, Crown, ShieldCheck`). Keep existing `ListFilter, Ghost, ClipboardList` imports for left-side icons.

## Verification

- `bunx tsgo --noEmit`.
- Playwright screenshot at 1280×1800 to confirm angle, bleed, and clipping; mobile viewport (375px) to confirm wall hidden and text stacks cleanly.
