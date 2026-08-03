CREATE EXTENSION IF NOT EXISTS citext;

ALTER TYPE public.consent_channel ADD VALUE IF NOT EXISTS 'billing_terms';

-- consent_records: bring up to evidence standard
ALTER TABLE public.consent_records RENAME COLUMN wording TO consent_text;
ALTER TABLE public.consent_records ADD COLUMN IF NOT EXISTS email citext;
ALTER TABLE public.consent_records ADD COLUMN IF NOT EXISTS lawful_basis text NOT NULL DEFAULT 'consent';
ALTER TABLE public.consent_records ADD COLUMN IF NOT EXISTS policy_version text NOT NULL DEFAULT '2026-08-01';
ALTER TABLE public.consent_records ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE public.consent_records ADD COLUMN IF NOT EXISTS user_agent text;

UPDATE public.consent_records c
SET email = p.email
FROM public.profiles p
WHERE p.id = c.user_id AND c.email IS NULL;

DELETE FROM public.consent_records WHERE email IS NULL;
ALTER TABLE public.consent_records ALTER COLUMN email SET NOT NULL;

-- Evidence must outlive the account: keep the row, drop the link.
ALTER TABLE public.consent_records ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.consent_records DROP CONSTRAINT IF EXISTS consent_records_user_id_fkey;
ALTER TABLE public.consent_records
  ADD CONSTRAINT consent_records_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS consent_records_email_channel_idx
  ON public.consent_records (email, channel, created_at DESC);
CREATE INDEX IF NOT EXISTS consent_records_user_idx
  ON public.consent_records (user_id);

-- No client writes at all; the server owns consent.
DROP POLICY IF EXISTS consent_records_insert_own ON public.consent_records;
REVOKE INSERT, UPDATE, DELETE ON public.consent_records FROM anon, authenticated;
GRANT SELECT ON public.consent_records TO authenticated;
GRANT ALL ON public.consent_records TO service_role;

-- email_contacts
CREATE TABLE IF NOT EXISTS public.email_contacts (
  email              citext PRIMARY KEY,
  user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at       timestamptz,
  unsubscribe_token  uuid NOT NULL DEFAULT gen_random_uuid(),
  suppressed_at      timestamptz,
  suppression_reason text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS email_contacts_token_idx
  ON public.email_contacts (unsubscribe_token);

GRANT SELECT ON public.email_contacts TO authenticated;
GRANT ALL ON public.email_contacts TO service_role;
ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_contacts_select_own ON public.email_contacts;
CREATE POLICY email_contacts_select_own ON public.email_contacts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS email_contacts_updated_at ON public.email_contacts;
CREATE TRIGGER email_contacts_updated_at BEFORE UPDATE ON public.email_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Current state, keyed by email so pre-account consent is representable.
DROP VIEW IF EXISTS public.current_consent;
CREATE VIEW public.current_consent WITH (security_invoker = on) AS
SELECT DISTINCT ON (email, channel)
  email, user_id, channel, granted, consent_text, source, policy_version, created_at
FROM public.consent_records
ORDER BY email, channel, created_at DESC;

GRANT SELECT ON public.current_consent TO authenticated;
GRANT SELECT ON public.current_consent TO service_role;