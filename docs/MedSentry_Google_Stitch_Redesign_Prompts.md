# MedSentry — Google Stitch Redesign Prompt Package

> This document is a complete, standalone package for redesigning every screen of the MedSentry
> app using Google Stitch, built around the new shield/leaf-flame logo and the expanded
> "Organic & Balanced" nature-inspired color palette. Run the Master Design Brief first to lock in
> the brand and style system, then run each per-screen prompt individually. The final section is
> the handoff prompt for implementing the finished designs back into the app.
>
> **Important:** Stitch produces visual designs only. It does not know whether a screen's
> underlying data, database queries, or backend logic actually works. Once these designs are
> implemented into the app, every screen still needs to be verified against real data before it's
> considered done — a good-looking screen and a working screen are two separate claims.

---

## Before you start: what to attach

1. **The logo image** (shield with a leaf/lotus/flame motif, teal-to-green gradient with a warm
   orange-ochre center) — attach this to every Stitch generation. It's the primary brand anchor.
2. **The brand/palette reference image** (MEDSENTRY wordmark, phone mockup, and the 4-color
   swatch: Rich Sage Green, Accent Teal, Clay Ochre, Pale Jade Green) — attach to the Master
   Design Brief.
3. **The expanded palette reference image** (the "Organic & Balanced, further improved" 8-color
   swatch alongside a Medication Logging Entry screen mockup) — attach to the Master Design Brief
   and to the Medicine Detail screen prompt, since it shows a complete real form layout in this
   exact style worth matching closely.
4. Screenshots of your current app screens are optional — helpful only as loose context on
   information density if you have them handy, not required.

---

## Master Design Brief (run this first)

```
Design a clean, SIMPLE, modern mobile app UI for "MedSentry" — an Android medication and
antibiotic-tracking app for individuals and families. Prioritize simplicity above all else: fewer
elements per screen, generous whitespace, one clear primary action per screen, minimal visual
competition between elements. This is a health app used by a wide age range including elderly
users — clarity and reduced cognitive load matter more than density or decoration.

BRAND: Use the attached shield/leaf-flame logo as the app icon and as the centerpiece of the
Onboarding and Sign In screens. The logo blends a shield (protection/guardian) with a lotus/leaf
shape and a small flame-like center accent (vitality) in a teal-to-green gradient with a warm
orange-ochre center. Reference this motif's proportions and gradient direction if any screen
calls for a simplified icon version of it.

STYLE DIRECTION: "Organic & Balanced" — a light, warm, nature-inspired palette, decluttered rather
than a dense dashboard aesthetic. Soft rounded corners (16-20px radius), a single gentle drop
shadow per card, no glassmorphism, no neumorphism, no heavy blur effects, generous whitespace.
Reference the attached palette and mockup images for exact tone.

COLOR TOKENS (exact hex values, use consistently across every screen):
- Rich Sage Green: #81C784 — primary actions, active states, brand accent, header bars
- Accent Teal: #4DB6AC — secondary accent, links, selected/active tab states
- Clay Ochre: #C5A081 — warm highlight/badge accent; background or icon use only, not for body
  text or button text (contrast unverified — flag for a WCAG check before any text-bearing use)
- Pale Jade Green: #A5D6A7 — soft airy accent, subtle active-state fills, non-text uses only
- Warm Beige: #D7CCC8 — borders, dividers, input field backgrounds
- Cream Accent: #F5F0E6 — app background
- Mid Slate Grey: #546E7A — secondary/muted text such as captions and labels only, not primary
  body text (contrast unverified at small sizes — flag for a WCAG check)
- Dark Slate Grey: #37474F — primary text, headings, body copy
- Solid CTA buttons carrying white text: use #2E7D32 (sage variant), #20756C (teal variant), or
  #A85A46 (danger/clay variant) specifically — these are separate, deliberately deepened shades
  chosen to guarantee readable white text on a solid button, distinct from the airy tokens above

TYPOGRAPHY: Bold, clear headings in Dark Slate Grey, no italics. Body text minimum 16sp for
anything related to dosage or safety information. Uppercase, letter-spaced labels for form field
names (reference the attached Medication Logging Entry mockup for exact styling: rounded pill
input fields, small uppercase section headers like "MEDICATION DETAILS" and "DOSAGE & FREQUENCY").

SIMPLIFICATION RULES:
- Prefer a single-column layout over multi-card grids for any screen whose job is a single task
  (forms, detail views, focused single-purpose screens).
- Reserve grid/bento layouts only for the Home Dashboard, and even there keep it to a maximum of
  four tiles in a 2x2 arrangement.
- Every screen should have exactly one obvious primary action, visually distinct from everything
  else on the screen via the solid CTA colors.
- Cut decorative icons, badges, or secondary metadata that don't directly help the user complete
  their task on that specific screen — when in doubt, leave it out.
- Avoid stacking more than two pieces of information inside a single card without a clear visual
  hierarchy distinguishing them.

HEADER BARS: solid Rich Sage Green fill with white text and icons, matching the attached
Medication Logging Entry mockup's top bar treatment (back arrow + screen title in white).

TONE: calm, organic wellness app — approachable but serious. Not clinical or sterile, not a busy
tech-dashboard aesthetic, not playful or cartoonish.

Generate this as the base style system, incorporating the logo as the core brand identity element.
I will follow up with individual screen prompts using this same design language.
```

**Attach:** logo image, brand/palette reference image, expanded palette/mockup image.

---

## Per-Screen Prompts

Run each of these individually, after the Master Design Brief has been established.

### 1. Onboarding
```
Design a simple 3-screen onboarding flow for MedSentry. Each screen: one simple icon or
illustration, one bold short headline, one line of supporting text, pagination dots at the
bottom. On the final screen, feature the shield/leaf-flame logo prominently, large and centered,
above a single "Get Started" button, using its full gradient color treatment as shown in the
attached logo image. No feature lists, no dense text — keep each screen to one idea.
```

### 2. Sign In / Sign Up
```
Design a Sign In screen: the shield/leaf-flame logo at the top, sized similarly to the attached
brand reference image, with the wordmark "MEDSENTRY" beneath it in Dark Slate Grey. Below that, a
card containing email and password input fields, one solid primary "Sign In" button, one
"Continue with Google" button beneath it, and a small text link to Sign Up. Keep the card itself
minimal — no extra copy beyond what's functionally necessary. Design a matching Sign Up screen
with an added confirm-password field.
```

### 3. Home Dashboard
```
Design a simplified Home Dashboard: a 2x2 bento grid maximum — one large "Next Dose" card showing
the drug name and time, one "Adherence" card with a simple percentage or ring (no extra chart
clutter), one "Quick Scan" action card, one "Family Alerts" card. Nothing else on this screen —
no extra sections below the grid.
```

### 4. Scan (Prescription / Medicine Strip)
```
Design a camera scan screen: a mode toggle at the top between "Prescription" and "Medicine
Strip," a full-screen camera viewfinder with a simple corner-guide overlay, one capture button at
the bottom. No other UI chrome cluttering the camera view.
```

### 5. Medicine Detail / Add-to-Tracker Form
```
Design a Medicine Detail screen: drug name as a large heading, one AWaRe classification badge,
three simple text sections (Uses / Side Effects / Interactions), and a primary "Start Tracking"
button pinned near the bottom. Base the tracking input form specifically on the attached
Medication Logging Entry mockup — a solid sage green header bar with a back arrow and the screen
title in white text, uppercase section labels (MEDICATION DETAILS, DOSAGE & FREQUENCY, SCHEDULE &
NOTES), rounded pill-style dropdown and stepper inputs on a cream background, and a solid
full-width green "Save & Log Dose" button at the bottom.
```

### 6. My Medications
```
Design a simple vertical list of medication cards: drug name, dosage, schedule, a days-left
counter, and one "Log Dose Taken" button per card. Flat, high-contrast, minimal decoration — this
is a frequently-checked functional screen, prioritize scan-ability over visual interest.
```

### 7. Family Circle
```
Design a Family Circle screen. Empty state: one simple message ("No members yet") and two clear
buttons ("Create Circle" / "Join via Code"). Active state: a simple vertical list of member rows,
each showing a name and one role badge (Owner, Caregiver, or Viewer, clearly color-differentiated
but not visually loud), plus an invite-code display card visible only to the Owner.
```

### 8. AI Consultant
```
Design a simple AI Consultant screen: a mode tab at top switching between "Consultant" and
"Chat," one image-upload button, one text input, and one "Analyze" button. Show the AI response
as a single clean card with a thin accent-color border to mark it as AI-generated — no extra
badges or icons cluttering the response.
```

### 9. AI Chatbot
```
Design a simple chat interface: right-aligned solid-color user message bubbles, left-aligned
soft-card AI message bubbles with a thin accent border, and a text input bar with a send button
at the bottom. No extra chrome.
```

### 10. Symptom Journal
```
Design a simple Symptom Journal screen: a vertical list of entries, each showing the date, a
simple severity indicator (a color-coded dot or short label, not a numeric badge), and one line
of description. A single floating action button opens a new-entry form: a simple 1-10
tap-to-select severity row, a text field, and one save button.
```

### 11. Admin Portal — Dashboard, User Management, Audit Log, Misuse Heatmap
```
Design a calm, utilitarian Admin Portal using the same tokens but flatter and simpler than the
rest of the app. Dashboard: a simple grid of four navigation cards (Users / API Usage / Audit Log
/ Misuse Heatmap), each showing just an icon, a label, and one key number. User Management: a
flat searchable list of users; tapping one opens a simple action sheet (Deactivate / Edit /
Disband Circle, each requiring a reason field before it can be submitted). Audit Log: a flat
timestamped list that expands to show raw detail when tapped. Misuse Heatmap: a simple filterable
list or basic chart, with region, drug category, and time-window filters shown as simple chips —
avoid an overly complex data-visualization treatment, this needs to be scannable, not impressive.
```

### 12. Cabinet Inventory
```
Design a simple shared medicine cabinet screen: a vertical list of items showing drug name,
quantity, and expiry date (with a subtle warning color if expiring soon), a single "Add Item"
button, and a simple add-item form with a drug name/typeahead field, quantity, expiry date, and a
save button.
```

### 13. Notifications / Dose Reminder
```
Design a simple notification card for a dose reminder: medicine name, dose time, and three
clearly distinct action buttons — "Taken" (solid green), "Snooze" (neutral outline), and
"Skipped" (soft outline, not solid, since skipping is tracked rather than alarming).
```

### 14. Profile / Settings
```
Design a simple Profile/Settings screen: an avatar circle with initial, the user's name, and
account type at the top; one card for basic account settings (preferred language); one card for
the optional "Community Health" region selector with a short explanatory line about anonymous AMR
data sharing; one card with a single "Caregiver Access" toggle and a short line explaining that it
revokes all caregivers' edit access to this person's data; and a "Sign Out" button styled as a
soft outline, not a solid fill.
```

---

## After Stitch generates designs — implementation handoff prompt

```
I've finalized new UI designs for the app using Google Stitch, built around a new logo and an
expanded "Organic & Balanced" color palette, replacing all prior visual work across every screen.
Attached are the new reference designs and the logo asset.

Before implementing: two of the new color tokens (Clay Ochre #C5A081, Mid Slate Grey #546E7A)
have not been through a WCAG AA contrast verification. Check whether either one carries body
text, placeholder text, or sits under white button text anywhere in the final designs. If so, run
a proper contrast-check before implementing that specific instance, and propose a WCAG-safe
substitute if either fails — don't implement an unverified text/background pairing.

Add the new logo as the app icon (update the app icon assets and configuration accordingly), and
use it on the Onboarding and Sign In screens per the designs.

Implement everything else as a visual-only change: do not touch data-fetching logic, database
queries, API calls, navigation structure, or any business logic — only the JSX structure, styling,
and layout should change to match the new designs. If implementing a new design genuinely requires
a different data shape than what a screen currently fetches, flag that specifically and propose
the change rather than silently modifying a query while doing a visual update.

Extract any new repeated patterns (for example, the simplified severity indicator or the role
badges) into reusable components if they appear on more than one screen.

Once each screen is implemented, it needs the same functional verification as every other part of
this app: a real screenshot showing real data, and confirmation that nothing which previously
worked (data fetching, form submission, notification actions, permission-gated actions) regressed
as a result of the visual change. Propose your implementation order in plain text and wait for
explicit approval before touching any file.
```
