/**
 * TabIcons — Clean, production-quality icon components for the bottom tab bar
 * and form field inputs. Powered by Lucide React Native SVG icons.
 * Every export name is preserved from the original hand-drawn set.
 * Color is passed as a prop so active/inactive states are handled by the caller.
 */
import React from 'react';
import {
  House,
  ScanLine,
  Pill,
  Users,
  BotMessageSquare,
  NotebookPen,
  CircleUserRound,
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  User,
} from 'lucide-react-native';

type Props = { color?: string; size?: number };

// ─── Home ──────────────────────────────────────────────────────────────────
export function HomeIcon({ color = '#8A99AD', size = 22 }: Props) {
  return <House color={color} size={size} strokeWidth={1.8} />;
}

// ─── Scan (viewfinder) ─────────────────────────────────────────────────────
export function ScanIcon({ color = '#8A99AD', size = 22 }: Props) {
  return <ScanLine color={color} size={size} strokeWidth={1.8} />;
}

// ─── Meds (pill capsule) ───────────────────────────────────────────────────
export function MedsIcon({ color = '#8A99AD', size = 22 }: Props) {
  return <Pill color={color} size={size} strokeWidth={1.8} />;
}

// ─── Family (two people) ───────────────────────────────────────────────────
export function FamilyIcon({ color = '#8A99AD', size = 22 }: Props) {
  return <Users color={color} size={size} strokeWidth={1.8} />;
}

// ─── AI (stethoscope simplified → bot) ─────────────────────────────────────
export function AIIcon({ color = '#8A99AD', size = 22 }: Props) {
  return <BotMessageSquare color={color} size={size} strokeWidth={1.8} />;
}

// ─── Journal (notebook) ────────────────────────────────────────────────────
export function JournalIcon({ color = '#8A99AD', size = 22 }: Props) {
  return <NotebookPen color={color} size={size} strokeWidth={1.8} />;
}

// ─── Profile (person silhouette) ───────────────────────────────────────────
export function ProfileIcon({ color = '#8A99AD', size = 22 }: Props) {
  return <CircleUserRound color={color} size={size} strokeWidth={1.8} />;
}

// ─── Admin (shield with lock) ──────────────────────────────────────────────
export function AdminIcon({ color = '#8A99AD', size = 22 }: Props) {
  return <ShieldCheck color={color} size={size} strokeWidth={1.8} />;
}

// ─── Form Field Icons ──────────────────────────────────────────────────────
export function UserIcon({ color = '#8A99AD', size = 18 }: Props) {
  return <User color={color} size={size} strokeWidth={1.8} />;
}

export function EmailIcon({ color = '#8A99AD', size = 18 }: Props) {
  return <Mail color={color} size={size} strokeWidth={1.8} />;
}

export function LockIcon({ color = '#8A99AD', size = 18 }: Props) {
  return <Lock color={color} size={size} strokeWidth={1.8} />;
}

export function KeyIcon({ color = '#8A99AD', size = 18 }: Props) {
  return <KeyRound color={color} size={size} strokeWidth={1.8} />;
}

export function EyeIcon({ color = '#8A99AD', size = 18 }: Props) {
  return <Eye color={color} size={size} strokeWidth={1.8} />;
}

export function EyeOffIcon({ color = '#8A99AD', size = 18 }: Props) {
  return <EyeOff color={color} size={size} strokeWidth={1.8} />;
}
