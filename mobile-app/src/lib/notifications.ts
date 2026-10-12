import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSavedDoseSchedule } from './notificationSchedule';
import { supabase } from './supabase';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('DOSE_ACTION', [
    {
      identifier: 'TAKEN',
      buttonTitle: 'Taken',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Snooze 15 min',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SKIPPED',
      buttonTitle: 'Skipped',
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
}

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4C6EF5',
    });
  }
  
  await setupNotificationCategories();
  return true;
}

export async function scheduleDailyDoseReminder(courseId: string, drugName: string, frequency: string[]) {
  // Retrieve user's customized dose schedule timings
  const userSchedule = await getSavedDoseSchedule();
  const scheduleTimes: { hour: number; minute: number }[] = [];

  // If frequency array is empty, default to morning dose time
  if (!frequency || frequency.length === 0) {
    scheduleTimes.push({ hour: userSchedule.morning.hour, minute: userSchedule.morning.minute });
  } else {
    frequency.forEach((freq) => {
      const lower = freq.toLowerCase();
      if (lower.includes('morning')) {
        scheduleTimes.push({ hour: userSchedule.morning.hour, minute: userSchedule.morning.minute });
      } else if (lower.includes('afternoon')) {
        scheduleTimes.push({ hour: userSchedule.afternoon.hour, minute: userSchedule.afternoon.minute });
      } else if (lower.includes('evening')) {
        scheduleTimes.push({ hour: userSchedule.evening.hour, minute: userSchedule.evening.minute });
      } else if (lower.includes('night') || lower.includes('bed')) {
        scheduleTimes.push({ hour: userSchedule.night.hour, minute: userSchedule.night.minute });
      } else {
        // Fallback for generic frequencies (e.g. daily), schedule at morning dose time
        scheduleTimes.push({ hour: userSchedule.morning.hour, minute: userSchedule.morning.minute });
      }
    });
  }

  // Deduplicate schedule times
  const uniqueTimes = Array.from(new Set(scheduleTimes.map((t) => `${t.hour}:${t.minute}`))).map((str) => {
    const [h, m] = str.split(':');
    return { hour: parseInt(h, 10), minute: parseInt(m, 10) };
  });

  for (const time of uniqueTimes) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for your medication 💊',
        body: `Remember to take your scheduled dose of ${drugName}.`,
        sound: true,
        categoryIdentifier: 'DOSE_ACTION', // for interactive buttons
        data: { courseId }, // Pass context to the background action
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      } as Notifications.DailyTriggerInput,
    });
  }
}

/**
 * Fires an immediate test dose reminder notification on the user's device
 */
export async function sendImmediateTestReminder(slotLabel: string, timeStr: string) {
  await setupNotificationCategories();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `MedSentry Reminder (${slotLabel}) 💊`,
      body: `Test reminder scheduled for ${timeStr}. Clinical intervals active.`,
      sound: true,
      categoryIdentifier: 'DOSE_ACTION',
      data: { isTest: true },
    },
    trigger: null, // trigger immediately
  });
}

/**
 * Re-schedules all active medication courses when the user updates reminder timing
 */
export async function rescheduleAllActiveCoursesReminders() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch active courses
    const { data: courses } = await supabase
      .from('medication_courses')
      .select('id, custom_name, frequency, drug:drugs(name)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!courses || courses.length === 0) return;

    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Re-schedule each course with updated times
    for (const c of courses as any[]) {
      const drugName = c.drug?.name || c.custom_name || 'Medication';
      await scheduleDailyDoseReminder(c.id, drugName, c.frequency || ['morning']);
    }
  } catch (err) {
    console.warn('Failed to reschedule courses after schedule update', err);
  }
}

export async function scheduleLowStockNudge(drugName: string, daysRemaining: number) {
  if (daysRemaining > 2) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Low Stock Alert',
      body: `You have ${daysRemaining} days remaining for ${drugName}. Time to refill!`,
      sound: true,
    },
    trigger: null, // trigger immediately
  });
}

/**
 * Item 5: schedule a one-shot refill reminder on the computed refill_date.
 * Fires at 9:00 AM on that date so the user gets a morning heads-up.
 */
export async function scheduleRefillReminder(courseId: string, drugName: string, refillDate: Date) {
  const now = new Date();
  // Only schedule if refill date is in the future
  if (refillDate <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Time to Refill',
      body: `Your supply of ${drugName} runs out today. Refill now to stay on track.`,
      sound: true,
      data: { courseId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: refillDate,
    } as Notifications.DateTriggerInput,
  });
}
