-- Fix Postgres permissions for authenticated role on all necessary tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drugs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dose_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptoms TO authenticated;
