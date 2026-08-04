CREATE TABLE public.job_interactions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('disliked','reported')),
  reason text,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_interactions TO authenticated;
GRANT ALL ON public.job_interactions TO service_role;

ALTER TABLE public.job_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own job interactions"
ON public.job_interactions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX job_interactions_user_idx ON public.job_interactions (user_id);

CREATE TRIGGER update_job_interactions_updated_at
BEFORE UPDATE ON public.job_interactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();