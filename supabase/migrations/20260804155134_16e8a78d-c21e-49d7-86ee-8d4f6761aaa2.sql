CREATE TABLE public.policy_documents (
  key text PRIMARY KEY,
  display_name text NOT NULL
);

GRANT SELECT ON public.policy_documents TO anon, authenticated;
GRANT ALL ON public.policy_documents TO service_role;

ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_documents_public_read" ON public.policy_documents
  FOR SELECT USING (true);

CREATE TABLE public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_key text NOT NULL REFERENCES public.policy_documents(key),
  version text NOT NULL,
  effective_from timestamptz NOT NULL,
  published_at timestamptz,
  content_hash text,
  is_material boolean NOT NULL,
  requires_reconsent boolean NOT NULL,
  change_summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_key, version)
);

CREATE INDEX policy_versions_doc_effective_idx
  ON public.policy_versions (document_key, effective_from DESC);

GRANT SELECT ON public.policy_versions TO anon, authenticated;
GRANT ALL ON public.policy_versions TO service_role;

ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_versions_public_read" ON public.policy_versions
  FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.current_policy_version
WITH (security_invoker = true) AS
SELECT DISTINCT ON (document_key)
  document_key, version, effective_from, is_material, requires_reconsent, change_summary
FROM public.policy_versions
WHERE published_at IS NOT NULL AND effective_from <= now()
ORDER BY document_key, effective_from DESC;

GRANT SELECT ON public.current_policy_version TO anon, authenticated;
GRANT ALL ON public.current_policy_version TO service_role;

ALTER TYPE public.consent_channel ADD VALUE IF NOT EXISTS 'terms';
ALTER TYPE public.consent_channel ADD VALUE IF NOT EXISTS 'privacy';

INSERT INTO public.policy_documents (key, display_name) VALUES
  ('terms', 'Terms of Service'),
  ('privacy', 'Privacy Policy'),
  ('cookies', 'Cookie Policy'),
  ('billing_terms', 'Subscription and Billing Terms')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.policy_versions
  (document_key, version, effective_from, published_at, content_hash, is_material, requires_reconsent, change_summary)
VALUES
  ('terms', '2026-08-01', '2026-08-01T00:00:00Z', now(), '7d103870d4122cccf0f231a26ed70cc9b288f6887c69127a7f5d5bf1d69647ed', false, false, 'Baseline version. Recorded as the first tracked version of the Terms of Service; no change of substance from what was already published.'),
  ('privacy', '2026-08-01', '2026-08-01T00:00:00Z', now(), 'c91b6bc5e286250d6424af3146bf0d1044f0ea2a9089939bd0e011a707b5d6b7', false, false, 'Baseline version. Recorded as the first tracked version of the Privacy Policy; no change of substance from what was already published.'),
  ('cookies', '2026-08-01', '2026-08-01T00:00:00Z', now(), '61170f704c64898a2b3dccb7b5997dcc709ce89661300ca30fecdbb95dea9357', false, false, 'Baseline version. Recorded as the first tracked version of the Cookie Policy; no change of substance from what was already published.'),
  ('billing_terms', '2026-08-01', '2026-08-01T00:00:00Z', now(), 'd708fcb8ec20795ac8d9bc79ab398cae88db44fed306efbc9813874be7d50978', false, false, 'Baseline version. Recorded as the first tracked version of the Subscription and Billing Terms; no change of substance from what was already published.')
ON CONFLICT (document_key, version) DO NOTHING;