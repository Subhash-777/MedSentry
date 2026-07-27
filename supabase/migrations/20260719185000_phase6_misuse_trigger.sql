-- Migration: Phase 6 AMR Misuse Events Trigger
-- Centralizes the insertion logic for AMR misuse tracking into a single database trigger.

-- 1. Add course_id to misuse_events to prevent duplicate logging for the same course
ALTER TABLE public.misuse_events
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.medication_courses(id) ON DELETE CASCADE;

-- We also need to add a unique constraint so ON CONFLICT DO NOTHING works cleanly
-- Using IF NOT EXISTS pattern for constraint (Postgres 11+) is tricky, but we can do it via DO block if needed.
-- Or just standard ADD CONSTRAINT.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'misuse_events_course_event_key'
  ) THEN
    ALTER TABLE public.misuse_events ADD CONSTRAINT misuse_events_course_event_key UNIQUE (course_id, event_type);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.log_amr_misuse_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_region TEXT;
    resolved_category TEXT;
BEGIN
    -- 1. Only track events for antibiotics
    IF NOT NEW.is_antibiotic THEN
        RETURN NEW;
    END IF;

    -- 2. Resolve the user's opted-in region (NULL if they haven't provided one)
    SELECT region INTO user_region
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- 3. Resolve drug category (Fallback if drug_id is null/unknown)
    IF NEW.drug_id IS NOT NULL THEN
        SELECT category INTO resolved_category
        FROM public.drugs
        WHERE id = NEW.drug_id;
    END IF;
    
    IF resolved_category IS NULL THEN
        resolved_category := 'Antibiotics (Unverified)';
    END IF;

    -- 4. Evaluate transitions based on TG_OP to avoid null OLD references on INSERT
    
    -- Case A: unprescribed_purchase
    IF (TG_OP = 'INSERT' AND NEW.necessity_flag = 'flagged_unprescribed') OR 
       (TG_OP = 'UPDATE' AND NEW.necessity_flag = 'flagged_unprescribed' AND OLD.necessity_flag IS DISTINCT FROM NEW.necessity_flag) THEN
       
       INSERT INTO public.misuse_events (course_id, region, drug_category, event_type)
       VALUES (NEW.id, user_region, resolved_category, 'unprescribed_purchase')
       ON CONFLICT (course_id, event_type) DO NOTHING;
    END IF;

    -- Case B: unnecessary_use
    IF (TG_OP = 'INSERT' AND NEW.necessity_flag = 'flagged_unnecessary') OR 
       (TG_OP = 'UPDATE' AND NEW.necessity_flag = 'flagged_unnecessary' AND OLD.necessity_flag IS DISTINCT FROM NEW.necessity_flag) THEN
       
       INSERT INTO public.misuse_events (course_id, region, drug_category, event_type)
       VALUES (NEW.id, user_region, resolved_category, 'unnecessary_use')
       ON CONFLICT (course_id, event_type) DO NOTHING;
    END IF;

    -- Case C: early_stop
    IF (TG_OP = 'INSERT' AND NEW.status = 'stopped_early') OR 
       (TG_OP = 'UPDATE' AND NEW.status = 'stopped_early' AND OLD.status IS DISTINCT FROM NEW.status) THEN
       
       INSERT INTO public.misuse_events (course_id, region, drug_category, event_type)
       VALUES (NEW.id, user_region, resolved_category, 'early_stop')
       ON CONFLICT (course_id, event_type) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Attach trigger to medication_courses
DROP TRIGGER IF EXISTS trg_log_amr_misuse ON public.medication_courses;
CREATE TRIGGER trg_log_amr_misuse
    AFTER INSERT OR UPDATE ON public.medication_courses
    FOR EACH ROW
    EXECUTE FUNCTION public.log_amr_misuse_events();
