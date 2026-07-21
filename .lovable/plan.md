
# Digest + Job Drawer v2

Rebuild the Digest screen and Job Drawer against a single shared client-side job store, so status changes anywhere (digest card, drawer, right-rail counts, Tracker screen) stay in sync. Keep the header, greeting, tokens, and card visual anatomy exactly as they are.

## 1. Shared job store

New file `src/lib/tracker-store.ts` (module singleton + `useSyncExternalStore` hook):

- `Status = "default" | "saved" | "applied" | "interview" | "offer" | "rejection" | "dismissed" | "reported"` (extends today's `CardState`).
- Per-job record: `{ status, savedAt, appliedAt, interviewAt, offerAt, rejectionAt, reminderAt?: ISO, notes: string }`.
- Actions: `setStatus(id, next)`, `setReminder(id, iso|null)`, `setNotes(id, text)`, `removeFromTracker(id)` (→ back to `default`, clears dates).
- Selectors: `useJobState(id)`, `useCounts()` returning `{ saved, applied, interview }`.
- Seeded from `TODAY_JOBS`/`YESTERDAY_JOBS` `initialState` on first read; extended below.

`CardState` in `src/lib/jobs-data.ts` widens to the new `Status` union; existing consumers (`Tracker`, `AppNav`) keep working because the added states are additive.

## 2. Mock data expansion (`src/lib/jobs-data.ts`)

- Today (5 jobs): Nimbus 95 saved, Orion 86 default, Vertex 74 default, Helix 71 applied, Quantum 70 dismissed.
- Yesterday (5): mix of default/saved plus one Interview w/ reminder (e.g. Figma) and one Reported (e.g. Deno). Distinct jobs at Vercel/Figma/GitLab/Chromatic/Deno.
- Add two more full 5-job digests (Fri Jul 17, Thu Jul 16) with distinct companies (Linear, Notion, Ramp, Stripe, Shopify, Airbnb, Discord, Cloudflare, Datadog, Retool). Include at least one Applied w/ status dropdown demoing regime B, plus one Disliked compact row.
- Provide `getDigestDays(): { key, label, jobs }[]` helper so the wall + lazy loader read from one source.

## 3. Digest screen (`src/routes/_authenticated/dashboard.tsx`)

### Left column — Parameters card
- Replace current `ProfileCard`. Header row: 56px gradient avatar left; "Edit parameters" text link (green, 600) on the right → `Link to="/profile"`. Remove pencil button and the 3D decoration.
- Card title "Parameters" (Stack Sans display).
- Render quiz sections dynamically from `useQuizStore()`: Role, Hard skills, Soft skills, Tools, Experience, Location and salary. Each section = 11px uppercase muted label + Body/Small value, hairline separators. Missing groups are skipped.
- Resume block at bottom (hairline separator above): unchanged states, but CTA copy per spec; `Manage` becomes a text link (not a bordered button) when resume exists.
- Sticky with independent internal scroll: `sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto`.

### Center column — digest wall
- Remove the collapsible "older days" rows. Instead, render each dated group as a plain header (date left, "N matches" right on background) followed by standalone job cards with 12px gaps. No outer wrapper.
- Match counter = visible cards only (exclude dismissed/reported).
- Lazy load: render first 2 days initially; `IntersectionObserver` on a sentinel appends the next day (skeleton row while loading, ~250ms simulated delay). Stop when data exhausted.

### Job card — two regimes
Extract `JobCard` and split its right-side controls by regime derived from status:

**Regime A** (`default` | `saved`): existing thumbs-down menu, bookmark, Apply dropdown. On "Open posting to apply" → open new tab, show existing bottom toast "Did you apply to {title}?" → Yes sets `applied`.

**Regime B** (`applied` | `interview` | `offer` | `rejection`):
- Left: **X** icon-button opening menu with `Remove from tracker` (→ status back to default) and `Report — looks fake or ghost` (danger).
- No bookmark.
- Right: bordered **status dropdown** (`Applied ⌄`) listing Applied / Interview / Received offer / Rejection. Selecting Interview triggers the shared reminder modal (see §5). Selecting any status updates the store; the digest, drawer, right-rail, and Tracker reflect it immediately.
- Interview cards also render a reminder chip in the footer (mint if future, orange-subtle if today).

**Regime C** — compact rows for `dismissed` / `reported`: single-line muted logo + title/meta + date right + `Disliked`/`Reported` tag, 55% opacity, no drawer, no actions. Transient toast with Undo appears immediately after the action (auto-dismiss ~5s).

### Right column
- Tracker widget: counts pulled from `useCounts()`; "Open tracker" is a `Link to="/tracker"` (green, 600).
- Salary insights teaser unchanged.

## 4. Job Drawer (`src/components/app/JobDrawer.tsx`)

Rebuild layout per spec:
- Only the X button is sticky (top-right). Everything else scrolls as one flow.
- Identity block: 48px logo + 64px `BigRing` side by side; title (18–20/600); meta line; "why it fits".
- Full-width **Open posting** button (white, 1px border, external-link icon). When status is not yet `applied`, opening it starts the "Did you apply?" return-confirm (reuse toast).
- Hairline separator.
- **Stage-dependent body**, driven by store status:
  - **Saved** / **Applied** / **Interview**: two side-by-side buttons `Rejection` (white/border) and `Received offer` (accent, lightning); "Status" label + segmented control (Saved · Applied · Interview) — active tab dark fill/white text; date line ("Saved Jul 18" / "Applied Jul 18" / same); Interview adds the reminder section (Set a reminder → popup; chip with Edit/Remove; orange-subtle when today).
  - **Received offer**: mint `#D8FBEF` banner "Congratulations on the offer!"; "Received {date}"; muted `Change status` link reopens status choice.
  - **Rejection**: red-subtle `#FFE2E2` banner with title + body copy; "Received {date}"; `Change status` link.
- **Notes** textarea present in every state, autosave on blur → `setNotes`.
- Footer text links: `Report — looks fake or ghost` (danger, left) and `Remove from tracker` (muted, right). Offer state omits Report; Rejection state keeps only Remove.

Drop the existing sticky action row, details table, and sources block — spec says drawer content is short and focused.

## 5. Shared Interview reminder modal

New `src/components/app/InterviewReminderDialog.tsx`. Global-ish: mounted once inside `DigestScreen` and once inside `JobDrawer` (both call the same component; imperative open via local state). Centered modal, 8px radius, scrim, shadow. Fields: date input + time input. Buttons: `Save reminder` (accent) writes `setReminder(id, iso)`, `Cancel` closes and leaves reminder unset. Both paths still transition status to `interview`.

## 6. Tracker sync

Tracker screen (`src/routes/_authenticated/tracker.tsx`) already renders columns from a local store — repoint it to `useJobState`/`useCounts` so Digest actions appear there instantly. Removing from tracker via any surface sets status back to `default`; setting Applied/Interview/Offer/Rejection from Digest places the card in the corresponding column.

## 7. Technical notes

- Store lives in a plain module + `useSyncExternalStore`; no context provider needed. Reads inside SSR-safe branch (`if (typeof window)`).
- Reminder dates: stored as ISO strings; "today" = same YYYY-MM-DD in local tz.
- Skeleton row: 96px, border, `animate-pulse` on a muted rectangle.
- Toast component inlined (already used today); extract to `Toast.tsx` if reused >2 places.
- All colors via existing tokens; no new palette entries. Radii per spec (4px controls, 6px cards, 8px big cards/modals).

## Out of scope
Header/tab bar, greeting block, palette, card visual anatomy (logo/ring/tags), mobile bottom tab bar — untouched.
