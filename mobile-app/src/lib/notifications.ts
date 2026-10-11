import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
  // Derive times based on structured frequency
  const scheduleTimes: { hour: number, minute: number }[] = [];
  
  // If frequency array is empty, default to 9 AM
  if (!frequency || frequency.length === 0) {
    scheduleTimes.push({ hour: 9, minute: 0 });
  } else {
    frequency.forEach(freq => {
      const lower = freq.toLowerCase();
      if (lower.includes('morning')) scheduleTimes.push({ hour: 8, minute: 0 }); // 8 AM
      else if (lower.includes('afternoon')) scheduleTimes.push({ hour: 14, minute: 0 }); // 2 PM
      else if (lower.includes('evening')) scheduleTimes.push({ hour: 18, minute: 0 }); // 6 PM
      else if (lower.includes('night') || lower.includes('bed')) scheduleTimes.push({ hour: 20, minute: 0 }); // 8 PM
      else {
        // Fallback for unknown text, just schedule at 9 AM to be safe
        scheduleTimes.push({ hour: 9, minute: 0 });
      }
    });
  }

  // Deduplicate schedule times
  const uniqueTimes = Array.from(new Set(scheduleTimes.map(t => `${t.hour}:${t.minute}`)))
    .map(str => {
      const [h, m] = str.split(':');
      return { hour: parseInt(h, 10), minute: parseInt(m, 10) };
    });

  for (const time of uniqueTimes) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for your medication 💊',
        body: `Remember to take your dose of ${drugName}.`,
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
