# MedSentry 🛡️💊
### AI-Powered Smart Antibiotic & Medication Management Platform

MedSentry is a state-of-the-art, mobile-first healthcare platform designed to combat **Antimicrobial Resistance (AMR)**, optimize prescription compliance, and empower families and caregivers with intelligent medication tracking. Built with React Native, Expo, Supabase Cloud PostgreSQL, and multi-model AI routing, MedSentry seamlessly blends clinical safety guardrails, OCR prescription scanning, family circle coordination, and real-time WHO AWaRe antibiotic surveillance.

---

## 🚀 Key Features & Modules

### 1. 📷 Smart OCR Prescription & Pill Strip Scanner
* **Hybrid 2-Tier OCR Engine**: Combines low-latency, on-device text recognition (**Google ML Kit**, maintained as a known build dependency risk) with cloud-scale multimodal vision (**Google Gemini Flash Lite**) for maximum speed and accuracy.
* **2D Spatial Layout Reconstruction**: Gathers bounding coordinates from ML Kit blocks and clusters lines sharing the same horizontal band ($\Delta y \le 65\%$ line height), sorting columns left-to-right. Preserves physical tabular rows so medication names, dosages, frequencies, and durations are never misaligned across table cells.
* **Fuzzy Database Matching & Levenshtein Fallback**:
  * Employs PostgreSQL's native **`pg_trgm`** trigram similarity extension and GIN indexing (`idx_drugs_name_trgm`) via the `fuzzy_search_drug` database function.
  * Supplemented by client-side Levenshtein edit-distance calculations ($\ge 70\%$ similarity threshold) to effortlessly absorb OCR typographical errors (e.g. matching `Amoxlcillin` or `Paracetam0l` to their clean catalog counterparts).
* **Multimodal AI Handwriting Reader**:
  * An automated fallback and user-toggleable **"AI Doctor Handwriting Mode"** routes tricky or cursive prescriptions through the Supabase `ai-router` Edge Function to **Gemini Flash Lite Vision**.
  * Formats clinical prescriptions into structured JSON schemas containing patient demographics, diagnosed conditions, doctor registration details, and medication courses.
* **2D Barcode (GS1 DataMatrix & EAN-13) Auto-Scanner**:
  * Live camera stream automatically detects pharmaceutical **GS1 DataMatrix** 2D codes and standard barcodes.
  * Decodes Application Identifiers: `(01)` GTIN, `(17)` Expiry Date (`YYMMDD`), and `(10)` Batch Number, instantly warning users if a scanned medication has expired.
* **Manual Flash / Torch Lighting Control**:
  * Integrated user-togglable torch (`enableTorch={torchActive}`) with intuitive `Zap` / `ZapOff` icon controls for reliable low-light scanning.
  * Integrated screen blur and navigation lifecycle listeners that automatically extinguish the torch when switching tabs to conserve battery.
* **Dual-Field Candidate Matching**:
  * Enhanced OCR search (`ocr.ts`) to match scanned text across both brand names and generic active ingredient names against the catalog and India formulary.
* **Clinical Verification Screen**: Interactive confirmation screen (`VerifyPrescriptionScreen.tsx`) allowing users to review, edit, and confirm extracted medicine names, doses, frequencies, and instructions prior to adding courses to their adherence tracker.

### 2. 🌍 WHO AWaRe Antibiotic Classification System
* **Stewardship Categorization**: Classifies every antibiotic into **Access**, **Watch**, **Reserve**, or **Not Recommended** tiers based on World Health Organization guidelines.
* **Misuse Heatmap & Risk Scoring**: Automatically flags high-risk antibiotic usage ($K \ge 5$ threshold for unprescribed/overused Watch & Reserve tier drugs) to promote responsible prescribing.

### 3. 🤖 AI Health Consultant & Multi-Model Router (`ai-router`)
* **Multi-Provider AI Routing**: Dynamically routes requests across **Google Gemini** (`gemini-flash-lite-latest`), **Groq Llama 3** (`llama-3.3-70b-versatile`), and **OpenRouter** (`mistralai/mixtral-8x22b-instruct`) via Supabase Edge Functions. Hugging Face is maintained as an architectural stub.
* **Clinical Request Modes**:
  1. `suitability` / `consultant` — Evaluates candidate medicines against active courses, known conditions, and drug interactions, with full multimodal packaging vision.
  2. `symptom_to_care` — Analyzes symptoms, correlates side effects, and outputs AWaRe necessity flags (`necessary`, `not_necessary`, `unclear`).
  3. `visual_id` — Visual pill, blister strip, or packaging identification from captured images.
  4. `prescription_ocr` — Clinical multimodal extraction of complex and cursive handwritten doctor prescriptions.
* **Multimodal Vision Engine & In-Chat Attachment**:
  * Seamlessly passes image payloads (`inline_data` base64) to Google Gemini within multi-turn conversation histories.
  * Explicit visual inspection prompts direct the AI to read packaging details, brand names (e.g. *Daflon 500mg*), active ingredients (*Micronized Purified Flavonoid Fraction*), and strengths directly from photos.
  * In-chat attachment picker (`promptImageSource`) lets users snap photos with the camera or select from the gallery mid-consultation.
* **Post-Inference Catalog Resolution**:
  * Automatically cross-references medicines identified by Gemini against the official Indian CDSCO formulary to attach verified Schedule H/K records, interaction analyses, and source attributions.
* **Deterministic Server-Side Allergy Pre-Check**: Performs a pre-flight string/category match between the user's recorded allergies (`profiles.allergies`) and target drug data (`drugs.name`, `category`, `aware_class`), injecting a high-priority `CRITICAL SAFETY WARNING` before the LLM generates its response.
* **Structured Medical Context Injection**: Injects user demographics (age, weight, height), known conditions, recorded allergies, 7-day adherence trends, and active medication courses into system prompts.
* **3-Tier Clinical Guardrails**:
  1. **Pediatric Dosage Refusal**: Blocks automated pediatric dosing calculations and directs to licensed pediatricians.
  2. **Overdose Refusal**: Refuses fatal/lethal dose queries and provides immediate emergency hotline contact details.
  3. **Severe Self-Diagnosis Refusal**: Prevents AI diagnostic assertions for severe conditions (cancer, stroke, myocardial infarction).
* **Dual Interaction Modes**:
  * **Image Scan Consultant**: Visual pill/strip identification and suitability analysis via camera or gallery photos (`launchCameraAsync`).
  * **AI Conversational Chatbot**: Multi-turn routine-aware health assistant for daily medication advice.

### 4. 🏛️ Indian CDSCO Formulary & Evidence Attribution Engine
* **Authoritative National Formulary (`medication_formulary_india`)**:
  * Sourced from the **Central Drugs Standard Control Organisation (CDSCO)**, **Drugs & Cosmetics Rules 1945**, Schedules H/H1/K/X, and the **Indian Pharmacopoeia Commission (IPC)**.
  * Enforces statutory prescription status (`OTC` vs `prescription_only`), legal bases (e.g. Schedule K Item 23), and verification tiers (`verified_authoritative`, `provisional_evidence`, `unverified`).
* **Strict Antibiotic Invariant**:
  * Under Indian regulatory law and NAP-AMR, enforces that **all systemic antibiotics are strictly Prescription-Only (Schedule H/H1)** and can never be claimed as OTC.
* **Redesigned Source Attribution Cards (`SourceAttributionCard.tsx`)**:
  * Responsive single-column vertical stacked card design eliminating awkward syllable line-wrapping.
  * Displays full medicine names, active ingredients, authoritative verification badges, statutory schedules, and sanitized external reference URLs.
* **AST-Based Medical Markdown Renderer (`SafeMarkdown.tsx`)**:
  * Custom token-aware AST parser rendering structured clinical notes, bulleted lists, and statutory warnings cleanly without raw markup artifacts.

### 5. 👨‍👩‍👧‍👦 Family Circles & Privacy-Enforced RBAC
* **Shared Family Circles**: Create or join family groups via secure 6-character text invite codes (e.g. `RAMIREZ2026`). No QR joining.
* **Strict Privacy Enforcement (Decision D2 & D3)**:
  * `VIEWER`: Read-only access to member full name, account type, active medication list, adherence %, and next dose time. Clinical physical metrics (age, weight, height), known medical conditions, allergies, and symptom journal entries are completely hidden and enforced by database Row Level Security.
  * `CAREGIVER` & `OWNER`: Full visibility of health profiles and symptom journals for shared circle members.
  * **Zero Emergency Contact Sharing**: Emergency contact details are never shared across circle members.
* **Standing Caregiver Consent Management**: Empowers adult members to toggle caregiver edit permissions on/off (`caregiver_consent_revoked`) at any time for complete privacy sovereignty.
* **Caregiver Audit Trail**: Automatically logs every edit or dose logged by a caregiver on a dependent's behalf into `public.caregiver_audit_log`.
* **Medicine Cabinet Inventory**: Shared OTC inventory tracker with 30-day near-expiry warnings and stock management.

### 6. 🩺 Caregiver Dependent Profile Access
* **Interactive Member Cards**: Caregivers and circle members can tap any member card in `FamilyCircleScreen` to view their detailed profile (`MemberProfileScreen.tsx`).
* **Role-Gated Medical Profile**: Displays age, weight, height, known medical conditions, and drug allergies to Owner and Caregiver roles only. Displays a privacy protection notice to Viewers.
* **Dependent Course Overview**: Renders active medication courses, AWaRe badges, dosage schedules, and days-remaining progress bars to all circle members.
* **Proxy Dose Logging**: Enables authorized caregivers to tap **"Log Dose for Member"** directly from the profile view to record adherence on their dependent's behalf. Viewers have read-only access.

### 7. 📔 Symptom Journal & Side-Effect Correlation
* **Rich Symptom Logging**: Record symptoms with 1–10 severity ratings, onset duration (`Just started`, `< 24h`, `1-3 days`, `4-7 days`, `> 1 week`), body system category tags (`Head & Brain`, `Stomach & Digestive`, `Skin & Rash`, `Respiratory`, `Muscle & Joint`, `General / Other`), and visual symptom photo attachments.
* **Medication Linking**: Links symptoms directly to active medication courses (`linked_course_id`) for side-effect correlation.
* **Status Toggles**: Easily toggle entries between `ongoing` and `resolved`.

### 8. 🔍 Direct Medicine Search & Custom Catalog Fallback
* **Typeahead Catalog Search**: Instant search querying 752 catalog drugs in `public.drugs`.
* **"Scan Instead" Secondary Path**: Prominent option navigating directly to OCR scanner.
* **Unmatched Custom Drug Fallback**: Option `"Can't find 'X'? Add as custom medication"` allows tracking 100% of unlisted drugs.
* **Analytics Demand Logging**: Logs unmatched drug searches into `public.api_usage_logs` (`provider_name = 'missing_drug_search'`) to track catalog expansion demand.

### 9. 🎮 Gamified Adherence & Automated Badges
* **Adherence Streak Tracking**: Automatically evaluates dose logging frequency via PostgreSQL database triggers (`trg_evaluate_badges` on `public.user_badges`).
* **Unlocked Badges**: Awards badges such as `first_dose_logged` and `7_day_streak`.

### 10. 📊 Admin Portal & Regional AMR Surveillance
* **Executive Dashboard**: System metrics on active users, antibiotic compliance rates, API usage logs, and dataset refresh status (`dataset_sync_log`).
* **Atomic Account Deletion**: Secure GoTrue Admin API integration ensuring clean multi-table user deletion.
* **Community Misuse Heatmap**: Opt-in anonymized state/province regional tracking (`profiles.region`).

---

## 📊 Datasets Used & Clinical Sources

1. **WHO AWaRe Classification Dataset (2023)**:
   * 750+ essential medicines categorized into **Access**, **Watch**, **Reserve**, and **Not Recommended** antibiotic tiers.
   * Embedded into `public.drugs.aware_class`.
2. **CDSCO National Formulary & Drugs & Cosmetics Rules 1945**:
   * Official Indian statutory classification covering Schedules H, H1, K, and X.
   * Authoritative regulatory basis and verification sources stored in `public.medication_formulary_india` and `public.drugs`.
   * Enforces zero-antibiotic OTC exemptions and includes recent essential formulations (e.g. Daflon 500mg flavonoid fraction).
3. **FDA & DailyMed Reference Drug Database**:
   * Drug formulations, common clinical uses, side effects, and warning notes stored in `public.drugs`.
   * Drug-drug interaction pairs and severity descriptions stored in `public.drug_interactions`.
4. **Synthetic Clinical Safety Evaluation Dataset (Batch C)**:
   * 44 synthetic evaluation scenarios across 14 safety domains stored in `tests/evaluation/batch_c_eval_dataset.json`.
   * Verifies brand-generic resolution, dosage-form safety, emergency refusals, and statutory attribution.
5. **Regional Opt-In Surveillance Data**:
   * Anonymized State/Province region strings stored in `public.profiles.region` powering the regional AMR misuse heatmap without compromising user privacy.

---

## 🧪 Comprehensive Evaluation & Regression Loop

MedSentry includes an end-to-end evaluation and verification infrastructure running against the live Supabase backend and local Edge Function logic:

| Suite | Scope | Cases / Tests | Status |
| :--- | :--- | :--- | :--- |
| **Batch A** | Medication Context & Dose History | 5 tests | **PASSED (100%)** |
| **Batch A2** | UI Layout, Spacing & SafeMarkdown | 5 tests | **PASSED (100%)** |
| **Batch B** | Indian Formulary & Antibiotic Invariants | 10 tests | **PASSED (100%)** |
| **Batch C** | Clinical Safety & Evaluation Loop | 44 scenarios across 14 domains | **PASSED (100%)** |
| **Batch C Gates** | Automated Safety Regression Gates | 7 gate invariants | **PASSED (100%)** |
| **Batch D3** | Runtime Security, JWT & RLS Isolation | 10 security tests | **PASSED (100%)** |
| **Batch D4** | Source Attribution & URL Sanitization | 6 UI tests | **PASSED (100%)** |
| **Live Vision** | Multimodal Image Consultation (Daflon 500mg) | Edge Function & Gemini Vision | **PASSED (100%)** |

Run full regression loop:
```bash
python3 scripts/run_batch_c_eval.py --all
python3 scripts/test_batch_d_ui_sources.py
```

---

## 🛠️ Technology Stack

### Frontend & Mobile Application
* **Framework**: React Native with Expo SDK (EAS CLI & EAS Build)
* **Language**: TypeScript (Strict Mode)
* **Navigation**: React Navigation v7 (Native Stack + Material Top Tabs)
* **Styling**: Organic & Balanced Design System (`mobile-app/src/theme/colors.ts`) with custom glassmorphism effects and WCAG AA accessible contrast tokens.
* **Animations**: React Native Reanimated v4 (Smooth micro-animations & layout transitions)
* **Icons**: Custom vector icons powered by `lucide-react-native`
* **On-Device OCR**: Google ML Kit (`react-native-mlkit-ocr`) with 2D spatial Y/X coordinate line clustering (documented as a known build dependency risk).
* **Camera & Hardware Scanning**: `expo-camera` with live GS1 DataMatrix (2D), QR, and EAN-13 barcode parsing, and `expo-image-picker` for gallery uploads.

### Backend & Database Infrastructure
* **Database**: Supabase Cloud PostgreSQL 15
* **Fuzzy Search & Indexing**: PostgreSQL **`pg_trgm`** extension with GIN trigram indexing (`idx_drugs_name_trgm`) and `public.fuzzy_search_drug` RPC function.
* **Security & RLS**: 100% Row Level Security (RLS) enforcement with `SECURITY DEFINER` PostgreSQL functions (`check_caregiver_access`, `check_circle_read_access`, `is_admin()`).
* **Database Triggers**: Automated badge unlock triggers (`trg_evaluate_badges`) and AMR misuse event tracking (`trg_track_misuse`).
* **Serverless Edge Functions**: Deno / TypeScript Edge Functions:
  * `ai-router`: Multi-model AI request handler with JWT validation, per-user sliding-window rate limiting, input size limits, guardrails, and fallback chain.
  * `admin-api`: Privileged service-role administrative portal operations with self-action protection and atomic database cleanup.

### AI APIs & LLM Providers
* **Google Gemini API**: `gemini-flash-lite-latest` (Multimodal vision analysis, doctor prescription handwriting extraction, and fast inference)
* **Groq API**: `llama-3.3-70b-versatile` (High-speed conversational chatbot)
* **OpenRouter API**: `mistralai/mixtral-8x22b-instruct` (High-accuracy clinical fallback)
* **Hugging Face Inference API**: Clinical fallback model tier

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Mobile App - React Native / Expo] -->|JWT Auth & RLS Queries| B[Supabase Cloud PostgreSQL]
    A -->|invokeAIRouter: prescription_ocr| C[Edge Function: ai-router]
    A -->|invokeAdminApi| D[Edge Function: admin-api]

    C -->|Fetch Profile & Allergies| B
    C -->|Deterministic Pre-Check| E{Allergy Match?}
    E -->|Yes| F[Inject CRITICAL WARNING Head]
    E -->|No| G[Inject Profile Context]
    
    F --> H[LLM Provider Chain: Gemini / Groq / OpenRouter / HuggingFace]
    G --> H
    H -->|Structured Response / JSON| C
    C -->|Log API Metrics| B
    C -->|Return Result| A

    B -->|PostgreSQL Triggers| I[user_badges & misuse_events]
```

---

## 🗄️ Database Schema Summary

| Table / Object | Description |
| :--- | :--- |
| `profiles` | User demographics (`age`, `weight_kg`, `height_cm`), `known_conditions`, `allergies`, `caregiver_consent_revoked`, `region`, and `is_admin`. |
| `medication_courses` | Tracked prescriptions (`drug_id`, `custom_name`, `dosage_amount`, `frequency`, `instructions`, `total_pills`, `daily_dose`, `days_remaining`, `necessity_flag`, `expiry_date`, `batch_number`). |
| `dose_logs` | Adherence logging (`course_id`, `taken_at`, `status`). |
| `symptom_journal` | Symptom entries (`symptom`, `severity`, `status`, `linked_course_id`, `category_location`, `duration_onset`, `image_url`). |
| `drugs` | Catalog reference table (752 rows) containing `name`, `category`, `aware_class`, `common_uses`, `side_effects`. Indexed with GIN Trigram (`idx_drugs_name_trgm`). |
| `fuzzy_search_drug(text[])` | Stored RPC function for fault-tolerant fuzzy OCR candidate matching. |
| `drug_interactions` | Pairwise interaction data (`drug_a_id`, `drug_b_id`, `severity`, `description`). |
| `family_groups` | Family circles with unique 6-character `invite_code` and `owner_id`. |
| `family_members` | Circle membership mapping (`group_id`, `member_id`, `role`, `is_linked_dependent`). |
| `cabinet_inventory` | Shared OTC medicine cabinet items (`drug_id`, `quantity`, `expiry_date`). |
| `caregiver_audit_log` | Audit logs of edits/actions made by caregivers on dependents' behalf (`caregiver_id`, `target_member_id`, `action`, `details`). |
| `user_badges` | Gamified adherence badges awarded to users (`badge_type`, `unlocked_at`). |
| `misuse_events` | Anonymized AMR misuse tracking events (`course_id`, `event_type`, `aware_tier`, `region`). |
| `api_usage_logs` | AI & search demand usage analytics (`provider_name`, `request_type`, `outcome`, `latency_ms`). |
| `dataset_sync_log` | Refresh logs for backend datasets (`dataset_name`, `status`, `details`). |

---

## 📱 Expo EAS Build & Mobile Distribution

The mobile application has been configured for building and uploading via **Expo Application Services (EAS CLI & EAS Build)**.

### Rebuilding & Uploading to EAS

1. **Install Expo & EAS CLI**:
   ```bash
   npm install -g eas-cli expo-cli
   ```

2. **Navigate to Mobile App Directory**:
   ```bash
   cd mobile-app
   ```

3. **Configure / Login to EAS**:
   ```bash
   eas login
   eas project:init
   ```

4. **Build Android Package (`.apk` or `.aab`)**:
   ```bash
   # Build preview APK for testing on physical devices
   eas build --platform android --profile preview

   # Build production AAB for Google Play Store upload
   eas build --platform android --profile production
   ```

5. **Build iOS Application (`.ipa`)**:
   ```bash
   eas build --platform ios --profile production
   ```

6. **Submit / Upload to App Stores**:
   ```bash
   eas submit --platform android
   ```

---

## 💻 Local Setup & Installation

### Prerequisites
* Node.js v18+
* Expo CLI & React Native environment
* Supabase CLI (`npx supabase`)
* Python 3.10+ (for database verification scripts)

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Subhash-777/MedSentry.git
   cd MedSentry
   ```

2. **Install Mobile Dependencies**:
   ```bash
   cd mobile-app
   npm install
   ```

3. **Environment Setup**:
   Copy the client environment template in `mobile-app/`:
   ```bash
   cp mobile-app/.env.example mobile-app/.env
   ```
   Fill in your public client keys:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id
   ```

4. **Set Edge Function Secrets (Supabase CLI)**:
   AI provider keys are managed entirely server-side on Supabase Edge Functions:
   ```bash
   npx supabase secrets set \
     GEMINI_API_KEY="your-gemini-key" \
     GROQ_API_KEY="your-groq-key" \
     OPENROUTER_API_KEY="your-openrouter-key" \
     HF_API_TOKEN="your-hf-token"
   ```

5. **Deploy Supabase Edge Functions**:
   ```bash
   npx supabase functions deploy ai-router --project-ref your-project-ref
   npx supabase functions deploy admin-api --project-ref your-project-ref
   ```

6. **Start Mobile Development Server**:
   ```bash
   cd mobile-app
   npx expo start
   ```

---

## 🛡️ Credential Hygiene & Security Notice

* All live secrets (API keys, Supabase Service Role keys, database connection strings) are strictly stored in environment variables (`.env`) and Supabase Edge Function Secrets.
* Demo review credentials are documented separately in `docs/DEMO_CREDENTIALS.md`, which is strictly ignored by `.gitignore`. Zero real-world credential reuse is permitted.

---

## 📜 License & Governance

MedSentry is developed as a healthcare technology platform targeting Antimicrobial Resistance mitigation. Designed for patient safety, clinical compliance, and public health surveillance.
