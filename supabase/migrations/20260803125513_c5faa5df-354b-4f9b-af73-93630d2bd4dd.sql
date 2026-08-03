REVOKE ALL ON FUNCTION public.can_send(uuid, public.consent_channel) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_pro(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_digest_frequency_entitlement() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_entitlements() TO authenticated;