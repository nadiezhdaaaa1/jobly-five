# Make the Security section reflect how the user actually signs in

Today the "Security and sign in" card always shows Current password / New password / Confirm, plus a hardcoded "Connected as serjkrush@gmail.com" Google row. For someone who signed up with Google that is wrong twice: they have no current password to enter, and the connected-account line isn't their real state.

Verified current state:
- `SecurityCard` renders the three password fields unconditionally and never reads the user's identities.
- The password form is cosmetic — submitting only clears the fields and flashes "Password updated."; it never calls the auth service.
- The Google row uses `useState(true)` and a hardcoded email; Connect/Disconnect only flip local state.
- The Danger zone card already does this correctly: it reads `user.identities` and branches on whether an `email` identity exists.

## What changes for you

The card adapts to your sign-in method.

1. **Google-only account** — no Current password field. Instead:
   - A short line: "You sign in with Google. You don't have a password yet."
   - A single action, "Set a password", which reveals New password + Confirm (no current password) and adds password sign-in to the account. Framed as an addition, not a replacement — Google keeps working.
   - After it succeeds the card switches to the normal change-password form.
2. **Email/password account** — unchanged: Current / New / Confirm, and the form now really updates the password (a wrong current password shows an inline error instead of a false success).
3. **Both** — normal change-password form, and Google shown as connected.
4. **Connected accounts** shows your real state: connected with your actual Google email, or "Not connected" with a Connect button. Connect runs the real Google link flow.
5. **Disconnect Google** is only offered when you have another way in. With Google as your only sign-in method the button is disabled with the reason: "Set a password first so you don't lose access." The confirmation copy stops promising an email-and-password fallback that may not exist.
6. While sign-in methods are being read the card shows the existing skeleton/placeholder treatment rather than guessing.

No layout, spacing, or component restructuring beyond adding/removing these fields and lines.

## Technical notes

- `SecurityCard` gains the same identity read the danger zone uses: `supabase.auth.getUser()` → `identities`, deriving `hasPassword` (an `email` identity) and `googleIdentity` (provider `google`, with its `identity_data.email`). Render states: `loading | password | no-password`.
- Set-password path: `supabase.auth.updateUser({ password })` — valid because the user has an active session; on success re-read identities so the card re-renders in change-password mode.
- Change-password path: verify the current password with `supabase.auth.signInWithPassword({ email, password: current })` (same reauth pattern the danger zone already uses), then `updateUser({ password: next })`. Surface real errors inline; only flash success after the call resolves.
- Connect Google: `supabase.auth.linkIdentity({ provider: 'google' })`. Disconnect: `supabase.auth.unlinkIdentity(identity)`, gated on `hasPassword`.
- All work stays inside `SecurityCard` / `PasswordField` in `src/routes/_authenticated/settings.tsx`. No schema or store changes.
