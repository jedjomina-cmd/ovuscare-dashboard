-- ============================================================
-- OvusCare Dashboard — Schema Audit Migration
-- Generated: 2026-06-01
-- Safe: no DROP TABLE, no TRUNCATE, no data deletion
--
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/blsftpeizdyaoubwjywy/sql/new
--
-- RECOMMENDED ORDER:
--   1. Run STEP 0 (read-only checks) and review output first.
--   2. Run STEP 1 → 2 → 3 in order.
--   3. STEP 4 (true PK swap) is optional — read the warning.
-- ============================================================


-- ============================================================
-- STEP 0: PRE-FLIGHT CHECKS (read-only — review before proceeding)
-- ============================================================

-- 0a. Confirm actual column types and nullability
SELECT
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('patients', 'sent_log', 'dialogs_log')
ORDER BY table_name, ordinal_position;

-- 0b. Confirm existing PKs, UNIQUEs, and FKs
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema  = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('patients', 'sent_log', 'dialogs_log')
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;

-- 0c. Orphan check — MUST return 0 for both rows before adding FKs
--     If count > 0, patient_ids in child tables have no matching patient.
--     Fix orphans manually before running STEP 3.
SELECT 'sent_log orphans'    AS check_name, COUNT(*) AS orphan_count
FROM   sent_log sl
WHERE  NOT EXISTS (SELECT 1 FROM patients p WHERE p.patient_id = sl.patient_id)
UNION ALL
SELECT 'dialogs_log orphans', COUNT(*)
FROM   dialogs_log dl
WHERE  NOT EXISTS (SELECT 1 FROM patients p WHERE p.patient_id = dl.patient_id);


-- ============================================================
-- STEP 1: UNIQUE + NOT NULL on patients.patient_id
--
-- Why not make it PRIMARY KEY immediately?
-- The app currently routes via patients.id (integer).
-- Changing the PK now would break /patients/[id] routing.
-- Adding UNIQUE + NOT NULL achieves the FK requirement safely.
-- To fully swap the PK, see the optional STEP 4 below.
-- ============================================================

ALTER TABLE patients
  ALTER COLUMN patient_id SET NOT NULL;

ALTER TABLE patients
  ADD CONSTRAINT patients_patient_id_key UNIQUE (patient_id);


-- ============================================================
-- STEP 2: Upgrade id columns to bigint with identity
--
-- int4 → int8 is a widening cast — safe, no data loss.
-- The DO blocks only add a sequence if one does not already exist
-- (idempotent — safe to re-run).
-- ============================================================

-- 2a. sent_log.id
ALTER TABLE sent_log
  ALTER COLUMN id TYPE bigint;

DO $$
BEGIN
  IF pg_get_serial_sequence('sent_log', 'id') IS NULL THEN
    CREATE SEQUENCE IF NOT EXISTS sent_log_id_seq;
    ALTER TABLE  sent_log ALTER COLUMN id SET DEFAULT nextval('sent_log_id_seq');
    ALTER SEQUENCE sent_log_id_seq OWNED BY sent_log.id;
    -- Advance sequence past current max so next insert doesn't collide
    PERFORM setval('sent_log_id_seq', COALESCE((SELECT MAX(id) FROM sent_log), 0));
  END IF;
END$$;

-- 2b. dialogs_log.id
ALTER TABLE dialogs_log
  ALTER COLUMN id TYPE bigint;

DO $$
BEGIN
  IF pg_get_serial_sequence('dialogs_log', 'id') IS NULL THEN
    CREATE SEQUENCE IF NOT EXISTS dialogs_log_id_seq;
    ALTER TABLE  dialogs_log ALTER COLUMN id SET DEFAULT nextval('dialogs_log_id_seq');
    ALTER SEQUENCE dialogs_log_id_seq OWNED BY dialogs_log.id;
    PERFORM setval('dialogs_log_id_seq', COALESCE((SELECT MAX(id) FROM dialogs_log), 0));
  END IF;
END$$;


-- ============================================================
-- STEP 3: Foreign key constraints
--
-- Requires: STEP 0c orphan count = 0 for both tables.
-- ON DELETE CASCADE: deleting a patient removes their logs.
-- Change to ON DELETE SET NULL if you prefer to keep orphaned logs.
-- ============================================================

ALTER TABLE sent_log
  ADD CONSTRAINT fk_sent_log_patient_id
  FOREIGN KEY (patient_id)
  REFERENCES patients (patient_id)
  ON DELETE CASCADE;

ALTER TABLE dialogs_log
  ADD CONSTRAINT fk_dialogs_log_patient_id
  FOREIGN KEY (patient_id)
  REFERENCES patients (patient_id)
  ON DELETE CASCADE;


-- ============================================================
-- STEP 4 [OPTIONAL]: Make patient_id the true PRIMARY KEY
--
-- WARNING — read before running:
--   • The app routes to /patients/[id] using patients.id (integer).
--   • Running this block drops patients.id, which breaks that routing.
--   • You must also update the app:
--       - Change /patients/[id]/page.tsx to .eq('id', ...) → .eq('patient_id', ...)
--       - Update PatientTable.tsx router.push to use patient.patient_id
--       - Update all other .eq('id', ...) queries on the patients table
--   • Only run after the app code changes are deployed.
-- ============================================================

-- -- Drop the old integer PK
-- ALTER TABLE patients DROP CONSTRAINT patients_pkey;
--
-- -- Drop the UNIQUE we added in STEP 1 (PK implies unique)
-- ALTER TABLE patients DROP CONSTRAINT patients_patient_id_key;
--
-- -- Promote patient_id to PRIMARY KEY
-- ALTER TABLE patients ADD PRIMARY KEY (patient_id);
--
-- -- Optionally retire the old id column (or keep it as a surrogate)
-- -- ALTER TABLE patients DROP COLUMN id;


-- ============================================================
-- VERIFICATION (run after all steps to confirm)
-- ============================================================

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema  = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('patients', 'sent_log', 'dialogs_log')
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;
