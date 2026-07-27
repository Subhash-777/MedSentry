-- =============================================================================
-- MedSentry — Initial Schema Migration
-- plan.md §4 — all 14 tables, RLS enabled, profiles policies
--
-- Schema addition (confirmed in chat, 2026-07-09):
--   drug_interactions.severity_source text ('parsed' | 'unclassified')
--   Allows Phase 3 AI layer to distinguish heuristic-derived severity from
--   confidently-known severity. Rows with no keyword match get severity = NULL
--   and severity_source = 'unclassified' as a worklist for AI re-classification.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------------
create table profiles (
  id               uuid        primary key references auth.users(id) on delete cascade,
  full_name        text,
  age              int,
  weight_kg        numeric,
  height_cm        numeric,
  known_conditions text[],
  allergies        text[],
  preferred_language text      default 'en',
  is_admin         boolean     default false,
  account_type     text        default 'standard'   -- standard / linked_dependent
    check (account_type in ('standard', 'linked_dependent')),
  created_at       timestamptz default now()
);

alter table profiles enable row level security;

-- Users can read their own profile
create policy "profiles: select own"
  on profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile (called on first login)
create policy "profiles: insert own"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. FAMILY GROUPS
-- ---------------------------------------------------------------------------
create table family_groups (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  owner_id    uuid        references profiles(id) on delete set null,
  invite_code text        unique,
  created_at  timestamptz default now()
);

alter table family_groups enable row level security;
-- NOTE: Full RLS policies for family_groups come in Phase 4 alongside
-- the Family Circle feature implementation. The table is locked down
-- (no policies = deny all for standard users) until then.

-- ---------------------------------------------------------------------------
-- 3. FAMILY MEMBERS
-- ---------------------------------------------------------------------------
create table family_members (
  id                  uuid        primary key default gen_random_uuid(),
  group_id            uuid        references family_groups(id) on delete cascade,
  member_id           uuid        references profiles(id) on delete cascade,
  role                text        not null
    check (role in ('owner', 'caregiver', 'viewer')),
  is_linked_dependent boolean     default false,
  joined_at           timestamptz default now()
);

alter table family_members enable row level security;
-- Phase 4: Full policies (three-tier permission + self-sovereignty override)

-- ---------------------------------------------------------------------------
-- 4. DRUGS (seeded from datasets in Phase 2)
-- ---------------------------------------------------------------------------
create table drugs (
  id               uuid  primary key default gen_random_uuid(),
  name             text,
  generic_name     text,
  category         text,
  aware_class      text, -- WHO AWaRe tier: Access / Watch / Reserve / Not recommended
  common_uses      text,
  side_effects     text,
  interaction_notes text
);

alter table drugs enable row level security;

-- Drugs table is read-only reference data — all authenticated users may read it
create policy "drugs: authenticated read"
  on drugs for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 5. DRUG INTERACTIONS (seeded from datasets in Phase 2)
--    Schema addition confirmed: severity_source text
-- ---------------------------------------------------------------------------
create table drug_interactions (
  id              uuid  primary key default gen_random_uuid(),
  drug_a_id       uuid  references drugs(id) on delete cascade,
  drug_b_id       uuid  references drugs(id) on delete cascade,
  severity        text  check (severity in ('mild', 'moderate', 'severe', null)),
  severity_source text  check (severity_source in ('parsed', 'unclassified')),
  description     text
);

alter table drug_interactions enable row level security;

-- Reference data — authenticated users may read interaction data
create policy "drug_interactions: authenticated read"
  on drug_interactions for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 6. PRESCRIPTIONS
-- ---------------------------------------------------------------------------
create table prescriptions (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references profiles(id) on delete cascade,
  raw_ocr_text            text,
  patient_name_extracted  text,
  weight_extracted        numeric,
  height_extracted        numeric,
  conditions_extracted    text[],
  doctor_reg_number       text,
  prescription_date       date,
  scanned_image_url       text,
  created_at              timestamptz default now()
);

alter table prescriptions enable row level security;
-- Phase 2: Full policies (own data + caregiver write for linked dependents)

-- ---------------------------------------------------------------------------
-- 7. MEDICATION COURSES
-- ---------------------------------------------------------------------------
create table medication_courses (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references profiles(id) on delete cascade,
  drug_id          uuid        references drugs(id) on delete set null,
  prescription_id  uuid        references prescriptions(id) on delete set null,
  total_pills      int,
  daily_dose       int,
  start_date       date,
  days_remaining   int,
  is_antibiotic    boolean     default false,
  necessity_flag   text        check (necessity_flag in ('valid', 'flagged_unprescribed', 'flagged_unnecessary', null)),
  status           text        default 'active'
    check (status in ('active', 'completed', 'stopped_early')),
  created_at       timestamptz default now()
);

alter table medication_courses enable row level security;
-- Phase 2: Full policies (own data + caregiver write)

-- ---------------------------------------------------------------------------
-- 8. DOSE LOGS
-- ---------------------------------------------------------------------------
create table dose_logs (
  id             uuid        primary key default gen_random_uuid(),
  course_id      uuid        not null references medication_courses(id) on delete cascade,
  scheduled_time timestamptz,
  status         text        check (status in ('taken', 'skipped', 'snoozed', null)),
  confirmed_by   uuid        references profiles(id) on delete set null,
  logged_at      timestamptz default now()
);

alter table dose_logs enable row level security;
-- Phase 2: Full policies

-- ---------------------------------------------------------------------------
-- 9. MISUSE EVENTS (anonymized — no user_id by design, region-level only)
-- ---------------------------------------------------------------------------
create table misuse_events (
  id            uuid        primary key default gen_random_uuid(),
  region        text,
  drug_category text,
  event_type    text        check (event_type in ('unprescribed_purchase', 'early_stop', 'unnecessary_use', null)),
  created_at    timestamptz default now()
);

alter table misuse_events enable row level security;
-- Public opt-in heatmap (Phase 6): aggregated read-only policy added then.
-- Insert via server-side Edge Function only (never direct client insert).

-- ---------------------------------------------------------------------------
-- 10. AI CONSULTATIONS
-- ---------------------------------------------------------------------------
create table ai_consultations (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references profiles(id) on delete cascade,
  input_text       text,
  input_image_url  text,
  ai_response      text,
  provider_used    text,
  flagged_unsafe   boolean     default false,
  created_at       timestamptz default now()
);

alter table ai_consultations enable row level security;
-- Phase 3: Full policies

-- ---------------------------------------------------------------------------
-- 11. CHATBOT THREADS
-- ---------------------------------------------------------------------------
create table chatbot_threads (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles(id) on delete cascade,
  title      text,
  created_at timestamptz default now()
);

alter table chatbot_threads enable row level security;
-- Phase 3: Full policies

-- ---------------------------------------------------------------------------
-- 12. CHATBOT MESSAGES
-- ---------------------------------------------------------------------------
create table chatbot_messages (
  id            uuid        primary key default gen_random_uuid(),
  thread_id     uuid        not null references chatbot_threads(id) on delete cascade,
  role          text        not null check (role in ('user', 'assistant')),
  content       text,
  provider_used text,
  created_at    timestamptz default now()
);

alter table chatbot_messages enable row level security;
-- Phase 3: Full policies

-- ---------------------------------------------------------------------------
-- 13. API USAGE LOGS (admin-only — readable only via service-role Edge Function)
-- ---------------------------------------------------------------------------
create table api_usage_logs (
  id               uuid        primary key default gen_random_uuid(),
  provider_name    text        not null
    check (provider_name in ('ondevice', 'gemini', 'groq', 'openrouter', 'huggingface')),
  request_type     text        not null
    check (request_type in ('consultant', 'chatbot', 'ocr_assist')),
  user_id          uuid        references profiles(id) on delete set null,
  tokens_estimated int,
  latency_ms       int,
  outcome          text        not null
    check (outcome in ('success', 'rate_limited', 'error', 'timeout')),
  created_at       timestamptz default now()
);

alter table api_usage_logs enable row level security;
-- No standard user policies — admin access exclusively via service-role Edge Function.
-- Phase 3: Edge Function writes logs; Phase 5: Admin Portal reads via service role.

-- ---------------------------------------------------------------------------
-- 14. ADMIN AUDIT LOG (admin-only)
-- ---------------------------------------------------------------------------
create table admin_audit_log (
  id             uuid        primary key default gen_random_uuid(),
  admin_id       uuid        not null references profiles(id) on delete set null,
  action         text        not null,
  target_user_id uuid        references profiles(id) on delete set null,
  details        jsonb,
  created_at     timestamptz default now()
);

alter table admin_audit_log enable row level security;
-- No standard user policies — Phase 5: admin reads via service-role Edge Function.

-- ---------------------------------------------------------------------------
-- 15. CABINET INVENTORY (shared medicine cabinet, Family Circles)
-- ---------------------------------------------------------------------------
create table cabinet_inventory (
  id          uuid        primary key default gen_random_uuid(),
  group_id    uuid        not null references family_groups(id) on delete cascade,
  drug_id     uuid        references drugs(id) on delete set null,
  quantity    int,
  expiry_date date,
  added_by    uuid        references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

alter table cabinet_inventory enable row level security;
-- Phase 4: Full policies (Circle member access based on family_members role)

-- ---------------------------------------------------------------------------
-- 16. SYMPTOM JOURNAL
-- ---------------------------------------------------------------------------
create table symptom_journal (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references profiles(id) on delete cascade,
  symptom          text,
  severity         text,
  status           text        default 'ongoing'
    check (status in ('ongoing', 'resolved')),
  linked_course_id uuid        references medication_courses(id) on delete set null,
  created_at       timestamptz default now()
);

alter table symptom_journal enable row level security;
-- Phase 2/3: Full policies (own data; caregiver read for linked dependents)
