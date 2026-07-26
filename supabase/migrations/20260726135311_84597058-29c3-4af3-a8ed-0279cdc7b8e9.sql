ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'interview_screen';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'interview_tech';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'test_task';

ALTER TABLE public.user_job_state ADD COLUMN IF NOT EXISTS column_id text;