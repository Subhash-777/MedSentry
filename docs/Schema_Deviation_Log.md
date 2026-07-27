# MedSentry — Schema Deviation Log

This file is the running record of every column or table added to the live database that was
not present in plan.md §4 at the time of implementation. Every entry must be appended here
**before** the migration is pushed to the live database.

Format per entry:
- **Deviation #**: Sequential number
- **Date**: ISO date when the migration was pushed
- **Migration file**: Filename under `supabase/migrations/`
- **Change**: Exact DDL added
- **Why §4 wasn't sufficient**: Specific reason the spec schema couldn't support the feature as-is
- **Decision**: Who approved it and under what condition
- **Status**: Pending / Applied / Rolled back

---

## Deviation #1 — `severity_source` on `drug_interactions`

- **Date**: 2026-07-09 (Phase 2)
- **Migration file**: `20260710000001_medication_courses_package_fields.sql`
- **Change**:
  ```sql
  ALTER TABLE public.drug_interactions
  ADD COLUMN IF NOT EXISTS severity_source text;
  ```
- **Why §4 wasn't sufficient**: plan.md §4 defines `severity text` on `drug_interactions` but has no column to distinguish between AI-classified severity (Phase 3 work) and keyword-heuristic severity (Phase 2 seeder work). Without `severity_source`, the Phase 3 AI re-classification job has no way to know which rows still need AI review vs. which are already processed. The agreed heuristic (`'parsed'` / `'unclassified'`) requires a separate tracking column.
- **Decision**: Approved (Phase 2). Logged retrospectively as Deviation #1.
- **Status**: Applied

---

## Deviation #2 — `expiry_date`, `batch_number`, `refill_date` on `medication_courses`

- **Date**: 2026-07-10 (Phase 2)
- **Migration file**: `20260710000001_medication_courses_package_fields.sql`
- **Change**:
  ```sql
  ALTER TABLE public.medication_courses
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS batch_number text,
  ADD COLUMN IF NOT EXISTS refill_date date;
  ```
- **Why §4 wasn't sufficient**: plan.md §2.3 specifies medicine strip scan must extract expiry date and batch number, and §2.4 specifies auto-computed refill-reminder dates. The §4 `medication_courses` schema has no columns for any of these three fields. They cannot be derived at query time — they must be stored when a strip is scanned.
- **Decision**: Approved (Phase 2). Logged retrospectively as Deviation #2.
- **Status**: Applied

---

## Deviation #3 — `dosage_amount`, `frequency`, `instructions`, `custom_name` on `medication_courses`

- **Date**: 2026-07-19 (Phase 2 → Phase 3 boundary)
- **Migration file**: `20260718000001_enhance_medication_courses.sql`
- **Change**:
  ```sql
  ALTER TABLE public.medication_courses
  ADD COLUMN IF NOT EXISTS dosage_amount text,
  ADD COLUMN IF NOT EXISTS frequency text[],
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS custom_name text;

  COMMENT ON COLUMN public.medication_courses.frequency IS 'Array of times/schedules e.g., ["morning", "evening"]';
  COMMENT ON COLUMN public.medication_courses.instructions IS 'Specific instructions e.g., "Take 30 min before sleep"';
  COMMENT ON COLUMN public.medication_courses.dosage_amount IS 'Dosage quantity e.g., "3mg" or "1 tablet"';
  COMMENT ON COLUMN public.medication_courses.custom_name IS 'Display name fallback when drug_id is null (scanned drug not matched in drugs table)';
  ```
- **Why §4 wasn't sufficient**:
  - `dosage_amount text`: plan.md §4 has `daily_dose int` (a count). The OCR scanner extracts the human-readable dosage string from prescriptions (e.g. "3mg", "500mg"). These serve different purposes — `daily_dose` computes `days_remaining`; `dosage_amount` is the displayable string from the prescription.
  - `frequency text[]`: `daily_dose int` answers "how many times per day" but not "at what time of day." For time-sensitive medications (e.g. Melatonin "At bedtime"), the prescription's explicit timing is medically meaningful and needed by the notification scheduler to set correct push notification hours. The spec (§2.3) requires "every prescribed medicine with dosage/frequency/duration" to be extracted.
  - `instructions text`: plan.md §2.3 explicitly requires per-medicine instructions to be captured from prescriptions ("Take 30 min before sleep", "After food"). No field existed for this.
  - `custom_name text`: When OCR extracts a drug name that has no matching row in `drugs`, `drug_id` is null. Without `custom_name`, the tracker displays "Unknown Drug" instead of the verified name. This is a fallback display label for unmatched drugs only — it is **not** a user-facing rename/alias field.
- **Decision**: Approved by user 2026-07-19. Process deviation noted — this was implemented without prior flag. Going forward, any schema change must be logged here before the migration runs.
- **Status**: Applied 2026-07-19

---

## Deviation #4 — Check constraints on `api_usage_logs`

- **Date**: 2026-07-19 (Phase 3)
- **Migration file**: `20260719105400_update_api_usage_logs.sql`
- **Change**:
  ```sql
  ALTER TABLE public.api_usage_logs
      DROP CONSTRAINT api_usage_logs_outcome_check,
      DROP CONSTRAINT api_usage_logs_provider_name_check,
      DROP CONSTRAINT api_usage_logs_request_type_check;

  ALTER TABLE public.api_usage_logs
      ADD CONSTRAINT api_usage_logs_outcome_check
          CHECK (outcome = ANY (ARRAY['success', 'rate_limited', 'error', 'timeout', 'skipped', 'flagged'])),
      ADD CONSTRAINT api_usage_logs_provider_name_check
          CHECK (provider_name = ANY (ARRAY['ondevice', 'gemini', 'groq', 'openrouter', 'huggingface', 'guardrail'])),
      ADD CONSTRAINT api_usage_logs_request_type_check
          CHECK (request_type = ANY (ARRAY['consultant', 'chatbot', 'ocr_assist', 'suitability', 'symptom_to_care', 'visual_id']));
  ```
- **Why §4 wasn't sufficient**:
  - The `outcome` constraint in plan.md §4 only allowed `success`, `rate_limited`, `error`, `timeout`. Phase 3 introduced `guardrail` refusals (which produce a `flagged` outcome) and local device completions (which produce a `skipped` outcome for the cloud provider), meaning the logs were blocked from recording these results.
  - The `provider_name` constraint lacked `guardrail`.
  - The `request_type` constraint only had `consultant`, `chatbot`, `ocr_assist`. The Phase 3 architecture splits `consultant` into three distinct modes: `suitability`, `symptom_to_care`, `visual_id`.
- **Decision**: Implemented as part of resolving Phase 3 logging errors.

### Addendum: Minimal `service_role` grants
- **Change**:
  ```sql
  GRANT INSERT ON public.api_usage_logs TO service_role;
  GRANT SELECT, UPDATE ON public.medication_courses TO service_role;
  GRANT SELECT ON public.drugs TO service_role;
  GRANT SELECT ON public.drug_interactions TO service_role;
  GRANT SELECT ON public.symptom_journal TO service_role;
  GRANT SELECT ON public.dose_logs TO service_role;
  ```
- **Why §4 wasn't sufficient**:
  - The `service_role` in this Supabase project (used by the AI Router Edge Function to bypass Row Level Security for critical logging and necessity write-backs) was throwing `42501 permission denied` because it lacked default `SELECT`, `UPDATE`, and `INSERT` grants on the application tables created in earlier phases.
  - Grants have been scoped specifically to the Edge Function's absolute minimum usage per table (e.g. only `INSERT` on `api_usage_logs` since it never reads/updates them, only `SELECT, UPDATE` on `medication_courses` since it only reads context and writes back `necessity_flag`).
- **Status**: Pending (Migration written, awaiting manual `supabase db push`)

---

## Deviation #5 — `caregiver_consent_revoked` on `profiles`

- **Date**: 2026-07-19 (Phase 4)
- **Migration file**: `20260719120000_phase4_family_circles.sql`
- **Change**:
  ```sql
  ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS caregiver_consent_revoked boolean DEFAULT false;
  ```
- **Why §4 wasn't sufficient**: plan.md §2.2 specifies a self-sovereignty rule: "any adult member can downgrade anyone's edit access to their own data back to viewer-only at any time... implemented as a standing-consent flag the member controls from Settings". The `profiles` table in §4 did not have this flag.
- **Decision**: Implemented as part of Phase 4 RLS.
- **Status**: Applied

---

## Deviation #6 — `caregiver_audit_log` table

- **Date**: 2026-07-19 (Phase 4)
- **Migration file**: `20260719120000_phase4_family_circles.sql`
- **Change**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.caregiver_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id uuid REFERENCES public.profiles(id) NOT NULL,
    target_member_id uuid REFERENCES public.profiles(id) NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
  );
  ```
- **Why §4 wasn't sufficient**: plan.md §2.2 specifies an audit trail where "every caregiver edit made on a dependent's behalf is logged and visible to the affected member." plan.md §4 only included `admin_audit_log` and omitted a table for caregiver audit tracking.
- **Decision**: Implemented as part of Phase 4.
- **Status**: Applied

---

## Deviation #7 — Breaking Recursive RLS on `family_members` and Missing Grants

- **Date**: 2026-07-19 (Phase 4)
- **Migration file**: `20260719130000_phase4_family_circles_fixes.sql`
- **Change**:
  1. Created a `SECURITY DEFINER` function `is_circle_member(group_id, user_id)` and updated `family_groups` / `family_members` SELECT policies to use it instead of directly querying `family_members` via subqueries.
  2. Added standard `GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated` for all Phase 4 tables.
- **Why §4 wasn't sufficient**:
  - **Recursion**: The tables in plan.md §4 didn't dictate RLS implementation details. When implementing the RLS policies, a direct self-referencing subquery (where `family_members` SELECT queries `family_groups`, which in turn queries `family_members`) triggered an infinite recursion exception in Postgres. The schema design necessitates a `SECURITY DEFINER` helper to safely bypass RLS just for membership checks, breaking the loop.
- **Status**: Applied

---

## Deviation #8 — `dataset_sync_log` table

- **Date**: 2026-07-19 (Phase 5)
- **Migration file**: `20260719140000_phase5_admin_portal.sql`
- **Change**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.dataset_sync_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_name text NOT NULL,
    status text NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
    last_refreshed_at timestamptz DEFAULT now(),
    details jsonb
  );
  ```
- **Why §4 wasn't sufficient**: plan.md §2.7 specifies a "Dataset Sync Status" section in the Admin Portal to show when each seeded dataset was last refreshed. However, plan.md §4 omitted any table or schema structure to store these sync timestamps.
- **Decision**: Added to support Phase 5 Admin Portal feature.
- **Status**: Pending (Migration written, awaiting manual `supabase db push`)

---

## Deviation #9 — `user_badges` table

- **Date**: 2026-07-19 (Phase 6)
- **Migration file**: `20260719183000_phase6_user_badges.sql`
- **Change**:
  ```sql
  CREATE TABLE public.user_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      badge_type TEXT NOT NULL,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb,
      UNIQUE(user_id, badge_type)
  );

  ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Users can read own badges" 
      ON public.user_badges FOR SELECT 
      USING (auth.uid() = user_id);

  CREATE POLICY "Admins can read all badges" 
      ON public.user_badges FOR SELECT 
      USING (is_admin());

  -- Writes are strictly service_role only (no INSERT/UPDATE/DELETE policies for authenticated)
  ```
- **Why §4 wasn't sufficient**: plan.md §8 introduces Gamified Badges, but plan.md §4 omitted any schema to persist them. We need a `user_badges` table. To prevent client-side forgery, write access is blocked for authenticated users and deferred entirely to the server-side via Supabase `service_role`. Evaluation happens asynchronously via Postgres trigger or Edge Function rather than blindly trusting the client's assertion of a streak.
- **Decision**: Approved by user 2026-07-19.
- **Status**: Pending (Migration written, awaiting manual `supabase db push`)

---

## Deviation #10 — `region` on `profiles`

- **Date**: 2026-07-19 (Phase 6)
- **Migration file**: `20260719184500_phase6_profiles_region.sql`
- **Change**:
  ```sql
  ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS region text;
  ```
- **Why §4 wasn't sufficient**: plan.md §2.1 and §2.7 define an anonymized community misuse heatmap tracking AMR abuse events by region. The initial schema added `region` directly to `misuse_events`, but lacked any user-consented source to draw from. IP geolocation was rejected on privacy grounds. This column allows users to explicitly opt-in to regional tracking by providing a State/Province fallback on their profile.
- **Decision**: Approved by user 2026-07-19.
- **Status**: Pending (Migration written, awaiting manual `supabase db push`)

---

## Deviation #11 — `course_id` on `misuse_events`

- **Date**: 2026-07-19 (Phase 6)
- **Migration file**: `20260719185000_phase6_misuse_trigger.sql`
- **Change**:
  ```sql
  ALTER TABLE public.misuse_events
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.medication_courses(id) ON DELETE CASCADE;

  ALTER TABLE public.misuse_events 
  ADD CONSTRAINT misuse_events_course_event_key UNIQUE (course_id, event_type);
  ```
- **Why §4 wasn't sufficient**: plan.md §4 didn't link `misuse_events` to `medication_courses`. This meant a course flipping between flagged and valid (via admin override or AI re-eval) would create multiple duplicate AMR misuse events for the same underlying course. Linking `course_id` and adding a unique constraint prevents statistical inflation by ensuring each course contributes AT MOST ONE event of a given type.
- **Decision**: Approved by user 2026-07-19.
- **Status**: Pending (Migration written, awaiting manual `supabase db push`)
