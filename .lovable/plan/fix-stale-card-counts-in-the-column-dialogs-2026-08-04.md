# Fix stale card counts in the column dialogs

## What's wrong

The column-editing dialogs read the tracker's card counts, but they never *listen* to the tracker for changes. They only re-render when the column layout itself changes. So after you drag a card into or out of a custom column, the numbers those dialogs show were captured earlier and are never refreshed: the reset confirmation can claim a column still holds a card (or claim it is empty when it isn't), and the same stale number drives the delete-column tooltip and the disabled reset button.

Confirmed in the code: `countActiveInColumn` in `src/lib/tracker-store.ts` is a plain function over the in-memory records — it has no subscription — and `BoardColumnsDialog.tsx` calls it inside a memo keyed only on the column list, while `SingleColumnDialog.tsx` keys its memo on the dialog being open and its own stage drafts.

## The fix

Make both dialogs subscribe to tracker changes so any card move immediately refreshes the counts they display.

- Add a small subscription hook to the tracker store that re-renders on every tracker mutation (the store already has the internal subscribe/version plumbing that `useCounts` and `useTrackerHiddenIds` use).
- `BoardColumnsDialog`: use it, and include its value in the memo that builds the "columns that will be deleted" list, so the reset dialog's per-column counts, the red banner, and the disabled Approve button all reflect the live board. The per-row delete guard picks this up in the same re-render.
- `SingleColumnDialog`: use it for the active-card count behind the delete guard and the "stage in use" checks.

No behaviour, wording, or layout changes — only the freshness of the numbers.

## Technical notes

- New export in `src/lib/tracker-store.ts`: `useTrackerVersion()` — `useSyncExternalStore(subscribe, getVersion, getVersion)`, matching the existing hooks in that file.
- `src/components/app/BoardColumnsDialog.tsx`: call the hook once; add its value to the `removedColumns` dependency array.
- `src/components/app/SingleColumnDialog.tsx`: call the hook once; add its value to the `activeInColumn` dependency array.
