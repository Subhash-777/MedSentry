# MedSentry — Design System v1: Organic & Balanced (Nature-Inspired)

> This document **supersedes** the visual style column of `plan.md` §7 (the original
> glassmorphism/neumorphism/bento-on-dark-theme direction). Everything else in `plan.md` —
> screen purposes, data sources, feature scope, phased roadmap — is unchanged. Only the visual
> language changes, to the light, warm, nature-inspired palette below. Treat this as the binding
> ground truth for all UI styling going forward.

---

## 1. Color Tokens

| Token | Hex | Role |
|---|---|---|
| `sageGreen` | `#81C784` | Primary actions — buttons, active states, adherence-ring fill, success indicators |
| `mutedAccent` | `#4DB6AC` | Secondary accent — links, selected tab, info highlights |
| `warmCocoa` | `#D7CCC8` | Surface/card background on light sections, input field backgrounds |
| `textColor` | `#37474F` | Primary text — headings, body copy |
| `slateColor` | `#37474F` (shared with textColor per reference; use for secondary text/labels at reduced opacity, e.g. `#37474F` at 70% for captions) | Secondary text, labels, placeholder copy |
| `background` | `#F5F1EC` *(derived — warm off-white, not pure white, to stay consistent with the cocoa/sage warmth)* | App background |
| `surfaceCard` | `#FFFFFF` or `#FBF8F4` *(derived — slightly warmer than pure white for cards sitting on `background`)* | Card/container backgrounds |
| `border` | `#D7CCC8` at reduced opacity (~40%) | Card borders, input borders, dividers |

### Semantic/state colors (derived, not in the reference image — needed for app-specific states)
| Token | Hex | Role |
|---|---|---|
| `successGreen` | `#81C784` (reuse sageGreen) | Dose taken, valid prescription, adherence success |
| `warningAmber` | `#E6B655` *(warm amber consistent with the palette's earthiness)* | Low-stock nudge, prescription staleness warning |
| `dangerClay` | `#C97B63` *(muted terracotta/clay red, stays in the organic family rather than a jarring pure red)* | Expired medicine blocking warning, unprescribed-antibiotic flag, critical missed-dose escalation |
| `infoTeal` | `#4DB6AC` (reuse mutedAccent) | AI-generated content badges, informational callouts |

**Contrast check requirement:** `textColor` (`#37474F`) on `background` (`#F5F1EC`) and on
`surfaceCard` must be verified at WCAG AA (4.5:1 minimum) before shipping — dark slate on warm
off-white should pass comfortably, but verify programmatically (e.g. a contrast-checker script)
rather than assuming, especially for any text rendered at smaller sizes (captions, labels).

---

## 2. Typography & Spacing
- Headings: bold, `textColor`, no italics — keep clinical information unambiguous.
- Body text: regular weight, `textColor`, minimum 16sp for anything dosage/safety-related (never
  shrink below this regardless of layout density).
- Labels/captions: `textColor` at reduced opacity, uppercase tracking optional for field labels
  (matches the reference image's "EMAIL ADDRESS" / "Header" / "Dose field" label style).
- Rounded corners throughout: 16–20px radius on cards and buttons (matches the reference mockup's
  soft, organic feel) — avoid sharp corners entirely in this theme.
- Soft shadows only — no hard drop shadows. A single soft, low-opacity shadow beneath cards is
  enough; this replaces the glassmorphism blur approach entirely.

---

## 3. Component Styling (replaces plan.md §7's glass/neumorphic assignments)

| Component | Styling |
|---|---|
| Primary button (e.g. "Send passcode", "Log Dose", "Start Tracking") | `sageGreen` fill, white or `textColor` label text depending on contrast, rounded (20px+), no neumorphic dual-shadow — a single soft shadow is enough |
| Input fields | `warmCocoa`-tinted or `surfaceCard` background, thin `border` outline, rounded corners, `textColor` placeholder at reduced opacity |
| Cards (bento tiles, medication cards, family member cards) | `surfaceCard` background on `background`, soft shadow, rounded corners — no blur/glass effect |
| Header bars (e.g. the green "Logging" header in the reference mockup) | `sageGreen` or `mutedAccent` solid fill, white text |
| Adherence ring / progress indicators | `sageGreen` fill on a `warmCocoa` track |
| Low-stock nudge | `warningAmber` accent border or icon on an otherwise normal card — not a full-card color change, keep it legible |
| Expired-medicine blocking warning | `dangerClay` full banner, high contrast, blocking modal — this one should feel distinctly more urgent than the amber low-stock nudge |
| AI-generated response cards (Consultant/Chatbot) | `surfaceCard` with a thin `infoTeal` left-border accent to distinguish AI content from user-entered data, plus the offline/online source badge in `infoTeal` or `slateColor` |
| Notification action buttons (Taken/Snooze/Skipped) | Taken = `sageGreen`, Snooze = `mutedAccent` or neutral `warmCocoa`, Skipped = `dangerClay`-tinted outline (not full fill, since skipping isn't inherently "wrong," just tracked) |

---

## 4. Updated Screen Style Table (replaces plan.md §7's style column)

| Screen | Updated style direction |
|---|---|
| Onboarding | Light, warm illustrations using the palette; `sageGreen`/`mutedAccent` accents; Three.js pill viewer re-rendered in warm-toned materials, not the previous dark-theme glow |
| Sign In / OTP Verify | Exactly per the reference mockup: `background` app background, white/cream card container, `warmCocoa`-tinted input, `sageGreen` primary button, `textColor` headings |
| Home Dashboard | Bento grid retained as a *layout* pattern, re-skinned: `surfaceCard` tiles on `background`, `sageGreen` liquid-fill adherence ring |
| Scan (Prescription/Strip) | Camera view stays high-contrast/unmodified (functional requirement unchanged); any overlay UI switches to `surfaceCard` + soft shadow instead of dark glass |
| Medicine Detail | Primary "Add to tracker" button in `sageGreen`; skeuomorphic pill render re-toned to warm/organic materials rather than the previous dark-theme rendering |
| My Medications | Flat `surfaceCard` cards on `background`, high-contrast `textColor` — this screen keeps its "clarity over flair" priority from plan.md, just re-colored |
| Family Circle | `surfaceCard` cards on `background`, `mutedAccent` accents for member role badges |
| AI Consultant / Chatbot | `surfaceCard` response cards with `infoTeal` accent border; typing indicator uses `mutedAccent` |
| Symptom Journal | Bento timeline cards retained as layout, re-skinned per the card styling above |
| Admin Portal | Same bento/table layouts retained, re-skinned; keep this section visually calmer (less accent color) since it's a utility surface |
| Notifications/Reminders | Buttons per §3's notification action color mapping above |

---

## 5. Implementation Notes for Antigravity
- Centralize all tokens in one file (`src/theme/colors.ts` or equivalent) — no hardcoded hex
  values in individual screen files.
- Update `app.json`'s `userInterfaceStyle` from `dark` to `light`.
- This is a styling-only change — no business logic, query, or navigation structure changes
  should occur as part of this re-theme.
- Where a screen isn't shown in a reference mockup (most of them aren't — only Sign In/OTP and a
  generic "Logging" screen were provided), apply the token system and component styling rules
  above consistently rather than guessing at a screen-specific design; flag any screen where the
  right call is genuinely ambiguous.

---

## 6. WCAG AA Contrast Remediation (Phase 6 Addendum)

During the Phase 6 Accessibility Audit, programmatic contrast checks proved that white text on the original airy background tokens (`sageGreen`, `mutedAccent`, `dangerClay`) fails WCAG AA 4.5:1 standards (often falling below 3:1). Flipping the text to `textColor` (`#37474F`) mathematically fails for `mutedAccent` and `dangerClay`, and visually ruins the urgency required for blocking warnings.

To remediate this without destroying the airy Nature Palette aesthetic, the original light tokens MUST be retained for non-contrast-critical surfaces (like the adherence ring fill, subtle active states, and pill badges). However, **primary solid-fill buttons** with white text MUST use the following newly introduced deepened tokens:

| Solid CTA Token | Hex | WCAG AA Ratio (White Text) | Role |
|---|---|---|---|
| `sageGreenSolid` | `#2E7D32` | 5.25:1 | Primary action buttons (Log Dose, Start Tracking) |
| `mutedAccentSolid` | `#20756C` | 5.49:1 | Secondary solid action buttons |
| `dangerClaySolid` | `#A85A46` | 4.98:1 | Unambiguous blocking warnings, expired medicine CTA |

When building a solid button containing white text, always use the `*Solid` variants. When coloring a background shape without critical readable text sitting directly on it, use the original airy tokens.
