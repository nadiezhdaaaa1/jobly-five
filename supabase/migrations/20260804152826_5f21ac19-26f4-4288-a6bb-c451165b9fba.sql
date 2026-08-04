ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS activation_source text NOT NULL DEFAULT 'none';

UPDATE public.subscriptions
   SET activation_source = 'manual_preview'
 WHERE activation_source = 'none'
   AND status <> 'none';