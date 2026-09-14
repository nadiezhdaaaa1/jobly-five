-- 1. The five flat SKUs. Not plan x cycle: impossible combinations cannot be typed.
CREATE TYPE public.subscription_sku AS ENUM (
  'watch_monthly', 'watch_annual', 'pro_monthly', 'pro_3month', 'pro_6month'
);

-- 2. subscriptions: the SKU enum replaces the monthly|annual CHECK on `cycle`.
--    `cycle` itself is left in place as a legacy column that is no longer
--    written, so no data is dropped without sign-off.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_cycle_check;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS sku public.subscription_sku,
  -- The price actually paid. Renewal charges this, never the current list price.
  ADD COLUMN IF NOT EXISTS purchase_price numeric(10,2),
  -- Banked days from pausing a prepaid plan, plus when the balance expires.
  ADD COLUMN IF NOT EXISTS banked_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS banked_days_expire_at timestamp with time zone;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_banked_days_nonneg;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_banked_days_nonneg CHECK (banked_days >= 0);

-- Legacy monthly rows map onto the one monthly Pro SKU and keep the price they
-- actually bought at, so the no-step-up promise holds for them too.
UPDATE public.subscriptions
   SET sku = 'pro_monthly', purchase_price = COALESCE(purchase_price, 9.99)
 WHERE sku IS NULL AND cycle = 'monthly' AND status <> 'none';

-- 3. Renewal reminders are a product obligation: the shared disclosure promises
--    an email before every charge.
ALTER TYPE public.consent_channel ADD VALUE IF NOT EXISTS 'renewal_reminders';

-- 4. One tier resolver. Paused grants nothing: a pause suspends access.
CREATE OR REPLACE FUNCTION public.active_tier(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE((
    SELECT CASE
      WHEN s.status = 'paused' THEN 'none'
      WHEN (s.status = 'trialing' AND s.trial_ends_at > now())
        OR s.status = 'active'
        OR (s.status = 'past_due' AND s.current_period_end > now() - interval '3 days')
      THEN CASE WHEN s.sku IN ('watch_monthly', 'watch_annual') THEN 'watch' ELSE 'pro' END
      ELSE 'none'
    END
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
  ), 'none');
$function$;

-- has_pro keeps its signature and attributes; it now means the Pro tier only.
CREATE OR REPLACE FUNCTION public.has_pro(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.active_tier(p_user_id) = 'pro';
$function$;

-- 5. Per-feature granularity by tier. Attributes preserved exactly:
--    SECURITY INVOKER, STABLE, SET search_path TO 'public'.
CREATE OR REPLACE FUNCTION public.get_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  s public.subscriptions;
  tier text := 'none';
  onboarded boolean := false;
  qver integer := NULL;
  feats jsonb;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object(
      'plan','free','tier','none','status','none','sku',NULL,'purchase_price',NULL,
      'onboarded',false,'quiz_schema_version',NULL,
      'trial_ends_at',NULL,'current_period_end',NULL,'pause_ends_at',NULL,
      'banked_days',0,'banked_days_expire_at',NULL,
      'features', jsonb_build_object(
        'match_score',false,'ghost_filtering',false,'daily_digest',false,
        'high_match_alerts',false,'tracker',false,'follow_up_reminders',false,
        'found_a_job_pause',false,'saved_searches',0)
    );
  END IF;

  SELECT * INTO s FROM public.subscriptions WHERE user_id = uid;
  tier := public.active_tier(uid);

  -- Onboarded = the account has saved answers. Deliberately NOT tied to a
  -- schema version: a version bump must never eject an account (paying or not)
  -- from the app. The stored version travels separately so the client can offer
  -- a re-run when it wants to.
  SELECT COALESCE(p.quiz_answers, '{}'::jsonb) <> '{}'::jsonb, p.quiz_schema_version
    INTO onboarded, qver
  FROM public.profiles p
  WHERE p.id = uid;

  feats := CASE tier
    WHEN 'pro' THEN jsonb_build_object(
      'match_score',true,'ghost_filtering',true,'daily_digest',true,
      'high_match_alerts',true,'tracker',true,'follow_up_reminders',true,
      'found_a_job_pause',true,
      -- null = unlimited
      'saved_searches',NULL)
    WHEN 'watch' THEN jsonb_build_object(
      'match_score',true,'ghost_filtering',true,'daily_digest',false,
      'high_match_alerts',false,'tracker',false,'follow_up_reminders',false,
      'found_a_job_pause',false,
      'saved_searches',1)
    ELSE jsonb_build_object(
      'match_score',false,'ghost_filtering',false,'daily_digest',false,
      'high_match_alerts',false,'tracker',false,'follow_up_reminders',false,
      'found_a_job_pause',false,
      'saved_searches',0)
  END;

  RETURN jsonb_build_object(
    'plan', CASE tier WHEN 'pro' THEN 'pro' WHEN 'watch' THEN 'watch' ELSE 'free' END,
    'tier', tier,
    'status', COALESCE(s.status, 'none'::public.subscription_status),
    'sku', s.sku,
    'purchase_price', s.purchase_price,
    'onboarded', COALESCE(onboarded, false),
    'quiz_schema_version', qver,
    'trial_ends_at', s.trial_ends_at,
    'current_period_end', s.current_period_end,
    'pause_ends_at', s.pause_ends_at,
    'banked_days', COALESCE(s.banked_days, 0),
    'banked_days_expire_at', s.banked_days_expire_at,
    'features', feats
  );
END;
$function$;

-- 6. Watch is weekly-only; Pro may choose either. No volume signal is involved.
CREATE OR REPLACE FUNCTION public.enforce_digest_frequency_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.digest_frequency = 'daily' AND public.active_tier(NEW.user_id) <> 'pro' THEN
    NEW.digest_frequency := 'weekly';
  END IF;
  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.active_tier(uuid) TO authenticated, service_role;
