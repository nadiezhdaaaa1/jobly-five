REVOKE EXECUTE ON FUNCTION public.ensure_user_provisioned() FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_user(uuid, text, jsonb) TO service_role;