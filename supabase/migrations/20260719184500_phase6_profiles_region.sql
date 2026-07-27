-- Migration: Phase 6 Profiles Region (Deviation #10)
-- Adds an optional region column to allow explicit opt-in for community AMR surveillance.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS region text;

COMMENT ON COLUMN public.profiles.region IS 'User-provided State/Province for opt-in community AMR surveillance tracking.';
