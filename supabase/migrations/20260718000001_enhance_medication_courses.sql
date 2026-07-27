-- =============================================================================
-- MedSentry — Migration 20260718000001
-- Description: Add dosage_amount, frequency, and instructions to medication_courses
-- =============================================================================

ALTER TABLE public.medication_courses
ADD COLUMN IF NOT EXISTS dosage_amount text,
ADD COLUMN IF NOT EXISTS frequency text[],
ADD COLUMN IF NOT EXISTS instructions text,
ADD COLUMN IF NOT EXISTS custom_name text;

-- Add a comment for documentation
COMMENT ON COLUMN public.medication_courses.frequency IS 'Array of times/schedules e.g., ["morning", "evening"]';
COMMENT ON COLUMN public.medication_courses.instructions IS 'Specific instructions e.g., "Take 30 min before sleep"';
COMMENT ON COLUMN public.medication_courses.dosage_amount IS 'Dosage quantity e.g., "3mg" or "1 tablet"';
COMMENT ON COLUMN public.medication_courses.custom_name IS 'Display name fallback when drug_id is null (scanned drug not matched in drugs table)';
