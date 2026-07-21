## Goal
Replace the mocked login with real Lovable Cloud auth: Google + email/password, a signup flow, protected `/dashboard`, session-aware header, and a `profiles` table.

## Steps

1. **Enable Lovable Cloud** (provisions auth + database + Supabase client at `@/integrations/supabase/client`).

2. **Database migration** — create `profiles` table:
   - Columns: `id` (uuid PK → `auth.users.id` ON DELETE CASCADE), `email`, `full_name`, `avatar_url`, `created_at`, `updated_at`.
   - `GRANT`s to `authenticated` + `service_role`.
   - Enable RLS; policies: users can `SELECT`/`UPDATE` their own row.
   - Trigger `handle_new_user()` on `auth.users` insert → auto-create profile row (pulls `full_name`/`avatar_url` from Google metadata).

3. **Configure Google provider** via `supabase--configure_social_auth`.

4. **Auth surface** in `src/routes/__root.tsx`:
   - Register a single `onAuthStateChange` listener (filtered to SIGNED_IN / SIGNED_OUT / USER_UPDATED) → `router.invalidate()`.
   - Expose session to the app via router context so header + guards read it.

5. **Rebuild `/login`** (`src/routes/login.tsx`):
   - Real "Continue with Google" → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })`.
   - Real email/password → `supabase.auth.signInWithPassword`. Surface errors.
   - Add "Sign up" link → new `/signup` route (email/password + Google, `emailRedirectTo: origin`).
   - Add "Forgot password" → new `/forgot-password` + `/reset-password` routes (uses `resetPasswordForEmail` + `updateUser({ password })`).

6. **Protect `/dashboard`** — move to `src/routes/_authenticated/dashboard.tsx` under the integration-managed `_authenticated` layout (redirects unauthenticated users to `/login`). Update `Get started` links that go to `/quiz` unchanged (public), but `/dashboard` becomes gated.

7. **Header session state** (`src/components/site/Header.tsx`):
   - Replace static "Log in" with session-aware affordance: signed-out → `Log in` + `Get started`; signed-in → account menu with email/avatar + `Dashboard` link + `Sign out`.
   - `Sign out`: `queryClient.cancelQueries()` → `clear()` → `supabase.auth.signOut()` → `navigate({ to: '/login', replace: true })`.

8. **Verify** with Playwright: unauth `/dashboard` redirects to `/login`, email/password signup creates a profile row, Google button opens Google consent, signed-in header shows account menu, sign-out clears session.

## Technical notes
- Use the browser `supabase` client from `@/integrations/supabase/client` for all auth calls (never the admin/server client).
- Google OAuth `redirectTo` must be a public same-origin URL — use `/dashboard` (the auth callback will land there and the auth listener will hydrate the session before the `_authenticated` gate runs). Alternatively use the app origin and let post-login navigation land the user on `/dashboard`.
- Do not store roles on `profiles`; not needed now — skip user_roles table.
- Keep `/quiz` public; only `/dashboard` is gated in this pass.

## Out of scope
- Persisting quiz answers to the profile (can be a follow-up).
- Additional providers (Apple, Microsoft), password strength / HIBP, MFA.
