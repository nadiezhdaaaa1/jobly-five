## Fix select field arrow spacing

The dropdown arrow on select fields sits flush against the right border because right-side padding is too small (or the shadcn Radix trigger has no reserved right space). Fix by adding right padding on all select triggers and native `<select>` elements.

### Changes

1. **`src/components/ui/select.tsx`** (shadcn Radix trigger, line 22)
   - Replace `px-3` with `pl-3 pr-2` and add a small `gap-2` so the ChevronDown icon has breathing room from the right border (target ~8px inner right padding + icon).

2. **Native `<select>` elements** — add right padding room for the browser-drawn arrow (use `pr-8` while keeping `pl-2`):
   - `src/routes/_authenticated/profile.tsx` — lines 832, 837, 985, 993, 998
   - `src/routes/quiz.tsx` — lines 1867, 1891, 1902 (language pickers)
   - `src/components/app/InterviewReminderDialog.tsx` — lines 39, 49, 59 (time picker selects)

No logic changes, no other UI changes.
