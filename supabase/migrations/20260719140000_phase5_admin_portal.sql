-- Phase 5: Admin Portal
-- Adds dataset_sync_log per Deviation #8 and required RLS/Grants for Edge Function access

CREATE TABLE IF NOT EXISTS public.dataset_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  last_refreshed_at timestamptz DEFAULT now(),
  details jsonb
);

ALTER TABLE public.dataset_sync_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dataset_sync_log TO service_role;

CREATE POLICY "admin_select" ON public.dataset_sync_log
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Grant required permissions to service_role so admin-api can function
GRANT SELECT, UPDATE ON public.profiles TO service_role;
GRANT SELECT, DELETE ON public.family_groups TO service_role;
GRANT SELECT, DELETE ON public.family_members TO service_role;
GRANT SELECT, DELETE ON public.cabinet_inventory TO service_role;
GRANT INSERT, SELECT ON public.admin_audit_log TO service_role;
-- api_usage_logs and caregiver_audit_log already have SELECT grants for service_role
