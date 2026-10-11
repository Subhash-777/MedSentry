import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import * as T from '../theme/colors';
import {
  HomeIcon, ScanIcon, MedsIcon, FamilyIcon,
  AIIcon, JournalIcon, ProfileIcon, AdminIcon,
} from './TabIcons';

// All screens
import HomeScreen from '../screens/home/HomeScreen';
import ScanScreen from '../screens/scan/ScanScreen';
import MedicineDetailScreen from '../screens/medicine/MedicineDetailScreen';
import MyMedicationsScreen from '../screens/medications/MyMedicationsScreen';
import FamilyCircleScreen from '../screens/family/FamilyCircleScreen';
import CabinetInventoryScreen from '../screens/family/CabinetInventoryScreen';
import MemberProfileScreen from '../screens/family/MemberProfileScreen';
import AIConsultantScreen from '../screens/ai/AIConsultantScreen';
import AIChatbotScreen from '../screens/ai/AIChatbotScreen';
import SymptomJournalScreen from '../screens/symptoms/SymptomJournalScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettingsScreen';
import AdminNavigator from './AdminNavigator';
import VerifyPrescriptionScreen from '../screens/scan/VerifyPrescriptionScreen';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// ---------------------------------------------------------------------------
// Param list types
// ---------------------------------------------------------------------------

export type HomeStackParamList = {
  Home: undefined;
  MedicineDetail: { drugId: string; stripData?: { expiryDate: string | null; batchNumber: string | null; pillCount: number | null } };
};

export type ScanStackParamList = {
  Scan: undefined;
  VerifyPrescription: { extractedData: any; rawText: string; photoUri: string };
  MedicineDetail: { drugId: string; stripData?: { expiryDate: string | null; batchNumber: string | null; pillCount: number | null } };
};

export type MedicationsStackParamList = {
  MyMedications: undefined;
  MedicineDetail: { drugId: string };
};

export type FamilyStackParamList = {
  FamilyCircle: undefined;
  Cabinet: undefined;
  MemberProfile: { memberId: string; memberName: string; role: string; isLinkedDependent: boolean };
};

export type MainTabParamList = {
  HomeTab: undefined;
  ScanTab: undefined;
  MedicationsTab: undefined;
  FamilyTab: undefined;
  AITab: undefined;
  JournalTab: undefined;
  ProfileTab: undefined;
  AdminTab: undefined;
};

// ---------------------------------------------------------------------------
// Shared header options — warm cream, matches page backgrounds
// ---------------------------------------------------------------------------
const sharedHeader = {
  headerStyle: { backgroundColor: T.surfaceCard },
  headerTintColor: T.textColor,
  headerTitleStyle: {
    fontWeight: '700' as const,
    fontSize: T.fontSize.body,
    color: T.textColor,
    letterSpacing: -0.2,
  },
  headerShadowVisible: true,
};

// ---------------------------------------------------------------------------
// Stacks
// ---------------------------------------------------------------------------

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={sharedHeader}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={{ title: 'Medicine Detail' }} />
    </HomeStack.Navigator>
  );
}

const ScanStack = createNativeStackNavigator<ScanStackParamList>();
function ScanStackNavigator() {
  return (
    <ScanStack.Navigator screenOptions={sharedHeader}>
      <ScanStack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan' }} />
      <ScanStack.Screen name="VerifyPrescription" component={VerifyPrescriptionScreen} options={{ title: 'Verify Prescription' }} />
      <ScanStack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={{ title: 'Medicine Detail' }} />
    </ScanStack.Navigator>
  );
}

const MedicationsStack = createNativeStackNavigator<MedicationsStackParamList>();
function MedicationsStackNavigator() {
  return (
    <MedicationsStack.Navigator screenOptions={sharedHeader}>
      <MedicationsStack.Screen name="MyMedications" component={MyMedicationsScreen} options={{ title: 'My Medications' }} />
      <MedicationsStack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={{ title: 'Medicine Detail' }} />
    </MedicationsStack.Navigator>
  );
}

const FamilyStack = createNativeStackNavigator<FamilyStackParamList>();
function FamilyStackNavigator() {
  return (
    <FamilyStack.Navigator screenOptions={sharedHeader}>
      <FamilyStack.Screen name="FamilyCircle" component={FamilyCircleScreen} options={{ title: 'Family Circle' }} />
      <FamilyStack.Screen name="Cabinet" component={CabinetInventoryScreen} options={{ title: 'Medicine Cabinet' }} />
      <FamilyStack.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={({ route }) => ({ title: route.params.memberName || 'Member Profile' })}
      />
    </FamilyStack.Navigator>
  );
}

const AITopTab = createMaterialTopTabNavigator();
function AITabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: T.background, paddingTop: insets.top }}>
      <AITopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: T.sageGreenSolid,
          tabBarInactiveTintColor: T.caption,
          tabBarIndicatorStyle: { backgroundColor: T.sageGreenSolid, height: 2.5, borderRadius: 2 },
          tabBarLabelStyle: { fontWeight: '700', fontSize: T.fontSize.caption, letterSpacing: 0.3 },
          tabBarStyle: {
            backgroundColor: T.surfaceCard,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: T.border,
          },
        }}
      >
        <AITopTab.Screen name="Consultant" component={AIConsultantScreen} options={{ tabBarLabel: 'Image Scan' }} />
        <AITopTab.Screen name="Chatbot" component={AIChatbotScreen} options={{ tabBarLabel: 'AI Chat' }} />
      </AITopTab.Navigator>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------
type TabConfig = {
  name: keyof MainTabParamList;
  label: string;
  Icon: React.ComponentType<{ color: string; size?: number }>;
};

const TABS: TabConfig[] = [
  { name: 'HomeTab',        label: 'Home',    Icon: HomeIcon    },
  { name: 'ScanTab',        label: 'Scan',    Icon: ScanIcon    },
  { name: 'MedicationsTab', label: 'Meds',    Icon: MedsIcon    },
  { name: 'FamilyTab',      label: 'Family',  Icon: FamilyIcon  },
  { name: 'AITab',          label: 'AI',      Icon: AIIcon      },
  { name: 'JournalTab',     label: 'Journal', Icon: JournalIcon },
  { name: 'ProfileTab',     label: 'Profile', Icon: ProfileIcon },
];
const ADMIN_TAB: TabConfig = { name: 'AdminTab', label: 'Admin', Icon: AdminIcon };

// ---------------------------------------------------------------------------
// Custom Tab Bar
// ---------------------------------------------------------------------------
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tabStyles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={tabStyles.topBorder} />
      <View style={tabStyles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const allTabs = [...TABS, ADMIN_TAB];
          const config = allTabs.find(t => t.name === route.name);
          if (!config) return null;

          const iconColor = isFocused ? T.sageGreenSolid : T.caption;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as string);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={config.label}
              onPress={onPress}
              style={tabStyles.tab}
              activeOpacity={0.65}
            >
              {/* Pill highlight behind active tab */}
              {isFocused && <View style={tabStyles.pill} />}

              {/* Custom vector icon */}
              <config.Icon color={iconColor} size={20} />

              {/* Label */}
              <Text
                style={[
                  tabStyles.label,
                  { color: iconColor },
                  isFocused && tabStyles.labelBold,
                ]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    backgroundColor: T.surfaceCard,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 14,
  },
  topBorder: {
    height: 1,
    backgroundColor: T.border,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingBottom: 5,
    minHeight: 52,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 2,
    left: 3,
    right: 3,
    bottom: 2,
    backgroundColor: T.sageGreen + '22',
    borderRadius: T.radius.small,
    borderWidth: 1,
    borderColor: T.sageGreen + '38',
  },
  label: {
    fontSize: 9.5,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  labelBold: {
    fontWeight: '700',
  },
});

// ---------------------------------------------------------------------------
// Main Tab Navigator
// ---------------------------------------------------------------------------
const Tab = createBottomTabNavigator<MainTabParamList>();

export default function AppNavigator() {
  const { profile } = useAuth();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab"        component={HomeStackNavigator} />
      <Tab.Screen name="ScanTab"        component={ScanStackNavigator} />
      <Tab.Screen name="MedicationsTab" component={MedicationsStackNavigator} />
      <Tab.Screen name="FamilyTab"      component={FamilyStackNavigator} />
      <Tab.Screen name="AITab"          component={AITabNavigator} />
      <Tab.Screen name="JournalTab"     component={SymptomJournalScreen} />
      <Tab.Screen name="ProfileTab"     component={ProfileSettingsScreen} />
      {profile?.is_admin && (
        <Tab.Screen name="AdminTab" component={AdminNavigator} />
      )}
    </Tab.Navigator>
  );
}
