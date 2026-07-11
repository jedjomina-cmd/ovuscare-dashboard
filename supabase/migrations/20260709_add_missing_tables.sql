-- ============================================================
-- OvusCare — Add missing tables and columns
-- Generated: 2026-07-09 (revised 2026-07-11)
-- Safe: additive only, no DROP TABLE, no TRUNCATE, no data deletion
--
-- Assumes existing tables: patients, dialogs_log, sent_log
-- All WITHOUT clinic_id (single-clinic schema from initial build)
--
-- Order matters:
--   1. Create clinics table (no RLS yet — needs patients.clinic_id)
--   2. Add clinic_id to existing tables
--   3. Create new tables (content, documents)
--   4. Enable RLS and create all policies
--   5. Create match_documents function
-- ============================================================


-- ============================================================
-- 0. Enable pgvector extension (required for documents table)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;


-- ============================================================
-- 1. Create clinics table (RLS added in step 4 after patients.clinic_id exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clinics (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  plan             text        NOT NULL DEFAULT 'pilot'
                                 CHECK (plan IN ('pilot', 'starter', 'growth', 'enterprise')),
  pilot_expires_at timestamptz,
  whatsapp_number  text,
  created_at       timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. Add clinic_id to existing tables
-- ============================================================
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id);

ALTER TABLE public.dialogs_log
  ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id);

ALTER TABLE public.sent_log
  ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id);

-- Add flagged column to dialogs_log
ALTER TABLE public.dialogs_log
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;


-- ============================================================
-- 3. Create new tables (clinic_id available now)
-- ============================================================

-- content bank (videos, FAQs, text)
CREATE TABLE IF NOT EXISTS public.content (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id  uuid        REFERENCES public.clinics(id),
  title      text        NOT NULL,
  type       text        NOT NULL DEFAULT 'video'
                           CHECK (type IN ('video', 'faq', 'text')),
  stage      text,
  language   text        NOT NULL DEFAULT 'en',
  url        text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_clinic_id_idx   ON public.content(clinic_id);
CREATE INDEX IF NOT EXISTS content_stage_lang_idx  ON public.content(stage, language);

-- RAG knowledge base chunks
CREATE TABLE IF NOT EXISTS public.documents (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id  uuid        REFERENCES public.clinics(id),
  content    text        NOT NULL,
  embedding  vector(1024),
  metadata   jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_clinic_id_idx ON public.documents(clinic_id);


-- ============================================================
-- 4. Enable RLS and create policies
--    (patients.clinic_id, dialogs_log.clinic_id, etc. now exist)
-- ============================================================

-- clinics: a user can read their own clinic row
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_read_own" ON public.clinics;
CREATE POLICY "clinic_members_read_own"
  ON public.clinics FOR SELECT
  USING (
    id IN (SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL)
  );

-- patients: scoped to clinic
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_patients" ON public.patients;
CREATE POLICY "clinic_members_patients"
  ON public.patients FOR ALL
  USING (clinic_id IS NULL OR clinic_id IN (
    SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL LIMIT 1
  ));

-- dialogs_log: scoped to clinic
ALTER TABLE public.dialogs_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_dialogs" ON public.dialogs_log;
CREATE POLICY "clinic_members_dialogs"
  ON public.dialogs_log FOR ALL
  USING (clinic_id IS NULL OR clinic_id IN (
    SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL LIMIT 1
  ));

-- sent_log: scoped to clinic
ALTER TABLE public.sent_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_sent_log" ON public.sent_log;
CREATE POLICY "clinic_members_sent_log"
  ON public.sent_log FOR ALL
  USING (clinic_id IS NULL OR clinic_id IN (
    SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL LIMIT 1
  ));

-- content: scoped to clinic
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_content" ON public.content;
CREATE POLICY "clinic_members_content"
  ON public.content FOR ALL
  USING (clinic_id IS NULL OR clinic_id IN (
    SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL LIMIT 1
  ));

-- documents: scoped to clinic
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_documents" ON public.documents;
CREATE POLICY "clinic_members_documents"
  ON public.documents FOR SELECT
  USING (clinic_id IS NULL OR clinic_id IN (
    SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL LIMIT 1
  ));


-- ============================================================
-- 5. match_documents function for RAG similarity search
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding  vector(1024),
  match_clinic_id  uuid,
  match_count      int DEFAULT 3
)
RETURNS TABLE (
  id         uuid,
  content    text,
  metadata   jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.documents d
  WHERE d.clinic_id = match_clinic_id
    AND d.embedding IS NOT NULL
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ============================================================
-- Verification — run after migration succeeds
-- ============================================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   ORDER BY table_name;
--
-- Expected: clinics, content, dialogs_log, documents, patients, sent_log
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'patients'
--   ORDER BY ordinal_position;
--
-- Expected to include: id, patient_id, display_name, ..., clinic_id
