# MedSentry — AI Family Medication & Antibiotic Resistance Guardian
## Complete Implementation Blueprint v2.0

> This is a full revision of the original blueprint. It keeps every validated idea from v1 (Family
> Circles, deep OCR, adherence tracking, AI Consultant, datasets, animation stack) and adds:
> Family Circle write-permissions, a dual-brain AI layer (Consultant + standalone Chatbot) with a
> multi-provider free-tier fallback chain, a full in-app Admin Portal with API/token usage
> analytics, deeper OCR extraction rules, and a second wave of novel features. App name
> shortlist is at the end.

---

## 1. Project Vision

A mobile-first AI health app (Expo + React Native + Supabase) that closes the loop between
**buying/taking a medicine — especially antibiotics** — and **contributing to antimicrobial
resistance (AMR)**. It scans medicines and prescriptions, checks necessity, tracks adherence,
lets families co-manage each other's medication safely, talks to users through two distinct AI
surfaces (a diagnostic Consultant and a conversational Chatbot), and gives administrators full
visibility into user data and AI cost/usage — all built on free-tier-friendly infrastructure.

**One-line pitch:** *"Scan your medicine, know if you really need it, never miss a dose, and
keep your whole family's medication safe — together, and never alone."*

---

## 2. Full Feature Set

### 2.1 Core AMR Features
1. Antibiotic identification via OCR (strip/prescription scan)
2. Prescription-validity check (flags non-prescribed antibiotic purchase)
3. AI symptom-to-necessity matching ("do you actually need this antibiotic?")
4. Course-adherence tracker (detects early stoppage — the top AMR driver)
5. Anonymized community misuse heatmap for public-health researchers
6. Offline-capable local AI model (Ollama / Gemma-class / LiteRT on-device) as the first fallback
   tier before any cloud API is touched

### 2.2 Family Group Collaboration Module (refined)

The original idea — "family members view each other's medications and can also make changes" —
is restructured into a **permissioned co-management system** so visibility and edit rights are
never accidental.

- **Family Circles**: a user creates a Circle (shared workspace); members join via invite code or
  QR scan. A Circle has one **Owner** and unlimited members.
- **Three Permission Tiers** (assigned per-member, per-Circle, not global):
  - *Viewer* — read-only: medication list, adherence %, next dose time. Cannot edit or confirm doses.
  - *Caregiver* — everything a Viewer sees, plus can add/edit a **dependent's** medications, adjust
    reminder times, mark doses taken on their behalf, and initiate a new prescription scan for them.
    Intended for a parent managing a child, or an adult child managing an elderly parent.
  - *Owner* — full Circle control: invite/remove members, change roles, delete the Circle.
- **Self-Sovereignty Rule**: an adult member can always downgrade anyone's edit access to their
  *own* medications back to Viewer-only, even if that person is the Circle Owner. This prevents
  the family-visibility feature from becoming a surveillance/control risk — a person's own
  medication data is never permanently editable by someone else without their standing consent,
  which can be revoked at any time from Settings.
- **Linked-Dependent Mode**: for genuinely dependent members (minors, or elderly members who
  explicitly opt in during onboarding), a Caregiver can hold full edit rights persistently. This is
  a distinct account type set at Circle-join time, not a silent escalation of a normal adult account.
- **Cross-Alerts**: if a dependent misses 2+ consecutive doses, their Caregiver is notified within
  the app and via push, in addition to the dependent's own reminder chain.
- **Family Antibiotic Overlap Warning**: if two Circle members are on antibiotics simultaneously,
  the app surfaces household-contamination hygiene tips (shared bathroom/kitchen surface notes)
  and flags if it's the *same* infection type spreading household-to-household.
- **Shared Medicine Cabinet Inventory**: an optional Circle-level view of OTC/common medicines
  currently in the house (paracetamol, ORS, antiseptic, etc.) with expiry tracking, so members
  don't unknowingly buy duplicates or use expired stock.
- **Audit Trail**: every edit a Caregiver makes on behalf of another member is logged (who changed
  what, when, from which device) and visible to the affected member — full transparency in
  exchange for the convenience of caregiver access.

### 2.3 Deep OCR Scanning Module

Two scan flows, each with an explicit, exhaustive extraction checklist per your request.

**A) Prescription Scan** — extracts and validates:
- Patient full name → cross-checked against the logged-in profile name (fuzzy match; if it
  doesn't match, the app asks *"This prescription is for [X], not you — add it for a Circle
  member instead?"* rather than silently rejecting it)
- Age / date of birth
- Body weight & height → used for pediatric/elderly/renal dosing-appropriateness flags
- Diagnosed condition / doctor's clinical notes
- Other existing medical conditions mentioned on the document (diabetes, kidney disease,
  pregnancy, cardiac history, allergies)
- Every prescribed medicine, with dosage, frequency, and duration parsed line-by-line
- Doctor's name, registration number, clinic stamp/signature presence (used only as a
  prescription-validity heuristic, never a legal verification)
- Prescription date (used to flag stale/expired prescriptions being reused for repeat purchase)

**B) Medicine Strip / Box / Bottle Scan** — extracts:
- Drug name & composition (active salts)
- Manufacturing & expiry date, with an immediate expiry-safety check
- Batch number (checked against the counterfeit/banned-drug advisory dataset — §5.7)
- Pills/tablets remaining, either via user tap-to-count on a blister-pack overlay or manual entry

**After either scan, the AI pipeline runs this sequence:**
1. Cross-reference the drug against the AWaRe + drug reference database.
2. Explain the medicine in plain language: what it treats, common side effects, and any
   interaction/precaution notes specific to the user's stored + newly-scanned conditions.
3. Ask: *"Add this to your daily medication tracker?"*
4. If yes → creates a tracked course with total pill count, daily dosage frequency, auto-calculated
   **days remaining** (pills ÷ daily dose), and an auto-calculated refill-reminder date.
5. If the scanned item is an antibiotic and no matching valid prescription exists in the user's
   history → flag as `unprescribed_purchase` (feeds §2.1's misuse surveillance, anonymized).

### 2.4 Daily Medication Tracking & Notification Engine
- **Scheduled reminders** at exact per-medicine times (e.g., 8 AM, 2 PM, 9 PM), configurable per
  course, not just per drug.
- **Confirmation loop**: notification actions — *Taken / Snooze 15 min / Skipped* — logged
  instantly to `dose_logs`.
- **Escalation ladder**: unconfirmed after 2 follow-up nudges → notify the linked Caregiver
  (if in a Linked-Dependent Circle) → if still unconfirmed after 24h on a critical medication
  (diabetic/cardiac/antibiotic), escalate to all Circle Owners.
- **Adherence Score**: weekly % per medicine, shown as a ring/progress chart on Home.
- **Antibiotic-specific enforcement**: 2+ "Skipped" marks on an antibiotic course triggers a
  short AMR-education popup on resistance risk from incomplete courses — not just a nag, an
  explanation.
- **Low-stock nudge**: warns 2 days before pills run out, prompting refill or a doctor follow-up —
  prevents both missed doses and impulsive antibiotic re-purchase without a fresh prescription.
- **Smart Timing Suggestions**: if a user repeatedly snoozes a fixed reminder time, the app
  suggests shifting the schedule to match their actual routine (data-driven, opt-in).

### 2.5 AI Health Consultant (image + text, diagnostic-flavored)
A structured, form-guided AI surface for *specific* checks:
- **Image upload**: photograph a symptom (rash, swelling), a medicine strip, or a prescription.
- **Multimodal query**: text + image together, e.g. "I have this rash and mild fever, can I take
  this?" + photo.
- **Response modes**: Medicine-suitability check ("Can I take Paracetamol with my current
  Amoxicillin course?"), Symptom-to-care suggestion with an AWaRe-aware necessity flag, and
  Visual medicine identification for anything not already scanned into the app.
- **Safety guardrails**: refuses pediatric dosage calculation below a safety threshold, overdose
  questions, and self-diagnosis of serious conditions — always routes those to "see a doctor."

### 2.6 NEW: Standalone AI Chatbot (conversational, routine-aware)
Distinct from the Consultant — this is a free-flowing chat companion for ongoing doubts, not a
one-shot diagnostic form.
- Users can ask things like *"I've had a headache for 2 days, similar to last month — should I
  take the same thing again?"* and the bot pulls their **own dose history and symptom journal**
  (§2.8) as context, not just the current message.
- Maintains conversation threads (multi-turn memory within a session, summarized context across
  sessions) so users don't have to re-explain their history every time.
- Cross-references active medication courses automatically before suggesting anything, to avoid
  contradicting a course the user is already on.
- Same safety guardrails as the Consultant; always closes serious-symptom threads with a
  "see a doctor" recommendation rather than a definitive answer.
- **Multi-provider resilience** — detailed in §3.4 — so the chatbot keeps working even if one
  free-tier API is rate-limited or down.

### 2.7 NEW: In-App Admin Portal
A role-gated section of the *same* mobile app (not a separate product) for the project owner /
future clinical admins.
- **Access control**: an `is_admin` flag on `profiles`, checked both client-side (hides the entry
  point) and server-side via Supabase RLS + Edge Function checks (never trust the client flag alone).
- **User Management**: searchable list of all users, their profile details, active medication
  courses, adherence history; ability to edit/correct records, deactivate accounts, or reset a
  Circle in case of abuse.
- **API & Token Usage Dashboard**: per-provider call counts, token consumption, current fallback
  tier in use, error/rate-limit events, and estimated free-tier quota remaining for each connected
  AI service (see §3.4 for the providers tracked).
- **Misuse Heatmap Admin View**: the same anonymized aggregation from §2.1, but with drill-down
  filters (region, drug category, event type, time range) — the researcher-facing version of the
  public opt-in heatmap.
- **Dataset Sync Status**: shows when each seeded dataset (§5) was last refreshed and flags if a
  source dataset has been updated upstream (manual check trigger, since most sources are static
  Kaggle/WHO exports).
- **Audit Log Viewer**: every admin action (edit, deactivate, role change) is itself logged to a
  separate `admin_audit_log` table — admins are accountable too.

### 2.8 Additional Novel Features (second wave)
- **AMR Literacy Score / Gamified badges**: "Responsible Antibiotic User" badge for completed
  courses; opt-in family adherence leaderboard (light gamification, never shaming).
- **Doctor-Verified Prescription QR**: clinics/pharmacies can optionally issue a QR-coded digital
  prescription the app trusts instantly, skipping OCR uncertainty — a future integration hook for
  India's ABDM (Ayushman Bharat Digital Mission) health ID ecosystem.
- **Local Pharmacy Counterfeit/Banned-Drug Check**: cross-reference scanned batch/manufacturer
  against CDSCO banned or counterfeit drug advisories.
- **Multilingual voice explanations**: TTS drug explanations in regional languages (Tamil, Hindi,
  etc.) for low-literacy accessibility.
- **Symptom Journal with Trend Detection**: logs symptoms over time; if a "resolved" viral symptom
  is followed by a new antibiotic request within days, the AI re-questions necessity.
- **Emergency Family Alert**: a serious drug-interaction flag or a missed critical dose
  (diabetic/cardiac) auto-notifies the designated Caregiver immediately, bypassing the normal
  escalation ladder.
- **Interaction Timeline Visualizer**: a simple horizontal timeline showing overlapping courses,
  so a user can see at a glance *why* two medicines are flagged as conflicting.
- **Pharmacy Price/Generic-Alternative Lookup**: once a drug is identified, optionally show its
  generic-equivalent name so users can ask their pharmacist for a cheaper equivalent (informational
  only, no e-commerce).
- **"Explain Like I'm Worried" Mode**: a calmer, plain-language explanation toggle for anxious
  users who find clinical phrasing (side-effect lists, percentages) overwhelming.
- **Offline Mode Indicator**: since the on-device model is the first fallback tier, the app clearly
  shows whether a given AI response came from the offline model or a cloud provider, so users
  understand response-quality tradeoffs during connectivity issues.

---

## 3. System Architecture

### 3.1 Tech Stack
| Layer | Tool |
|---|---|
| Mobile app framework | React Native + Expo (TypeScript/.tsx) |
| IDE | Android Studio (native builds/emulator) |
| Backend & DB | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Push notifications | Expo Notifications + Supabase Edge Functions |
| 3D/visual flourishes | Three.js (onboarding, medicine 3D pill viewer) |
| UI animation | Framer Motion, Motion.dev, anime.js, Theatre.js, Mo.js, PixiJS, KUTE.js |
| Micro-interactions | Lottie files |
| OCR | On-device ML Kit OCR (Android) with Tesseract.js as fallback |
| AI/LLM (tiered) | On-device Gemma/LiteRT → free-tier cloud fallback chain (§3.4) |

### 3.2 High-Level Data Flow
```
[Camera/Gallery] -> [OCR Extraction] -> [Drug/Prescription Parser]
        -> [AWaRe + Drug DB Match] -> [AI Necessity/Interaction Reasoning]
        -> [Supabase: medications, courses, family_members tables]
        -> [Notification Scheduler] -> [Expo Push] -> [Escalation Ladder]
        -> [Anonymized Aggregation] -> [Misuse Heatmap Dashboard] -> [Admin Portal]

[AI Consultant / AI Chatbot] <-> [Multi-Provider Router] <-> [On-device model
        -> Provider A -> Provider B -> Provider C ...] -> [Safety Guardrail Layer]
        -> [Response + Disclaimer] -> [api_usage_logs] -> [Admin Portal Usage Dashboard]
```

### 3.3 AI Provider Fallback Architecture (NEW)
To keep the Consultant and Chatbot always responsive without paid API costs, requests pass
through a **router with an ordered fallback chain**, implemented as a Supabase Edge Function so
API keys never live on-device.

**Recommended ordering (tune based on live rate-limit testing):**
1. **On-device model** (Gemma-class via LiteRT, or a small Ollama-served model if running near a
   home/dev server) — zero API cost, works offline, used first for simple symptom/interaction
   lookups.
2. **Google Gemini free tier** (multimodal — handles both the Consultant's image uploads and the
   Chatbot's text) — primary cloud tier.
3. **Groq free tier** (fast Llama/Gemma-class inference) — secondary cloud tier, especially good
   as a low-latency fallback for the Chatbot's conversational load.
4. **OpenRouter free-tier models** (aggregates several free community-hosted models) — tertiary
   fallback, useful because it itself has internal redundancy across model providers.
5. **Hugging Face Inference API free tier** — final fallback for text-only queries if all above
   are rate-limited.

**Router logic:**
- Each provider call is wrapped with a timeout + retry-once policy before moving to the next tier.
- Every call (success, failure, or rate-limit) is logged to `api_usage_logs` with provider name,
  token estimate, latency, and outcome — this is exactly what powers the Admin Portal's usage
  dashboard (§2.7).
- A per-provider **daily/monthly quota counter** is maintained in Supabase so the router can
  proactively skip a provider that's near its free-tier ceiling instead of waiting for it to fail.
- The safety guardrail layer (refusal rules for overdose/pediatric-dosage/self-diagnosis queries)
  runs identically regardless of which provider answered — guardrails live in the router, not
  duplicated per provider.

### 3.4 Admin Portal Access Model
- Admin routes are a separate navigator stack, only mounted when `profiles.is_admin = true` for
  the session.
- All admin-facing Supabase queries go through Edge Functions that re-verify the admin flag
  server-side using the service role — the app never trusts a client-side flag for data access.
- RLS on every table: users see only their own rows plus rows shared via `family_members`
  (viewer/caregiver roles) — admins bypass RLS only through the dedicated Edge Function path,
  never through the general client.

---

## 4. Supabase Database Schema

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

-- AI Consultant (structured, image-driven) history
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

-- NEW: AI Chatbot (conversational) history
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

-- NEW: API/Provider Usage Logging (powers Admin Portal dashboard)
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

-- NEW: Admin Audit Log
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text,
  target_user_id uuid references profiles(id) null,
  details jsonb,
  created_at timestamptz default now()
);

-- NEW: Shared Medicine Cabinet Inventory
create table cabinet_inventory (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references family_groups(id),
  drug_id uuid references drugs(id),
  quantity int,
  expiry_date date,
  added_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- NEW: Symptom Journal
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

Enable **Row Level Security (RLS)** on every table. Standard users see only their own rows plus
rows shared via `family_members` (viewer/caregiver roles). Admin-only tables
(`api_usage_logs`, `admin_audit_log`) are readable exclusively through service-role Edge
Functions gated on `profiles.is_admin`.

---

## 5. Datasets — Sources, Links & Exact Folder Placement

Use all six original datasets, plus the two additional ones already identified for interaction
checking and essential-medicines benchmarking. Download everything into a top-level `datasets/`
folder **before** running any seeding scripts.

### 5.1 Folder structure to create first
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
├── mobile-app/            (Expo/React Native project)
├── supabase/               (migrations, edge functions)
└── scripts/
    └── seed_datasets.py    (loads CSVs into Supabase tables)
```

### 5.2 WHO AWaRe Classification (antibiotic tiering — ground truth)
- Source: WHO IRIS export — `https://iris.who.int/bitstream/handle/10665/382244/B09489-eng.xlsx?sequence=1`
- Browsable/exportable alternative: `https://aware.essentialmeds.org/list`
- Download the `.xlsx`, convert to CSV, place at `datasets/aware_classification/aware_list.csv`

### 5.3 Antibiotic Dataset (Kaggle)
- Source: `https://www.kaggle.com/datasets/kanchana1990/antibiotic-dataset`
- `kaggle datasets download -d kanchana1990/antibiotic-dataset`
- Unzip into `datasets/antibiotic_overview/`

### 5.4 Comprehensive A-Z Pharmaceutical Drug Database (Kaggle)
- Source: `https://www.kaggle.com/datasets/shayanhusain/comprehensive-a-z-pharmaceutical-drug-database`
- `kaggle datasets download -d shayanhusain/comprehensive-a-z-pharmaceutical-drug-database`
- Unzip into `datasets/pharma_az_db/`

### 5.5 RxHandBD — Handwritten Prescription OCR Dataset (Zenodo)
- Source: `https://zenodo.org/records/18478741`
- Download `RxHandBD.zip` (AI-compatible, pre-split version)
- Extract into `datasets/rxhandbd_ocr/` — should contain `train/`, `test/`, `train_labels.csv`,
  `test_labels.csv`

### 5.6 SympScan — Symptoms to Disease Dataset (Kaggle)
- Source: `https://www.kaggle.com/datasets/behzadhassan/sympscan-symptomps-to-disease`
- `kaggle datasets download -d behzadhassan/sympscan-symptomps-to-disease`
- Unzip into `datasets/sympscan_symptoms/` (contains `symptoms.csv`, `medications.csv`,
  `precautions.csv`)

### 5.7 Hospital Antibiotics Usage (Kaggle) — misuse-pattern seed data
- Source: `https://www.kaggle.com/datasets/minsithu/hospital-antibiotics-usage`
- `kaggle datasets download -d minsithu/hospital-antibiotics-usage`
- Unzip into `datasets/hospital_antibiotic_usage/`

### 5.8 Drug-Drug Interactions Dataset (Kaggle) — powers the interaction-check feature
- Source: `https://www.kaggle.com/datasets/mghobashy/drug-drug-interactions`
- `kaggle datasets download -d mghobashy/drug-drug-interactions`
- Unzip into `datasets/drug_drug_interactions/`
- Directly feeds both the AI Consultant's "can I take X with Y" check and the new
  `drug_interactions` table (§4).

### 5.9 WHO Model List of Essential Medicines (regional benchmarking)
- Source: `https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines/essential-medicines-lists`
- Download the India-specific EML PDF/CSV; place in `datasets/who_eml/`

### 5.10 Suggested additional dataset to evaluate (worth checking during build)
- **DrugBank open data / DDInter** — a broader, more clinically detailed drug-interaction source
  than the Kaggle set above, useful as a secondary cross-check if the Kaggle interactions dataset
  has coverage gaps. Search `DDInter 2.0` (academic open dataset) before committing to it, since
  licensing terms should be re-checked at build time.

### 5.11 Kaggle CLI Setup (one-time)
```bash
pip install kaggle
# Place kaggle.json (API token from kaggle.com/settings) at ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json
```

### 5.12 Seeding Supabase from datasets
Write `scripts/seed_datasets.py` using `supabase-py` or a direct `psycopg2` connection to your
Supabase Postgres connection string. Each CSV in `datasets/` maps to a table: `drugs` (from
AWaRe + Antibiotic + Pharma-AZ, deduplicated by generic name), symptom-mapping tables from
SympScan, `misuse_events` seed rows from Hospital Antibiotics Usage, and `drug_interactions`
from §5.8. Run this script once during Phase 1 setup and re-run whenever a dataset is refreshed.

---

## 6. Mobile App Screen Map

| Screen | Purpose |
|---|---|
| Onboarding (3D pill animation) | Explains AMR crisis in 3 swipes |
| Home Dashboard | Today's doses, adherence ring, quick-scan button |
| Scan (Prescription / Strip) | Camera + gallery upload, OCR result review |
| Medicine Detail | AI explanation, side effects, interaction warnings, "Add to tracker" |
| My Medications | Active courses, days remaining, refill countdown |
| Family Circle | Member list, permission tiers, shared cabinet inventory, caregiver actions |
| AI Consultant | Structured image + text diagnostic-flavored Q&A |
| AI Chatbot | Free-flowing conversational assistant, thread history |
| Symptom Journal | Logged symptoms, trend detection, resolved/ongoing status |
| Insights/Heatmap (public) | Anonymized community misuse trends (opt-in) |
| Admin Portal — Users | Search/edit users, adherence history, deactivate accounts |
| Admin Portal — API Usage | Per-provider calls, tokens, quota remaining, error rates |
| Admin Portal — Audit Log | Every admin action, timestamped |
| Profile & Settings | Conditions, allergies, language, notification intervals, revoke caregiver access |

---

## 7. Animation & Styling Plan
- **Three.js**: rotating 3D pill/capsule model on onboarding and medicine-detail screens.
- **Framer Motion / Motion.dev**: screen transitions, card expand/collapse for medication list.
- **Lottie**: success checkmark on "dose taken," gentle pulse animation for pending reminders.
- **anime.js / KUTE.js**: micro-interactions (button feedback, progress-ring fill).
- **Mo.js**: burst/confetti effect for adherence streak milestones and badges.
- **PixiJS**: lightweight particle background for the Family Circle screen (subtle, not distracting).
- **Theatre.js**: cinematic, timeline-keyframed onboarding sequence — used sparingly.

Keep animations purposeful — reserve heavier effects (Three.js, PixiJS) for onboarding and
milestone moments; keep daily-use screens (Home, Medications, Chatbot) fast and lightweight for
low-end Android devices common in the target user base. The Admin Portal should use minimal
animation — it's a utility surface, not a showcase one.

---

## 8. Implementation Roadmap (Phased)

**Phase 1 — Foundation (Weeks 1–2)**
Expo + Supabase project setup, auth (email/OTP), `profiles` table, basic navigation, dataset
download + `seed_datasets.py` run.

**Phase 2 — Core Scan & Track (Weeks 3–5)**
OCR integration (ML Kit), drug DB seeding, `medication_courses` + `dose_logs`, notification
scheduling via Expo Notifications, low-stock nudges.

**Phase 3 — AI Layer (Weeks 6–8)**
Symptom-necessity model (SympScan-trained or rule+LLM hybrid), AI Consultant (image+text),
standalone AI Chatbot with thread memory, multi-provider fallback router (§3.3), drug-interaction
checks, `api_usage_logs` wiring.

**Phase 4 — Family & Social (Week 9)**
Family Circles, permission tiers, Linked-Dependent mode, shared cabinet inventory, caregiver
escalation logic, RLS policies.

**Phase 5 — Admin Portal (Week 10)**
`is_admin` flag + Edge Function gating, User Management screen, API Usage Dashboard, Audit Log
viewer.

**Phase 6 — Surveillance & Polish (Weeks 11–12)**
Anonymized misuse heatmap (public + admin drill-down), animation/Lottie pass, gamified badges,
final QA on Android Studio, low-end device performance pass.

---

## 9. Novelty Summary (for research/coursework framing)

The unique contribution is the **closed-loop unification** of functions that otherwise exist only
in isolated form: OCR-based drug identification, prescription-validity checking,
symptom-necessity reasoning, adherence enforcement with an escalation ladder, permissioned
family-shared care coordination, crowdsourced misuse surveillance, a dual-surface AI layer
(structured Consultant + conversational Chatbot) with provider-agnostic free-tier resilience, and
a built-in operational Admin Portal with live AI-cost/usage observability. No reviewed existing
app (Remedium, SnapMed, Antibiotic Guardian, AWaRe Portal, AI Prescription Reader) combines more
than one or two of these functions — and none pair family co-management with AI-usage
transparency for the operator.

---

## 10. App / Project Name Shortlist

A few directions, since the app sits at the intersection of *personal medication tracking*,
*family coordination*, and *antimicrobial resistance*:

| Name | Angle | Tagline |
|---|---|---|
| **MedSentry** *(recommended)* | Guardian framing, short, easy to say | "Your family's medication, guarded." |
| **DoseCircle** | Emphasizes the Family Circle mechanic | "Every dose, every family member, in sync." |
| **AmoxiTrack** | Directly antibiotic-flavored, memorable | "Track it. Finish it. Stop resistance." |
| **CourseComplete** | Names the core AMR behavior (finishing courses) | "The app that makes sure you finish what you start." |
| **ResistWatch** | Public-health/surveillance angle | "Watching resistance, one household at a time." |
| **MedKin** | "Medicine" + "Kin" — family-first branding | "Medication, managed together." |
| **PillPath** | Simple, friendly, tracks the "path" of a course | "Follow the path to a finished course." |
| **Sentari** | Invented word (from "Sentry" + care), unique/trademarkable | "Care that never misses a beat." |

**Recommendation:** **MedSentry** — it's short, trademarkable, immediately communicates
"protection," works equally well for the solo-user tracking angle and the family-guardian angle,
and doesn't lock you into antibiotics-only branding if you expand scope later. **DoseCircle** is
the strongest runner-up if you want the Family Circle mechanic to be the headline feature in the
name itself.
