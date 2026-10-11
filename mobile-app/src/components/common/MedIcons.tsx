/**
 * MedIcons — Application-wide icon components powered by Lucide React Native.
 * Every export name is preserved from the original hand-drawn icon set so
 * consumer imports remain unchanged. Each wrapper accepts `color`, `size`,
 * and an optional `secondaryColor` (ignored — kept for API compatibility).
 */
import React from 'react';
import * as T from '../../theme/colors';
import {
  Pill,
  Stethoscope,
  Dna,
  ShieldCheck,
  Leaf,
  HeartPulse,
  TriangleAlert,
  Hospital,
  CalendarDays,
  Weight,
  Ruler,
  Pencil,
  Lock,
  Phone,
  LogOut,
  Settings,
  ArchiveRestore,
  Sun,
  Moon,
  Thermometer,
  Users,
} from 'lucide-react-native';

type IconProps = {
  color?: string;
  size?: number;
  secondaryColor?: string;
  style?: any;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. CAPSULE / PILL ICON
// ─────────────────────────────────────────────────────────────────────────────
export function CapsuleIcon({ color = T.sageGreenSolid, size = 24, style }: IconProps) {
  return <Pill color={color} size={size} strokeWidth={1.8} style={style} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STETHOSCOPE ICON
// ─────────────────────────────────────────────────────────────────────────────
export function StethoscopeIcon({ color = T.sageGreenSolid, size = 24 }: IconProps) {
  return <Stethoscope color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DNA / GENOME HELIX ICON
// ─────────────────────────────────────────────────────────────────────────────
export function GenomeIcon({ color = T.mutedAccentSolid, size = 24 }: IconProps) {
  return <Dna color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SHIELD / GUARDIAN ICON
// ─────────────────────────────────────────────────────────────────────────────
export function ShieldIcon({ color = T.sageGreenSolid, size = 24 }: IconProps) {
  return <ShieldCheck color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LEAF / HERBAL ICON
// ─────────────────────────────────────────────────────────────────────────────
export function LeafIcon({ color = T.sageGreenSolid, size = 24 }: IconProps) {
  return <Leaf color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. HEART / WELLNESS ICON
// ─────────────────────────────────────────────────────────────────────────────
export function HeartIcon({ color = T.dangerClaySolid, size = 24 }: IconProps) {
  return <HeartPulse color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ALLERGY WARNING ICON
// ─────────────────────────────────────────────────────────────────────────────
export function AllergyAlertIcon({ color = T.warningAmberSolid, size = 24 }: IconProps) {
  return <TriangleAlert color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. HOSPITAL / CLINICAL BUILDING ICON
// ─────────────────────────────────────────────────────────────────────────────
export function HospitalIcon({ color = T.mutedAccentSolid, size = 24 }: IconProps) {
  return <Hospital color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. AGE / CALENDAR ICON
// ─────────────────────────────────────────────────────────────────────────────
export function AgeCalendarIcon({ color = T.sageGreenSolid, size = 24 }: IconProps) {
  return <CalendarDays color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. WEIGHT / BALANCE SCALE ICON
// ─────────────────────────────────────────────────────────────────────────────
export function ScaleWeightIcon({ color = T.sageGreenSolid, size = 24 }: IconProps) {
  return <Weight color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. HEIGHT / RULER ICON
// ─────────────────────────────────────────────────────────────────────────────
export function RulerHeightIcon({ color = T.sageGreenSolid, size = 24 }: IconProps) {
  return <Ruler color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. EDIT PENCIL ICON
// ─────────────────────────────────────────────────────────────────────────────
export function EditPencilIcon({ color = T.sageGreenSolid, size = 20 }: IconProps) {
  return <Pencil color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. LOCK / SECURITY ICON
// ─────────────────────────────────────────────────────────────────────────────
export function LockIcon({ color = T.textColor, size = 20 }: IconProps) {
  return <Lock color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. PHONE CALL ICON
// ─────────────────────────────────────────────────────────────────────────────
export function PhoneCallIcon({ color = T.sageGreenSolid, size = 20 }: IconProps) {
  return <Phone color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. LOGOUT EXIT ICON
// ─────────────────────────────────────────────────────────────────────────────
export function LogoutIcon({ color = T.dangerClaySolid, size = 20 }: IconProps) {
  return <LogOut color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. SETTINGS GEAR ICON
// ─────────────────────────────────────────────────────────────────────────────
export function SettingsGearIcon({ color = T.caption, size = 20 }: IconProps) {
  return <Settings color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. MEDICINE CABINET ICON
// ─────────────────────────────────────────────────────────────────────────────
export function CabinetIcon({ color = T.sageGreenSolid, size = 24 }: IconProps) {
  return <ArchiveRestore color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. SUN / MOON DAYTIME ICON
// ─────────────────────────────────────────────────────────────────────────────
export function SunMoonIcon({ isNight = false, color = T.clayOchre, size = 22 }: IconProps & { isNight?: boolean }) {
  if (isNight) {
    return <Moon color={color} size={size} strokeWidth={1.8} />;
  }
  return <Sun color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 19. THERMOMETER / AMR HEATMAP ICON
// ─────────────────────────────────────────────────────────────────────────────
export function ThermometerIcon({ color = T.dangerClaySolid, size = 24 }: IconProps) {
  return <Thermometer color={color} size={size} strokeWidth={1.8} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 20. USERS / PEOPLE GROUP ICON
// ─────────────────────────────────────────────────────────────────────────────
export function UsersGroupIcon({ color = T.mutedAccentSolid, size = 22 }: IconProps) {
  return <Users color={color} size={size} strokeWidth={1.8} />;
}
