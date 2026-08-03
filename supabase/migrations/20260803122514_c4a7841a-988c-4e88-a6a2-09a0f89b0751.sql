CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.quiz_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_steps text[] NOT NULL DEFAULT '{}',
  current_step text,
  email citext,
  status text NOT NULL DEFAULT 'in_progress',
  schema_version int NOT NULL DEFAULT 1,
  claimed_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quiz_drafts_email_idx ON public.quiz_drafts (email) WHERE email IS NOT NULL;
CREATE INDEX quiz_drafts_last_seen_idx ON public.quiz_drafts (last_seen_at) WHERE status = 'in_progress';
CREATE INDEX quiz_drafts_user_idx ON public.quiz_drafts (user_id) WHERE user_id IS NOT NULL;

-- Drafts are anonymous: there is no auth.uid() to key a policy on, so all access
-- goes through server code with the service role. No client policies at all.
GRANT ALL ON public.quiz_drafts TO service_role;
ALTER TABLE public.quiz_drafts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER quiz_drafts_updated_at
BEFORE UPDATE ON public.quiz_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
  ADD COLUMN quiz_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN quiz_schema_version int;