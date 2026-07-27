-- Phase 4: Family & Social
-- Adds tables, RLS policies, and helper functions for Caregiver access and Self-Sovereignty.

-- 1. Schema Deviations
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS caregiver_consent_revoked boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.caregiver_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid REFERENCES public.profiles(id) NOT NULL,
  target_member_id uuid REFERENCES public.profiles(id) NOT NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinet_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Caregiver Access Functions (Security Definer)
CREATE OR REPLACE FUNCTION public.check_caregiver_access(target_user_id uuid, acting_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM family_members m_actor
    JOIN family_members m_target ON m_actor.group_id = m_target.group_id
    JOIN profiles p_target ON p_target.id = m_target.member_id
    WHERE m_actor.member_id = acting_user_id
      AND m_target.member_id = target_user_id
      AND m_actor.role IN ('owner', 'caregiver')
      AND p_target.caregiver_consent_revoked = false
  );
$$;

CREATE OR REPLACE FUNCTION public.check_circle_read_access(target_user_id uuid, acting_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM family_members m_actor
    JOIN family_members m_target ON m_actor.group_id = m_target.group_id
    WHERE m_actor.member_id = acting_user_id
      AND m_target.member_id = target_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.check_caregiver_access_course(target_course_id uuid, acting_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM medication_courses c
    WHERE c.id = target_course_id 
      AND (c.user_id = acting_user_id OR check_caregiver_access(c.user_id, acting_user_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.check_circle_read_access_course(target_course_id uuid, acting_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM medication_courses c
    WHERE c.id = target_course_id 
      AND (c.user_id = acting_user_id OR check_circle_read_access(c.user_id, acting_user_id))
  );
$$;

-- 4. Profiles RLS
CREATE POLICY "profiles: select circle members" ON public.profiles
FOR SELECT USING (
  id = auth.uid() OR check_circle_read_access(id, auth.uid())
);

-- 5. Medication Courses RLS
CREATE POLICY "courses: select circle members" ON public.medication_courses
FOR SELECT USING (
  user_id = auth.uid() OR check_circle_read_access(user_id, auth.uid())
);
CREATE POLICY "courses: update dependents" ON public.medication_courses
FOR UPDATE USING (check_caregiver_access(user_id, auth.uid())) 
WITH CHECK (check_caregiver_access(user_id, auth.uid()));
CREATE POLICY "courses: insert dependents" ON public.medication_courses
FOR INSERT WITH CHECK (check_caregiver_access(user_id, auth.uid()));
CREATE POLICY "courses: delete dependents" ON public.medication_courses
FOR DELETE USING (check_caregiver_access(user_id, auth.uid()));

-- 6. Dose Logs RLS
CREATE POLICY "dose_logs: select circle members" ON public.dose_logs
FOR SELECT USING (check_circle_read_access_course(course_id, auth.uid()));
CREATE POLICY "dose_logs: update dependents" ON public.dose_logs
FOR UPDATE USING (check_caregiver_access_course(course_id, auth.uid())) 
WITH CHECK (check_caregiver_access_course(course_id, auth.uid()));
CREATE POLICY "dose_logs: insert dependents" ON public.dose_logs
FOR INSERT WITH CHECK (check_caregiver_access_course(course_id, auth.uid()));
CREATE POLICY "dose_logs: delete dependents" ON public.dose_logs
FOR DELETE USING (check_caregiver_access_course(course_id, auth.uid()));

-- 7. Symptom Journal RLS
CREATE POLICY "symptom_journal: select circle members" ON public.symptom_journal
FOR SELECT USING (
  user_id = auth.uid() OR check_circle_read_access(user_id, auth.uid())
);
CREATE POLICY "symptom_journal: update dependents" ON public.symptom_journal
FOR UPDATE USING (check_caregiver_access(user_id, auth.uid())) 
WITH CHECK (check_caregiver_access(user_id, auth.uid()));
CREATE POLICY "symptom_journal: insert dependents" ON public.symptom_journal
FOR INSERT WITH CHECK (check_caregiver_access(user_id, auth.uid()));
CREATE POLICY "symptom_journal: delete dependents" ON public.symptom_journal
FOR DELETE USING (check_caregiver_access(user_id, auth.uid()));

-- 8. Caregiver Audit Log RLS
CREATE POLICY "audit: insert caregiver" ON public.caregiver_audit_log
FOR INSERT WITH CHECK (
  caregiver_id = auth.uid() AND check_caregiver_access(target_member_id, auth.uid())
);
CREATE POLICY "audit: select own or dependent" ON public.caregiver_audit_log
FOR SELECT USING (
  target_member_id = auth.uid() OR (caregiver_id = auth.uid() AND check_caregiver_access(target_member_id, auth.uid()))
);

-- 9. Family Groups RLS
CREATE POLICY "groups: select members" ON public.family_groups
FOR SELECT USING (
  owner_id = auth.uid() OR id IN (SELECT group_id FROM public.family_members WHERE member_id = auth.uid())
);
CREATE POLICY "groups: update owner" ON public.family_groups
FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "groups: delete owner" ON public.family_groups
FOR DELETE USING (owner_id = auth.uid());
CREATE POLICY "groups: insert owner" ON public.family_groups
FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 10. Family Members RLS
CREATE POLICY "members: select members" ON public.family_members
FOR SELECT USING (
  member_id = auth.uid() OR group_id IN (SELECT group_id FROM public.family_members WHERE member_id = auth.uid())
);
CREATE POLICY "members: insert owner or self" ON public.family_members
FOR INSERT WITH CHECK (
  group_id IN (SELECT id FROM public.family_groups WHERE owner_id = auth.uid()) OR member_id = auth.uid()
);
CREATE POLICY "members: update owner or self" ON public.family_members
FOR UPDATE USING (
  group_id IN (SELECT id FROM public.family_groups WHERE owner_id = auth.uid()) OR member_id = auth.uid()
) WITH CHECK (
  group_id IN (SELECT id FROM public.family_groups WHERE owner_id = auth.uid()) OR member_id = auth.uid()
);
CREATE POLICY "members: delete owner or self" ON public.family_members
FOR DELETE USING (
  group_id IN (SELECT id FROM public.family_groups WHERE owner_id = auth.uid()) OR member_id = auth.uid()
);

-- 11. Cabinet Inventory RLS
CREATE POLICY "cabinet: select members" ON public.cabinet_inventory
FOR SELECT USING (
  group_id IN (SELECT group_id FROM public.family_members WHERE member_id = auth.uid())
);
CREATE POLICY "cabinet: insert caregivers" ON public.cabinet_inventory
FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM public.family_members WHERE member_id = auth.uid() AND role IN ('owner', 'caregiver'))
);
CREATE POLICY "cabinet: update caregivers" ON public.cabinet_inventory
FOR UPDATE USING (
  group_id IN (SELECT group_id FROM public.family_members WHERE member_id = auth.uid() AND role IN ('owner', 'caregiver'))
) WITH CHECK (
  group_id IN (SELECT group_id FROM public.family_members WHERE member_id = auth.uid() AND role IN ('owner', 'caregiver'))
);
CREATE POLICY "cabinet: delete caregivers" ON public.cabinet_inventory
FOR DELETE USING (
  group_id IN (SELECT group_id FROM public.family_members WHERE member_id = auth.uid() AND role IN ('owner', 'caregiver'))
);

-- 12. Service Role Grants for New Tables
GRANT ALL PRIVILEGES ON public.family_groups TO service_role;
GRANT ALL PRIVILEGES ON public.family_members TO service_role;
GRANT ALL PRIVILEGES ON public.cabinet_inventory TO service_role;
GRANT ALL PRIVILEGES ON public.caregiver_audit_log TO service_role;
