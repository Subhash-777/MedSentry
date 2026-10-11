-- Migration: 20261011000001_security_hardening.sql
-- Description: Batch 1 Security Hardening: Pin search_path, revoke anon access, cap fuzzy query, drop debug triggers, index logs, admin user cleanup RPC.

-- 1. Pin search_path on all SECURITY DEFINER functions to public, pg_temp
ALTER FUNCTION public.check_caregiver_access(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_caregiver_access_course(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_circle_read_access(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_circle_read_access_course(uuid, uuid) SET search_path = public, pg_temp;

-- 2. Revoke anon execution on fuzzy_search_drug and get_amr_heatmap (including PUBLIC)
REVOKE EXECUTE ON FUNCTION public.fuzzy_search_drug(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fuzzy_search_drug(text[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_amr_heatmap() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_amr_heatmap() TO authenticated;

-- 3. Cap fuzzy_search_drug query input and preserve search_path
CREATE OR REPLACE FUNCTION public.fuzzy_search_drug(search_terms text[])
RETURNS TABLE (
  id uuid,
  name text,
  similarity_score real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Security guard: cap array length and term length to prevent CPU exhaustion
  IF array_length(search_terms, 1) > 50 THEN
    search_terms := search_terms[1:50];
  END IF;

  RETURN QUERY
  SELECT 
    d.id, 
    d.name, 
    similarity(d.name, term) AS similarity_score
  FROM public.drugs d
  CROSS JOIN unnest(search_terms) AS term
  WHERE length(term) BETWEEN 2 AND 100
    AND similarity(d.name, term) >= 0.42
  ORDER BY similarity_score DESC
  LIMIT 1;
END;
$$;

-- 4. Drop leftover test_trigger_debug function
DROP FUNCTION IF EXISTS public.test_trigger_debug();

-- 5. Add 'prescription_ocr' to api_usage_logs request_type CHECK constraint
ALTER TABLE public.api_usage_logs
    DROP CONSTRAINT IF EXISTS api_usage_logs_request_type_check;

ALTER TABLE public.api_usage_logs
    ADD CONSTRAINT api_usage_logs_request_type_check
    CHECK (request_type = ANY (ARRAY['consultant', 'chatbot', 'ocr_assist', 'suitability', 'symptom_to_care', 'visual_id', 'prescription_ocr']));

-- 6. Add index on api_usage_logs for per-user rate limiting queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_created ON public.api_usage_logs(user_id, created_at DESC);

-- 7. Drop FK constraint on admin_audit_log(target_user_id) to allow immutable audit history
ALTER TABLE public.admin_audit_log 
    DROP CONSTRAINT IF EXISTS admin_audit_log_target_user_id_fkey;

-- 8. Atomic dependent user cleanup RPC for admin-api (service_role only)
CREATE OR REPLACE FUNCTION public.admin_cleanup_user_data(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Remove dependent records where foreign key is NO ACTION or child entity
  DELETE FROM public.caregiver_audit_log 
    WHERE caregiver_id = target_id OR target_member_id = target_id;

  -- dose_logs links via course_id and confirmed_by
  DELETE FROM public.dose_logs 
    WHERE course_id IN (SELECT id FROM public.medication_courses WHERE user_id = target_id);
  UPDATE public.dose_logs 
    SET confirmed_by = NULL 
    WHERE confirmed_by = target_id;

  DELETE FROM public.symptom_journal WHERE user_id = target_id;
  DELETE FROM public.medication_courses WHERE user_id = target_id;
  DELETE FROM public.family_members WHERE member_id = target_id;
  
  -- If user owned any groups, clean cabinet inventory and remove group
  DELETE FROM public.cabinet_inventory WHERE added_by = target_id;
  DELETE FROM public.cabinet_inventory 
    WHERE group_id IN (SELECT id FROM public.family_groups WHERE owner_id = target_id);
  DELETE FROM public.family_members 
    WHERE group_id IN (SELECT id FROM public.family_groups WHERE owner_id = target_id);
  DELETE FROM public.family_groups WHERE owner_id = target_id;

  DELETE FROM public.prescriptions WHERE user_id = target_id;
  DELETE FROM public.chatbot_threads WHERE user_id = target_id;
  DELETE FROM public.ai_consultations WHERE user_id = target_id;

  -- User badges if present
  DELETE FROM public.user_badges WHERE user_id = target_id;

  -- Delete profile row
  DELETE FROM public.profiles WHERE id = target_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_cleanup_user_data(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cleanup_user_data(uuid) TO service_role;
