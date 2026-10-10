-- Migration: OCR Fuzzy Drug Matching via pg_trgm (Deviation #14)
-- Date: 2026-10-10
-- Purpose: Provides high-speed trigram similarity and Levenshtein resilience
-- for OCR-scanned drug names against public.drugs catalog.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram index on drug name for accelerated similarity search
CREATE INDEX IF NOT EXISTS idx_drugs_name_trgm ON public.drugs USING gin (name gin_trgm_ops);

-- RPC Function: fuzzy_search_drug
-- Takes an array of OCR candidate terms and returns the highest similarity match above 0.4 threshold
CREATE OR REPLACE FUNCTION public.fuzzy_search_drug(search_terms text[])
RETURNS TABLE (
  id uuid,
  name text,
  similarity_score real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.name, 
    similarity(d.name, term) AS similarity_score
  FROM public.drugs d
  CROSS JOIN unnest(search_terms) AS term
  WHERE similarity(d.name, term) >= 0.42
  ORDER BY similarity_score DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fuzzy_search_drug(text[]) TO authenticated, anon;
