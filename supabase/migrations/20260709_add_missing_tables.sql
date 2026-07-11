-- ============================================================
-- OvusCare — Add missing tables and columns
-- Generated: 2026-07-09
-- Safe: additive only, no DROP, no TRUNCATE, no data deletion
--
-- Tables added: clinics, content, documents
-- Columns added: dialogs_log.flagged, patients.clinic_id
--
-- Run in Supabase SQL Editor after 20260601_schema_audit.sql
-- ============================================================


-- Enable pgvector extension (required for documents table)
CREATE EXTENSION IF NOT EXISTS vector;


-- ============================================================
-- clinics table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clinics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  plan          text NOT NULL DEFAULT 'pilot'
                  CHECK (plan IN ('pilot', 'starter', 'growth', 'enterprise')),
  pilot_expires_at  timestamptz,
  whatsapp_number   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_read_own" ON public.clinics;
CREATE POLICY "clinic_members_read_own"
  ON public.clinics FOR SELECT
  USING (
    id IN (
      SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL
    )
  );


-- ============================================================
-- Add clinic_id to patients (nullable for backward compat)
-- ============================================================
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id);


-- ============================================================
-- Add flagged column to dialogs_log
-- ============================================================
ALTER TABLE public.dialogs_log
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;


-- ============================================================
-- content table — clinic content bank (videos, FAQs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid REFERENCES public.clinics(id),
  title       text NOT NULL,
  type        text NOT NULL DEFAULT 'video'
                CHECK (type IN ('video', 'faq', 'text')),
  stage       text,
  language    text NOT NULL DEFAULT 'en',
  url         text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_clinic_id_idx ON public.content(clinic_id);
CREATE INDEX IF NOT EXISTS content_stage_lang_idx ON public.content(stage, language);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_content" ON public.content;
CREATE POLICY "clinic_members_content"
  ON public.content FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL LIMIT 1
    )
  );


-- ============================================================
-- documents table — RAG knowledge base (pgvector)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid REFERENCES public.clinics(id),
  content     text NOT NULL,
  embedding   vector(1024),
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_clinic_id_idx ON public.documents(clinic_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_members_documents" ON public.documents;
CREATE POLICY "clinic_members_documents"
  ON public.documents FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.patients WHERE clinic_id IS NOT NULL LIMIT 1
    )
  );


-- ============================================================
-- match_documents function for RAG similarity search
-- Returns top-k document chunks by cosine similarity
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding   vector(1024),
  match_clinic_id   uuid,
  match_count       int DEFAULT 3
)
RETURNS TABLE (
  id        uuid,
  content   text,
  metadata  jsonb,
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
-- Verification — run this after applying the migration
-- ============================================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   ORDER BY table_name;
--
-- Expected tables: clinics, content, dialogs_log, documents, patients, sent_log
