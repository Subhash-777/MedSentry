-- Migration: 20261011000002_privacy_enforcement.sql
-- Description: Batch 2 Privacy Enforcement (Decision D2):
--   - Restrict profiles table SELECT to self, owner/caregivers of shared circle, and admins.
--   - Provide circle_member_profiles view (id, full_name, account_type) for viewers.
--   - Restrict symptom_journal SELECT to self, owner/caregivers of shared circle, and admins.

-- 1. Helper function: is_admin() to safely check admin role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, PUBLIC;

-- 2. Replace profiles SELECT policy
DROP POLICY IF EXISTS "profiles: select circle members" ON public.profiles;
DROP POLICY IF EXISTS "profiles: select self or caregiver" ON public.profiles;

CREATE POLICY "profiles: select self or caregiver" ON public.profiles
FOR SELECT USING (
  id = auth.uid() 
  OR check_caregiver_access(id, auth.uid()) 
  OR is_admin()
);

-- 2. Create restricted view for circle members (accessible by viewers)
CREATE OR REPLACE VIEW public.circle_member_profiles
WITH (security_invoker = false)
AS
SELECT 
  p.id,
  p.full_name,
  p.account_type
FROM public.profiles p
WHERE 
  p.id = auth.uid() 
  OR check_circle_read_access(p.id, auth.uid()) 
  OR is_admin();

GRANT SELECT ON public.circle_member_profiles TO authenticated;
REVOKE SELECT ON public.circle_member_profiles FROM anon, PUBLIC;

-- 3. Stored RPC helper for fetching restricted profile of a circle member
CREATE OR REPLACE FUNCTION public.get_circle_member_profile(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  account_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (
    target_user_id = auth.uid() 
    OR check_circle_read_access(target_user_id, auth.uid()) 
    OR is_admin()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.account_type
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_circle_member_profile(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_circle_member_profile(uuid) FROM anon, PUBLIC;

-- 4. Replace symptom_journal SELECT policy (restricts viewers)
DROP POLICY IF EXISTS "symptom_journal: select circle members" ON public.symptom_journal;
DROP POLICY IF EXISTS "symptom_journal: select self or caregiver" ON public.symptom_journal;

CREATE POLICY "symptom_journal: select self or caregiver" ON public.symptom_journal
FOR SELECT USING (
  user_id = auth.uid() 
  OR check_caregiver_access(user_id, auth.uid()) 
  OR is_admin()
);
