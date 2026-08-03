-- 1. resume_documents
CREATE TABLE public.resume_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path         text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type         text NOT NULL,
  size_bytes        bigint NOT NULL,
  checksum_sha256   text,
  is_primary        boolean NOT NULL DEFAULT false,
  parse_status      text NOT NULL DEFAULT 'pending',
  parsed_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

GRANT SELECT, UPDATE, DELETE ON public.resume_documents TO authenticated;
GRANT ALL ON public.resume_documents TO service_role;

ALTER TABLE public.resume_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resume_documents_select_own" ON public.resume_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "resume_documents_update_own" ON public.resume_documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resume_documents_delete_own" ON public.resume_documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX resume_documents_user_created_idx
  ON public.resume_documents (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX resume_documents_one_primary
  ON public.resume_documents (user_id)
  WHERE is_primary AND deleted_at IS NULL;

CREATE TRIGGER resume_documents_updated_at
  BEFORE UPDATE ON public.resume_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. consent_records
CREATE TYPE public.consent_channel AS ENUM (
  'resume_storage',
  'daily_digest',
  'product_updates',
  'marketing'
);

CREATE TABLE public.consent_records (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel    public.consent_channel NOT NULL,
  granted    boolean NOT NULL,
  wording    text NOT NULL,
  source     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.consent_records TO authenticated;
GRANT ALL ON public.consent_records TO service_role;

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_records_select_own" ON public.consent_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "consent_records_insert_own" ON public.consent_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX consent_records_user_channel_idx
  ON public.consent_records (user_id, channel, created_at DESC);

-- 3. storage policies for the private `resumes` bucket
CREATE POLICY "resumes_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "resumes_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "resumes_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);