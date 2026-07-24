## Problem

Clicking any sub-tab in `/profile` (Documents, Cover letters, etc.) navigates to `/_authenticated/profile?tab=…` instead of `/profile?tab=…`. Since `_authenticated` is a pathless layout, that URL doesn't match any route and the tabs appear dead.

Verified by simulating a click on "Documents" — the URL changed to `/_authenticated/profile?tab=documents`.

## Cause

In `src/routes/_authenticated/profile.tsx`:

```ts
const navigate = useNavigate({ from: "/_authenticated/profile" });
const setTab = (t) => navigate({ search: { tab: t }, replace: true });
```

Without a `to`, TanStack Router falls back to the route id as the target path, which includes the `_authenticated` pathless segment.

## Fix

Pass an explicit `to: "/profile"` in the tab click handler:

```ts
const setTab = (t: TabKey) =>
  navigate({ to: "/profile", search: { tab: t }, replace: true });
```

That's the only change needed. No other tab-related logic is affected.
