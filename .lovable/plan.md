## Goal
Replace the two-select (state → city → Add) location picker in the "Where and how much?" quiz step with a single search input that suggests both cities and whole states, and adds a chip on selection.

## Behavior
- One text input labeled "Preferred locations" with placeholder like "Search city or state…".
- As the user types, show a dropdown of matches (max ~8):
  - Cities from the existing `US_CITIES` map, shown as `City, ST` (e.g. `Austin, TX`).
  - States from `US_STATES`, shown as `Entire state of {Name}` (e.g. `Entire state of California`).
  - Matches when the query is a case-insensitive substring of the city name, state name, or state code.
- Clicking a suggestion (or Enter on the highlighted one) adds a chip and clears the input.
- Chip labels:
  - City: `City, ST` (two-letter uppercase abbreviation).
  - Whole state: `Entire state of {Name}`.
- Chips remain removable via the existing X button. Duplicates ignored.
- No standalone Add button anymore.
- Keyboard: ↑/↓ to move highlight, Enter to add, Esc to close dropdown.
- Dropdown styled to match existing quiz surfaces (white bg, `--color-border`, 4px radius, subtle shadow).

## Data / storage
- Continue using `answers.locations: string[]`; each entry is the final chip label. Existing collapsed-summary logic (`quizSummary`) keeps working since it just joins strings.
- Remove now-unused `stateCode` / `city` local state and the `addLocation` helper; keep `removeLoc`.

## Scope
- Only `LocationSalaryStep` in `src/routes/quiz.tsx`. No changes to salary slider, work-mode toggle, taxonomy, or store shape.

### Technical notes
- Build suggestions lazily from the current query: flat-map `US_CITIES` into `{label: "City, ST", value: "City, ST"}` and `US_STATES` into `{label: "Entire state of Name", value: "Entire state of Name"}`, filter by query, slice to 8.
- Track `highlightIndex` for keyboard nav; close dropdown on outside click via a ref + `mousedown` listener.
