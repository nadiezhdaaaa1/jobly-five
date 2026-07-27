## Problem

The skills dropdown is portaled to `document.body` so it renders above the dialog edges — but the Radix Dialog uses `react-remove-scroll`, which attaches a **capture-phase** wheel listener on the document. That listener calls `preventDefault()` on any wheel target that isn't inside the DialogContent subtree. Our bubble-phase `wheel` handler on the popover element runs after preventDefault has already fired, so the dropdown never scrolls.

## Fix

Rebuild the dropdown using the existing shadcn **Popover** (`@/components/ui/popover`, built on Radix Popover). Radix Popover is designed to interop with Radix Dialog: its portal content is registered with the dialog's scroll-lock allowlist, so wheel/touch scrolling works natively without any manual handler.

### Changes in `src/routes/quiz.tsx` — `SkillsGroup` only

1. Remove the manual portal machinery: `createPortal` import usage here, `inputWrapRef`, `popRef`, `pos` state, the resize/scroll reposition effect, the outside-click effect, and the manual `wheel` effect.
2. Wrap the search field + dropdown in `<Popover open={open} onOpenChange={setOpen}>`:
   - `PopoverAnchor` wraps the search input row so the popover width matches it.
   - `PopoverContent` (side="bottom", align="start", `sideOffset={4}`, `onOpenAutoFocus` prevented so focus stays in the input) contains the option list.
   - Set `style={{ width: "var(--radix-popover-trigger-width)" }}` on `PopoverContent` so it matches the search field width.
   - Keep the current visual: `max-h-[240px] overflow-y-auto`, 4px radius, white bg, existing stronger shadow, 4px vertical gap between options.
3. Open on input focus (`setOpen(true)`); keep it open while typing; Radix handles outside-click close.
4. Keep everything else (Select all / Clear buttons, filter logic, chip visuals) unchanged.

### Why this works

Radix Popover's portal content is on Radix Dialog's internal allowlist, so `react-remove-scroll` skips wheel/touch events targeted at it — native scrolling on `overflow-y-auto` just works, in the dialog and outside it. It also inherently overflows the dialog borders (which was the original reason for the portal) and repositions on scroll/resize automatically.

### Out of scope

No changes to other dropdowns, no styling changes beyond what's needed to preserve current look, no logic changes to selection or filtering.