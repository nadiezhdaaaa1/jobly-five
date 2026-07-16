Goal: Adjust the spacing between the main match card and the two backing cards in the hero so the visible gaps match the requested 12px spacing.

Current state: The hero card has two backing cards centered behind the main card. They are positioned with fixed `top-32` / `top-52` offsets, which makes the visible gaps larger than the desired 12px.

Plan:

1. Read `src/routes/index.tsx` around the `HeroCard` component (lines ~273-310) to confirm the current stacked card markup.

2. In `src/routes/index.tsx`, change the positioning of the two backing cards so their visible portion is always 12px, regardless of the main card's natural height:
   - Second card (first stacked card): keep `h-[140px]`, but set `top-[calc(100%-128px)]` so exactly 12px peeks below the main card.
   - Third card (second stacked card): keep `h-[100px]`, but set `top-[calc(100%-76px)]` so it is 12px lower than the second card.

3. Verify the result with a desktop screenshot using Playwright at 1280×1800 and check that the visible spacing is 12px for each step.

4. Run `bunx tsc --noEmit` to ensure the TypeScript still compiles cleanly.

No new files or dependencies are needed.