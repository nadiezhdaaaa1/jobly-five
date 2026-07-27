Fix the skill search dropdown without rebuilding the quiz/profile flow.

1. Update the existing `SkillsGroup` dropdown in `src/routes/quiz.tsx`.
2. Keep the dropdown escaped from the inner scroll container, but portal it into the nearest dialog content when it is used inside a modal instead of always portaling to `document.body`.
3. Recalculate dropdown position relative to that portal target so it still appears over the modal/window edge and is not clipped.
4. Keep body-level fallback for the standalone `/quiz` page.
5. Preserve current behavior: search filtering, select/unselect, selected chips, Select all, Clear, and outside-click close.
6. Verify in the Profile preferences edit modal with a short viewport that the dropdown opens outside the clipped area and wheel/touch scrolling works.