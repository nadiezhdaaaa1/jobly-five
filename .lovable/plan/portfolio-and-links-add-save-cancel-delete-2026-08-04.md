# Portfolio and links — add/save/cancel/delete

## Audit of the section today

- Clicking a suggested chip (GitHub, Behance, …) or "Add link" immediately creates an empty row. There is no save or cancel — every keystroke in the URL field writes straight into your account (debounced), so half-typed and blank links get stored.
- Blank rows count toward the "up to 10" limit and toward profile strength, so an accidental chip click inflates both.
- Nothing is validated: a link can be empty or not a URL at all.
- Delete works (the X on each row) but is instant, with no undo and no confirmation.
- "Social and profiles" has the same shape and the same problems.
- Saving does reach the account: links and socials live in your profile's extras blob, and writes are flushed correctly (fixed earlier). No backend change is needed.
- The "Portfolio file" card is metadata-only — it records a name and size but never uploads a file. Out of scope here unless you want it addressed.

## What changes

Links and socials become explicit add/edit forms instead of live-editing rows.

1. Quick add: the suggested chips and "Add link" open one inline draft row (type select + URL, plus a Label field when type is "Other") with **Save** and **Cancel** buttons. Nothing is stored until Save.
2. Save validates: URL required, must be a valid http(s) address (a bare `example.com` is accepted and normalised to `https://example.com`); "Other" needs a label. Errors show inline under the field.
3. Saved links render as compact read-only rows — type, the clickable URL, and **Edit** / **Delete** icon actions. Edit reopens the same form with Save/Cancel; Cancel restores the previous values.
4. Delete removes the link and shows a toast with **Undo** for a few seconds.
5. The limit counter now counts only saved links, and an inline note appears when the limit is reached (chips and Add link disable).
6. Identical treatment for "Social and profiles".
7. Existing blank rows already in your account are cleaned up on first load of the tab (empty-URL entries dropped).

Card layout, headings, spacing, colours, and the 4px radii stay as they are.

## Technical detail

- Edit in place in `src/routes/_authenticated/profile.tsx`: `PortfolioTab` gains a small local `draft` state (`{ mode: 'new' | id, type, label, url, error }`) and two subcomponents — `LinkRowView` (read-only row) and `LinkRowForm` (draft form) — plus the same pair for socials.
- Store API in `src/lib/profile-store.ts` is unchanged: `addLink`/`updateLink`/`removeLink`/`addSocial`/`updateSocial`/`removeSocial` are now called only on Save/Delete, so the debounced write to the account fires once per committed change.
- URL normalise/validate helper lives locally in the tab file; no new dependency.
- Undo re-adds the removed entry via `addLink`/`addSocial` (new id) from a held snapshot.
- No database migration, no RLS change.
