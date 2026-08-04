CREATE TABLE public.auth_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('signup', 'reset', 'signin_fail')),
  ip inet,
  email_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Server-only: no anon/authenticated grants. Reached exclusively through
-- trusted server code using the service role.
GRANT ALL ON public.auth_attempts TO service_role;

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- No policies: RLS denies every client role by default. service_role bypasses RLS.

CREATE INDEX auth_attempts_lookup_idx ON public.auth_attempts (kind, ip, created_at DESC);
CREATE INDEX auth_attempts_created_at_idx ON public.auth_attempts (created_at);

CREATE OR REPLACE FUNCTION public.purge_auth_attempts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.auth_attempts WHERE created_at < now() - interval '24 hours';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_auth_attempts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_auth_attempts() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_auth_attempts() TO service_role;