-- 1. Consent channel for the Cancellation Policy.
ALTER TYPE public.consent_channel ADD VALUE IF NOT EXISTS 'cancellation';

-- 2. Documents that were not tracked before.
INSERT INTO public.policy_documents (key, display_name) VALUES
  ('cancellation', 'Cancellation Policy'),
  ('email', 'Email and Communications Consent'),
  ('disclaimer', 'Service Disclaimer'),
  ('dmca', 'DMCA Policy')
ON CONFLICT (key) DO NOTHING;

-- 3. Annotate superseded August rows: their hashes came from the pre-2026-09-17
--    hasher, which silently skipped bullet lists, so the current hasher cannot
--    reproduce them. Recorded rather than rewritten.
UPDATE public.policy_versions
SET change_summary = change_summary ||
  ' [Audit note, recorded 2026-09-17: this row''s content_hash was produced by the pre-17-September-2026 hashing script, which omitted bulleted list content, and therefore cannot be reproduced by the current hasher. The hash is retained unchanged as the historical record; a mismatch against today''s tool is expected and is not evidence of tampering.]'
WHERE version = '2026-08-01'
  AND document_key IN ('terms', 'privacy', 'billing_terms');

-- 4. Cookie Policy: presentation-only re-render (four prose bullets became a
--    three-column table, wording identical). Not an amendment, so the date is
--    deliberately unchanged and no new version is created; the recorded hash on
--    the existing row is corrected to the current text.
UPDATE public.policy_versions
SET content_hash = 'cb25f6f9da78b6c0ce2521acd02d60012a4ecb0e8850736bd3c90764b99f4eea',
    change_summary = change_summary ||
      ' [Hash corrected 2026-09-17: the storage disclosure was re-laid out from four prose bullets into a three-column table using the same wording. No sentence changed, so the document was not amended and the 2026-08-01 date stands; only the recorded content_hash was updated, and this version remains non-material with no re-acceptance required.]'
WHERE document_key = 'cookies' AND version = '2026-08-01';

-- 5. Current published versions.
INSERT INTO public.policy_versions
  (document_key, version, effective_from, published_at, content_hash, is_material, requires_reconsent, change_summary)
VALUES
  ('terms', '2026-09-14', '2026-09-14 00:00:00+00', now(),
   'c331d96419b8e203ee8bc110a57667a72fafeb4e0ea76b9291c976bcd62e2d60', true, true,
   'Full replacement of the Terms of Service (18 sections). Adds a mandatory arbitration clause and class-action waiver, and states Delaware governing law. Removes the free-tier sentence. States that fees are non-refundable except as required by law. Affirmative acceptance is required: continued use is not assent to a new arbitration clause.'),
  ('privacy', '2026-09-14', '2026-09-14 00:00:00+00', now(),
   '66fb0c527e5f9bf07ccfdccc97a675379e550e975177828b904d0cce44617b35', true, false,
   'Full replacement of the Privacy Policy. Names sub-processors individually, adds a 30-day account restore window, states that banked days are forfeited on deletion, and sets out US and EEA rights. Material and requires notice; processing rests on contract rather than consent, so no re-acceptance click is required.'),
  ('billing_terms', '2026-09-14', '2026-09-14 00:00:00+00', now(),
   '5c5e967892bc1cc9061a2cf2c01db94ccba556ce1e26709b2461c013895a702d', true, true,
   'Full replacement of the Subscription and Billing Terms. States that no free tier is offered, restricts the 3-day trial to monthly Pro, and adds pause and banked-days terms. Affirmative acceptance is required before the next charge.'),
  ('cancellation', '2026-09-14', '2026-09-14 00:00:00+00', now(),
   '21b828b0766c251faafe3426ea113c8aa35c4d90d73076fa8b6b4210853394a0', true, true,
   'First published version of the Cancellation Policy (10 sections), replacing the previous Refund Policy, whose URL now redirects here. Removes the discretionary-refund language and sets out plan-change and banked-days treatment. Strictly less favourable to the user than the document it replaces, so affirmative acceptance is required rather than acceptance by incorporation into the Terms.'),
  ('email', '2026-09-14', '2026-09-14 00:00:00+00', now(),
   '755ce56ef33ebb543ba10f951f62c203ef91bdb0f1180c2e34b68a1d93b56863', true, false,
   'First published version of the Email and Communications Consent document. Names Postmark as the sending processor, and makes digest frequency plan-driven rather than user-chosen. Material because it reduces what was previously promised; notice is required, not a fresh acceptance click.'),
  ('disclaimer', '2026-08-01', '2026-08-01 00:00:00+00', now(),
   '888dd295e809e826fa98720da9b31533ce56fa9f0d3aad7835b567aef4cba736', false, false,
   'First tracked version of the Service Disclaimer. Registered at its existing 2026-08-01 date; the only differences from the previously published page are the title ("Disclaimer" to "Service Disclaimer") and British spelling. Not an amendment of substance.'),
  ('dmca', '2026-08-01', '2026-08-01 00:00:00+00', now(),
   'b9c1f537275b3e5bc641f5651debdc1ee8fe4816460a38cc2343380c6504cd81', false, false,
   'First tracked version of the DMCA Policy. Registered at its existing 2026-08-01 date; differences from the previously published page are layout and spelling only, including breaking the designated agent''s contact address onto its own line. Not an amendment of substance.')
ON CONFLICT (document_key, version) DO UPDATE
SET content_hash = EXCLUDED.content_hash,
    effective_from = EXCLUDED.effective_from,
    published_at = EXCLUDED.published_at,
    is_material = EXCLUDED.is_material,
    requires_reconsent = EXCLUDED.requires_reconsent,
    change_summary = EXCLUDED.change_summary;