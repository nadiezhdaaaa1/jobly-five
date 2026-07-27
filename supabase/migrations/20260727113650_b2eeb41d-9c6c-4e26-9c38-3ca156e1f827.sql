
ALTER TABLE public.user_job_state DROP CONSTRAINT IF EXISTS user_job_state_job_id_fkey;
DROP TABLE IF EXISTS public.jobs CASCADE;

CREATE TABLE public.jobs (
  id text PRIMARY KEY,
  title text NOT NULL,
  group_name text NOT NULL,
  roles jsonb NOT NULL DEFAULT '[]',
  role_ids jsonb NOT NULL DEFAULT '[]',
  seniority text NOT NULL CHECK (seniority IN ('Junior','Mid','Senior','Lead','Exec')),
  min_years_experience int NOT NULL DEFAULT 0,
  work_mode text NOT NULL CHECK (work_mode IN ('Remote','Hybrid','Onsite')),
  location text NOT NULL,
  company text NOT NULL,
  company_sector text,
  company_domain text,
  stack jsonb NOT NULL DEFAULT '[]',
  hard_skills jsonb NOT NULL DEFAULT '[]',
  tools jsonb NOT NULL DEFAULT '[]',
  soft_skills jsonb NOT NULL DEFAULT '[]',
  salary_min int,
  salary_max int,
  posted_days_ago int NOT NULL DEFAULT 0,
  source text,
  description text
);

CREATE INDEX jobs_group_idx ON public.jobs (group_name);
CREATE INDEX jobs_seniority_idx ON public.jobs (seniority);
CREATE INDEX jobs_work_mode_idx ON public.jobs (work_mode);
CREATE INDEX jobs_location_idx ON public.jobs (location);
CREATE INDEX jobs_posted_idx ON public.jobs (posted_days_ago);
CREATE INDEX jobs_stack_gin ON public.jobs USING gin (stack);
CREATE INDEX jobs_role_ids_gin ON public.jobs USING gin (role_ids);

GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs are readable by everyone" ON public.jobs FOR SELECT USING (true);

ALTER TABLE public.user_job_state
  ADD CONSTRAINT user_job_state_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
