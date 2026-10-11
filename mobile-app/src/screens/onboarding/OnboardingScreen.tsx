import React from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, Image,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as T from '../../theme/colors';
import { ScanIcon, AIIcon, FamilyIcon } from '../../navigation/TabIcons';
import { CapsuleIcon } from '../../components/common/MedIcons';

const FEATURES = [
  { renderIcon: (c: string) => <ScanIcon color={c} size={24} />, title: 'Scan Medications', desc: 'Identify pills & prescriptions instantly with your camera' },
  { renderIcon: (c: string) => <CapsuleIcon color={c} size={24} />, title: 'Track Your Doses', desc: 'Never miss a dose — get reminders for every medication' },
  { renderIcon: (c: string) => <FamilyIcon color={c} size={24} />, title: 'Family Circle', desc: 'Coordinate care across your household safely' },
  { renderIcon: (c: string) => <AIIcon color={c} size={24} />, title: 'AI Consultant', desc: 'Ask questions about your medications, anytime' },
];

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/RootNavigator';

type OnboardingProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

/**
 * OnboardingScreen — Brand-updated welcome screen.
 * Uses the new logo asset, Universal Layout sizing, and updated palette.
 */
export default function OnboardingScreen({ navigation }: OnboardingProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* ── Hero ── */}
      <Animated.View entering={ZoomIn.duration(600)} style={styles.heroWrap}>
        {/* Logo mark */}
        <View style={styles.logoBg}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        {/* App name lockup */}
        <Text style={styles.appName}>
          MED<Text style={styles.appNameAccent}>SENTRY</Text>
        </Text>
        <Text style={styles.tagline}>Your Mindful Medication Guide</Text>
      </Animated.View>

      {/* ── Features ── */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={styles.features}
      >
        {FEATURES.map((f, i) => (
          <Animated.View
            key={f.title}
            entering={FadeInDown.duration(400).delay(320 + i * 60)}
            style={styles.featureRow}
          >
            <View style={styles.featureIconWrap}>
              {f.renderIcon(T.sageGreenSolid)}
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </Animated.View>

      {/* ── Get Started CTA ── */}
      <Animated.View entering={FadeInUp.duration(400).delay(680)} style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('SignIn')}
          accessibilityRole="button"
        >
          <Text style={styles.ctaBtnText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
    paddingHorizontal: T.spacing.lg,   // 16px — Universal horizontal margin
    paddingTop: 72,
    paddingBottom: T.spacing.max,      // 40px
  },

  // ── Hero ──
  heroWrap: {
    alignItems: 'center',
    marginBottom: T.spacing.xxl,       // 24px section rhythm
  },
  logoBg: {
    width: 108,
    height: 108,
    borderRadius: T.radius.large,      // 20px — large card scale
    backgroundColor: T.paleJade + '44',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.sageGreen + '55',
    marginBottom: T.spacing.lg,        // 16px
    ...T.cardShadow,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: T.fontSize.title,        // 28sp bold
    fontWeight: '800',
    color: T.textColor,
    letterSpacing: 1.5,
    marginBottom: T.spacing.xs,        // 4px
  },
  appNameAccent: {
    color: T.sageGreenSolid,
  },
  tagline: {
    fontSize: T.fontSize.caption,      // 13sp
    color: T.midSlate,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── Features ──
  features: {
    gap: T.spacing.md,                 // 12px — item rhythm
    marginBottom: T.spacing.xxl,       // 24px section rhythm
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.spacing.lg,                 // 16px
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,       // 16px — standard card
    padding: T.spacing.lg,             // 16px — card padding minimum
    borderWidth: 1,
    borderColor: T.border,
    minHeight: T.componentSize.touchTarget, // 48px minimum touch target
    ...T.subtleShadow,
  },
  featureIconWrap: {
    width: T.componentSize.touchTarget,    // 48px touch target
    height: T.componentSize.touchTarget,
    borderRadius: T.radius.small,          // 12px — small element scale
    backgroundColor: T.paleJade + '55',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  featureIcon: { fontSize: T.componentSize.iconStandard }, // 24px standard icon
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: T.fontSize.body,         // 16sp — never smaller
    fontWeight: '700',
    color: T.textColor,
    marginBottom: T.spacing.xs,        // 4px
  },
  featureDesc: {
    fontSize: T.fontSize.caption,      // 13sp
    color: T.midSlate,
    lineHeight: 18,
  },

  // ── CTA ──
  ctaWrap: {
    marginTop: 'auto' as any,
  },
  ctaBtn: {
    backgroundColor: T.sageGreenSolid,
    borderRadius: T.radius.large,      // 20px — primary button scale
    height: T.componentSize.buttonPrimary, // 56px
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.sageGreenSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: T.fontSize.body,         // 16sp
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
