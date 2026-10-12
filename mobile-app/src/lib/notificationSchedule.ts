import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface SlotTiming {
  id: 'morning' | 'afternoon' | 'evening' | 'night';
  label: string;
  subtitle: string;
  hour: number;
  minute: number;
}

export interface DoseScheduleConfig {
  morning: SlotTiming;
  afternoon: SlotTiming;
  evening: SlotTiming;
  night: SlotTiming;
}

export const STORAGE_KEY_DOSE_SCHEDULE = '@medsentry_dose_schedule';

/**
 * Default clinical dose schedules:
 * Morning: 08:00 AM
 * Afternoon: 01:00 PM (13:00) -> 5h interval
 * Evening: 06:00 PM (18:00) -> 5h interval
 * Night: 09:00 PM (21:00) -> 3h interval
 */
export const DEFAULT_DOSE_SCHEDULE: DoseScheduleConfig = {
  morning: {
    id: 'morning',
    label: 'Morning Dose',
    subtitle: 'With or after breakfast',
    hour: 8,
    minute: 0,
  },
  afternoon: {
    id: 'afternoon',
    label: 'Afternoon Dose',
    subtitle: 'With or after lunch',
    hour: 13,
    minute: 0,
  },
  evening: {
    id: 'evening',
    label: 'Evening Dose',
    subtitle: 'With or after dinner',
    hour: 18,
    minute: 0,
  },
  night: {
    id: 'night',
    label: 'Bedtime Dose',
    subtitle: 'Before sleep',
    hour: 21,
    minute: 0,
  },
};

export const PRESET_SCHEDULES: { id: string; name: string; description: string; schedule: DoseScheduleConfig }[] = [
  {
    id: 'standard',
    name: 'Standard Rhythm',
    description: 'Balanced for regular 8am–9pm workdays',
    schedule: DEFAULT_DOSE_SCHEDULE,
  },
  {
    id: 'early',
    name: 'Early Riser',
    description: 'Suited for 6:30am starts',
    schedule: {
      morning: { id: 'morning', label: 'Morning Dose', subtitle: 'With or after breakfast', hour: 6, minute: 30 },
      afternoon: { id: 'afternoon', label: 'Afternoon Dose', subtitle: 'With or after lunch', hour: 12, minute: 0 },
      evening: { id: 'evening', label: 'Evening Dose', subtitle: 'With or after dinner', hour: 17, minute: 30 },
      night: { id: 'night', label: 'Bedtime Dose', subtitle: 'Before sleep', hour: 20, minute: 30 },
    },
  },
  {
    id: 'flexible',
    name: 'Late Schedule',
    description: 'Suited for later morning routines',
    schedule: {
      morning: { id: 'morning', label: 'Morning Dose', subtitle: 'With or after breakfast', hour: 9, minute: 30 },
      afternoon: { id: 'afternoon', label: 'Afternoon Dose', subtitle: 'With or after lunch', hour: 14, minute: 30 },
      evening: { id: 'evening', label: 'Evening Dose', subtitle: 'With or after dinner', hour: 19, minute: 0 },
      night: { id: 'night', label: 'Bedtime Dose', subtitle: 'Before sleep', hour: 22, minute: 30 },
    },
  },
];

/**
 * Format 24h hour and minute to readable 12h format (e.g., 08:00 AM, 01:30 PM)
 */
export function formatTime12(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute < 10 ? `0${minute}` : String(minute);
  return `${h}:${m} ${period}`;
}

/**
 * Calculate minute difference between two time slots
 */
export function getMinuteDifference(h1: number, m1: number, h2: number, m2: number): number {
  return h2 * 60 + m2 - (h1 * 60 + m1);
}

/**
 * Format minutes into readable hour/min interval (e.g. "5h 00m", "3h 30m")
 */
export function formatIntervalMinutes(minutes: number): string {
  if (minutes < 0) return 'Negative interval';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins < 10 ? '0' : ''}${mins}m`;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: {
    morningAfternoon?: string;
    afternoonEvening?: string;
    eveningNight?: string;
    diurnal?: string;
  };
  intervals: {
    morningToAfternoonMinutes: number;
    afternoonToEveningMinutes: number;
    eveningToNightMinutes: number;
  };
}

/**
 * Clinical Interval Constraints:
 * - Morning to Afternoon: Minimum 3 hours (180 mins) spacing
 * - Afternoon to Evening: Minimum 3 hours (180 mins) spacing
 * - Evening to Night: Minimum 2.5 hours (150 mins) spacing
 * - Diurnal boundary: Morning >= 05:00 AM, Night <= 11:45 PM
 */
export function validateDoseSchedule(schedule: DoseScheduleConfig): ScheduleValidationResult {
  const mToA = getMinuteDifference(
    schedule.morning.hour,
    schedule.morning.minute,
    schedule.afternoon.hour,
    schedule.afternoon.minute
  );
  const aToE = getMinuteDifference(
    schedule.afternoon.hour,
    schedule.afternoon.minute,
    schedule.evening.hour,
    schedule.evening.minute
  );
  const eToN = getMinuteDifference(
    schedule.evening.hour,
    schedule.evening.minute,
    schedule.night.hour,
    schedule.night.minute
  );

  const errors: ScheduleValidationResult['errors'] = {};

  // Check Diurnal Bounds
  if (schedule.morning.hour < 5) {
    errors.diurnal = 'Morning reminder cannot be set earlier than 05:00 AM.';
  } else if (schedule.night.hour === 23 && schedule.night.minute > 45) {
    errors.diurnal = 'Bedtime reminder cannot be set later than 11:45 PM.';
  }

  // Check Morning -> Afternoon spacing (min 180 min)
  if (mToA < 180) {
    errors.morningAfternoon =
      mToA <= 0
        ? 'Afternoon dose must be after morning dose.'
        : `Minimum 3h interval required between Morning and Afternoon doses (currently ${formatIntervalMinutes(mToA)}).`;
  }

  // Check Afternoon -> Evening spacing (min 180 min)
  if (aToE < 180) {
    errors.afternoonEvening =
      aToE <= 0
        ? 'Evening dose must be after afternoon dose.'
        : `Minimum 3h interval required between Afternoon and Evening doses (currently ${formatIntervalMinutes(aToE)}).`;
  }

  // Check Evening -> Night spacing (min 150 min)
  if (eToN < 150) {
    errors.eveningNight =
      eToN <= 0
        ? 'Bedtime dose must be after evening dose.'
        : `Minimum 2.5h interval required between Evening and Bedtime doses (currently ${formatIntervalMinutes(eToN)}).`;
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    intervals: {
      morningToAfternoonMinutes: mToA,
      afternoonToEveningMinutes: aToE,
      eveningToNightMinutes: eToN,
    },
  };
}

/**
 * Retrieve saved schedule from AsyncStorage or defaults
 */
export async function getSavedDoseSchedule(): Promise<DoseScheduleConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_DOSE_SCHEDULE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.morning && parsed.afternoon && parsed.evening && parsed.night) {
        return parsed as DoseScheduleConfig;
      }
    }
  } catch (err) {
    console.warn('Failed to load dose schedule from storage', err);
  }
  return DEFAULT_DOSE_SCHEDULE;
}

/**
 * Save schedule to AsyncStorage and sync to user metadata
 */
export async function saveDoseSchedule(schedule: DoseScheduleConfig): Promise<{ success: boolean; error?: string }> {
  const validation = validateDoseSchedule(schedule);
  if (!validation.isValid) {
    const firstErr =
      validation.errors.morningAfternoon ||
      validation.errors.afternoonEvening ||
      validation.errors.eveningNight ||
      validation.errors.diurnal ||
      'Invalid interval constraints.';
    return { success: false, error: firstErr };
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY_DOSE_SCHEDULE, JSON.stringify(schedule));

    // Best-effort sync to Supabase user metadata
    supabase.auth
      .updateUser({
        data: { dose_notification_schedule: schedule },
      })
      .catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save schedule.' };
  }
}
