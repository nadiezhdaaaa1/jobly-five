Goal: Reduce the height of the testimonial cards from 560px to 520px.

Current state: In `src/routes/index.tsx`, the testimonial cards are rendered with `className="relative h-[560px] overflow-hidden rounded-xl ..."` on line 358.

Plan:

1. Open `src/routes/index.tsx` and locate the `testimonials.map` block inside the "From inbox to offer" section.

2. Change the `h-[560px]` class on the testimonial `<article>` to `h-[520px]`.

3. Verify the change with a desktop screenshot at 1280×1800 to confirm the cards look correct and the text is still readable.

4. Run `bunx tsc --noEmit` to ensure the TypeScript still compiles cleanly.

No new files or dependencies are needed.