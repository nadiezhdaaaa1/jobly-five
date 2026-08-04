# Fix: Preferences rows sometimes come up empty

## What's happening

The Profile screen takes a one-time snapshot of your saved answers when the page mounts (`loadQuiz()` on mount only). Those answers are still being fetched from the account at that moment. When the fetch finishes a moment later, nothing re-reads it, so every Preferences row renders empty. Navigating away and back remounts the screen — by then the answers are in memory, so it looks filled.

Whether you see it depends on timing: arrive after hydration finished and it's fine; arrive before and it's blank.

## The fix

1. Profile screen reads answers through the existing reactive hook (`useQuiz()`) instead of the one-time snapshot, so rows fill in as soon as the answers arrive.
2. While the answers are still loading (`useQuizHydrated()` is false), the Preferences rows show the existing skeleton/placeholder treatment rather than looking like a genuinely empty profile — no new visual language, same styling already used elsewhere for loading rows.
3. The edit modal keeps its local draft; on save the reactive read picks the change up, so the manual `refreshQuiz()` hop goes away and an in-progress edit is never overwritten by a late-arriving hydration.

No layout, copy, or component structure changes.

## Technical notes

- `src/routes/_authenticated/profile.tsx`: replace `useState(() => loadQuiz())` + mount effect + `refreshQuiz` (lines ~173-175) with `const quiz = useQuiz()`; drop the `refreshQuiz()` call at the save site (~line 299). Add `useQuizHydrated()` to gate the Preferences rows into their loading state.
- `PreferencesTab` already re-syncs its `draft` from the `quiz` prop, so it inherits the reactive value with no signature change.
- No store or database changes: `quiz-store` already exposes `useQuiz` / `useQuizHydrated`.
