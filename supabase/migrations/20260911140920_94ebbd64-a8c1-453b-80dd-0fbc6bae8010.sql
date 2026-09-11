CREATE OR REPLACE FUNCTION public.get_entitlements()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  s public.subscriptions;
  pro boolean := false;
  onboarded boolean := false;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object(
      'plan','free','status','none','cycle',NULL,'onboarded',false,
      'trial_ends_at',NULL,'current_period_end',NULL,'pause_ends_at',NULL,
      'features', jsonb_build_object(
        'match_score',false,'daily_digest',false,'tracker',false,
        'follow_up_reminders',false,'found_a_job_pause',false)
    );
  END IF;

  SELECT * INTO s FROM public.subscriptions WHERE user_id = uid;

  pro := s.user_id IS NOT NULL AND (
    (s.status = 'trialing' AND s.trial_ends_at > now())
    OR s.status = 'active'
    OR (s.status = 'past_due' AND s.current_period_end > now() - interval '3 days')
  );

  -- Onboarded = non-empty answers stored against the CURRENT quiz schema.
  SELECT COALESCE(p.quiz_answers, '{}'::jsonb) <> '{}'::jsonb
         AND COALESCE(p.quiz_schema_version, 0) = 1
    INTO onboarded
  FROM public.profiles p
  WHERE p.id = uid;

  RETURN jsonb_build_object(
    'plan', CASE WHEN pro THEN 'pro' ELSE 'free' END,
    'status', COALESCE(s.status, 'none'::public.subscription_status),
    'cycle', s.cycle,
    'onboarded', COALESCE(onboarded, false),
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

GRANT EXECUTE ON FUNCTION public.get_entitlements() TO authenticated, service_role;