ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS english_level text;

ALTER TABLE public.jobs ADD CONSTRAINT jobs_english_level_check
  CHECK (english_level IS NULL OR english_level IN ('conversational','professional','native'));