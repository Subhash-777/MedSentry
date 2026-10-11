/**
 * MedSentry — Design System v2: Organic & Balanced (Enhanced Nature-Inspired)
 *
 * Single source of truth for all color tokens.
 * Updated in UI/UX Enhancement Pass (Round 3) to reconcile with brand board.
 *
 * DO NOT hardcode hex values in individual screen files — import from here.
 *
 * ─── PROTECTED TOKENS (DO NOT TOUCH) ───────────────────────────────────────
 * sageGreenSolid   (#2E7D32)  WCAG AA — primary solid button, white text
 * mutedAccentSolid (#20756C)  WCAG AA — secondary solid button, white text
 * dangerClaySolid  (#A85A46)  WCAG AA — danger solid button, white text
 * These survived the Phase 6 accessibility remediation and must not be
 * reinterpreted, re-mapped, or replaced in this or any future pass.
 * ────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Core palette tokens
// ---------------------------------------------------------------------------

/** Primary actions — buttons, active states, adherence-ring fill, success */
export const sageGreen = '#81C784';

/** Secondary accent — links, selected tab, info highlights */
export const mutedAccent = '#4DB6AC';

/** Surface/card border accent, input field backgrounds */
export const warmCocoa = '#D7CCC8';

/** Primary text — headings, body copy */
export const textColor = '#37474F';

/**
 * Secondary text / labels / captions.
 * Dedicated token — replaces the old opacity-based slateColor workaround.
 * Use directly (no opacity modifier needed) for all secondary/caption text.
 */
export const midSlate = '#546E7A';

/**
 * Secondary warm accent — badges, highlights, selected-but-not-primary states.
 * Distinct from dangerClay/warningAmber (which are semantic safety-state colors
 * and must not be reinterpreted). clayOchre is purely decorative/accent.
 */
export const clayOchre = '#C5A081';

/**
 * Light tint for subtle backgrounds, progress-bar tracks, unselected states.
 * Replaces opacity-based tinting of sageGreen throughout the app.
 */
export const paleJade = '#A5D6A7';

/** App background — warm cream, exact brand hex */
export const background = '#F5F0E6';

/** Dark background for camera overlay / scanner processing screens */
export const cameraOverlayDark = '#0A0A0A';

/** Card / container backgrounds — slightly warmer than pure white */
export const surfaceCard = '#FDFAF6';

/** Elevated card surface — used for floating elements on surfaceCard */
export const surfaceElevated = '#FFFFFF';

/**
 * Card borders, input borders, dividers.
 * Use warmCocoa at ~40% opacity, or this pre-mixed value for flat StyleSheet use.
 */
export const border = 'rgba(215, 204, 200, 0.55)';

/** Stronger border for selected/active states */
export const borderStrong = 'rgba(129, 199, 132, 0.45)';

// ---------------------------------------------------------------------------
// Semantic / state colors  (DO NOT repurpose these for decoration)
// ---------------------------------------------------------------------------

/** Dose taken, valid prescription, adherence success (reuses sageGreen) */
export const successGreen = sageGreen;

/** Low-stock nudge, prescription staleness warning — warm amber */
export const warningAmber = '#E6B655';

/**
 * Expired medicine blocking warning, unprescribed-antibiotic flag,
 * critical missed-dose escalation — muted terracotta/clay
 */
export const dangerClay = '#C97B63';

/** AI-generated content badges, informational callouts (reuses mutedAccent) */
export const infoTeal = mutedAccent;

// ---------------------------------------------------------------------------
// WCAG AA Contrast-Compliant Solid Button Tokens  ── PROTECTED ──
// ---------------------------------------------------------------------------

/** Deep forest green: For solid primary buttons with white text (WCAG AA pass) */
export const sageGreenSolid = '#2E7D32';

/** Deep teal: For solid secondary buttons with white text (WCAG AA pass) */
export const mutedAccentSolid = '#20756C';
export const infoTealSolid = mutedAccentSolid;

/** Brick red: For solid urgent blocking warnings with white text (WCAG AA pass) */
export const dangerClaySolid = '#A85A46';

/** Warm amber solid — for warning buttons with white text */
export const warningAmberSolid = '#B8860B';

// ---------------------------------------------------------------------------
// Derived convenience tokens
// ---------------------------------------------------------------------------

/** Placeholder text color — midSlate at ~55% opacity */
export const placeholder = 'rgba(84, 110, 122, 0.55)';

/**
 * Caption / label color — resolves to midSlate.
 * Used as a color value (e.g. color: T.caption).
 * For font sizes, use T.fontSize.caption (= 13sp).
 */
export const caption = midSlate;

/** Disabled element tint */
export const disabled = 'rgba(55, 71, 79, 0.30)';

/** Subtle overlay — for glassmorphism-lite effect on hero sections */
export const overlayLight = 'rgba(253, 250, 246, 0.85)';

/** Status bar style for light background screens */
export const statusBarStyle = 'dark-content' as const;

// ---------------------------------------------------------------------------
// Gradient stop helpers (use with LinearGradient)
// ---------------------------------------------------------------------------
export const gradients = {
  sageHero: ['#81C784', '#4CAF50'] as const,
  tealHero: ['#4DB6AC', '#00897B'] as const,
  /** Updated to match new background hex #F5F0E6 */
  warmCard: ['#FDFAF6', '#F5F0E6'] as const,
  sunsetWarn: ['#E6B655', '#D4874A'] as const,
  clayDanger: ['#C97B63', '#A85A46'] as const,
  nightSky: ['#37474F', '#263238'] as const,
  /** New: sage-to-paleJade for gentle tinted backgrounds */
  jadeWash: ['#A5D6A7', '#F5F0E6'] as const,
} as const;

// ---------------------------------------------------------------------------
// Typography scale (sp values — Universal Layout System)
//
// Target scale (applied per-screen in Batch 1–6):
//   title / large heading: 28sp bold
//   sectionHeading:        20sp bold
//   body:                  16sp regular   (never smaller for safety text)
//   caption:               13sp regular   (Mid Slate Grey)
//   label:                 12sp semi-bold (uppercase, 0.5 tracking)
//   display:               42sp           (stats, hero numerals)
//
// Bridge aliases (subtitle, small, hero) are kept here so existing screen
// files continue to compile during the batch-by-batch migration. Each batch
// removes them in that batch's screen files. Remove these bridge aliases
// after Batch 6 once all screens have been migrated.
// ---------------------------------------------------------------------------
export const fontSize = {
  /** Screen title / large heading — 28sp bold */
  title: 28,
  /** Section heading — 20sp bold */
  sectionHeading: 20,
  /** Body — minimum for dosage/safety text, never smaller */
  body: 16,
  /** Secondary / caption — 13sp, Mid Slate Grey */
  caption: 13,
  /** Label (uppercase tracked) — 12sp semi-bold, letter-spacing 0.5 */
  label: 12,
  /** Display / large stats (adherence ring, hero numerals) */
  display: 42,

  // ── Bridge aliases — do not use in new screen work ──────────────────────
  /** @deprecated Use fontSize.caption (13) or fontSize.label (12) instead */
  small: 11,
  /** @deprecated Use fontSize.caption (13) instead */
  subtitle: 14,
  /** @deprecated Use fontSize.title (28) instead */
  hero: 28,
} as const;

// ---------------------------------------------------------------------------
// Border radius — Universal Layout 3-value scale
//
// Target scale (applied per-screen in Batch 1–6):
//   small:  12px  — chips, badges, small icon buttons
//   card:   16px  — standard cards, inputs
//   large:  20px  — primary buttons, large cards
//   pill:   100px — fully rounded (not part of the 3-value scale)
//
// Bridge aliases (button, tag, input, hero, otp) are kept here so existing
// screen files continue to compile during the batch-by-batch migration.
// Remove these bridge aliases after Batch 6 once all screens have been migrated.
// ---------------------------------------------------------------------------
export const radius = {
  /** Small elements: chips, badges, small icon buttons — 12px */
  small: 12,
  /** Standard cards, inputs — 16px */
  card: 16,
  /** Primary buttons, large cards — 20px */
  large: 20,
  /** Pill / fully rounded — kept for pill badges */
  pill: 100,

  // ── Bridge aliases — do not use in new screen work ──────────────────────
  /** @deprecated Use radius.large (20) instead */
  button: 20,
  /** @deprecated Use radius.small (12) instead */
  tag: 12,
  /** @deprecated Use radius.card (16) instead */
  input: 16,
  /** @deprecated Use radius.large (20) instead */
  hero: 20,
  /** @deprecated Use radius.small (12) instead */
  otp: 12,
} as const;

// ---------------------------------------------------------------------------
// Spacing scale — Universal Layout System (use only these values)
// 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40
// ---------------------------------------------------------------------------
export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px — item-to-item rhythm inside lists */
  md: 12,
  /** 16px — screen horizontal margin, card padding */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px — section-to-section vertical rhythm */
  xxl: 24,
  /** 32px */
  xxxl: 32,
  /** 40px */
  max: 40,
} as const;

// ---------------------------------------------------------------------------
// Component sizing constants — fixed, identical on every screen
// ---------------------------------------------------------------------------
export const componentSize = {
  /** Primary button height */
  buttonPrimary: 56,
  /** Secondary / outline button height */
  buttonSecondary: 48,
  /** Input field height */
  inputHeight: 52,
  /** Bottom tab bar height (add safeAreaInset separately) */
  tabBarHeight: 64,
  /** Header height (add safeAreaInset separately) */
  headerHeight: 56,
  /** Minimum touch target (accessibility — do not regress) */
  touchTarget: 48,
  /** Icon: inline / small */
  iconSmall: 20,
  /** Icon: standard / nav */
  iconStandard: 24,
  /** Icon: feature / empty-state */
  iconFeature: 32,
} as const;

// ---------------------------------------------------------------------------
// Shadows — soft only, no hard drops
// ---------------------------------------------------------------------------
export const cardShadow = {
  shadowColor: '#8D6E63',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 4,
} as const;

export const heroShadow = {
  shadowColor: '#4CAF50',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 20,
  elevation: 8,
} as const;

export const subtleShadow = {
  shadowColor: '#8D6E63',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
} as const;

export const innerShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
} as const;
