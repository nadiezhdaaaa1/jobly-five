# Skeleton loading for the Digest job list

Not hard at all — the list already has a clean loading branch ("Loading jobs…"), so it's a drop-in replacement with a shimmer placeholder.

## What changes

- Replace the plain "Loading jobs…" box on the Digest with 5 skeleton job rows that match the real card layout: grey logo square, two text bars (title / company), a round match-score placeholder, salary bar, and an Apply button block.
- Each skeleton uses the same outer card shell as a real job row (12px grey wrapper, white 8px card, same border and padding), so nothing shifts when the real jobs appear.
- Add a soft shimmer sweep animation (subtle left-to-right highlight, ~1.6s loop) plus a light fade-in for the real cards once loaded, so the swap feels smooth instead of snapping.
- Respect reduced-motion: the shimmer falls back to a gentle static pulse.

## Technical notes

- New component `JobRowSkeleton` in `src/routes/_authenticated/dashboard.tsx` (or a small `src/components/app/JobRowSkeleton.tsx` if it keeps the route tidy), rendered 5x in the `!loaded && allJobs.length === 0` branch at line ~1331.
- Shimmer keyframes added to `src/styles.css` as a reusable `skeleton` utility using existing tokens (`--color-surface-2` / Light Mist) — no hardcoded colors in components.
- No data, store, or query changes; purely presentational.
