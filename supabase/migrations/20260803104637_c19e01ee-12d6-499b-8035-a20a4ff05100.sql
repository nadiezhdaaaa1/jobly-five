REVOKE ALL ON FUNCTION public.get_entitlements() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_pro(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_entitlements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pro(uuid) TO service_role;