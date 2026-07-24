-- Jobs catalog + per-user job state
CREATE TABLE public.jobs (
  id text PRIMARY KEY,
  title text NOT NULL,
  "group" text,
  roles text[] NOT NULL DEFAULT '{}',
  role_ids text[] NOT NULL DEFAULT '{}',
  seniority text,
  min_years_experience int,
  english_level text,
  work_mode text,
  location text,
  company text,
  company_sector text,
  company_domain text,
  stack text[] NOT NULL DEFAULT '{}',
  hard_skills text[] NOT NULL DEFAULT '{}',
  tools text[] NOT NULL DEFAULT '{}',
  soft_skills text[] NOT NULL DEFAULT '{}',
  salary_min int,
  salary_max int,
  posted_days_ago int,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs readable by everyone" ON public.jobs FOR SELECT USING (true);

CREATE TYPE public.job_status AS ENUM ('default','saved','applied','interview','offer','rejection','dismissed','reported');

CREATE TABLE public.user_job_state (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status public.job_status NOT NULL DEFAULT 'default',
  archived boolean NOT NULL DEFAULT false,
  last_status public.job_status,
  saved_at timestamptz,
  applied_at timestamptz,
  interview_at timestamptz,
  offer_at timestamptz,
  rejection_at timestamptz,
  reminder_at timestamptz,
  moved_at timestamptz,
  notes text NOT NULL DEFAULT '',
  interview_stage text,
  offer_status text,
  applied_resume_name text,
  applied_cover_letter_name text,
  rejection_details text,
  offer_details text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);
CREATE INDEX user_job_state_user_status_idx ON public.user_job_state (user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_job_state TO authenticated;
GRANT ALL ON public.user_job_state TO service_role;
ALTER TABLE public.user_job_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own job state" ON public.user_job_state FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_job_state_updated_at BEFORE UPDATE ON public.user_job_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();