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

---

## Deviation #12 — Temporary `auto_confirm_user` trigger (CREATED & REMOVED)

- **Date**: 2026-08-23 (Created) / 2026-09-01 (Removed)
- **Migration file**: `20260823000002_auto_confirm_users.sql` (Deleted)
- **Change**:
  ```sql
  -- Temporary trigger that set NEW.email_confirmed_at = NOW() on auth.users BEFORE INSERT
  DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
  DROP FUNCTION IF EXISTS public.auto_confirm_user();
  ```
- **Why §4 wasn't sufficient / Root Cause**: Introduced as an unreviewed temporary shortcut on 2026-08-23 during testing when Supabase default SMTP mailer hit free-tier rate limits (3 confirmation emails/hour). It bypassed `auth.signUp()` email confirmation entirely, rendering the Supabase Dashboard "Confirm email" toggle irrelevant.
- **Decision**: Audit Finding #1 (2026-09-01). Per explicit user directive, the trigger and function were completely REMOVED from the DB schema and codebase to enforce strict 100% production auth integrity.
- **Status**: RESOLVED & REMOVED (Executed on Live Database 2026-09-01T18:25:39Z)
- **Live Verification**:
  - `pg_trigger`: 0 rows returned for `on_auth_user_created_auto_confirm` (Verified via `psql`)
  - `pg_proc`: 0 rows returned for `auto_confirm_user()` (Verified via `psql`)
  - `auth.signUp()`: Unconfirmed state verified (`email_confirmed_at: NULL`, `confirmation_sent_at` timestamped `2026-09-01T18:25:59Z`).
  - **SMTP / Resend Domain Status**: Resend is currently using the **`onboarding@resend.dev` sandbox domain** (no custom domain verified). Under Resend sandbox rules, emails are **only delivered to the registered owner inbox (`subhashravichandran7432@gmail.com`)**; non-owner test recipients are blocked by Resend sandbox policy.
- **Tracked Pre-Launch Follow-Up**: Before onboarding external multi-user public signups, a custom sending domain (e.g., `@medsentry.app`) must be added and verified via DNS in Resend to allow unconstrained confirmation email delivery to all recipient addresses.

---

## Deviation #13 — `duration_onset`, `category_location`, `image_url` on `symptom_journal`

- **Date**: 2026-09-07 (Phase 6 Enhancement)
- **Migration file**: `20260907184500_expand_symptom_journal.sql`
- **Change**:
  ```sql
  ALTER TABLE public.symptom_journal
    ADD COLUMN IF NOT EXISTS duration_onset text,
    ADD COLUMN IF NOT EXISTS category_location text,
    ADD COLUMN IF NOT EXISTS image_url text;
  ```
- **Why §4 wasn't sufficient**: plan.md §2.8 specifies rich symptom logging for side-effect correlation against active medication courses. The initial `symptom_journal` schema only had `symptom` and `severity`. Adding `duration_onset`, `category_location`, and `image_url` enables users to record when symptoms started, tag body systems (e.g. skin, stomach, headache), and attach photo evidence (e.g. rash or swelling) for AI analysis.
- **Decision**: Approved by user 2026-09-07.
- **Status**: Applied

---

## Deviation #14 — `pg_trgm` Extension & `fuzzy_search_drug` RPC Function

- **Date**: 2026-10-10 (OCR Resiliency Upgrade)
- **Migration file**: `20261010000001_ocr_fuzzy_search_trgm.sql`
- **Change**:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS idx_drugs_name_trgm ON public.drugs USING gin (name gin_trgm_ops);

  CREATE OR REPLACE FUNCTION public.fuzzy_search_drug(search_terms text[])
  RETURNS TABLE (
    id uuid,
    name text,
    similarity_score real
  )
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    RETURN QUERY
    SELECT 
      d.id, 
      d.name, 
      similarity(d.name, term) AS similarity_score
    FROM public.drugs d
    CROSS JOIN unnest(search_terms) AS term
    WHERE similarity(d.name, term) >= 0.42
    ORDER BY similarity_score DESC
    LIMIT 1;
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.fuzzy_search_drug(text[]) TO authenticated, anon;
  ```
- **Why §4 wasn't sufficient**: Substring `ilike` in `findDrugFromOcrText` fails when on-device OCR makes 1-character errors (e.g., `Paracetam0l` with a zero, or `Amoxlcillin` with an `l` instead of `i`). The `pg_trgm` extension and `fuzzy_search_drug` RPC enable trigram similarity matching directly inside PostgreSQL, matching OCR-scanned medicine strips against `public.drugs` with fault tolerance. Client-side Levenshtein fallback ensures the mobile app functions even before this migration runs.
- **Decision**: Approved by user with explicit token `APPROVED: RUN MIGRATION` (2026-10-10).
- **Status**: Applied (Executed via `supabase db push` on Live Database 2026-10-10; verified with `fuzzy_search_drug` live test returning Amoxicillin for 'Amoxlcillin' typo at 0.6 similarity score).

---

## Deviation #15 — Security Hardening & Rate-Limiting Index

- **Date**: 2026-10-11 (Batch 1 Security Hardening)
- **Migration file**: `20261011000001_security_hardening.sql`
- **Change**:
  ```sql
  -- Pin search_path on caregiver and circle helper functions
  ALTER FUNCTION public.check_caregiver_access(uuid, uuid) SET search_path = public, pg_temp;
  ALTER FUNCTION public.check_caregiver_access_course(uuid, uuid) SET search_path = public, pg_temp;
  ALTER FUNCTION public.check_circle_read_access(uuid, uuid) SET search_path = public, pg_temp;
  ALTER FUNCTION public.check_circle_read_access_course(uuid, uuid) SET search_path = public, pg_temp;

  -- Revoke anon access
  REVOKE EXECUTE ON FUNCTION public.fuzzy_search_drug(text[]) FROM anon;
  REVOKE EXECUTE ON FUNCTION public.get_amr_heatmap() FROM anon;

  -- Cap fuzzy_search_drug query input and drop debug trigger function
  DROP FUNCTION IF EXISTS public.test_trigger_debug();

  -- Add 'prescription_ocr' to api_usage_logs request_type CHECK constraint
  ALTER TABLE public.api_usage_logs
      DROP CONSTRAINT IF EXISTS api_usage_logs_request_type_check;
  ALTER TABLE public.api_usage_logs
      ADD CONSTRAINT api_usage_logs_request_type_check
      CHECK (request_type = ANY (ARRAY['consultant', 'chatbot', 'ocr_assist', 'suitability', 'symptom_to_care', 'visual_id', 'prescription_ocr']));

  -- Index on api_usage_logs for per-user rate limit sliding window
  CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_created ON public.api_usage_logs(user_id, created_at DESC);

  -- Atomic dependent user cleanup RPC for admin-api (service_role only)
  CREATE OR REPLACE FUNCTION public.admin_cleanup_user_data(target_id uuid)
  RETURNS void ...
  SECURITY DEFINER
  SET search_path = public, pg_temp;
  REVOKE EXECUTE ON FUNCTION public.admin_cleanup_user_data(uuid) FROM anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.admin_cleanup_user_data(uuid) TO service_role;
  ```
- **Why §4 wasn't sufficient**:
  - Live security audit identified unpinned `search_path` on 4 `SECURITY DEFINER` functions, creating search_path escalation risk.
  - `fuzzy_search_drug` and `get_amr_heatmap` had granted `EXECUTE` to `anon`, exposing drug queries and epidemiology data to unauthenticated callers.
  - `test_trigger_debug()` was a leftover unreviewed debug function in the public schema.
  - The `prescription_ocr` mode in `ai-router` was causing HTTP 500 crashes because `prescription_ocr` was absent from `api_usage_logs_request_type_check`.
  - Rate limiting (10 req/min, 100 req/day) requires an indexed query on `(user_id, created_at DESC)`.
  - Admin user deletion requires an atomic, idempotent database cleanup transaction (RPC) before Auth user deletion, preventing orphaned rows or broken foreign key constraints if network drops midway.
- **Decision**: Approved by user with token `APPROVED: RUN MIGRATION` (2026-10-11).
- **Status**: Applied (Executed on Live Database 2026-10-11; verified via pg_proc and routine_privileges).

---

## Deviation #16 — Batch 2 Privacy Enforcement (Decision D2)

- **Date**: 2026-10-11 (Batch 2 Privacy Enforcement)
- **Migration file**: `20261011000002_privacy_enforcement.sql`
- **Change**:
  ```sql
  -- Helper function: is_admin() to safely check admin role without RLS recursion
  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public, pg_temp
  AS $$
    SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
  $$;
  GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
  REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, PUBLIC;

  -- Restrict profiles table reads to self, owner/caregivers of shared circle, or admins
  DROP POLICY IF EXISTS "profiles: select circle members" ON public.profiles;
  CREATE POLICY "profiles: select self or caregiver" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() 
    OR check_caregiver_access(id, auth.uid()) 
    OR is_admin()
  );

  -- Restricted view for circle viewers (id, full_name, account_type only)
  CREATE OR REPLACE VIEW public.circle_member_profiles
  WITH (security_invoker = false)
  AS
  SELECT p.id, p.full_name, p.account_type
  FROM public.profiles p
  WHERE p.id = auth.uid() OR check_circle_read_access(p.id, auth.uid()) OR is_admin();

  GRANT SELECT ON public.circle_member_profiles TO authenticated;
  REVOKE SELECT ON public.circle_member_profiles FROM anon, PUBLIC;

  -- Restricted RPC helper for fetching restricted profile of a circle member
  CREATE OR REPLACE FUNCTION public.get_circle_member_profile(target_user_id uuid)
  RETURNS TABLE (id uuid, full_name text, account_type text) ...
  SECURITY DEFINER
  SET search_path = public, pg_temp;

  -- Restrict symptom_journal reads to entry owner, group owner/caregivers, and admins
  DROP POLICY IF EXISTS "symptom_journal: select circle members" ON public.symptom_journal;
  CREATE POLICY "symptom_journal: select self or caregiver" ON public.symptom_journal
  FOR SELECT USING (
    user_id = auth.uid() 
    OR check_caregiver_access(user_id, auth.uid()) 
    OR is_admin()
  );
  ```
- **Why §4 wasn't sufficient**:
  - The previous RLS policy `"profiles: select circle members"` allowed any circle member (including `viewer` roles) to query every column of other members' profiles, leaking sensitive health conditions, allergies, age, and physical metrics.
  - The previous RLS policy `"symptom_journal: select circle members"` allowed any circle member to read all intimate symptom journal entries of another member.
  - Per Decision D2 and plan.md §2.2, viewers must only see: full name, account type, medication list, adherence, and next dose. Full health profile (conditions, allergies, symptoms) is restricted to self, owner, and caregivers.
- **Decision**: Final Decision D2 approved by user.
- **Status**: Applied (Executed on Live Database 2026-10-11; verified via scripts/test_batch2_privacy_suite.py).

---

## Deviation #17 — Medication Knowledge & India-Focused OTC Formulary Layer

- **Date**: 2026-10-12 (Batches B, C, & D Deployment)
- **Migration file**: `20261012000001_medication_knowledge_otc_formulary.sql`
- **Change**:
  ```sql
  -- 1. Enhance public.drugs with clinical, formulary, and provenance columns
  ALTER TABLE public.drugs
    ADD COLUMN IF NOT EXISTS brand_names text[],
    ADD COLUMN IF NOT EXISTS active_ingredients text[],
    ADD COLUMN IF NOT EXISTS strength text,
    ADD COLUMN IF NOT EXISTS dosage_form text,
    ADD COLUMN IF NOT EXISTS route text,
    ADD COLUMN IF NOT EXISTS indications text,
    ADD COLUMN IF NOT EXISTS contraindications text,
    ADD COLUMN IF NOT EXISTS precautions text,
    ADD COLUMN IF NOT EXISTS prescription_status_india text DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS schedule_category_india text DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS status_verification text DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS verification_source text,
    ADD COLUMN IF NOT EXISTS source_url text,
    ADD COLUMN IF NOT EXISTS source_version text,
    ADD COLUMN IF NOT EXISTS verification_date date,
    ADD COLUMN IF NOT EXISTS classification_notes text;

  -- 2. Create authoritative India medication formulary table
  CREATE TABLE IF NOT EXISTS public.medication_formulary_india (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    generic_name text NOT NULL,
    brand_names text[],
    active_ingredients text[] NOT NULL,
    strength text,
    dosage_form text,
    route text,
    prescription_status text NOT NULL CHECK (prescription_status IN ('OTC', 'prescription_only', 'restricted', 'unverified')),
    schedule_category text NOT NULL,
    status_verification text NOT NULL CHECK (status_verification IN ('verified_authoritative', 'provisional_evidence', 'unverified')),
    legal_basis text NOT NULL,
    source_organization text NOT NULL,
    source_url text,
    source_version text,
    verification_date date NOT NULL DEFAULT CURRENT_DATE,
    indications text,
    contraindications text,
    precautions text,
    adverse_effects text,
    max_otc_dose_adult text,
    classification_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  ALTER TABLE public.medication_formulary_india ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "medication_formulary_india: authenticated read"
    ON public.medication_formulary_india FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated'::text);
  ```
- **Why §4 wasn't sufficient**:
  - plan.md §4 only included US/global drug catalogs (`drugs` and `drug_interactions`) without Indian regulatory classifications (CDSCO, Drugs & Cosmetics Rules 1945 Schedules H/H1/K/X, and IPC monographs).
  - To prevent catastrophic medical misinformation (such as recommending systemic antibiotics as OTC under Indian law or failing to cite CDSCO Gazette schedules for household remedies), an authoritative regulatory formulary layer (`medication_formulary_india`) and provenance columns were required.
- **Decision**: Approved and validated under Batches B, C, and D evaluation loops (2026-10-12).
- **Status**: Applied (Executed on Live Database 2026-10-12; verified via `scripts/test_batch_b_knowledge.py` and `scripts/run_batch_c_eval.py`).




