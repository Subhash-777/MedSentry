-- 1. Recreate CHECK constraints with updated valid values
ALTER TABLE public.api_usage_logs
    DROP CONSTRAINT IF EXISTS api_usage_logs_outcome_check,
    DROP CONSTRAINT IF EXISTS api_usage_logs_provider_name_check,
    DROP CONSTRAINT IF EXISTS api_usage_logs_request_type_check;

ALTER TABLE public.api_usage_logs
    ADD CONSTRAINT api_usage_logs_outcome_check
        CHECK (outcome = ANY (ARRAY['success', 'rate_limited', 'error', 'timeout', 'skipped', 'flagged'])),
    ADD CONSTRAINT api_usage_logs_provider_name_check
        CHECK (provider_name = ANY (ARRAY['ondevice', 'gemini', 'groq', 'openrouter', 'huggingface', 'guardrail'])),
    ADD CONSTRAINT api_usage_logs_request_type_check
        CHECK (request_type = ANY (ARRAY['consultant', 'chatbot', 'ocr_assist', 'suitability', 'symptom_to_care', 'visual_id']));

-- 2. Ensure service_role has minimal necessary table privileges for Edge Function execution
GRANT INSERT ON public.api_usage_logs TO service_role;
GRANT SELECT, UPDATE ON public.medication_courses TO service_role;
GRANT SELECT ON public.drugs TO service_role;
GRANT SELECT ON public.drug_interactions TO service_role;
GRANT SELECT ON public.symptom_journal TO service_role;
GRANT SELECT ON public.dose_logs TO service_role;

-- 3. Fix RLS policies
-- Drop the overly permissive insert policy if it exists
DROP POLICY IF EXISTS "edge_function_insert" ON public.api_usage_logs;

-- Recreate policy strictly scoped to authenticated users only (prevents anon inserts from leaked public keys)
CREATE POLICY "edge_function_insert" ON public.api_usage_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Ensure admins can read the logs
DROP POLICY IF EXISTS "admin_select" ON public.api_usage_logs;
CREATE POLICY "admin_select" ON public.api_usage_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );
