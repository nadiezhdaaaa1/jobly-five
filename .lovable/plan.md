# "Keep my pause" should only close the dialog

## What it does today

The button sits in the "Are you sure?" dialog shown when a paused user starts to cancel. Its handler is `setPlan("paused")` followed by closing the dialog.

`setPlan("paused")` is not a no-op call in intent — it is the same mutator that starts a pause, and it writes to the server. In practice the store guards it (`if (sub.status === "paused") return`, and the server action also returns early when already paused), so it currently changes nothing. But it is a real write path attached to a button that means "never mind": if that guard ever moves, this button re-pauses or extends a pause the user only wanted to keep.

The cancel reason picker in the same dialog is also left untouched by this path — the reason is only saved on the actual cancel button, which is correct.

## The change

Make the handler `closeCancel()` only. That resets the dialog step and clears the selected reason and free-text, exactly like the X and backdrop already do. No plan mutation, no server call, no flash message.

Nothing else in the dialog changes: copy, layout, the reason picker, and the "Cancel anyway" path stay as they are.

## Technical note

In `src/routes/_authenticated/settings.tsx`, the "Keep my pause" button's `onClick` becomes `closeCancel` instead of `() => { setPlan("paused"); closeCancel(); }`.
