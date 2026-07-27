-- =============================================================================
-- Phase 2 RLS Policies & Grants
-- =============================================================================

-- 1. Ensure basic table permissions (GRANTS) are present
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drugs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dose_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_journal TO authenticated;

-- 2. Add RLS Policies for Medication Courses
create policy "courses: select own"
  on medication_courses for select
  using (auth.uid() = user_id);

create policy "courses: insert own"
  on medication_courses for insert
  with check (auth.uid() = user_id);

create policy "courses: update own"
  on medication_courses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "courses: delete own"
  on medication_courses for delete
  using (auth.uid() = user_id);

-- 3. Add RLS Policies for Dose Logs
-- Since dose_logs references course_id, we need to join or just allow if the user owns the course
create policy "dose_logs: select own"
  on dose_logs for select
  using (
    exists (
      select 1 from medication_courses
      where medication_courses.id = dose_logs.course_id
      and medication_courses.user_id = auth.uid()
    )
  );

create policy "dose_logs: insert own"
  on dose_logs for insert
  with check (
    exists (
      select 1 from medication_courses
      where medication_courses.id = dose_logs.course_id
      and medication_courses.user_id = auth.uid()
    )
  );

create policy "dose_logs: update own"
  on dose_logs for update
  using (
    exists (
      select 1 from medication_courses
      where medication_courses.id = dose_logs.course_id
      and medication_courses.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from medication_courses
      where medication_courses.id = dose_logs.course_id
      and medication_courses.user_id = auth.uid()
    )
  );
