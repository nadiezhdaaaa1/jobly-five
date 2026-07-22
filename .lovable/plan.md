## Fix mobile overflow in Profile edit steps

At 393px width, the Experience card's Level chooser renders three cards in a fixed `grid-cols-3` row. Each card only gets ~100px, so the labels get clipped ("Juni…", "Ser…") and the absolute-positioned cube images spill visually past the card. Nothing else on the Profile page overflows the viewport at mobile width — Playwright at 393px reports no elements past `window.innerWidth`, but the level row is visibly broken inside the card.

### Change

**`src/routes/quiz.tsx`** — `ExperienceStep`, line 1677
- Replace `grid grid-cols-3 gap-3` with `grid grid-cols-1 gap-3 sm:grid-cols-3`.
- Result: on mobile, Junior/Mid/Senior stack full-width so the label has room and the right-aligned image no longer collides with the text. From `sm:` up (≥640px), the original 3-across layout is preserved.

No other visual or logic changes. This fix applies everywhere `ExperienceStep` is used (quiz + Profile edit).
