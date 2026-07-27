-- Migration: Phase 6 Gamified Badges
-- Creates the user_badges table and the server-side trigger to award badges automatically on dose log.

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, badge_type)
);

-- RLS: Users can read their own badges; Admins can read all.
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges" 
    ON public.user_badges FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all badges" 
    ON public.user_badges FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    ));

-- No INSERT/UPDATE/DELETE policies are granted to authenticated users.
-- Badges are completely client-tamper-proof and can only be written by postgres triggers or the service_role.

-- Trigger Function: Evaluate and award badges server-side
CREATE OR REPLACE FUNCTION public.evaluate_and_award_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    streak_days INT;
    resolved_user_id UUID;
BEGIN
    -- 1. Resolve user_id from medication_courses
    SELECT user_id INTO resolved_user_id
    FROM public.medication_courses
    WHERE id = NEW.course_id;

    IF resolved_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 2. Evaluate 7-Day Streak
    -- Count distinct days the user has taken a dose over the last 7 days (including today)
    SELECT COUNT(DISTINCT (dl.logged_at AT TIME ZONE 'UTC')::DATE)
    INTO streak_days
    FROM public.dose_logs dl
    JOIN public.medication_courses mc ON dl.course_id = mc.id
    WHERE mc.user_id = resolved_user_id
      AND dl.status = 'taken'
      AND dl.logged_at >= (NOW() - INTERVAL '6 days');

    IF streak_days >= 7 THEN
        INSERT INTO public.user_badges (user_id, badge_type, metadata)
        VALUES (resolved_user_id, '7_day_streak', '{"days": 7}'::jsonb)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 3. Evaluate First Log Badge (only if it was actually taken)
    IF NEW.status = 'taken' THEN
        INSERT INTO public.user_badges (user_id, badge_type, metadata)
        VALUES (resolved_user_id, 'first_dose_logged', '{}'::jsonb)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Attach trigger to dose_logs
DROP TRIGGER IF EXISTS trg_evaluate_badges ON public.dose_logs;
CREATE TRIGGER trg_evaluate_badges
    AFTER INSERT ON public.dose_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.evaluate_and_award_badges();
