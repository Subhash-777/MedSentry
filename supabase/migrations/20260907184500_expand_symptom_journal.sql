-- Migration: 20260907184500_expand_symptom_journal.sql
-- Add duration_onset, category_location, and image_url to symptom_journal for rich side-effect logging (plan.md §2.8)

ALTER TABLE public.symptom_journal
  ADD COLUMN IF NOT EXISTS duration_onset text,
  ADD COLUMN IF NOT EXISTS category_location text,
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.symptom_journal.duration_onset IS 'Onset or duration e.g., Just started, <24h, 1-3 days';
COMMENT ON COLUMN public.symptom_journal.category_location IS 'Category/body location tag e.g., Head & Brain, Digestive, Skin & Rash';
COMMENT ON COLUMN public.symptom_journal.image_url IS 'Optional image URI/base64 attachment for visual symptoms';
