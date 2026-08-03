-- Profile blobs
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS work_history jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Subscriptions: server-truth "ever had Pro"
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS ever_subscribed boolean NOT NULL DEFAULT false;

-- Board columns
CREATE TABLE public.board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  column_id text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  stages text[] NOT NULL DEFAULT '{}'::text[],
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, column_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_columns TO authenticated;
GRANT ALL ON public.board_columns TO service_role;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY board_columns_all_own ON public.board_columns FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER board_columns_updated_at BEFORE UPDATE ON public.board_columns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Saved filters
CREATE TABLE public.saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_filters TO authenticated;
GRANT ALL ON public.saved_filters TO service_role;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY saved_filters_all_own ON public.saved_filters FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER saved_filters_updated_at BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blocked companies
CREATE TABLE public.blocked_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_companies TO authenticated;
GRANT ALL ON public.blocked_companies TO service_role;
ALTER TABLE public.blocked_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY blocked_companies_all_own ON public.blocked_companies FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cancellation feedback
CREATE TABLE public.cancel_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.cancel_feedback TO authenticated;
GRANT ALL ON public.cancel_feedback TO service_role;
ALTER TABLE public.cancel_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY cancel_feedback_insert_own ON public.cancel_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY cancel_feedback_select_own ON public.cancel_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);