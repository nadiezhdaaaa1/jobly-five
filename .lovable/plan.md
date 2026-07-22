## Problem

In `InterviewReminderDialog`, the three time selects (hour / minute / AM-PM) crop their values ("02" → "0:", "PM" → "Pl"). Cause: the global `select { padding-right: 2.25rem !important }` rule I added stacks on top of the compact `flex-1 min-w-0` selects, leaving too little room for the 2-character value plus the custom chevron.

## Fix

1. In `src/styles.css`, soften the global `select` rule:
   - Drop `!important` on `padding-right` so per-instance padding wins.
   - Move the chevron slightly inward (`right 0.5rem center`) so compact selects still show text.
2. In `src/components/app/InterviewReminderDialog.tsx`, on the three time selects:
   - Replace `flex-1 min-w-0 pl-2 pr-8` with a fixed width sized for content (hour/minute ~72px, AM/PM ~76px) and `pr-7` so the value renders fully next to the chevron.
   - Keep the existing border/radius/focus styles.

No other components use these classes for time-style compact selects, so the global relaxation is safe; wider selects (profile year pickers, quiz) already have room.
