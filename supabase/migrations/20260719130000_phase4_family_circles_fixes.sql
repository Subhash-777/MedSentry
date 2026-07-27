-- Phase 4 Fixes: Grants, Join Circle RPC, Recursion Fix, Audit Trigger

-- 1. Missing Grants on new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cabinet_inventory TO authenticated;
GRANT SELECT ON public.caregiver_audit_log TO authenticated;

-- Narrow service_role grants
REVOKE ALL PRIVILEGES ON public.family_groups FROM service_role;
REVOKE ALL PRIVILEGES ON public.family_members FROM service_role;
REVOKE ALL PRIVILEGES ON public.cabinet_inventory FROM service_role;
REVOKE ALL PRIVILEGES ON public.caregiver_audit_log FROM service_role;
GRANT SELECT ON public.family_groups TO service_role;
GRANT SELECT ON public.family_members TO service_role;
GRANT SELECT ON public.cabinet_inventory TO service_role;
GRANT SELECT ON public.caregiver_audit_log TO service_role;

-- 2. Join Circle RPC and constraint
ALTER TABLE public.family_members
ADD CONSTRAINT family_members_group_id_member_id_key UNIQUE (group_id, member_id);

CREATE OR REPLACE FUNCTION public.join_family_circle(invite_code text, is_linked_dependent boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_group_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target_group_id 
  FROM public.family_groups 
  WHERE family_groups.invite_code = join_family_circle.invite_code;

  IF target_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.family_members (group_id, member_id, role, is_linked_dependent)
  VALUES (target_group_id, auth.uid(), 'viewer', is_linked_dependent);
END;
$$;

-- 3. Recursion breaker helper & Policy Fixes
CREATE OR REPLACE FUNCTION public.is_circle_member(check_group_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE group_id = check_group_id AND member_id = check_user_id
  );
$$;

-- Drop old recursive policies
DROP POLICY IF EXISTS "groups: select members" ON public.family_groups;
CREATE POLICY "groups: select members" ON public.family_groups
FOR SELECT USING (
  owner_id = auth.uid() OR public.is_circle_member(id, auth.uid())
);

DROP POLICY IF EXISTS "members: select members" ON public.family_members;
CREATE POLICY "members: select members" ON public.family_members
FOR SELECT USING (
  member_id = auth.uid() OR public.is_circle_member(group_id, auth.uid())
);

-- Fix member insert/update policies (Owner only)
DROP POLICY IF EXISTS "members: insert owner or self" ON public.family_members;
CREATE POLICY "members: insert owner" ON public.family_members
FOR INSERT WITH CHECK (
  group_id IN (SELECT id FROM public.family_groups WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "members: update owner or self" ON public.family_members;
CREATE POLICY "members: update owner" ON public.family_members
FOR UPDATE USING (
  group_id IN (SELECT id FROM public.family_groups WHERE owner_id = auth.uid())
) WITH CHECK (
  group_id IN (SELECT id FROM public.family_groups WHERE owner_id = auth.uid())
);

-- 4. Audit Log Trigger
-- Drop the client-side insert policy from the old migration
DROP POLICY IF EXISTS "audit: insert caregiver" ON public.caregiver_audit_log;

CREATE OR REPLACE FUNCTION public.trigger_caregiver_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  acting_user uuid := auth.uid();
  target_user uuid;
  row_data jsonb;
BEGIN
  IF acting_user IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    row_data := row_to_json(OLD)::jsonb;
  ELSE
    row_data := row_to_json(NEW)::jsonb;
  END IF;

  IF TG_TABLE_NAME = 'medication_courses' OR TG_TABLE_NAME = 'symptom_journal' THEN
    target_user := (row_data->>'user_id')::uuid;
  ELSIF TG_TABLE_NAME = 'dose_logs' THEN
    SELECT user_id INTO target_user FROM public.medication_courses WHERE id = (row_data->>'course_id')::uuid;
  END IF;

  IF target_user IS NOT NULL AND acting_user != target_user THEN
    INSERT INTO public.caregiver_audit_log (caregiver_id, target_member_id, action, details)
    VALUES (
      acting_user, 
      target_user, 
      TG_OP || ' ' || TG_TABLE_NAME, 
      row_data
    );
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS audit_medication_courses_changes ON public.medication_courses;
CREATE TRIGGER audit_medication_courses_changes
AFTER INSERT OR UPDATE OR DELETE ON public.medication_courses
FOR EACH ROW EXECUTE FUNCTION public.trigger_caregiver_audit();

DROP TRIGGER IF EXISTS audit_dose_logs_changes ON public.dose_logs;
CREATE TRIGGER audit_dose_logs_changes
AFTER INSERT OR UPDATE OR DELETE ON public.dose_logs
FOR EACH ROW EXECUTE FUNCTION public.trigger_caregiver_audit();

DROP TRIGGER IF EXISTS audit_symptom_journal_changes ON public.symptom_journal;
CREATE TRIGGER audit_symptom_journal_changes
AFTER INSERT OR UPDATE OR DELETE ON public.symptom_journal
FOR EACH ROW EXECUTE FUNCTION public.trigger_caregiver_audit();
