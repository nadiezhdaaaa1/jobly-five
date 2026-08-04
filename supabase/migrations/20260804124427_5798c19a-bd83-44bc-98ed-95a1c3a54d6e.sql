-- Provision helper shared by the auth trigger and the RPC safety net
CREATE OR REPLACE FUNCTION public.provision_user(_user_id uuid, _email text, _meta jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    _user_id,
    _email,
    COALESCE(_meta->>'full_name', _meta->>'name', split_part(COALESCE(_email,''), '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.subscriptions (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Trigger function: never block sign-up on a provisioning failure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM public.provision_user(NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data, '{}'::jsonb));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'provision_user failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- Safety net callable by the signed-in user for their own account
CREATE OR REPLACE FUNCTION public.ensure_user_provisioned()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  u_email text;
  u_meta jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT email, COALESCE(raw_user_meta_data, '{}'::jsonb)
    INTO u_email, u_meta
  FROM auth.users WHERE id = uid;

  PERFORM public.provision_user(uid, u_email, u_meta);
END;
$$;

REVOKE ALL ON FUNCTION public.provision_user(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_user(uuid, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.ensure_user_provisioned() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_provisioned() TO authenticated, service_role;