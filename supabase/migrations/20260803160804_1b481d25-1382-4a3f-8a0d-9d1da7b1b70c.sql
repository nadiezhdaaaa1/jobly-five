DROP FUNCTION IF EXISTS public.can_send(uuid, public.consent_channel);

CREATE OR REPLACE FUNCTION public.can_send(p_email citext, p_channel public.consent_channel)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE((SELECT granted FROM public.current_consent
              WHERE email = p_email AND channel = p_channel), false)
    AND NOT EXISTS (SELECT 1 FROM public.email_contacts
                    WHERE email = p_email AND suppressed_at IS NOT NULL)
    AND (p_channel = 'daily_digest' OR EXISTS (SELECT 1 FROM public.email_contacts
                    WHERE email = p_email AND confirmed_at IS NOT NULL));
$$;

REVOKE ALL ON FUNCTION public.can_send(citext, public.consent_channel) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_send(citext, public.consent_channel) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_send(citext, public.consent_channel) TO service_role;

COMMENT ON TABLE public.consent_records IS
  'Append-only consent evidence. Never UPDATE or DELETE except by retention rules: billing_terms rows retained at least 3 years or 1 year after subscription termination (whichever is later); all other channels for the life of the account plus 12 months. Excluded from all purge jobs.';