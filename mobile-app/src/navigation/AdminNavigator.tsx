import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AuditLogViewerScreen from '../screens/admin/AuditLogViewerScreen';
import MisuseHeatmapScreen from '../screens/admin/MisuseHeatmapScreen';
import * as T from '../theme/colors';

// ---------------------------------------------------------------------------
// Admin stack param list
// ---------------------------------------------------------------------------

export type AdminStackParamList = {
  AdminHome: undefined;
  AdminUsers: undefined;
  AdminAPIUsage: undefined;
  AdminAuditLog: undefined;
  AdminMisuseHeatmap: undefined;
};

const AdminStack = createNativeStackNavigator<AdminStackParamList>();

/**
 * AdminNavigator — mounted inside AppNavigator only when profile.is_admin = true.
 *
 * NOTE (plan.md §2.7, §3.4 security model):
 * The client-side is_admin flag controls whether this navigator is mounted —
 * but ALL data-fetching calls in these screens must go through service-role
 * Edge Functions that independently re-verify is_admin server-side.
 * Never trust the flag alone for data access.
 */
export default function AdminNavigator() {
  const headerOptions = {
    headerStyle: { backgroundColor: T.surfaceCard },
    headerTintColor: T.textColor,
    headerTitleStyle: {
      fontWeight: '700' as const,
      fontSize: T.fontSize.body,
      color: T.textColor,
    },
    headerShadowVisible: true,
  };

  return (
    <AdminStack.Navigator screenOptions={headerOptions}>
      <AdminStack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="AdminUsers"
        component={UserManagementScreen}
        options={{ title: 'User Management' }}
      />
      <AdminStack.Screen
        name="AdminAPIUsage"
        component={AdminDashboardScreen}
        options={{ title: 'API Usage' }}
      />
      <AdminStack.Screen
        name="AdminAuditLog"
        component={AuditLogViewerScreen}
        options={{ title: 'Audit Log' }}
      />
      <AdminStack.Screen
        name="AdminMisuseHeatmap"
        component={MisuseHeatmapScreen}
        options={{ title: 'AMR Heatmap' }}
      />
    </AdminStack.Navigator>
  );
}
