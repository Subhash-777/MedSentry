import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import * as T from '../theme/colors';

// Auth & Onboarding screens
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import EmailVerifiedScreen from '../screens/auth/EmailVerifiedScreen';

// Main app navigator (bottom tabs + nested stacks)
import AppNavigator from './AppNavigator';

// ---------------------------------------------------------------------------
// Param list types
// ---------------------------------------------------------------------------

export type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  EmailVerified: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// ---------------------------------------------------------------------------
// Root Navigator — switches between Auth and App based on session
// ---------------------------------------------------------------------------

export default function RootNavigator() {
  const { session, loading } = useAuth();

  // Show a branded splash screen while restoring the persisted session
  if (loading) {
    return (
      <View style={styles.splash}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={T.sageGreen} style={styles.spinner} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        // Authenticated — show the main app
        <AppNavigator />
      ) : (
        // Unauthenticated — show onboarding / auth flow
        <AuthStack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
          <AuthStack.Screen name="EmailVerified" component={EmailVerifiedScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: T.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 220,
    height: 110,
  },
  spinner: {
    marginTop: 24,
  },
});

