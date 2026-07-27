# MedSentry — Workspace Setup, Gemini CLI Build Prompt & UI/UX Design Guide

> Companion document to `Antibiotic_Medication_Tracker_Blueprint_V2.md`. That blueprint is the
> **ground truth** for architecture, schema, features, and datasets. This document covers the
> three things you asked for next: (1) exact Android Studio + workspace setup steps, (2) a
> ready-to-paste Gemini CLI initialization prompt that builds from the blueprint, and (3) a deep
> dive on mobile UI/UX styles (glassmorphism, neumorphism, liquid morphism, bento box, etc.)
> mapped to specific MedSentry screens.

---

## 1. Step-by-Step Workspace Setup (Android Studio + Expo + Supabase)

### 1.1 Install prerequisites
1. **Node.js LTS** (20.x or later) — verify with `node -v`.
2. **JDK 17** — Android Gradle builds require this exact major version; verify with `java -version`.
3. **Android Studio** (latest stable) — during setup, use the SDK Manager to install:
   - Android SDK Platform 34 (or latest stable)
   - Android SDK Build-Tools
   - Android Emulator + at least one system image (arm64/x86_64 depending on your machine)
   - Android SDK Command-line Tools
4. **Environment variables** (add to `~/.bashrc`/`~/.zshrc` on Linux/Mac or System Environment
   Variables on Windows):
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```
5. **Watchman** (Mac/Linux only, improves Metro bundler file-watching performance) — optional but
   recommended.
6. **Kaggle CLI** for dataset downloads:
   ```bash
   pip install kaggle
   # place kaggle.json (from kaggle.com/settings -> API -> Create New Token) at ~/.kaggle/kaggle.json
   chmod 600 ~/.kaggle/kaggle.json
   ```
7. **Supabase CLI**:
   ```bash
   npm install -g supabase
   supabase login
   ```

### 1.2 Create the workspace exactly per Blueprint V2 §5.1
```bash
mkdir MedSentry && cd MedSentry
mkdir -p datasets/{aware_classification,antibiotic_overview,pharma_az_db,rxhandbd_ocr,sympscan_symptoms,hospital_antibiotic_usage,drug_drug_interactions,who_eml}
mkdir -p scripts
```
This gives you the exact `project-root/` layout the blueprint specifies before any app code exists.

### 1.3 Download and place the datasets
Follow Blueprint V2 §5.2–5.9 exactly — download each dataset from its listed source and place it
in the matching subfolder. Example for one:
```bash
kaggle datasets download -d kanchana1990/antibiotic-dataset -p datasets/antibiotic_overview --unzip
```
Repeat for each Kaggle dataset. For the WHO AWaRe `.xlsx` and the RxHandBD Zenodo `.zip`, download
manually via browser (they're not on Kaggle) and place them per the blueprint's folder mapping.
Do this **before** writing any seed script, so the script has real files to read.

### 1.4 Scaffold the Expo (mobile-app) project
```bash
npx create-expo-app@latest mobile-app -t expo-template-blank-typescript
cd mobile-app
```

### 1.5 Generate the native Android project for Android Studio
Expo apps run fine in Expo Go for early development, but since you specifically want Android
Studio as your IDE, generate the native project:
```bash
npx expo prebuild -p android
```
This creates an `android/` folder with a real Gradle project.

### 1.6 Open in Android Studio
1. Open Android Studio → **Open** → select `MedSentry/mobile-app/android`.
2. Let Gradle sync fully (first sync can take several minutes).
3. If prompted, accept SDK license agreements and install any missing SDK components it flags.
4. Create a Virtual Device (**Device Manager → Create Device**) or connect a physical Android
   phone with USB debugging enabled (Settings → About Phone → tap Build Number 7x → enable
   Developer Options → enable USB Debugging).

### 1.7 Run the app
From `mobile-app/`:
```bash
npx expo run:android
```
This builds the native app and launches it on your emulator/device with Metro bundler attached
for hot reload. For day-to-day UI work you can also use `npx expo start` and open in Expo Go, but
switch back to `run:android` whenever you add a native module (camera/OCR/notifications) that
Expo Go doesn't support.

### 1.8 Set up the Supabase backend
```bash
cd ../
mkdir supabase && cd supabase
supabase init
supabase link --project-ref <your-project-ref>
```
Create your migration files under `supabase/migrations/` using the exact schema from Blueprint V2
§4, then:
```bash
supabase db push
```

### 1.9 Environment variables
In `mobile-app/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```
Never commit `.env` — add it to `.gitignore` immediately.

### 1.10 Install core dependencies
```bash
npx expo install expo-camera expo-image-picker expo-notifications expo-secure-store
npm install @supabase/supabase-js
npm install three expo-three expo-gl
npm install lottie-react-native
npm install react-native-reanimated moti
npm install @react-navigation/native @react-navigation/native-stack
```

### 1.11 ⚠️ Important library-compatibility notes
Your requested animation stack (Three.js, anime.js, Theatre.js, Motion.dev, Framer Motion, Mo.js,
PixiJS, KUTE.js, Lottie) was written **for the web (DOM/SVG/Canvas)**. In a React Native/Expo app
there's no DOM, so several of these don't run as-is. Here's the accurate mapping so you don't hit
a wall mid-build:

| Web library you listed | Works natively in Expo/RN? | What to actually use |
|---|---|---|
| Three.js | Yes, via `expo-three` + `expo-gl` | Same mental model, RN-adapted bindings |
| Lottie | Yes, directly | `lottie-react-native` |
| Framer Motion | No (DOM-only) | **Moti** — built on Reanimated, same declarative animation API/feel |
| Motion.dev | No (DOM-only) | Moti or `react-native-reanimated` directly |
| anime.js | No (DOM-only) | `react-native-reanimated` timing/spring animations |
| KUTE.js | No (DOM-only) | `react-native-reanimated` |
| Mo.js | No (Canvas/DOM) | `react-native-skia` for particle/burst effects, or a Lottie burst asset |
| PixiJS | Partial — works inside a `WebView`, not natively | `react-native-skia` for native performant 2D graphics, or embed a PixiJS scene in a WebView for the Family Circle background only |
| Theatre.js | No (DOM-only) | `react-native-reanimated` sequences, or Lottie for pre-authored cinematic timelines |

**Practical recommendation:** standardize on **Reanimated + Moti** as your primary animation
engine (covers 90% of what Framer Motion/anime.js/KUTE.js were doing), **Skia** for
particle/burst/liquid effects (covers Mo.js/PixiJS intent), **Three.js via expo-three** for the
3D pill viewer, and **Lottie** for pre-baked micro-interactions. This gets you the same *visual
outcomes* described in the blueprint without fighting library incompatibilities.

---

## 2. Gemini CLI Initialization Prompt

Install and authenticate Gemini CLI first, then run it from your `MedSentry/` project root (so it
has file-system access to the blueprint and the datasets folder). Paste the prompt below as your
first message.

```
gemini
```

**Paste this as the initialization prompt:**

```
You are building "MedSentry" — a mobile-first AI family medication and antibiotic-resistance
tracker app (React Native + Expo + TypeScript, Supabase backend, Android Studio as the target IDE).

GROUND TRUTH RULE (read this first, follow it for the entire project):
The file `Antibiotic_Medication_Tracker_Blueprint_V2.md` in this project root is the single
source of truth for architecture, database schema, feature scope, folder structure, dataset
sources, and the implementation roadmap. Before writing any code, read that file in full.
Do not invent features it doesn't describe. Do not skip features it does describe. Do not
change the database schema in section 4 unless a field is genuinely missing to implement a
described feature — and if so, tell me what you're adding and why before writing the migration.
If any instruction I give you later in this session conflicts with the blueprint, point out the
conflict and ask me to confirm before proceeding, rather than silently picking one.

WORKSPACE STATE:
- The folder structure already exists per blueprint §5.1: datasets/, mobile-app/, supabase/, scripts/
- Datasets have already been downloaded and placed per blueprint §5.2-5.9 — verify their presence
  before writing scripts/seed_datasets.py, and tell me if any expected file is missing rather than
  guessing its schema.
- mobile-app/ has already been scaffolded with `create-expo-app` (TypeScript template) and
  `expo prebuild -p android` has been run, so an android/ folder exists for Android Studio.

BUILD ORDER (follow the blueprint's phased roadmap, section 8, exactly, in this order):
Phase 1: Foundation — Supabase project wiring, auth (email/OTP), profiles table, base navigation.
Phase 2: Core Scan & Track — OCR integration, drug DB seeding from datasets, medication_courses
  and dose_logs tables, notification scheduling.
Phase 3: AI Layer — symptom-necessity logic, AI Consultant, standalone AI Chatbot with the
  multi-provider fallback router described in blueprint §3.3 (on-device model first, then Gemini
  free tier, then Groq, then OpenRouter, then Hugging Face — implement this as a Supabase Edge
  Function router, never call provider APIs directly from the client).
Phase 4: Family & Social — Family Circles, three-tier permissions, Linked-Dependent mode, shared
  cabinet inventory, caregiver escalation ladder, RLS policies.
Phase 5: Admin Portal — is_admin-gated routes, User Management, API Usage Dashboard reading from
  api_usage_logs, Audit Log viewer.
Phase 6: Surveillance & Polish — misuse heatmap, animation pass, gamified badges, low-end device
  performance QA.

TECHNICAL CONSTRAINTS:
- Animation stack: use react-native-reanimated + Moti as the primary animation engine,
  react-native-skia for particle/liquid effects, expo-three + expo-gl for the 3D pill viewer, and
  lottie-react-native for micro-interactions. Do not attempt to install web-only libraries
  (Framer Motion, anime.js, KUTE.js, Mo.js, PixiJS, Theatre.js) as npm dependencies in the RN app —
  they don't run without a DOM. If a screen's design calls for a specific one of these, tell me
  which Reanimated/Skia/Lottie approach you're substituting and why.
- OCR: on-device ML Kit OCR for Android as primary, Tesseract.js as fallback only if ML Kit
  integration proves infeasible — tell me before falling back.
- All Supabase tables must have RLS enabled exactly as described in blueprint §4's closing note.
- Never hardcode API keys in client code — all AI provider calls route through Supabase Edge
  Functions, with keys stored as Supabase secrets.
- Every AI provider call (success, failure, rate-limit) must be logged to api_usage_logs — this
  is required for the Admin Portal's usage dashboard, not optional instrumentation.

WORKING STYLE:
- Work phase by phase. After completing each phase's core deliverables, stop, summarize what was
  built and what's left, and wait for my confirmation before starting the next phase.
- When you're uncertain about a UI/UX detail not fully specified in the blueprint, propose one
  reasonable option and ask rather than guessing silently across many files.
- Flag any point where a free-tier API limit, Android permission requirement, or Play Store
  policy (e.g. health-data handling, notification permissions) could block a feature as described,
  as early as possible — not after the feature is fully built.

Start by reading Antibiotic_Medication_Tracker_Blueprint_V2.md in full, then give me a short
confirmation of your understanding of Phase 1's scope before writing any code.
```

---

## 3. UI/UX Design Deep Dive for a Mobile Health App

A medication-tracking app lives or dies on **trust and glanceability** — a user should be able to
tell "did I take my meds today?" in under two seconds, even half-asleep. Fancy visual styles are
worth using, but each one should be assigned to a *specific job*, not applied uniformly. Below is
a style-by-style breakdown, then a screen-by-screen mapping.

### 3.1 Glassmorphism
Frosted-glass panels — translucent background blur, subtle border highlight, soft shadow —
sitting over a colorful or gradient backdrop.
- **Best for:** floating overlays that need to feel "on top of" content without fully blocking it —
  the dose-confirmation bottom sheet, the AI Consultant's response card over a camera preview, the
  Family Circle member cards over a soft gradient background.
- **Caution:** blur effects are GPU-expensive on low-end Android devices (a real concern per your
  target user base). Use `expo-blur`'s native `BlurView` (hardware-accelerated) rather than a
  CSS-style faux blur, and limit simultaneous blurred layers to one per screen. Also watch text
  contrast on glass — always test with a dark-mode backdrop and a light-mode backdrop, since
  translucency can wreck WCAG contrast ratios for older users reading dosage info.

### 3.2 Neumorphism (Soft UI)
Elements that look "extruded" or "pressed into" the same-color background using dual soft
shadows (light + dark), no strong borders.
- **Best for:** tactile controls that benefit from feeling physically pressable — the big
  "Mark as Taken" button, medicine-count steppers, toggle switches in Settings.
- **Caution:** neumorphism has notoriously poor accessibility (low contrast by design) and doesn't
  age well visually. Use it sparingly, only on 2-3 primary action controls, never for body text or
  anything conveying dosage/safety information — that content needs high-contrast, unambiguous
  typography instead.

### 3.3 Liquid Morphism / Liquid Glass
An evolution of glassmorphism where blur panels *fluidly* reshape, blend, and merge as the user
interacts (Apple's "Liquid Glass" direction is the most visible recent example) — think blobs of
translucent color that morph into buttons or merge into a bottom nav bar on interaction.
- **Best for:** the bottom tab bar (morphs slightly when switching tabs), the AI Chatbot's typing
  indicator (a liquid blob that pulses while the AI "thinks" — reinforces the multi-provider
  routing happening behind the scenes without exposing the mechanics), and Home screen's
  adherence ring (liquid fill animation as the daily percentage updates).
- **Implementation:** achievable in RN via `react-native-skia`'s path morphing + blur filters, or
  simpler liquid-blob effects via Lottie assets pre-authored in After Effects for consistent
  performance.

### 3.4 Bento Box Layout
A grid of asymmetric, rounded-rectangle "cards" of varying sizes (popularized by Japanese bento
design, now common in dashboard apps) — each card holds one distinct chunk of information.
- **Best for:** the **Home Dashboard** specifically — this is the single highest-value use of bento
  in this app. Example grid: a large card for "Next dose in X hours," a medium card for the
  adherence ring, a small card for quick-scan, a small card for family alerts, a wide card for
  today's full schedule strip. Bento naturally supports glanceability because each card has one job.
- **Also strong for:** the Admin Portal's API Usage Dashboard — provider cards (Gemini, Groq,
  OpenRouter, Hugging Face) as bento tiles, each showing quota-remaining at a glance.

### 3.5 Additional styles worth incorporating
- **Claymorphism** — softer, more colorful cousin of neumorphism with inflated 3D-clay-like
  shapes. Good for the onboarding illustrations and empty-state graphics (e.g., "No medications
  yet — scan your first prescription") where a friendly, approachable tone matters more than
  clinical precision.
- **Material You / Dynamic Color theming** — since this targets Android specifically, adopting
  Android 12+'s dynamic color extraction (app theme adapts to the user's wallpaper-derived palette)
  makes the app feel native to the platform rather than a cross-platform port. Implement via
  `expo-dynamic-color` or a custom bridge if Expo's support is limited at build time.
- **Skeuomorphic pill/capsule iconography** — for the 3D pill viewer (Three.js) and medicine-detail
  icons specifically, a touch of realistic (not flat) rendering makes drug identification feel more
  trustworthy and reduces misidentification risk versus abstract icons.

### 3.6 Screen-by-Screen Style Mapping

| Screen | Primary style | Why |
|---|---|---|
| Onboarding | Claymorphism + Reanimated cinematic sequence + Three.js pill | Friendly first impression, sets emotional tone |
| Home Dashboard | Bento box grid + liquid-fill adherence ring | Glanceability is the #1 priority here |
| Scan (Prescription/Strip) | Minimal glass overlay on camera view only | Camera preview must stay unobstructed and high-contrast |
| Medicine Detail | Neumorphic "Add to tracker" button + skeuomorphic pill render | Tactile primary action, trustworthy drug visualization |
| My Medications | Flat cards, high contrast, no heavy effects | This is a *read-often, read-fast* safety screen — clarity beats flair |
| Family Circle | Glassmorphism cards over soft gradient + subtle Skia particle bg | Warm, social feel without competing with member data |
| AI Consultant | Glass response cards over camera/image input | Keeps focus on the uploaded image |
| AI Chatbot | Liquid-morph typing indicator, flat message bubbles | Bubbles need to stay legible; only the "thinking" state gets flair |
| Symptom Journal | Bento timeline cards | Visual trend-spotting benefits from card-based chunking |
| Admin Portal | Bento grid for usage dashboard, flat table for user list | Utility screens — clarity and density over decoration |
| Notifications/Reminders | Neumorphic Taken/Snooze/Skip buttons | Needs to feel satisfying to tap, one-handed, half-asleep |

### 3.7 Mobile-specific UX enhancements beyond visual style
These matter as much as the visual language for a health app used one-handed, often in low-light,
by users across a wide age range:

- **Thumb-zone-first layout:** primary actions (Mark as Taken, Scan) live in the bottom third of
  the screen, reachable without shifting grip — critical for elderly Family Circle members.
- **Haptic feedback:** a distinct haptic pattern for "dose confirmed" vs. "low stock warning" vs.
  "AMR education popup" — reinforces the action without requiring the user to read every time.
- **Edge-to-edge design with safe-area awareness:** respect Android's gesture-navigation zones and
  notch/punch-hole camera cutouts; never place tap targets under a status bar or gesture strip.
- **Skeleton loaders, not spinners:** while OCR processes or the AI router falls through provider
  tiers, show a content-shaped skeleton (bento-card outlines) rather than a generic spinner — makes
  the multi-provider fallback latency feel intentional rather than broken.
- **Offline/online AI-source indicator:** a small, unobtrusive badge (per blueprint §2.8) showing
  whether a response came from the on-device model or a cloud provider — builds trust in
  low-connectivity moments rather than hiding it.
- **Adaptive text sizing respecting system settings:** Android's font-scale accessibility setting
  must be honored throughout, especially on dosage/safety text — never lock font size for "design
  consistency" on anything medically relevant.
- **One-handed reachability test pass:** during QA, explicitly test every primary action screen at
  a large device size (6.7"+) with a thumb-only interaction pattern, since the target user base
  skews toward everyday Android devices, not premium compact phones.
- **Reduced-motion mode:** respect Android's system-level "Remove animations" accessibility
  setting — disable Skia/Reanimated flourishes automatically when it's on, keep only functional
  transitions.

---

## 4. Suggested Build Sequence Summary

1. Complete §1 of this document (workspace + Android Studio + Supabase wiring).
2. Run the Gemini CLI prompt from §2, phase by phase, confirming after each phase per its
   "working style" instructions.
3. Apply the §3 UI/UX mapping screen-by-screen as each phase's screens come online — don't try to
   theme everything at once; style each screen as it's functionally completed so design and
   functionality land together per phase.
