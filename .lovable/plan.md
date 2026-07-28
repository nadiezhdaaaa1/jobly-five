Convert row action buttons on the Resume, Cover Letters, and Saved searches tabs from text buttons to icon-only buttons that follow the same reveal pattern already used on the Preferences rows: hidden on desktop until row hover/focus, always visible on tablet and mobile.

## Scope (single file: `src/routes/_authenticated/profile.tsx`)

### 1. Resume rows — `FileRow`
Replace text `GhostBtn`s with 32px icon buttons, each with `aria-label` + `title`:
- Preview → `Eye`
- Make primary (when not primary) → `Star`
- Replace (when provided) → `RefreshCw`
- Delete → `Trash` (already icon, restyle to match)

Wrap the row in `group/row`. The action cluster becomes:
`flex items-center gap-1 lg:opacity-0 lg:transition-opacity lg:group-hover/row:opacity-100 lg:focus-within:opacity-100`.

The `Primary` tag stays visible at all times (it's status, not an action).

### 2. Cover Letters rows — `LetterRow`
Same treatment:
- Edit → `Pencil`
- Duplicate → `Copy`
- Delete → `Trash`

### 3. Saved searches rows
Same treatment for the default state only:
- Rename → `Pencil`
- Delete → `Trash`

The inline rename input state (Save/Cancel) and the inline "Delete? / Keep" confirmation stay as text buttons and stay always visible — they're transient interaction states, not the default action row.

## Visual spec (shared)
- Button: `inline-flex size-8 items-center justify-center rounded-[4px] hover:bg-[color:var(--color-surface-2)]`
- Icon: `size={16} strokeWidth={1.8}`
- Delete keeps `text-[color:var(--color-danger)]`
- Cluster gap: `gap-1`
- Reveal: desktop-only fade (`lg:` breakpoint). Below `lg`, buttons are always visible.

## Out of scope
- No changes to Preferences (already done).
- No changes to Portfolio, Social, Achievement, or other tabs.
- No changes to the upload / editor dialogs — only the row action buttons.
- No new icons imported that aren't already available from `lucide-react` / the existing `IconX` aliases used in the file.