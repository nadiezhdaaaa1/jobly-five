# Fix the ~2s delay when switching tabs

## What's happening

Every tab (Digest, Tracker, Profile, Settings) sits under the shared authenticated layout route. That layout runs an auth check before it will render anything, and that check calls the auth server over the network — not the session already stored in the browser. TanStack Router treats it as fresh work on every navigation, so each tab click waits for a round trip (typically 0.3–2s, worse on slow networks) with the old page still on screen and no feedback. Nothing else in the app is blocking navigation; the per-page data loads are already non-blocking.

So the delay is not "data loading" — it's a redundant auth round trip gating the route transition.

## The fix

1. Make the auth gate cheap and non-repeating
   - Read the session from the local session store instead of the network round trip, so the gate resolves synchronously in the common case.
   - Keep a server-side verification, but run it once per app boot in the background rather than in front of every navigation. If it fails, the user is redirected to login exactly as today.
   - Mark the layout's gate as non-stale so re-entering it during a tab switch doesn't re-run it.

2. Make any remaining wait visible, never frozen
   - Add a router-level pending state with a short delay threshold, so if a transition ever does need to wait, the new page frame appears immediately with skeletons instead of the old page hanging.
   - Reuse the existing skeleton patterns already in the Digest sidebar, Tracker and nav (no new visual language, no layout shift).

3. Preload on hover
   - Enable intent-based preloading on the main nav so the target route's code chunk is fetched while the pointer is on the tab, making the switch feel instant.

## What the user will see

- Clicking a tab switches the page frame immediately.
- Content that genuinely still needs the server (job feed, tracker board, plan badge) shows the existing skeletons and fills in — no blank freeze, no old page lingering.
- No change to any layout, copy, or styling.

## Technical notes

- `src/routes/_authenticated/route.tsx`: swap the blocking `supabase.auth.getUser()` in `beforeLoad` for a session read; add `staleTime: Infinity` / `shouldReload: false` so the gate runs once. Background revalidation + redirect-on-failure moves into the shell effect that already runs on mount.
- `src/router.tsx`: add `defaultPendingComponent` and `defaultPendingMs` / `defaultPendingMinMs`, plus `defaultPreload: "intent"`.
- `src/components/app/AppNav.tsx`: rely on router preloading (no markup change).
- No database, entitlement, or hydration logic changes; sign-out and deletion-grace behaviour stay as is.
