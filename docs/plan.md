# MedSentry — Master Implementation Plan (plan.md)

> This is the single, consolidated ground-truth document for building MedSentry end-to-end.
> It merges the architecture/feature blueprint, the database schema, the dataset sourcing
> instructions, the workspace/Android Studio setup steps, the animation-library compatibility
> decisions, and the UI/UX design system into one file so any tool (Gemini CLI, Claude Code, or
> a human developer) can implement the project from this alone. Treat every section as binding —
> if an implementation detail isn't covered here, flag it rather than inventing scope.

---

## 0. Project Identity

- **Name:** MedSentry
- **One-line pitch:** Scan your medicine, know if you really need it, never miss a dose, and keep
  your whole family's medication safe — together, and never alone.
- **Platform:** Android APK (React Native + Expo, built/run via Android Studio)
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, Realtime)
- **Core problem solved:** closes the loop between buying/taking a medicine — especially
  antibiotics — and contributing to antimicrobial resistance (AMR), while giving families a safe,
  permissioned way to co-manage medication.

---

## 1. Tech Stack (final, compatibility-checked)

| Layer | Tool |
|---|---|
| App framework | React Native + Expo (TypeScript, `.tsx`) |
| IDE | Android Studio (native Gradle project via `expo prebuild`) |
| Backend & DB | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Navigation | `@react-navigation/native` + native-stack |
| Push notifications | `expo-notifications` + Supabase Edge Functions for scheduling logic |
| OCR | `expo-camera` + on-device ML Kit OCR (Android); Tesseract.js only as a last-resort fallback |
| 3D | `three` via `expo-three` + `expo-gl` (pill/capsule viewer) |
| Primary animation engine | `react-native-reanimated` + `moti` (replaces Framer Motion / anime.js / Motion.dev / KUTE.js — see §1.1) |
| Particle / liquid effects | `react-native-skia` (replaces Mo.js / PixiJS — see §1.1) |
| Micro-interactions | `lottie-react-native` |
| State/data | `@supabase/supabase-js`, React context/hooks (no separate global store needed unless complexity grows) |

### 1.1 Animation library compatibility mapping (binding decision — do not deviate)
The originally-referenced web libraries (Framer Motion, Motion.dev, anime.js, KUTE.js, Mo.js,
PixiJS, Theatre.js) are DOM/Canvas-based and do not run natively in React Native. This mapping is
the resolved, final decision for implementation — do not attempt to `npm install` the web-only
versions into the RN app:

| Requested (web) | Native replacement | Used for |
|---|---|---|
| Framer Motion / Motion.dev / anime.js / KUTE.js | `react-native-reanimated` + `moti` | All screen transitions, card animations, button micro-interactions |
| Mo.js / PixiJS | `react-native-skia` | Particle bursts, liquid-blob morphing, milestone confetti |
| Theatre.js | Reanimated sequences, or pre-baked Lottie for cinematic onboarding | Onboarding timeline choreography |
| Three.js | `expo-three` + `expo-gl` (unchanged — works natively) | 3D pill/capsule viewer |
| Lottie | `lottie-react-native` (unchanged — works natively) | Success checkmarks, loading states, empty-state illustrations |

---

## 2. Feature Specification (implementation scope)

### 2.1 Core AMR / Scan Features
- OCR-based antibiotic identification from strip/prescription photos
- Prescription-validity check: flags antibiotic purchases with no matching valid prescription
- AI symptom-to-necessity matching before adding an antibiotic to tracking
- Course-adherence tracker with early-stoppage detection
- Anonymized community misuse heatmap (opt-in, region-level aggregation only)
- On-device AI model as first-tier fallback so basic checks work offline

### 2.2 Family Circle Module (permissioned co-management)
- **Family Circles**: shared workspace, created by an Owner, joined via invite code/QR
- **Three permission tiers per member, per Circle** (not global):
  - `viewer` — read-only: medication list, adherence %, next dose time
  - `caregiver` — can add/edit a dependent's medications, adjust reminders, mark doses taken on
    their behalf, initiate scans for them
  - `owner` — full Circle control: invite/remove members, change roles, delete Circle
- **Self-sovereignty rule**: any adult member can downgrade anyone's edit access to their own
  data back to `viewer`-only at any time, overriding even the Owner — implemented as a
  standing-consent flag the member controls from Settings, checked before any caregiver write.
- **Linked-Dependent mode**: a distinct `account_type = 'linked_dependent'` set at Circle-join
  time (for minors or elderly members who explicitly opt in) — persistent caregiver edit rights,
  not a silent escalation of a normal account.
- **Cross-alerts**: 2+ consecutive missed doses by a dependent notify their Caregiver in-app + push.
- **Family antibiotic overlap warning**: flags simultaneous antibiotic courses within a Circle;
  surfaces hygiene tips and same-infection-spread detection.
- **Shared medicine cabinet inventory**: Circle-level OTC stock list with expiry tracking.
- **Audit trail**: every caregiver edit made on a dependent's behalf is logged and visible to the
  affected member.

### 2.3 Deep OCR Scanning
**Prescription scan extraction fields:** patient full name (fuzzy-matched against logged-in
profile; mismatch triggers an "add for a Circle member?" prompt, never a silent reject), age/DOB,
body weight & height, diagnosed condition/clinical notes, other medical conditions mentioned,
every prescribed medicine with dosage/frequency/duration, doctor name/registration
number/stamp presence (validity heuristic only), prescription date (staleness check).

**Medicine strip/box/bottle scan extraction fields:** drug name & composition, manufacturing &
expiry date (immediate safety check), batch number (cross-check against counterfeit/banned-drug
advisory data), pills remaining (tap-to-count blister overlay or manual entry).

**Post-scan AI pipeline (both flows):**
1. Cross-reference drug against AWaRe + drug reference DB.
2. Plain-language explanation: what it treats, side effects, interaction/precaution notes
   specific to the user's stored + newly scanned conditions.
3. Prompt: "Add this to your daily medication tracker?"
4. On confirm → create tracked course with total pill count, daily dose frequency, computed
   `days_remaining` (pills ÷ daily dose), auto-computed refill-reminder date.
5. If antibiotic + no matching valid prescription → flag `unprescribed_purchase` (feeds anonymized
   misuse aggregation).

### 2.4 Daily Tracking & Notification Engine
- Per-course scheduled reminders at exact configured times
- Notification actions: **Taken / Snooze 15 min / Skipped**, logged instantly to `dose_logs`
- Escalation ladder: 2 unconfirmed nudges → notify linked Caregiver → 24h unconfirmed on a
  critical medication (diabetic/cardiac/antibiotic) → notify all Circle Owners
- Weekly adherence score per medicine (ring/progress chart)
- 2+ "Skipped" marks on an antibiotic → AMR-education popup (explanatory, not just a nag)
- Low-stock nudge 2 days before pills run out
- Smart timing suggestion if a fixed reminder is repeatedly snoozed (opt-in, data-driven)

### 2.5 AI Health Consultant (structured, image+text)
- Image upload (rash, swelling, medicine strip, prescription) + optional text
- Modes: medicine-suitability check, symptom-to-care suggestion with AWaRe-aware necessity flag,
  visual medicine identification
- Safety guardrails: refuses pediatric dosage calculation below safety threshold, overdose
  questions, self-diagnosis of serious conditions — always routes to "see a doctor"

### 2.6 AI Chatbot (conversational, routine-aware)
- Multi-turn threads (`chatbot_threads` / `chatbot_messages`), session memory + cross-session
  summarized context
- Pulls user's own dose history and symptom journal as context automatically
- Cross-references active medication courses before suggesting anything
- Same safety guardrails as the Consultant
- Runs through the same multi-provider fallback router as the Consultant (§3.3)

### 2.7 Admin Portal (in-app, role-gated)
- `profiles.is_admin` flag, verified server-side via Edge Function (never trust client flag alone)
- **User Management**: search/edit users, view courses & adherence history, deactivate accounts
- **API & Token Usage Dashboard**: per-provider call counts, token estimates, current fallback
  tier, error/rate-limit events, estimated free-tier quota remaining
- **Misuse Heatmap Admin View**: drill-down filters (region, drug category, event type, time range)
- **Dataset Sync Status**: last-refreshed timestamp per seeded dataset, manual refresh trigger
- **Audit Log Viewer**: every admin action logged to `admin_audit_log`

### 2.8 Additional Features (second wave)
- AMR literacy score / gamified adherence badges (opt-in family leaderboard, non-shaming)
- Doctor-verified QR prescription (future ABDM integration hook)
- Counterfeit/banned-drug batch check
- Multilingual TTS drug explanations
- Symptom journal with trend detection (resolved-then-recurring pattern re-triggers necessity check)
- Emergency family alert (bypasses normal escalation ladder for critical missed doses/interactions)
- Interaction timeline visualizer
- Generic-alternative name lookup (informational only, no e-commerce)
- "Explain Like I'm Worried" plain-language toggle
- Offline/online AI-source indicator badge

---

## 3. System Architecture

### 3.1 Data Flow
```
[Camera/Gallery] -> [OCR Extraction] -> [Drug/Prescription Parser]
    -> [AWaRe + Drug DB Match] -> [AI Necessity/Interaction Reasoning]
    -> [Supabase: medications, courses, family_members tables]
    -> [Notification Scheduler] -> [Expo Push] -> [Escalation Ladder]
    -> [Anonymized Aggregation] -> [Misuse Heatmap] -> [Admin Portal]

[AI Consultant / AI Chatbot] <-> [Edge Function Multi-Provider Router] <->
    [On-device model -> Gemini -> Groq -> OpenRouter -> Hugging Face]
    -> [Safety Guardrail Layer] -> [Response + Disclaimer]
    -> [api_usage_logs] -> [Admin Portal Usage Dashboard]
```

### 3.2 Security Model
- RLS enabled on every table.
- Standard users: read/write only their own rows, plus rows shared via `family_members`
  according to their assigned role (`viewer`/`caregiver`).
- Admin-only tables (`api_usage_logs`, `admin_audit_log`): readable only through service-role
  Edge Functions gated on `profiles.is_admin`; never exposed to the general client.
- All AI provider API keys stored as Supabase secrets; the mobile client never holds a provider
  key directly — every AI call goes through an Edge Function.

### 3.3 AI Provider Fallback Router (Edge Function)
Ordered fallback chain, each tier wrapped with timeout + one retry before advancing:
1. **On-device model** (Gemma-class via LiteRT / Ollama if available) — offline-capable, zero cost
2. **Google Gemini free tier** — primary cloud tier, multimodal (handles Consultant image uploads)
3. **Groq free tier** — low-latency secondary, good for Chatbot conversational load
4. **OpenRouter free-tier models** — tertiary, internally redundant across community models
5. **Hugging Face Inference API free tier** — final fallback for text-only queries

Implementation requirements:
- Every call logged to `api_usage_logs`: provider name, request type, token estimate, latency,
  outcome (`success` / `rate_limited` / `error` / `timeout`)
- Per-provider daily/monthly quota counters maintained in Supabase so the router can proactively
  skip a near-limit provider instead of waiting for a failure
- Safety guardrail logic lives once in the router, applied identically regardless of which
  provider produced the response

---

## 4. Database Schema (Supabase / Postgres)

```sql
-- Users & Profiles
create table profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  age int,
  weight_kg numeric,
  height_cm numeric,
  known_conditions text[],
  allergies text[],
  preferred_language text default 'en',
  is_admin boolean default false,
  account_type text default 'standard',   -- standard / linked_dependent
  created_at timestamptz default now()
);

-- Family Circles
create table family_groups (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_id uuid references profiles(id),
  invite_code text unique,
  created_at timestamptz default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id),
  member_id uuid references profiles(id),
  role text check (role in ('owner','caregiver','viewer')),
  is_linked_dependent boolean default false,
  joined_at timestamptz default now()
);

-- Drug Reference (seeded from datasets)
create table drugs (
  id uuid primary key default gen_random_uuid(),
  name text,
  generic_name text,
  category text,
  aware_class text,
  common_uses text,
  side_effects text,
  interaction_notes text
);

create table drug_interactions (
  id uuid primary key default gen_random_uuid(),
  drug_a_id uuid references drugs(id),
  drug_b_id uuid references drugs(id),
  severity text,                  -- mild / moderate / severe
  description text
);

-- Scanned Prescriptions
create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  raw_ocr_text text,
  patient_name_extracted text,
  weight_extracted numeric,
  height_extracted numeric,
  conditions_extracted text[],
  doctor_reg_number text,
  prescription_date date,
  scanned_image_url text,
  created_at timestamptz default now()
);

-- Medication Courses
create table medication_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  drug_id uuid references drugs(id),
  prescription_id uuid references prescriptions(id) null,
  total_pills int,
  daily_dose int,
  start_date date,
  days_remaining int,
  is_antibiotic boolean,
  necessity_flag text,             -- valid / flagged_unprescribed / flagged_unnecessary
  status text default 'active',    -- active / completed / stopped_early
  created_at timestamptz default now()
);

-- Daily Dose Logs
create table dose_logs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references medication_courses(id),
  scheduled_time timestamptz,
  status text,                     -- taken / skipped / snoozed
  confirmed_by uuid references profiles(id),
  logged_at timestamptz default now()
);

-- Anonymized Misuse Events (region only, no direct user_id)
create table misuse_events (
  id uuid primary key default gen_random_uuid(),
  region text,
  drug_category text,
  event_type text,                 -- unprescribed_purchase / early_stop / unnecessary_use
  created_at timestamptz default now()
);

-- AI Consultant history
create table ai_consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  input_text text,
  input_image_url text,
  ai_response text,
  provider_used text,
  flagged_unsafe boolean default false,
  created_at timestamptz default now()
);

-- AI Chatbot (conversational) history
create table chatbot_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text,
  created_at timestamptz default now()
);

create table chatbot_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references chatbot_threads(id),
  role text check (role in ('user','assistant')),
  content text,
  provider_used text,
  created_at timestamptz default now()
);

-- API/Provider Usage Logging (powers Admin Portal dashboard)
create table api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  provider_name text,             -- ondevice / gemini / groq / openrouter / huggingface
  request_type text,              -- consultant / chatbot / ocr_assist
  user_id uuid references profiles(id),
  tokens_estimated int,
  latency_ms int,
  outcome text,                   -- success / rate_limited / error / timeout
  created_at timestamptz default now()
);

-- Admin Audit Log
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text,
  target_user_id uuid references profiles(id) null,
  details jsonb,
  created_at timestamptz default now()
);

-- Shared Medicine Cabinet Inventory
create table cabinet_inventory (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id),
  drug_id uuid references drugs(id),
  quantity int,
  expiry_date date,
  added_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Symptom Journal
create table symptom_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  symptom text,
  severity text,
  status text default 'ongoing',   -- ongoing / resolved
  linked_course_id uuid references medication_courses(id) null,
  created_at timestamptz default now()
);
```

Enable RLS on every table before any client wiring. Do not modify this schema during
implementation unless a described feature genuinely cannot be built without a new field — flag
and confirm before altering it.

---

## 5. Datasets — Sources & Folder Placement

Create this structure **before** writing any seed script:
```
project-root/
├── datasets/
│   ├── aware_classification/
│   ├── antibiotic_overview/
│   ├── pharma_az_db/
│   ├── rxhandbd_ocr/
│   ├── sympscan_symptoms/
│   ├── hospital_antibiotic_usage/
│   ├── drug_drug_interactions/
│   └── who_eml/
├── mobile-app/
├── supabase/
└── scripts/
    └── seed_datasets.py
```

| # | Dataset | Source | Placement |
|---|---|---|---|
| 1 | WHO AWaRe Classification | `https://iris.who.int/bitstream/handle/10665/382244/B09489-eng.xlsx?sequence=1` (or `https://aware.essentialmeds.org/list`) | `datasets/aware_classification/aware_list.csv` (convert xlsx→csv) |
| 2 | Antibiotic Dataset | `kaggle datasets download -d kanchana1990/antibiotic-dataset` | `datasets/antibiotic_overview/` |
| 3 | Comprehensive A-Z Pharmaceutical Drug DB | `kaggle datasets download -d shayanhusain/comprehensive-a-z-pharmaceutical-drug-database` | `datasets/pharma_az_db/` |
| 4 | RxHandBD (handwritten prescription OCR) | `https://zenodo.org/records/18478741` | `datasets/rxhandbd_ocr/` (train/, test/, train_labels.csv, test_labels.csv) |
| 5 | SympScan (symptoms→disease) | `kaggle datasets download -d behzadhassan/sympscan-symptomps-to-disease` | `datasets/sympscan_symptoms/` |
| 6 | Hospital Antibiotics Usage | `kaggle datasets download -d minsithu/hospital-antibiotics-usage` | `datasets/hospital_antibiotic_usage/` |
| 7 | Drug-Drug Interactions | `kaggle datasets download -d mghobashy/drug-drug-interactions` | `datasets/drug_drug_interactions/` |
| 8 | WHO Model List of Essential Medicines | `https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines/essential-medicines-lists` | `datasets/who_eml/` |

Kaggle CLI one-time setup:
```bash
pip install kaggle
# place kaggle.json (from kaggle.com/settings) at ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json
```

`scripts/seed_datasets.py` reads each folder and loads it into the matching Supabase table via
`supabase-py` or `psycopg2`: `drugs` (from AWaRe + Antibiotic + Pharma-AZ, deduplicated by
generic name), symptom-mapping tables from SympScan, `misuse_events` seed rows from Hospital
Antibiotics Usage, `drug_interactions` from the Drug-Drug Interactions dataset. Run once during
Phase 1 setup, re-run whenever a dataset source is refreshed.

---

## 6. Workspace & Android Studio Setup (execution order)

1. **Prerequisites**: Node.js LTS (20.x+), JDK 17, Android Studio (SDK Platform 34+,
   Build-Tools, Emulator + system image, Command-line Tools), Watchman (optional), Kaggle CLI,
   Supabase CLI (`npm install -g supabase && supabase login`).
2. **Environment variables**:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin
   ```
3. **Create workspace**:
   ```bash
   mkdir MedSentry && cd MedSentry
   mkdir -p datasets/{aware_classification,antibiotic_overview,pharma_az_db,rxhandbd_ocr,sympscan_symptoms,hospital_antibiotic_usage,drug_drug_interactions,who_eml}
   mkdir -p scripts
   ```
4. **Download all 8 datasets** per §5 into their matching folders, before writing any seed code.
5. **Scaffold the app**:
   ```bash
   npx create-expo-app@latest mobile-app -t expo-template-blank-typescript
   cd mobile-app
   npx expo prebuild -p android
   ```
6. **Open in Android Studio**: Open → `MedSentry/mobile-app/android` → let Gradle sync → accept
   SDK licenses → create a Virtual Device or connect a physical device with USB debugging enabled.
7. **Run**: `npx expo run:android` (switch to this from `expo start`/Expo Go as soon as native
   modules like camera/OCR/notifications are added, since Expo Go doesn't support them).
8. **Supabase backend**:
   ```bash
   cd ../ && mkdir supabase && cd supabase
   supabase init
   supabase link --project-ref <your-project-ref>
   # add migration files under supabase/migrations/ using the schema in §4
   supabase db push
   ```
9. **Environment file** `mobile-app/.env` (add to `.gitignore` immediately):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
10. **Install dependencies**:
    ```bash
    npx expo install expo-camera expo-image-picker expo-notifications expo-secure-store expo-blur
    npm install @supabase/supabase-js
    npm install three expo-three expo-gl
    npm install lottie-react-native
    npm install react-native-reanimated moti
    npm install @shopify/react-native-skia
    npm install @react-navigation/native @react-navigation/native-stack
    ```

---

## 7. Screen Map & UI/UX Implementation

| Screen | Data source (tables) | UI style | Notes |
|---|---|---|---|
| Onboarding | — | Claymorphism illustrations + Reanimated sequence + Three.js pill viewer | Sets emotional tone, explains AMR briefly |
| Home Dashboard | `medication_courses`, `dose_logs` | Bento grid + Skia liquid-fill adherence ring | Glanceability priority #1 |
| Scan (Prescription/Strip) | writes to `prescriptions` / `drugs` | Minimal `expo-blur` overlay on camera view only | Camera preview must stay high-contrast, unobstructed |
| Medicine Detail | `drugs`, `drug_interactions` | Neumorphic primary button + skeuomorphic 3D pill render | One tactile action, trustworthy visualization |
| My Medications | `medication_courses` | Flat high-contrast cards, no heavy effects | Read-often safety screen — clarity over flair |
| Family Circle | `family_groups`, `family_members`, `cabinet_inventory` | Glassmorphism cards over gradient + subtle Skia particle bg | Warm, social, non-cluttered |
| AI Consultant | `ai_consultations` | Glass response cards over image/camera input | Focus stays on uploaded image |
| AI Chatbot | `chatbot_threads`, `chatbot_messages` | Liquid-morph typing indicator (Skia), flat message bubbles | Only the "thinking" state gets flair |
| Symptom Journal | `symptom_journal` | Bento timeline cards | Supports trend-spotting |
| Admin Portal — Users | `profiles`, `medication_courses` | Flat searchable table | Utility screen, minimal animation |
| Admin Portal — API Usage | `api_usage_logs` | Bento grid, one tile per provider | Quota-remaining at a glance |
| Admin Portal — Audit Log | `admin_audit_log` | Flat table, timestamped | Accountability surface |
| Notifications/Reminders | `dose_logs` | Neumorphic Taken/Snooze/Skip buttons | Must feel satisfying to tap one-handed |

**Cross-cutting UX requirements (apply to every screen):**
- Thumb-zone-first placement for primary actions (bottom third of screen)
- Distinct haptic patterns for dose-confirmed / low-stock / AMR-education events
- Edge-to-edge layout respecting Android gesture-nav zones and camera cutouts
- Skeleton loaders (bento-shaped) instead of spinners during OCR/AI-router latency
- Offline/online AI-source badge on every AI-generated response
- Full support for Android system font-scale (never lock text size on medically relevant content)
- Reduced-motion mode: auto-disable Skia/Reanimated flourishes when Android's "Remove
  animations" accessibility setting is on

---

## 8. Implementation Roadmap (phased, sequential)

**Phase 1 — Foundation**
Supabase project + auth (email/OTP), `profiles` table + RLS, base navigation shell, dataset
download + folder placement complete.

**Phase 2 — Core Scan & Track**
ML Kit OCR integration, `scripts/seed_datasets.py` run (populates `drugs`, symptom mappings,
`drug_interactions`, `misuse_events` seed rows), `medication_courses` + `dose_logs` CRUD,
`expo-notifications` scheduling, low-stock nudges.

**Phase 3 — AI Layer**
Symptom-necessity logic, AI Consultant (image+text), AI Chatbot with thread memory, multi-provider
fallback Edge Function router (§3.3), drug-interaction checks, `api_usage_logs` wiring end-to-end.

**Phase 4 — Family & Social**
Family Circles, three-tier permission logic + self-sovereignty override, Linked-Dependent mode,
`cabinet_inventory`, caregiver escalation ladder, full RLS policy set for shared data.

**Phase 5 — Admin Portal**
`is_admin` Edge Function gating, User Management screen, API Usage Dashboard, Audit Log viewer.

**Phase 6 — Surveillance & Polish**
Misuse heatmap (public opt-in + admin drill-down), full animation/Lottie/Skia pass per §7,
gamified badges, low-end Android device performance QA, accessibility pass (font-scale,
reduced-motion, contrast).

---

## 9. Build Execution Notes

- Work through phases sequentially — do not start Phase 3's AI router before Phase 2's course/dose
  data model is stable, since the Chatbot depends on reading real `medication_courses` data.
- Every AI provider call must be logged to `api_usage_logs` from the first Edge Function commit
  onward — retrofitting logging later loses historical usage data the Admin Portal depends on.
- RLS policies should be written and tested alongside each table's introduction (Phase 1/2/4), not
  deferred to a single "security pass" at the end.
- Do not install the web-only animation libraries listed in §1.1 — use the mapped native
  replacements from the start to avoid mid-build rework.
