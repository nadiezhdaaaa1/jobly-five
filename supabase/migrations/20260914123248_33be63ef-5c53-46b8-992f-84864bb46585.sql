-- The tier resolver reads any account's subscription by id, so it must not be
-- callable from the API. get_entitlements is SECURITY INVOKER and scoped to
-- auth.uid(), so it inlines the same logic instead of calling the helper.
REVOKE EXECUTE ON FUNCTION public.active_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_pro(uuid) FROM PUBLIC, anon, authenticated;

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

  -- Same rule as public.active_tier, inlined. A pause suspends access.
  IF s.user_id IS NOT NULL AND s.status <> 'paused' AND (
       (s.status = 'trialing' AND s.trial_ends_at > now())
       OR s.status = 'active'
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
    'features', feats
  );
END;
$function$;
