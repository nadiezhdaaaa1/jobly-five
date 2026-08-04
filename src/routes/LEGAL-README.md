# Publishing a legal document version

The legal pages live in `src/lib/legal-data.ts` (`LEGAL_DOCS`) and render through
`src/components/legal/LegalLayout.tsx`. The version history lives in the database:
`policy_documents`, `policy_versions`, and the `current_policy_version` view.

There is deliberately **no admin UI**. Publishing is a migration plus a code edit,
in this order. Doing it in any other order is how `policy_version` became a
meaningless free string.

## 1. Decide `is_material` and `requires_reconsent` — by hand

`is_material` is a human judgement recorded at publish time. Never computed from a
diff, never inferred.

- Not material: typo, formatting, clarified wording with no change of substance.
- Material: adding or changing a data processor, changing what we do with resumes
  or profile data, changing retention, changing billing or renewal terms,
  changing the legal basis for anything.

`requires_reconsent` is separate. A material change may need **notice only**. Set it
to `true` only when we actually need a fresh affirmative acceptance from existing
users. A price increase, for example, is material and needs advance notice
(California ARL: 7–30 business days before it takes effect), but the consent event
belongs at renewal — Tier 3 — not on an app-load banner.

| `is_material` | `requires_reconsent` | Effect |
| --- | --- | --- |
| `false` | `false` | Tier 1: page shows the new version. No prompt. |
| `true` | `false` | Notice only (email / release note). No prompt. |
| `true` | `true` (non-billing) | Tier 2: dismissible in-app banner with an explicit Accept. |
| `true` | `true` (`billing_terms`) | Tier 3: blocking step before the next charge only. |

## 2. Write the `change_summary` in plain language

It is shown to the user verbatim in the banner. Say what changed and what it means
for them. No "various updates and clarifications".

## 3. Compute the content hash

Edit the document text in `src/lib/legal-data.ts` locally first (including
`lastUpdated`, which is the version string), then:

```bash
node scripts/policy-hash.mjs
```

Copy the hash for the document you are publishing.

## 4. Insert the version row (migration)

```sql
INSERT INTO public.policy_versions
  (document_key, version, effective_from, published_at, content_hash,
   is_material, requires_reconsent, change_summary)
VALUES
  ('privacy', '2026-09-15', '2026-09-15T00:00:00Z', now(),
   '<hash from step 3>', true, true,
   'We added a new email provider that processes your address to send the digest.');
```

`version` must equal the document's `lastUpdated` value. `effective_from` may be in
the future — the `current_policy_version` view only surfaces a version once it is
published and its effective date has passed, so a scheduled notice period works
without extra plumbing.

## 5. Ship the page text

Only now commit the `legal-data.ts` edit. Registry first, page second.

## Drift check

```bash
node scripts/policy-drift-check.mjs
```

Exits non-zero if a page's text or version no longer matches the `content_hash`
recorded for its current version — i.e. someone edited a legal page without
publishing a version. Run it before shipping legal copy changes.

## Rules that do not bend

- Acceptance always requires an affirmative action. "By continuing to use Jobly you
  agree" is not express affirmative consent under ARL and is weak under GDPR.
- Never block data export, account deletion, or unsubscribe behind acceptance.
- Never block the digest — that runs on contract basis, not on new consent.
- Never invalidate or delete historical consent rows. A user who accepted v1 stays
  valid under v1 until a version marked `requires_reconsent` supersedes it. Never
  backfill consent for a version the user never saw.
- One banner at a time. Group several documents into a single prompt.
- Cookie consent stays out of `consent_records` — it is per-device, and today Jobly
  sets no cookies at all (see the Cookie Policy).
