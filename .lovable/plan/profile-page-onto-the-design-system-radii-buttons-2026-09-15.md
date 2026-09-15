# Profile page onto the design system — radii + buttons

All of `/profile` lives in one file, `src/routes/_authenticated/profile.tsx` (2826 lines, 105 radius sites). It renders no Tracker-style side components; its dialogs are `ui/dialog` panels styled at the call site, and there are no popovers or menus on the page.

The page is built from five shared atoms, so most of the work lands in five places: `PrimaryBtn` (565→), `SecondaryBtn`, `CardBig`, `CardSmall`, `Tag`.

## Size rule (identical to the approved Tracker round)

height ≤ 30px → 8px; 32–44px → 12px; 48px+ → the design-system button class.

One clarification carried over from Tracker so the screens agree: **icon-only** buttons up to 36px take 8px there (`BoardColumnsDialog` 32×32 → 8, 24×24 → 8), while 32–44px controls that carry a label take 12px. I apply the same split here.

## Off-ladder — flagged, not forced

1. **The avatar is not a circle.** It is a 60×60 square gradient tile at `rounded-[6px]` (line 465). So the "leave the circle alone" exemption does not apply. **Recommendation: 12px**, as a 60px surface. Its 20×20 remove badge is `rounded-full` and stays.
2. **Checkboxes** — 16×16 at 4px (1181) and 2px (2264). Below the smallest rung; **leave both**, same as Tracker.
3. **Skeleton text line** (722, 14px tall) at 4px — below the ladder, **leave**.
4. **The two profile-strength / matching sidebar cards and toggle**: the toggle (2494, 2498) is `rounded-full` — **unchanged**.
5. **No full-bleed or edge-anchored panel on this page** — every surface is an in-flow card or a centred `ui/dialog`, so the drawer reasoning does not come up.
6. **The "Upgrade to Pro" link** (998, 1536) is a hand-rolled `#00F1A9` link at 46px with its own `padding: 13px 17px`. Same shape as the Tracker locked-state upsell: **radius 4 → 12 only**, colour/padding/typography untouched, not converted to the accent class (which would rewrite its padding).
7. **Danger buttons** stay hand-rolled red — the delete confirm (617) and the inline "Remove" (2726, 2817). Radius only, as on Tracker.

## Audit + mapping

### Shared atoms

| Element | Line | Size | Before | After |
|---|---|---|---|---|
| `CardBig` section shell | 565 | full × auto, p-5 | 8 | **20** |
| `CardSmall` inner card | 573 | full × auto, p-4 | 6 | **16** |
| `Tag` badge | 587 | auto × ~18 | 4 | **8** |
| `PrimaryBtn` | 537 | auto × 40 | 4 | **12** + `main_accent_button--on-light` |
| `SecondaryBtn` | 552 | auto × 40 | 4 | **12** + `secondary_button--on-light` |

### Cards, panels, rows

| Element | Line | Size | Before | After |
|---|---|---|---|---|
| Sidebar "Profile strength" / "How matching works" | 336, 389 | ~300 × auto | 6 | **16** |
| Quiz-answers row list container | 689 | full × auto | 8 | **20** |
| Resume / portfolio / experience / education rows | 1225, 1605, 1788, 1851, 2387, 2445 | full × auto | 6 | **16** |
| Locked placeholder card | 1319 | full × auto | 8 | **16** |
| Resume-list skeleton block | 889 | full × 64 | 6 | **16** |
| Dashed upload dropzones | 891, 1143, 1304, 1362, 1440 | full × auto | 6 | **16** |
| Pro upsell tinted wrapper | 953, 1491 | full × auto | 12 | **20** |
| Pro upsell inner card | 956, 1494 | full × auto | 8 | **16** |
| Consent / info band | 868 | full × auto | 6 | **16** |
| Avatar tile | 465 | 60 × 60 | 6 | **12** (flag 1) |
| Toast | 152 | auto × ~36 | 4 | **12** |

### Dialog panels

| Element | Line | Size | Before | After |
|---|---|---|---|---|
| Name modal | 506 | 420 × auto | 8 | **20** |
| Delete-confirm modal | 605 | 420 × auto | 8 | **20** |
| Quiz-answer edit modal | 749 | 640 × ≤90vh | 8 | **20** |
| Upload-resume modal | 1138 | 480 × auto | 8 | **20** |
| Upload-portfolio modal | 1357 | 480 × auto | 8 | **20** |
| Cover-letter modal | 1676 | 640 × auto | 8 | **20** |

### Fields

| Element | Line | Size | Before | After |
|---|---|---|---|---|
| Name input | 514 | full × 40 | 4 | **12** |
| Cover-letter title input | 1686 | full × 40 | 4 | **12** |
| Cover-letter editor body | 1734 | full × ≥220 | 4 | **12** |
| Portfolio select / inputs | 1793, 1806, 1814, 1824 | auto × 40 | 4 | **12** |
| Experience inputs / selects | 2699, 2700, 2703, 2708 | auto × 40 | 4 | **12** |
| Experience textarea | 2718 | full × ~90 | 4 | **12** |
| Education selects / inputs | 2791, 2795, 2797, 2799, 2804 | auto × 40 | 4 | **12** |
| Link select / input / textarea | 2393, 2407, 2417, 2424 | auto × 40+ | 4 | **12** |
| Skill-option row | 2250 | auto × ~36 | 4 | **12** |
| Its 16px box | 2264 | 16 × 16 | 2 | **unchanged** (flag 2) |

### Buttons and small controls

| Element | Line | Size | Before | After |
|---|---|---|---|---|
| Edit-name pencil | 252 | 32 × 32 | 4 | **8** |
| Row edit affordance | 737 | 32 × 32 | 4 | **8** |
| Band dismiss | 880 | 24 × 24 | 4 | **8** |
| File-type / upload icon tiles | 892, 1227, 1305, 1441, 1607 | 40 × 40 | 4 | **8** |
| Row icon buttons | 1277, 1868, 1878, 2467, 2477, 2679, 2771 | 32–36 sq | 4 | **8** |
| Reorder icon buttons | 2714, 2715 | ~22 sq | 4 | **8** |
| Inline text buttons ("Remove"/"Keep") | 2726, 2727, 2817, 2818 | auto × ~24 | 4 | **8** |
| Small "add" chips | 2001, 2105 | auto × ~26 | 4 | **8** |
| Cover-letter tag chip | 1698 | auto × 28 | 4 | **8** |
| Editor toolbar buttons | 1713, 1720, 1725 | 34 × 34 | 4 | **8** |
| Ghost text button | 1295 | auto × 40 | 4 | **12** |
| Section action buttons ("Add …") | 2055, 2153, 2576, 2603 | auto × 32 | 4 | **12** |
| Disabled "Coming soon" button | 2544 | auto × 32 | 4 | **12** |
| Its inline badge | 2548 | small | 3 | **8** |
| Row status badges | 1239, 1619 | small | 4 | **8** |
| Delete-confirm danger button | 617 | auto × 40 | 4 | **12** (flag 7) |
| Upgrade-to-Pro link | 998, 1536 | auto × 46 | 4 | **12** (flag 6) |
| Toggle track / knob | 2494, 2498 | 44 × 24 | full | **unchanged** |

Already correct on a rung: nothing on the page currently sits on 8/12/16/20/24 except the two Pro-upsell wrappers at 12px, which move up to 20 because they are outer shells around a 16px inner card — the same relationship the Tracker column stack has.

## Step 3 — buttons

Two atoms cover every primary and secondary on the page, including inside all six dialogs:

- `PrimaryBtn` → `main_accent_button main_accent_button--on-light`, keeping `h-10`, with inline `borderRadius: 12, fontSize: 14, height: 40, paddingLeft: 16, paddingRight: 16, justifyContent: "center"`.
- `SecondaryBtn` → `secondary_button secondary_button--on-light` for the neutral variant, keeping `h-10`, with inline `borderRadius: 12, fontSize: 13, height: 40, paddingLeft: 12, paddingRight: 12, justifyContent: "center"`. The `danger` variant keeps its red bordered treatment (radius only) — the class would repaint it.

Both are unlayered CSS, so every one of those five declarations goes inline. `PrimaryBtn` has a `disabled` prop, so the disabled state moves from `opacity-50` on accent green to the app's standard grey `--color-surface-2` fill with muted text and no shadow — the same change the Edit-columns dialog took, and consistent with every other disabled primary.

## Verification

Computed `border-radius` / `font-size` / `height` / `padding` / `justify-content` read back for both converted atoms and the disabled primary, plus `bunx tsgo --noEmit` and `bunx vitest run`. Nothing outside radii and those two atoms changes — no layout, spacing, copy, colour, typography, behaviour, validation or data, and `styles.css` is untouched.

**One thing to expect:** I could not load `/tracker` last round because no account available to me has a plan, and `/profile` sits behind the same authenticated shell. If that is still true I will apply the changes, measure against the real stylesheet as before, and give you an explicit list of the screenshots I could not take rather than touching any row.
