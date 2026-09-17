-- 1. Pending plan change (deferred downgrade per Cancellation Policy 5).
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pending_sku public.subscription_sku,
  ADD COLUMN IF NOT EXISTS pending_sku_effective_at timestamptz;

-- A pending change and a scheduled cancellation are mutually exclusive, and a
-- pending SKU without an effective date is meaningless.
CREATE OR REPLACE FUNCTION public.subscriptions_pending_change_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.pending_sku IS NULL THEN
    NEW.pending_sku_effective_at := NULL;
  ELSIF NEW.pending_sku_effective_at IS NULL THEN
    RAISE EXCEPTION 'pending_sku requires pending_sku_effective_at';
  ELSIF NEW.cancel_at_period_end THEN
    RAISE EXCEPTION 'a pending plan change and a scheduled cancellation cannot coexist';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_pending_change_guard ON public.subscriptions;
CREATE TRIGGER subscriptions_pending_change_guard
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.subscriptions_pending_change_guard();

-- 2. SKU facts. src/config/pricing.ts is the source of truth; these mirror it so
-- the scheduler can apply a change without the app being open. Keep in sync.
CREATE OR REPLACE FUNCTION public.sku_period_days(p_sku public.subscription_sku)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE p_sku
    WHEN 'watch_annual' THEN 365
    WHEN 'pro_6month' THEN 180
    WHEN 'pro_3month' THEN 90
    ELSE 30
  END;
$$;

CREATE OR REPLACE FUNCTION public.sku_total(p_sku public.subscription_sku)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE p_sku
    WHEN 'watch_monthly' THEN 4.99
    WHEN 'watch_annual' THEN 34.99
    WHEN 'pro_monthly' THEN 16.99
    WHEN 'pro_3month' THEN 38.97
    WHEN 'pro_6month' THEN 65.94
  END::numeric;
$$;

CREATE OR REPLACE FUNCTION public.sku_tier(p_sku public.subscription_sku)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE WHEN p_sku IN ('watch_monthly','watch_annual') THEN 'watch' ELSE 'pro' END;
$$;

-- 3. Apply whatever has come due on one account. Idempotent, and it never
-- touches banked_days: those are lost only on cancellation or deletion.
CREATE OR REPLACE FUNCTION public.apply_due_subscription_changes(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  s public.subscriptions;
BEGIN
  SELECT * INTO s FROM public.subscriptions WHERE user_id = p_user_id FOR UPDATE;
  IF s.user_id IS NULL THEN RETURN; END IF;

  -- A trial that has run its course converts to the paid plan it disclosed.
  IF s.status = 'trialing' AND s.trial_ends_at IS NOT NULL AND s.trial_ends_at <= now() THEN
    UPDATE public.subscriptions
       SET status = 'active',
           current_period_end = s.trial_ends_at
             + (public.sku_period_days(COALESCE(s.sku,'pro_monthly')) || ' days')::interval,
           purchase_price = COALESCE(s.purchase_price, public.sku_total(COALESCE(s.sku,'pro_monthly')))
     WHERE user_id = p_user_id;
    SELECT * INTO s FROM public.subscriptions WHERE user_id = p_user_id;
  END IF;

  IF s.current_period_end IS NULL THEN RETURN; END IF;

  -- A scheduled cancellation ends the plan when the paid period runs out.
  IF s.cancel_at_period_end AND s.current_period_end <= now() THEN
    UPDATE public.subscriptions
       SET status = 'canceled',
           plan = 'free',
           cancel_at_period_end = false,
           canceled_at = COALESCE(s.canceled_at, s.current_period_end),
           pending_sku = NULL
     WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- A scheduled plan change starts its own fresh period at its own price.
  IF s.pending_sku IS NOT NULL
     AND s.pending_sku_effective_at IS NOT NULL
     AND s.pending_sku_effective_at <= now() THEN
    UPDATE public.subscriptions
       SET sku = s.pending_sku,
           plan = public.sku_tier(s.pending_sku),
           purchase_price = public.sku_total(s.pending_sku),
           status = 'active',
           current_period_end = s.pending_sku_effective_at
             + (public.sku_period_days(s.pending_sku) || ' days')::interval,
           pending_sku = NULL,
           pending_sku_effective_at = NULL
     WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- Otherwise a live plan renews: subscriptions run until cancelled.
  IF s.status = 'active' AND s.current_period_end <= now() AND s.sku IS NOT NULL THEN
    UPDATE public.subscriptions
       SET current_period_end = now() + (public.sku_period_days(s.sku) || ' days')::interval
     WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- 4. The sweep the nightly job calls: every account with something due.
CREATE OR REPLACE FUNCTION public.apply_all_due_subscription_changes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  FOR r IN
    SELECT user_id FROM public.subscriptions
    WHERE (status = 'trialing' AND trial_ends_at IS NOT NULL AND trial_ends_at <= now())
       OR (pending_sku IS NOT NULL AND pending_sku_effective_at <= now())
       OR (cancel_at_period_end AND current_period_end IS NOT NULL AND current_period_end <= now())
       OR (status = 'active' AND current_period_end IS NOT NULL AND current_period_end <= now())
  LOOP
    PERFORM public.apply_due_subscription_changes(r.user_id);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_due_subscription_changes(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_all_due_subscription_changes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_due_subscription_changes(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_all_due_subscription_changes() TO service_role;
GRANT EXECUTE ON FUNCTION public.sku_period_days(public.subscription_sku) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sku_total(public.subscription_sku) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sku_tier(public.subscription_sku) TO authenticated, service_role;

-- 5. Entitlements carry the pending change so Settings needs no second call.
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
      'pending_sku',NULL,'pending_sku_effective_at',NULL,
      'features', jsonb_build_object(
        'match_score',false,'ghost_filtering',false,'daily_digest',false,
        'high_match_alerts',false,'tracker',false,'follow_up_reminders',false,
        'found_a_job_pause',false,'saved_searches',0)
    );
  END IF;

  SELECT * INTO s FROM public.subscriptions WHERE user_id = uid;

  -- Same rule as public.active_tier, inlined. A pause suspends access. A
  -- scheduled cancellation stops granting once the paid period has run out.
  IF s.user_id IS NOT NULL AND s.status <> 'paused' AND (
       (s.status = 'trialing' AND s.trial_ends_at > now())
       OR (s.status = 'active'
           AND NOT (s.cancel_at_period_end
                    AND s.current_period_end IS NOT NULL
                    AND s.current_period_end <= now()))
       OR (s.status = 'past_due' AND s.current_period_end > now() - interval '3 days')
     ) THEN
    tier := CASE WHEN s.sku IN ('watch_monthly','watch_annual') THEN 'watch' ELSE 'pro' END;
  END IF;

  SELECT COALESCE(p.quiz_answers, '{}'::jsonb) <> '{}'::jsonb, p.quiz_schema_version
    INTO onboarded, qver
  FROM public.profiles p
  WHERE p.id = uid;

  feats := CASE tier
    WHEN 'pro' THEN jsonb_build_object(
      'match_score',true,'ghost_filtering',true,'daily_digest',true,
      'high_match_alerts',true,'tracker',true,'follow_up_reminders',true,
      'found_a_job_pause',true,
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
    'pending_sku', s.pending_sku,
    'pending_sku_effective_at', s.pending_sku_effective_at,
    'features', feats
  );
END;
$function$;