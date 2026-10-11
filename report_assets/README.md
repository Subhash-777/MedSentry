# MedSentry: Project Report Visual Assets & Comprehensive System Analysis

This directory contains the complete set of **44 production-grade visual assets** for the **MedSentry** medication adherence and antimicrobial resistance (AMR) tracking platform. All assets are categorized, verified, and formatted specifically for incorporation into academic dissertations, technical reports, and design documentation.

---

## Directory Overview

```
report_assets/
├── README.md                                # Comprehensive documentation, catalog & report guide
├── app_screenshots/                         # 30 Production App Screenshots (Exact 19:9 Android Aspect Ratio: 1080x2280)
│   ├── 01_onboarding_welcome.png            # Onboarding & Welcome Banner
│   ├── 02_auth_signin.png                   # Authentication - Login Screen
│   ├── 03_auth_signup.png                   # Authentication - Registration Screen
│   ├── 04_auth_email_verification.png       # Email Verification Confirmation
│   ├── 05_home_dashboard_morning.png        # Morning Home Dashboard (100% Adherence)
│   ├── 06_home_dashboard_evening.png        # Evening Home Dashboard (Next Dose Due)
│   ├── 07_ocr_camera_viewfinder.png         # Camera Scanner Strip Viewfinder
│   ├── 08_ocr_clinical_verification.png     # OCR Clinical Verification Screen
│   ├── 09_ocr_medication_table.png          # OCR Medication Extraction Table
│   ├── 10_medicine_detail_access_tier.png   # Medicine Detail: WHO Access Tier
│   ├── 11_medicine_detail_batch_info.png    # Medicine Detail: Batch & Side Effects
│   ├── 12_medications_adherence_list.png    # Active Medications Tracker List
│   ├── 13_medications_multiple_courses.png  # Multiple Concurrent Medication Regimens
│   ├── 14_family_circle_hub.png             # Family Circle Caregiver Hub
│   ├── 15_family_circle_members.png         # Family Circle Member Roster & Invite Code
│   ├── 16_family_cabinet_inventory.png      # Shared Family Medicine Cabinet
│   ├── 17_symptom_journal_overview.png      # Symptom Journal History List
│   ├── 18_symptom_journal_logging_modal.png # Symptom Logging Modal (Severity 1-10)
│   ├── 19_ai_consultant_image_scan.png      # AI Health Consultant Prescription Scanner
│   ├── 20_ai_chatbot_conversation.png       # Conversational AI Medical Guidance
│   ├── 21_profile_settings_sovereignty.png  # User Profile & Data Sovereignty Settings
│   ├── 22_profile_clinical_bmi.png          # Clinical Data & BMI Editor
│   ├── 23_profile_avatar_selector.png       # Clinical Profile Avatar Picker
│   ├── 24_profile_medical_id_card.png       # Verified Emergency Medical ID Pass
│   ├── 25_admin_control_centre.png          # Admin Control Centre Executive Dashboard
│   ├── 26_admin_user_management.png         # Admin User Management Console
│   ├── 27_admin_user_account_modal.png      # Admin User Moderation Modal
│   ├── 28_admin_audit_log_viewer.png        # Immutable Audit Log Viewer
│   ├── 29_admin_api_usage_metrics.png       # API Latency & Dataset Sync Metrics
│   └── 30_admin_amr_heatmap_surveillance.png# Regional AMR Misuse Surveillance Heatmap
├── code_snippets/                           # 10 High-Resolution Carbon-Styled Code Snippets (Dark Theme, Line Numbers)
│   ├── 01_backend_supabase_client.png       # Supabase Client Initialization & Persistence
│   ├── 02_backend_ai_router_edge_function.png # AI Router Edge Function (Gemini & Groq Fallback)
│   ├── 03_backend_ocr_fuzzy_search_rpc.png  # PostgreSQL pg_trgm Fuzzy Search Stored Procedure
│   ├── 04_backend_badge_trigger_engine.png  # Gamification Adherence Badge Trigger Engine
│   ├── 05_backend_amr_differential_privacy_rpc.png # AMR Heatmap Aggregation with k-Anonymity
│   ├── 06_backend_caregiver_rbac_rls.png    # Caregiver RBAC Row Level Security (RLS) Policy
│   ├── 07_backend_admin_api_edge_function.png # Admin Audit Log & System Metrics Edge Function
│   ├── 08_frontend_ocr_spatial_clustering.png # Optical Character Recognition Spatial Clustering
│   ├── 09_frontend_levenshtein_drug_matching.png # Client-Side Levenshtein Distance Matcher
│   └── 10_frontend_proxy_dose_logging.png   # Caregiver Proxy Medication Dose Logging
└── diagrams/                                # 4 Ultra-High Resolution Vector Architectural Diagrams (2400x1350)
    ├── 01_system_architecture_diagram.png   # Multi-Tier Cloud & Edge System Architecture
    ├── 02_application_modules_diagram.png   # Decomposed 9-Module Functional Architecture
    ├── 03_ocr_ai_workflow_pipeline.png      # 5-Stage OCR & Clinical Verification Pipeline
    └── 04_database_er_security_model.png    # Relational Database Schema & RLS Security Matrix
```

---

## Part 1: Application Working Screenshots Catalog

All application screenshots are rendered in **1080 × 2280 px** (exact **19:9 aspect ratio**, standard for modern Android smartphones such as Google Pixel, Samsung Galaxy, and OnePlus). All screens showcase genuine data states, authentic clinical classifications, and active user workflows.

| # | Filename | Resolution | Aspect Ratio | Module / Feature | Recommended Report Figure Caption |
|---|---|---|---|---|---|
| **01** | `01_onboarding_welcome.png` | 1080×2280 | 19:9 | Onboarding & Branding | *Figure 1: MedSentry initial onboarding splash and value proposition screen.* |
| **02** | `02_auth_signin.png` | 1080×2280 | 19:9 | Authentication | *Figure 2: Secure authentication interface utilizing Supabase Auth JWT credentials.* |
| **03** | `03_auth_signup.png` | 1080×2280 | 19:9 | Authentication | *Figure 3: Patient onboarding and account registration with password validation.* |
| **04** | `04_auth_email_verification.png` | 1080×2280 | 19:9 | Authentication | *Figure 4: Email verification dispatch screen confirming cryptographic confirmation token.* |
| **05** | `05_home_dashboard_morning.png` | 1080×2280 | 19:9 | Patient Home Dashboard | *Figure 5: Morning dashboard displaying 100% adherence streak and next scheduled dose (Amoxicillin 500mg).* |
| **06** | `06_home_dashboard_evening.png` | 1080×2280 | 19:9 | Patient Home Dashboard | *Figure 6: Evening dashboard interface highlighting upcoming dose schedule and symptom logger quick action.* |
| **07** | `07_ocr_camera_viewfinder.png` | 1080×2280 | 19:9 | Prescription Scanner | *Figure 7: Real-time camera viewfinder targeting prescription strip and medication packaging.* |
| **08** | `08_ocr_clinical_verification.png` | 1080×2280 | 19:9 | Clinical OCR Engine | *Figure 8: Prescription verification review dialog presenting parsed clinical parameters.* |
| **09** | `09_ocr_medication_table.png` | 1080×2280 | 19:9 | Prescription Scanner | *Figure 9: Structured medication table extracted via spatial clustering and OCR tokenization.* |
| **10** | `10_medicine_detail_access_tier.png` | 1080×2280 | 19:9 | Drug Knowledge Base | *Figure 10: Medicine detail interface displaying WHO AWaRe classification (Access Tier) for Paracetamol.* |
| **11** | `11_medicine_detail_batch_info.png` | 1080×2280 | 19:9 | Drug Knowledge Base | *Figure 11: Pharmaceutical metadata viewer showing batch code, side-effect profile, and food warnings.* |
| **12** | `12_medications_adherence_list.png` | 1080×2280 | 19:9 | Regimen Tracker | *Figure 12: Active medication schedule card interface indicating daily dosage frequency.* |
| **13** | `13_medications_multiple_courses.png` | 1080×2280 | 19:9 | Regimen Tracker | *Figure 13: Multiple concurrent antibiotic and cardiovascular regimens with progress rings.* |
| **14** | `14_family_circle_hub.png` | 1080×2280 | 19:9 | Family Circle | *Figure 14: Family Circle hub illustrating collective adherence and shared caregiver oversight.* |
| **15** | `15_family_circle_members.png` | 1080×2280 | 19:9 | Family Circle | *Figure 15: Family member roster with role-based permissions (Admin, Member) and secure invitation code.* |
| **16** | `16_family_cabinet_inventory.png` | 1080×2280 | 19:9 | Medicine Cabinet | *Figure 16: Shared family medicine inventory indicating remaining pill counts and expiry dates.* |
| **17** | `17_symptom_journal_overview.png` | 1080×2280 | 19:9 | Symptom Journal | *Figure 17: Chronological symptom journal timeline with severity tags and temporal correlation.* |
| **18** | `18_symptom_journal_logging_modal.png` | 1080×2280 | 19:9 | Symptom Journal | *Figure 18: Interactive symptom severity recording modal with 1–10 slider and clinical notes input.* |
| **19** | `19_ai_consultant_image_scan.png` | 1080×2280 | 19:9 | AI Health Consultant | *Figure 19: Multimodal AI consultant intake screen accepting prescription image upload and query.* |
| **20** | `20_ai_chatbot_conversation.png` | 1080×2280 | 19:9 | AI Health Consultant | *Figure 20: Conversational AI interface delivering evidence-based drug interaction advice.* |
| **21** | `21_profile_settings_sovereignty.png` | 1080×2280 | 19:9 | Profile & Security | *Figure 21: Patient profile settings showing emergency contact configuration and GDPR data export.* |
| **22** | `22_profile_clinical_bmi.png` | 1080×2280 | 19:9 | Profile & Clinical Data | *Figure 22: Clinical demographic editor calculating Body Mass Index (BMI) and physiological metrics.* |
| **23** | `23_profile_avatar_selector.png` | 1080×2280 | 19:9 | Profile Customization | *Figure 23: Clinical avatar selection modal enhancing personalization and accessibility.* |
| **24** | `24_profile_medical_id_card.png` | 1080×2280 | 19:9 | Emergency Medical ID | *Figure 24: Digital Emergency Medical ID pass displaying blood group, allergies, and emergency contact.* |
| **25** | `25_admin_control_centre.png` | 1080×2280 | 19:9 | Admin Control Centre | *Figure 25: Executive admin telemetry dashboard monitoring registered users, active doses, and API health.* |
| **26** | `26_admin_user_management.png` | 1080×2280 | 19:9 | Admin Control Centre | *Figure 26: User administration table with granular search, role management, and status filters.* |
| **27** | `27_admin_user_account_modal.png` | 1080×2280 | 19:9 | Admin Control Centre | *Figure 27: Admin modal for user account status modification, role assignment, and session termination.* |
| **28** | `28_admin_audit_log_viewer.png` | 1080×2280 | 19:9 | Security & Compliance | *Figure 28: Immutable audit log viewer recording security, caregiver proxy, and administrative actions.* |
| **29** | `29_admin_api_usage_metrics.png` | 1080×2280 | 19:9 | System Health Monitoring | *Figure 29: AI API usage metrics dashboard detailing Gemini and Groq token consumption and latency.* |
| **30** | `30_admin_amr_heatmap_surveillance.png` | 1080×2280 | 19:9 | AMR Surveillance | *Figure 30: Regional AMR misuse surveillance heatmap aggregated under differential privacy ($k \ge 5$).* |

---

## Part 2: Code Snippets Catalog

All code snippets have been captured with a syntax-highlighted dark theme, macOS-style window decorations, file path headers, and line numbers. They demonstrate the backend-to-database connection patterns, edge function compute layers, and core algorithms.

| # | Filename | Source File | Architectural Role | Report Figure Caption |
|---|---|---|---|---|
| **01** | `01_backend_supabase_client.png` | `mobile-app/src/lib/supabase.ts` | Mobile-to-DB Connection | *Figure 31: Supabase client initialization leveraging AsyncStorage persistence and auto-refreshing JWTs.* |
| **02** | `02_backend_ai_router_edge_function.png` | `supabase/functions/ai-router/index.ts` | Deno Serverless Edge Function | *Figure 32: Dual-LLM routing edge function implementing primary Google Gemini with Groq LLaMA fallback.* |
| **03** | `03_backend_ocr_fuzzy_search_rpc.png` | `supabase/migrations/20261010000001_ocr_fuzzy_search_trgm.sql` | PostgreSQL `pg_trgm` Stored Proc | *Figure 33: Stored procedure `fuzzy_search_medicines` executing trigram similarity matching for drug names.* |
| **04** | `04_backend_badge_trigger_engine.png` | `supabase/migrations/20260719183000_phase6_user_badges.sql` | PostgreSQL Trigger & Function | *Figure 34: Autonomous trigger engine awarding compliance badges upon verified dose logging.* |
| **05** | `05_backend_amr_differential_privacy_rpc.png` | `supabase/migrations/20260723183000_phase6_amr_heatmap_rpc.sql` | Differential Privacy Aggregation | *Figure 35: Privacy-preserving RPC implementing $k$-anonymity ($k \ge 5$) and Gaussian noise addition.* |
| **06** | `06_backend_caregiver_rbac_rls.png` | `supabase/migrations/20260719120000_phase4_family_circles.sql` | Row Level Security (RLS) | *Figure 36: PostgreSQL Row Level Security policy governing caregiver access to dependent logs.* |
| **07** | `07_backend_admin_api_edge_function.png` | `supabase/functions/admin-api/index.ts` | Deno Admin Edge Microservice | *Figure 37: Admin API edge function enforcing service-role validation and immutable audit logging.* |
| **08** | `08_frontend_ocr_spatial_clustering.png` | `mobile-app/src/lib/ocr.ts` | Computer Vision Post-Processing | *Figure 38: Spatial clustering algorithm grouping OCR text blocks into logical prescription lines.* |
| **09** | `09_frontend_levenshtein_drug_matching.png` | `mobile-app/src/lib/ocr.ts` | Client-Side Fuzzy Matching | *Figure 39: Normalized Levenshtein distance matching engine for drug name recognition.* |
| **10** | `10_frontend_proxy_dose_logging.png` | `mobile-app/src/screens/family/MemberProfileScreen.tsx` | Caregiver Delegation UI | *Figure 40: Caregiver proxy medication dose dispatch with optimistic UI update and audit tracking.* |

---

## Part 3: System Architecture & Module Diagrams Catalog

All architectural diagrams are rendered in **2400 × 1350 px** high-definition resolution with high-contrast vector elements and explanatory keys.

| # | Filename | Dimensions | Diagram Type | Core Subsystems Illustrated | Report Figure Caption |
|---|---|---|---|---|---|
| **01** | `01_system_architecture_diagram.png` | 2400×1350 | Multi-Tier Architecture | Mobile Client, Supabase BaaS, Deno Edge Functions, PostgreSQL 15, AI Provider Gateway, WHO Database | *Figure 41: End-to-end multi-tier system architecture diagram of the MedSentry healthcare platform.* |
| **02** | `02_application_modules_diagram.png` | 2400×1350 | Modular Decomposition | Auth & Security, Regimen Tracker, OCR Vision Engine, WHO AWaRe Engine, Family Circle, AI Consultant, Symptom Journal, Admin Telemetry, Audit Logging | *Figure 42: Decomposed application modules architecture showing inter-module event streams and data flows.* |
| **03** | `03_ocr_ai_workflow_pipeline.png` | 2400×1350 | Pipeline Flowchart | Camera Capture, Bounding Box Clustering, Trigram & Levenshtein Matching, WHO Classification, AI Interaction Safety Check | *Figure 43: Five-stage hybrid OCR and clinical verification workflow pipeline.* |
| **04** | `04_database_er_security_model.png` | 2400×1350 | Entity-Relationship & RLS Matrix | Relational Schema (Users, Medicines, Doses, Circles, Logs), Foreign Key Relationships, Row Level Security Policies | *Figure 44: PostgreSQL 15 relational database entity-relationship schema and Row Level Security isolation model.* |

---

## Part 4: Comprehensive Application & Workspace Technical Analysis

### 1. Architectural Philosophy
MedSentry is an enterprise-grade mobile health (mHealth) and public health surveillance platform designed to tackle **patient medication non-adherence** and **Antimicrobial Resistance (AMR)**. The system is architected around the following core tenets:
1. **Patient Data Sovereignty**: All protected health information (PHI) is isolated using PostgreSQL Row Level Security (RLS). Users retain absolute control over export, deletion, and selective caregiver delegation.
2. **Dual-Layer Prescription Recognition**: Combines client-side bounding-box spatial clustering with server-side trigram fuzzy search (`pg_trgm`) over a verified formulary of 10,000+ pharmaceuticals.
3. **Evidence-Based Antimicrobial Stewardship**: Integrates the World Health Organization (WHO) AWaRe classification (**Access**, **Watch**, **Reserve**) to alert patients and physicians against unnecessary broad-spectrum antibiotic consumption.
4. **Differential Privacy in Public Health Telemetry**: Enables municipal health authorities to monitor regional antimicrobial misuse clusters without deanonymizing individual patient locations ($k$-anonymity threshold $k \ge 5$).

---

### 2. Deep Dive: Key Functional Modules

#### Module A: Intelligent Adherence & Regimen Tracker
- **Dose Scheduling**: Manages complex multidose daily regimens with configurable alert windows, morning/afternoon/evening slots, and meal-relative timing (before/after food).
- **Gamification Engine**: Database triggers monitor consecutive 7-day, 14-day, and 30-day compliance streaks, automatically issuing non-fungible milestone badges stored in `user_badges`.
- **Offline Resiliency**: Leverages local cache synchronization with timestamp reconciliation upon reconnection.

#### Module B: Hybrid OCR Vision & Formulary Matching
- **Spatial Bounding Box Clustering**: Parses OCR text tokens into coherent semantic lines based on horizontal proximity ($\Delta X \le 1.5 \times \text{height}$) and vertical overlap ($\Delta Y \le 0.4 \times \text{height}$).
- **Trigram Similarity Search**: Resolves OCR misspellings (e.g., `"Amoxcilin 500mg"` $\to$ `"Amoxicillin 500mg"`) using PostgreSQL `similarity()` thresholds ($\ge 0.35$).
- **Dosage & Unit Extraction**: Regular expression tokenizers detect standardized medical frequencies (`OD`, `BD`, `TDS`, `QDS`, `PRN`) and strengths (`mg`, `mcg`, `ml`, `IU`).

#### Module C: WHO AWaRe Antimicrobial Stewardship
- **Access Tier (Green)**: First- and second-choice antibiotics with low resistance potential (e.g., Amoxicillin). Encourages full course completion to prevent pathogen adaptation.
- **Watch Tier (Amber)**: Higher-potency agents with elevated resistance risks (e.g., Ciprofloxacin). Alerts patient to complete strict regimens and avoid self-medication.
- **Reserve Tier (Red)**: Last-resort antibiotics (e.g., Colistin, Linezolid). Requires clinical consultation warnings and flags potential contraindications.

#### Module D: Family Circle & Caregiver Delegation
- **Role-Based Collaboration**: Supports `Admin`, `Caregiver`, and `Dependent` hierarchies joined via alphanumeric 6-character invitation tokens.
- **Proxy Dose Logging**: Authorized caregivers can record dose administration on behalf of elderly relatives or pediatric dependents.
- **Audit Traceability**: Every proxy action logs both the actor's `user_id` and the dependent's `patient_id` with an explicit reason for regulatory compliance.

#### Module E: Conversational Clinical Decision Support
- **Dual-LLM Edge Routing**: Dispatches clinical queries to Google Gemini 1.5 Flash for high-speed, cost-effective multimodal prescription parsing, falling back to Groq LLaMA 3.3 70B if latency exceeds 2,500ms.
- **Strict Guardrails**: Clinical prompts enforce disclaimers, contraindication screening against current medications, and escalation protocols for severe symptoms.

#### Module F: Administration, Compliance & Public Health Telemetry
- **Telemetry Console**: Real-time metrics tracking database connection health, active session counts, and LLM token expenditure.
- **Immutable Audit Log**: Append-only log recording every administrative credential elevation, role change, and proxy administration.
- **AMR Heatmap**: Aggregates prescription volume by postal district, suppressing any geographic cell with fewer than 5 patients to prevent re-identification attacks.

---

### 3. Database Architecture & Row Level Security

The platform runs on **PostgreSQL 15** managed by **Supabase**. Security is enforced at the database kernel level through Row Level Security:

```sql
-- Example RLS Policy for Active Medications:
CREATE POLICY "Users can only view their own medications or circle dependents"
ON public.medications
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.circle_members cm
    WHERE cm.circle_id IN (
      SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()
    )
    AND cm.user_id = medications.user_id
    AND cm.can_view_medications = true
  )
);
```

---

## Part 5: How to Use These Assets in Your Project Report

1. **Section 3: System Design & Architecture**:
   - Embed `diagrams/01_system_architecture_diagram.png` for top-level structural decomposition.
   - Embed `diagrams/04_database_er_security_model.png` for data persistence and RLS security analysis.
2. **Section 4: Implementation & Algorithms**:
   - Insert `code_snippets/01_backend_supabase_client.png` and `02_backend_ai_router_edge_function.png` to illustrate cloud connectivity and edge compute.
   - Insert `code_snippets/03_backend_ocr_fuzzy_search_rpc.png`, `08_frontend_ocr_spatial_clustering.png`, and `09_frontend_levenshtein_drug_matching.png` along with `diagrams/03_ocr_ai_workflow_pipeline.png` to detail the prescription recognition pipeline.
   - Insert `code_snippets/05_backend_amr_differential_privacy_rpc.png` to highlight the mathematical formulation of differential privacy in the AMR module.
3. **Section 5: Results, Verification & User Interface**:
   - Incorporate pairs of application screenshots (e.g., `05_home_dashboard_morning.png` alongside `06_home_dashboard_evening.png`, or `07_ocr_camera_viewfinder.png` alongside `09_ocr_medication_table.png`) with two-column figures.
   - Showcase administrative and public health surveillance capabilities using `25_admin_control_centre.png` and `30_admin_amr_heatmap_surveillance.png`.
