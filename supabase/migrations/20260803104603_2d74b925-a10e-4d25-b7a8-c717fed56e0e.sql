CREATE TYPE public.subscription_status AS ENUM ('none','trialing','active','past_due','paused','canceled');

CREATE TABLE public.subscriptions (
  user_id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status                 public.subscription_status NOT NULL DEFAULT 'none',
  plan                   text NOT NULL DEFAULT 'free',
  billing_period         text,
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  trial_started_at       timestamptz,
  trial_ends_at          timestamptz,
  current_period_end     timestamptz,
  paused_at              timestamptz,
  pause_ends_at          timestamptz,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  canceled_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated;
REVOKE ALL ON public.subscriptions FROM anon;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX subscriptions_stripe_customer_id_idx ON public.subscriptions (stripe_customer_id);
CREATE INDEX subscriptions_stripe_subscription_id_idx ON public.subscriptions (stripe_subscription_id);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.subscriptions (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_pro(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
      AND (
        (status = 'trialing' AND trial_ends_at > now())
        OR status = 'active'
        OR (status = 'past_due' AND current_period_end > now() - interval '3 days')
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  s public.subscriptions;
  pro boolean := false;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object(
      'plan','free','status','none',
      'trial_ends_at',NULL,'current_period_end',NULL,'pause_ends_at',NULL,
      'features', jsonb_build_object(
        'match_score',false,'daily_digest',false,'tracker',false,
        'follow_up_reminders',false,'found_a_job_pause',false)
    );
  END IF;

  SELECT * INTO s FROM public.subscriptions WHERE user_id = uid;
  pro := public.has_pro(uid);

  RETURN jsonb_build_object(
    'plan', CASE WHEN pro THEN 'pro' ELSE 'free' END,
    'status', COALESCE(s.status, 'none'::public.subscription_status),
    'trial_ends_at', s.trial_ends_at,
    'current_period_end', s.current_period_end,
    'pause_ends_at', s.pause_ends_at,
    'features', jsonb_build_object(
      'match_score', pro,
      'daily_digest', pro,
      'tracker', pro,
      'follow_up_reminders', pro,
      'found_a_job_pause', pro
    )
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_entitlements() TO authenticated;
REVOKE ALL ON FUNCTION public.has_pro(uuid) FROM anon, authenticated;