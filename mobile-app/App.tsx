import 'react-native-gesture-handler'; // Must be the first import per react-native-gesture-handler docs
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import * as Notifications from 'expo-notifications';
import { supabase } from './src/lib/supabase';

/**
 * MedSentry — root entry point.
 *
 * Provider order (outermost → innermost):
 * 1. GestureHandlerRootView   — required by react-native-gesture-handler + Reanimated
 * 2. SafeAreaProvider         — edge-to-edge safe area awareness (plan.md §7 cross-cutting UX)
 * 3. AuthProvider             — session + profile state for the whole app
 * 4. RootNavigator            — branches on session: Auth stack vs App navigator
 */
export default function App() {
  useEffect(() => {
    // Listen for interactive notification actions (Taken, Snooze, Skipped)
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const action = response.actionIdentifier;
      const courseId = response.notification.request.content.data?.courseId;

      if (!courseId) return;

      if (action === 'TAKEN' || action === 'SKIPPED' || action === 'SNOOZE') {
        const logStatus = action === 'TAKEN' ? 'taken' : action === 'SKIPPED' ? 'skipped' : 'snoozed';
        
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payload = {
            course_id: courseId,
            status: logStatus,
          };
          
          await supabase.from('dose_logs').insert(payload as any);

          if (action === 'SNOOZE') {
            // Schedule another notification 15 minutes from now
            await Notifications.scheduleNotificationAsync({
              content: {
                title: response.notification.request.content.title,
                body: response.notification.request.content.body,
                sound: true,
                categoryIdentifier: 'DOSE_ACTION',
                data: response.notification.request.content.data,
              },
              trigger: { 
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
                seconds: 15 * 60 
              } as Notifications.TimeIntervalTriggerInput,
            });
          }
        } catch (err) {
          console.error('Error handling notification action:', err);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
