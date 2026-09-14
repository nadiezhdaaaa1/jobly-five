# Tracker on the design system — radii + listing-card buttons

## Step 2 first: the ladder checks out

I verified all five anchors against the code. **None of them is wrong.**

| Radius | Anchor you cited | Verified at |
|---|---|---|
| 24px | `/matches` paywall plan card wrapper + inner | `PlanPaywall.tsx:129,144,191`, `PlanCards.tsx:134,149` |
| 20px | Digest job card outer, thank-you stat outer, quiz dialog | `dashboard.tsx:780,794,815`, `thank-you.tsx:188`, `quiz.tsx:521,561,889` |
| 16px | Digest card inner `article`, thank-you stat inner, quiz level cards | `dashboard.tsx:781,816,589`, `thank-you.tsx:190`, `quiz.tsx:1186,2005` |
| 12px | quiz option chips | `quiz.tsx:1048,1160,2047` |
| 8px | Digest filter chips, card icon buttons, Apply | `dashboard.tsx:638,674,712,855,928` |

Two extra facts worth stating, since I map against them below:

- Digest **poppers** (flag / dislike / menus) are `rounded-[16px]`, not 8px — so Tracker menus map to 16px.
- Digest filter Reset/Apply are 48px `secondary_button--on-light` / `main_accent_button--on-light`, i.e. the class's own 14px. I treat 48px+ buttons as "use the class", not as a rung.

To map controls consistently I use one size rule, stated openly: **height ≤ 30px → 8px; 32–44px → 12px; 48px+ → design-system button class (14px).**

## Things that do not fit a rung — flagging, not forcing

1. **16px checkboxes** (`TrackerTransitionDialogs.tsx:158`) and **skeleton text-line placeholders** at 4px. Below the smallest rung; 8px on a 16px box reads as a blob. **Proposal: leave at 4px** and report as out-of-ladder.
2. **The listing drawer panel** (`JobDrawer.tsx:420`) — full-height, anchored to the right edge, `md:w-[480px] md:border-l`, square today. You asked me not to guess. **My recommendation: leave it square (already correct).** It has no free outer corners on desktop and is full-bleed on mobile; rounding only the two left corners would be a new pattern the app uses nowhere else. Its *inner* surfaces do get remapped.
3. **The Pro-upsell "Upgrade to Pro" link** on the locked Tracker (`tracker.tsx:908`) is a hand-rolled `#00F1A9` button at 46px tall. It is not a listing-card button, so step 3 does not cover it. **Proposal: radius 4px → 12px only**, leave its padding/colour alone (the accent class would rewrite its padding).
4. **The card Apply label is 12px, not the Digest's 14px.** Adopting `main_accent_button` forces 16px, which I must inline-override anyway. Typography is out of scope, so I will inline `fontSize: 12` to preserve what renders today. Say the word if you want 14px to match the Digest exactly.
5. The Row-3 **toggle** is `rounded-full` — a pill, explicitly excluded. Unchanged.

## Step 1 + 2 — audit and proposed mapping

### `src/routes/_authenticated/tracker.tsx`

| Element | Line | Size | Before | After |
|---|---|---|---|---|
| Column card-stack shell (tinted `#F1F3F3` p-4) | 748 | column width × auto | 12 | **20** (Digest `dashboard.tsx:780` pattern) |
| Listing card (`KanbanCard`) | 258 | ~215 × ~150 | 8 | **16** (inner surface of the tinted stack) |
| Listing-card skeleton shell | 627 | same as card | 8 | **16** |
| Drop placeholder | 752 | card-sized | 8 | **16** |
| "Nothing here yet" empty box | 763 | card-sized | 8 | **16** |
| Company logo / initials avatar | 98, 104 | 28 × 28 | 4 | **8** |
| `IconBtn` (flag, dislike, saved, archive, follow-up) | 150 | 30 × 30 | 4 | **8** |
| Card **Apply** button | 348 | flex-1 × 30 | 4 | **8** + accent class (step 3) |
| Card **Move to** button | 375 | 91 × 30 | 4 | **8** |
| Row-3 chips | 527 | auto × 24 | 4 | **8** |
| Column count badge | 719 | 22 × 22 | 4 | **8** |
| Column "Edit column" pencil | 729 | 28 × 28 | 4 | **8** |
| Toolbar "Edit columns" / "Compare offers" | 1055, 1065 | auto × 32 | 4 | **12** |
| Compare-offers count badge | 1071 | 18 × 18 | 4 | **8** |
| Archive-confirm dialog panel | 433 | 440 × auto | 8 | **20** |
| Archive-reason textarea | 457 | full × ~70 | 4 | **12** |
| Archive dialog Cancel / Archive | 468, 481 | auto × 36 | 4 | **12** |
| `MenuPop` popper (flag, dislike, move) | 584 | ≥220 × auto | 6 | **16** (Digest popper parity) |
| Toast | 1223 | auto × ~36 | 6 | **12** |
| Upgrade-to-Pro link (locked state) | 908 | auto × 46 | 4 | **12** (see flag 3) |
| Row-3 toggle | 183 | 36 × 20 | full | **unchanged** (pill) |
| Skeleton text-line placeholders | 632–643 | ≤14px tall | 4 | **unchanged** (below ladder); the 30×30 and 76×30 button placeholders → **8** |
| Empty-state hero panel / inner | 829, 846, 831, 849 | 672 × auto / inner | 24 / 12 | **already correct** at 24 outer; inner 12 → **16** |

### Dialogs

| File | Element | Size | Before | After |
|---|---|---|---|---|
| `BoardColumnsDialog.tsx:95` | panel | 560 × auto | 8 | **20** |
| `:148` | column-list container | full × auto | 12 | **16** |
| `:182` | column row | full × auto | 8 | **12** |
| `:104,248,260,307` | icon buttons | 32 × 32 | 4 | **8** |
| `:206,217` | reorder icon buttons | 24 × 24 | 4 | **8** |
| `:129,234` | text inputs | auto × 36 | 4 | **12** |
| `:139,275,282,358,370` | action buttons | auto × 36 | 4 | **12** |
| `:298` | nested confirm panel | 480 × auto | 8 | **20** |
| `:347` | warning band | full × auto | 4 | **12** |
| `SingleColumnDialog.tsx:102` | panel | 480 × auto | 8 | **20** |
| `:109,180` | icon buttons | 32 × 32 | 4 | **8** |
| `:117,210,228,243` | buttons | auto × 32–36 | 4 | **8 / 12** by height |
| `:143,171,200` | inputs | auto × 32–36 | 4 | **8 / 12** by height |
| `TrackerTransitionDialogs.tsx:34` | panel | 440 × auto | 8 | **20** |
| `:41` | close button | 32 × 32 | 4 | **8** |
| `:56,58,95,171` | inputs / selects / textarea / date trigger | auto × 40 | 4 | **12** |
| `:179` | date-picker popover | auto (calendar) | 8 | **16** |
| `:208` | note band | full × auto | 4 | **12** |
| `:234,241` | Cancel / confirm | auto × 40 | 4 | **12** |
| `:158` | checkbox | 16 × 16 | 4 | **unchanged** (flag 1) |
| `InterviewReminderDialog.tsx:134` | panel | 420 × auto | 8 | **20** |
| `:141` | close button | 32 × 32 | 4 | **8** |
| `:37,159` | select / date trigger | auto × 40 | 4 | **12** |
| `:167` | date popover | auto | 8 | **16** |
| `:190,210,217` | band + buttons | auto × 40 | 4 | **12** |
| `ApplyModal.tsx:121` | apply panel | 520 × auto | 8 | **20** |
| `:318` | log-application panel | 560 × auto | 8 | **20** |
| `:128,132` | logo | 40 × 40 | 6 | **8** |
| `:210,231` | info bands | full × auto | 6 | **12** |
| `:168,196,333,343,351,360` | inputs / textarea | auto × 40 | 4 | **12** |
| `:216,223,239,373,380,388` | buttons | auto × 36–40 | 4 | **12** |
| `:248,255` | footer buttons | flex-1 × 44 | 4 | **12** |
| `HideJobDialog.tsx:45,52` | Cancel / confirm | auto × 40 | 4 | **12** |
| `CompareOffersDialog.tsx:197` | panel | wide × ≤90vh | 8 | **20** |
| `:240` | scroll body bottom corners | — | 8 | **20** (follows the panel) |
| `:135,232` | icon buttons | 28–32 | 4 | **8** |
| `:91` | textarea | auto | 4 | **12** |
| `:101,111,219,279` | buttons | auto × 28–32 | 4 | **8** |
| `:260,262` | logos | 28 × 28 | 4 | **8** |
| `:321` | inline badge | small | 4 | **8** |

### Drawer (`JobDrawer.tsx`)

| Element | Line | Size | Before | After |
|---|---|---|---|---|
| Panel | 420 | 480 × 100vh, edge-anchored | 0 | **unchanged — recommendation, see flag 2** |
| Meta band | 121 | full × auto | 4 | **12** |
| Close / header icon button | 436 | 32 × 32 | 4 | **8** |
| Logo | 450, 455 | ~40 × 40 | 4 | **8** |
| Status pill + move trigger | 485, 497 | auto × 36 | 4 | **12** |
| Menus | 505, 854, 880 | ≥180 × auto | 6 | **16** |
| Selects / inputs | 534, 554 | full × 40 | 4 | **12** |
| Inline edit rows / note boxes / textareas | 574, 642, 651, 700, 709, 799, 808 | full × auto | 4 | **12** |
| Small inline text buttons | 607–692, 764–791 | auto × 32 | 4 | **8** |
| Section card | 735 | full × auto | 6 | **16** |
| Pro upsell card | 818 | full × auto | 6 | **16** |
| "Pro" badge | 819 | small | 4 | **8** |
| Upsell CTA | 826 | auto × 40 | 4 | **12** |
| Footer icon buttons | 849, 875, 963 | 40 × 40 | 4 | **12** |
| Footer action buttons | 905, 919, 970, 979 | auto × 40 | 4 | **12** |
| Nested confirm dialog | 997 | 440 × auto | 8 | **20** |
| Its textarea / buttons | 1018, 1029, 1042 | auto × 36 | 4 | **12** |

## Step 3 — listing-card buttons

In `tracker.tsx`:

- `IconBtn` (line 150): `rounded-[4px]` → `rounded-[8px]`. Height already 30px. No other change.
- Card **Apply** (line 348): swap the hand-rolled `background: #00F1A9; border: 1px solid #00F1A9` for `main_accent_button main_accent_button--on-light`, keeping `h-[30px] flex-1` and the `ExternalLink` icon. Because those classes are unlayered CSS that beat Tailwind, the overrides go inline: `style={{ borderRadius: 8, fontSize: 12, height: 30, paddingLeft: 12, paddingRight: 12, justifyContent: "center" }}`. Padding and `justify-content` are inline too because the class sets `padding: 12px 20px` and no `justify-content`, which would change the button's size and centring — those inline values reproduce exactly what renders today.
- Card **Move to** (line 375): stays a bordered neutral control; radius only, 4 → 8.

I will read back the computed `border-radius`, `font-size` and `height` from the browser to prove the class did not win.

## Technical notes

- Every value is a literal `rounded-[Npx]` or inline `borderRadius`, matching how the rest of the app writes radii. No token or `--radius` changes.
- Nothing else is touched: no layout, spacing, copy, colour, typography, behaviour, drag-and-drop or data changes. `styles.css` is not edited.
- Verification: screenshots of the board, a card's button row, each dialog, and the drawer open; computed-style read-back on the Apply button; `bunx tsgo --noEmit`; `bunx vitest run`.

## One thing I need from you

**I cannot reach `/tracker`.** The account I can sign in as has no plan, so `/tracker` redirects to the `/matches` paywall, and per your constraint I did not touch any row to change that. Please arrange a Pro, onboarded account with a few tracker cards across columns (saved / applied / interview / offer, ideally one archived) and I will do the visual verification against it. I can write the code changes now and verify statically, but the screenshots and the computed-style proof need that account.
