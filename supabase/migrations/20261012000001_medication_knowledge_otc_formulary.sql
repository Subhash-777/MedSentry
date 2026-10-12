-- ============================================================================
-- Migration: 20261012000001_medication_knowledge_otc_formulary.sql
-- Description: Medication Knowledge and India-Focused OTC Formulary Layer
-- ============================================================================

-- 1. Enhance public.drugs with clinical, formulary, and provenance columns
ALTER TABLE public.drugs
  ADD COLUMN IF NOT EXISTS brand_names text[],
  ADD COLUMN IF NOT EXISTS active_ingredients text[],
  ADD COLUMN IF NOT EXISTS strength text,
  ADD COLUMN IF NOT EXISTS dosage_form text,
  ADD COLUMN IF NOT EXISTS route text,
  ADD COLUMN IF NOT EXISTS indications text,
  ADD COLUMN IF NOT EXISTS contraindications text,
  ADD COLUMN IF NOT EXISTS precautions text,
  ADD COLUMN IF NOT EXISTS prescription_status_india text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS schedule_category_india text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS status_verification text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_source text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_version text,
  ADD COLUMN IF NOT EXISTS verification_date date,
  ADD COLUMN IF NOT EXISTS classification_notes text;

-- Add check constraints safely if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drugs_prescription_status_india_check'
  ) THEN
    ALTER TABLE public.drugs
      ADD CONSTRAINT drugs_prescription_status_india_check
      CHECK (prescription_status_india IN ('OTC', 'prescription_only', 'restricted', 'unverified'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drugs_status_verification_check'
  ) THEN
    ALTER TABLE public.drugs
      ADD CONSTRAINT drugs_status_verification_check
      CHECK (status_verification IN ('verified_authoritative', 'provisional_evidence', 'unverified'));
  END IF;
END $$;

-- 2. Create authoritative India medication formulary table
CREATE TABLE IF NOT EXISTS public.medication_formulary_india (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generic_name text NOT NULL,
  brand_names text[],
  active_ingredients text[] NOT NULL,
  strength text,
  dosage_form text,
  route text,
  prescription_status text NOT NULL CHECK (prescription_status IN ('OTC', 'prescription_only', 'restricted', 'unverified')),
  schedule_category text NOT NULL, -- e.g. 'Schedule H', 'Schedule H1', 'Schedule X', 'Schedule K', 'Unscheduled OTC', 'unverified'
  status_verification text NOT NULL CHECK (status_verification IN ('verified_authoritative', 'provisional_evidence', 'unverified')),
  legal_basis text NOT NULL,
  source_organization text NOT NULL, -- 'CDSCO', 'Ministry of Health & Family Welfare', 'e-Gazette of India', 'Indian Pharmacopoeia Commission'
  source_url text,
  source_version text,
  verification_date date NOT NULL DEFAULT CURRENT_DATE,
  indications text,
  contraindications text,
  precautions text,
  adverse_effects text,
  max_otc_dose_adult text,
  classification_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medication_formulary_india ENABLE ROW LEVEL SECURITY;

-- Read policy for authenticated users (matching MedSentry security architecture)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'medication_formulary_india'
      AND policyname = 'medication_formulary_india: authenticated read'
  ) THEN
    CREATE POLICY "medication_formulary_india: authenticated read"
      ON public.medication_formulary_india
      FOR SELECT
      TO authenticated
      USING (auth.role() = 'authenticated'::text);
  END IF;
END $$;

-- Indexes for performance & search
CREATE INDEX IF NOT EXISTS idx_drugs_generic_name ON public.drugs (lower(generic_name));
CREATE INDEX IF NOT EXISTS idx_drugs_rx_status ON public.drugs (prescription_status_india);
CREATE INDEX IF NOT EXISTS idx_drugs_schedule ON public.drugs (schedule_category_india);
CREATE UNIQUE INDEX IF NOT EXISTS uq_med_formulary_generic ON public.medication_formulary_india (lower(generic_name));
CREATE INDEX IF NOT EXISTS idx_med_formulary_generic ON public.medication_formulary_india (lower(generic_name));
CREATE INDEX IF NOT EXISTS idx_med_formulary_status ON public.medication_formulary_india (prescription_status);
CREATE INDEX IF NOT EXISTS idx_med_formulary_schedule ON public.medication_formulary_india (schedule_category);
