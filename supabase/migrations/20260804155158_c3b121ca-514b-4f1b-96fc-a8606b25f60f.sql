CREATE OR REPLACE FUNCTION public.policies_needing_reconsent(p_user_id uuid)
RETURNS TABLE (document_key text, version text, change_summary text)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT c.document_key, c.version, c.change_summary
  FROM public.current_policy_version c
  WHERE c.requires_reconsent
    AND NOT EXISTS (
      SELECT 1 FROM public.consent_records r
      WHERE r.user_id = p_user_id
        AND r.channel::text = CASE WHEN c.document_key = 'billing_terms'
                                   THEN 'billing_terms' ELSE c.document_key END
        AND r.policy_version = c.version
        AND r.granted
    );
$$;

REVOKE ALL ON FUNCTION public.policies_needing_reconsent(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.policies_needing_reconsent(uuid) TO authenticated, service_role;