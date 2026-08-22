# MedSentry — Google Stitch Redesign Prompt Package

> Stitch generates best when it gets one clear design brief first (to lock in brand/style), then
> individual per-screen prompts you run one at a time, referencing that same brief. This doc gives
> you both, plus exactly which files/images to attach at each step.

---

## Before you start: what to attach

Stitch takes text prompts and can use uploaded images as visual/style references. Attach these:

1. **The reference mockup image** — the "Organic & Balanced (Nature-Inspired)" palette/UI mockup
   image you originally sourced the design system from (the one showing the green "Logging"
   header, cream card, sage buttons). This is your strongest visual anchor — attach it to the
   Master Design Brief prompt below and to every per-screen prompt if Stitch allows multiple
   reference images per generation.
2. **Current app screenshots** — the screenshots of your actual running app (Sign In, Profile,
   My Medications, AI Consultant, Family Circle, Symptom Journal). Attach these as "current state
   to improve upon" references specifically to the per-screen prompts for those same screens —
   this gives Stitch a concrete before-state to simplify and clean up rather than designing blind.
3. **This document's Master Design Brief section** — paste as the text prompt for your first
   Stitch generation, before generating any individual screen.

---

## Master Design Brief (run this first, establishes the style for everything after)

```
Design a clean, modern, minimalist mobile app UI for "MedSentry" — an Android medication and
antibiotic-tracking app for individuals and families. The design should feel warm, calm, and
trustworthy — this is a health app used by a wide age range, including elderly users, so clarity
and legibility always come before decoration.

STYLE DIRECTION: "Organic & Balanced" — a light, warm, nature-inspired palette. Soft rounded
corners (16-20px radius), gentle single-layer drop shadows (no glassmorphism, no neumorphism, no
heavy blur effects), generous whitespace, and calm typography. Reference the attached mockup image
for the exact visual tone — warm off-white backgrounds, cream/white cards, sage-green primary
actions, deep slate text.

COLOR TOKENS (use these exact hex values consistently across every screen):
- Background: #F5F1EC (warm off-white, not pure white)
- Card/surface background: #FFFFFF or #FBF8F4
- Primary text: #37474F (deep slate)
- Primary button fill (solid CTAs with white text): #2E7D32 (deepened forest green — WCAG AA
  compliant; use this exact shade for any button with white text on it, not the lighter sage below)
- Secondary/accent color: #4DB6AC (muted teal) for links, selected states, info highlights;
  #20756C for solid teal buttons with white text
- Airy accent (non-button uses only — rings, subtle badges, active-state backgrounds):
  #81C784 (sage green)
- Warning/caution: #E6B655 (warm amber)
- Danger/blocking warning: #C97B63 for subtle accents, #A85A46 for solid urgent CTAs with white
  text (e.g. an expired-medicine block)
- Borders/dividers: #D7CCC8 at ~40% opacity

TYPOGRAPHY: Bold, clear headings in the deep slate color, no italics. Body text minimum 16sp,
never smaller for anything related to dosage or safety information. Uppercase tracked labels for
form field names (e.g. "EMAIL ADDRESS", "REGION").

COMPONENT RULES:
- Buttons: fully rounded (pill-shaped or 20px+ radius), solid fill using the deepened CTA colors
  above with white text, single soft shadow beneath, no gradient, no glass effect.
- Input fields: cream/warm-tinted background, thin subtle border, rounded corners, placeholder
  text in slate at reduced opacity.
- Cards: white/cream surface on the warm off-white background, soft single shadow, rounded
  corners, no borders needed beyond a subtle hairline if any.
- Icons: simple, line-style or lightly filled, not overly detailed or skeuomorphic except where
  specifically noted per-screen.
- Bottom navigation: warm off-white or white background, icons + labels, active tab in sage/teal.

TONE: The overall aesthetic should read as "calm, organic wellness app" — think earthy plant tones,
soft shapes, generous breathing room — NOT clinical/sterile, NOT dark-mode tech-startup, NOT
playful/cartoonish. This is a serious health tool that still feels approachable.

Generate this as the base style system. I will follow up with individual screen prompts using this
exact same design language.
```

**Attach:** the reference mockup image.

---

## Per-Screen Prompts (run each separately, after the Master Brief)

For each prompt below, also attach the matching current-app screenshot where noted, captioned as
"current version — simplify and clean up, keep the same information but make it feel less busy /
fix the issues shown."

### 1. Onboarding
```
Design a 3-screen onboarding flow for MedSentry, same design language as established. Each screen:
a simple warm illustration (a shield icon, a pill/capsule, a family silhouette — one per screen),
a short bold headline, one line of supporting text, and pagination dots at the bottom. Final screen
ends with a "Get Started" primary button. Keep illustrations simple and flat, not overly detailed.
```

### 2. Sign In / Sign Up
```
Design a Sign In screen for MedSentry: app icon + name + tagline at top, a card containing email
and password input fields, a solid primary "Sign In" button, a "Continue with Google" secondary
button with the Google logo, and a "Don't have an account? Sign Up" link at the bottom. Design a
matching Sign Up screen with an added confirm-password field.
```
**Attach:** current Sign In screenshot (already close to on-brand — refine and simplify, don't
overhaul).

### 3. Home Dashboard
```
Design a Home Dashboard for MedSentry using a bento-box grid layout: one large card showing "Next
dose in X hours" with the medicine name, a medium card with a circular adherence-percentage ring
(sage green fill), a small quick-action card for "Scan Medicine", a small card for family alerts
if any, and a wide card showing today's full dose schedule as a horizontal strip. Keep it
scannable at a glance — this is the most-viewed screen in the app.
```

### 4. Scan (Prescription / Medicine Strip)
```
Design a camera scan screen for MedSentry with a toggle at the top between "Scan Prescription" and
"Scan Medicine Strip" modes. Below the toggle, a full-screen camera viewfinder with a rounded
capture button at the bottom and a subtle corner-guide overlay to help frame the document/strip.
Keep the camera view itself clean and high-contrast — minimal UI chrome overlaying it.
```

### 5. Medicine Detail
```
Design a Medicine Detail screen showing a warm-toned illustrated pill/capsule icon at top, the
drug name as a large heading, its AWaRe classification as a small badge, sections for "Common
Uses," "Side Effects," and "Interaction Warnings" as clean text blocks, and a solid primary
"Start Tracking" button pinned near the bottom.
```

### 6. My Medications
```
Design a My Medications list screen: a vertical list of flat, high-contrast cards, each showing
the medicine name, dosage, schedule (e.g. "Morning, Night"), a "Days Left" counter, and a "Log
Dose Taken" solid green button. Keep this screen simple and very readable — no heavy decoration,
this is a frequently-checked functional screen.
```
**Attach:** current My Medications screenshot — simplify the card layout, keep it clean.

### 7. Family Circle
```
Design a Family Circle screen. Empty state: a friendly illustration, "No members yet" message, and
"Create Circle" / "Join via Code" buttons. Active state: a list of member cards, each showing the
person's name, avatar initial, and a role badge (distinct colors/styles for Owner, Caregiver,
Viewer), plus a prominent invite-code display card for the Owner to share.
```
**Attach:** current Family Circle stub screenshot — this needs a full real design, not a refinement.

### 8. AI Consultant
```
Design an AI Consultant screen: a mode header ("Consultant" vs "Chat" as tabs), an image-upload
button, a text input for describing a symptom or question, and an "Analyze" primary button. Below,
show an example AI response card with a colored left-border accent to distinguish AI-generated
content, containing a short answer and a small "AI Generated" badge.
```
**Attach:** current AI Consultant screenshot (note the header overlap bug visible in it — this
should not appear in the redesign).

### 9. AI Chatbot
```
Design a conversational chat screen: message bubbles (user messages right-aligned in a solid
color, AI messages left-aligned in a soft card with a subtle accent border), a typing indicator,
and a text input bar with a send button at the bottom.
```

### 10. Symptom Journal
```
Design a Symptom Journal screen: a vertical timeline of logged symptom entries, each showing the
date, a severity indicator (1-10 scale, shown as a simple dot/bar rating rather than a number),
and a short description. A floating action button in the bottom right opens a new-entry flow.
```
**Attach:** current Symptom Journal stub screenshot.

### 11. Admin Portal — Dashboard / User Management / Audit Log
```
Design an Admin Portal for MedSentry with a deliberately calmer, more utilitarian version of the
same design system — same colors and fonts, but flatter, less decorative, higher information
density. Three views: (1) a dashboard with small bento tiles showing API usage stats per AI
provider, (2) a searchable flat list of users with name, account type, and a status badge, (3) a
flat, timestamped audit log list that expands each entry to show a JSON detail snapshot.
```

### 12. Notifications / Dose Reminder
```
Design a mobile notification/lock-screen style card for a dose reminder: medicine name, dose
time, and three action buttons — "Taken" (solid green), "Snooze" (neutral outline), "Skipped"
(soft red outline, not solid, since skipping is tracked but not alarming).
```

### 13. Profile / Settings
```
Design a Profile/Settings screen: user avatar circle with initial, name, account type label, a
card for account settings (preferred language), and a card for "Community Health" region
selection with a short explanatory line about optional AMR data sharing, plus a "Sign Out" button
styled as a soft outlined danger button, not a solid fill.
```
**Attach:** current Profile screenshot — this one's close to on-brand already, refine rather than
redesign.

---

## After Stitch generates designs

Once you have Stitch outputs you're happy with, the next step is handing them to Antigravity as
implementation references — not asking it to redesign from scratch. A good follow-up prompt once
you have exported designs:

```
I've redesigned several screens using Google Stitch, based on our existing
Design_System_Nature_Palette_v1.md tokens. Attached are the new reference designs for [list
screens]. Implement these as the new versions of [ScreenName].tsx, keeping all existing business
logic, data-fetching, and navigation structure completely untouched — this is a visual-only
update, same rule as the original re-theme. Extract any new/refined component patterns (e.g. the
role badge styles, the severity rating display) into reusable components if they repeat across
multiple screens. Confirm with a real screenshot once done, per our standing evidence rule.
```
