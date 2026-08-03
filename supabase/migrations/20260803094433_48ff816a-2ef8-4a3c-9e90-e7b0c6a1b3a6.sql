ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for timestamp with time zone;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active','pending_deletion'));

CREATE INDEX IF NOT EXISTS profiles_deletion_scheduled_for_idx
  ON public.profiles (deletion_scheduled_for)
  WHERE account_status = 'pending_deletion';