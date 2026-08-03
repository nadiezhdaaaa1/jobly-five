ALTER TYPE public.consent_channel ADD VALUE IF NOT EXISTS 'reactivation';
ALTER TYPE public.consent_channel ADD VALUE IF NOT EXISTS 'high_match_alerts';
ALTER TYPE public.consent_channel ADD VALUE IF NOT EXISTS 'weekly_report';

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_frequency text NOT NULL DEFAULT 'weekly',
  quiet_hours_start smallint NOT NULL DEFAULT 21,
  quiet_hours_end smallint NOT NULL DEFAULT 7,
  timezone text NOT NULL DEFAULT 'UTC',
  pref_digest_tuned boolean NOT NULL DEFAULT true,
  pref_interview_reminders boolean NOT NULL DEFAULT true,
  pref_followup_nudges boolean NOT NULL DEFAULT true,
  pref_stale_nudges boolean NOT NULL DEFAULT true,
  pref_gmail_status boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_frequency_check CHECK (digest_frequency IN ('daily','weekly')),
  CONSTRAINT notification_preferences_quiet_start_check CHECK (quiet_hours_start BETWEEN 0 AND 23),
  CONSTRAINT notification_preferences_quiet_end_check CHECK (quiet_hours_end BETWEEN 0 AND 23)
);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_select_own" ON public.notification_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notification_preferences_insert_own" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_preferences_update_own" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_digest_frequency_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.digest_frequency = 'daily' AND NOT public.has_pro(NEW.user_id) THEN
    NEW.digest_frequency := 'weekly';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notification_preferences_frequency_gate
  BEFORE INSERT OR UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.enforce_digest_frequency_entitlement();

CREATE OR REPLACE VIEW public.current_consent
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (user_id, channel)
  user_id, channel, granted, wording, source, created_at
FROM public.consent_records
ORDER BY user_id, channel, created_at DESC;

GRANT SELECT ON public.current_consent TO authenticated;
GRANT SELECT ON public.current_consent TO service_role;

CREATE OR REPLACE FUNCTION public.can_send(_user_id uuid, _channel public.consent_channel)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT granted
    FROM public.consent_records
    WHERE user_id = _user_id AND channel = _channel
    ORDER BY created_at DESC
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;