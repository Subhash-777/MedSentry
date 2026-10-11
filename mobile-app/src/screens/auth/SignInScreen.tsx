import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
  Keyboard,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../../lib/supabase';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import * as T from '../../theme/colors';
import { EmailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../navigation/TabIcons';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;
};

// Initialize Google Sign-In
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
if (webClientId) {
  GoogleSignin.configure({ webClientId, scopes: ['profile', 'email'] });
}

export default function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  async function handleSignIn() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    setLoading(false);
    if (error) setErrorMsg(error.message || 'Failed to sign in.');
    // On success, AuthContext detects the new session and navigates to App
  }

  async function handleGoogleSignIn() {
    if (!webClientId) {
      setErrorMsg('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in mobile-app/.env');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.type === 'success') {
        const idToken = userInfo.data.idToken;
        if (idToken) {
          const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
          if (error) throw error;
        } else {
          throw new Error('Google Sign-In succeeded, but no ID token was returned. Check your webClientId config.');
        }
      } else if (userInfo.type === 'cancelled') {
        console.log('Google Sign-In cancelled');
      } else {
        throw new Error('Google Sign-In failed or was cancelled.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(40, keyboardHeight) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Header ── */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          {/* Logo mark */}
          <View style={styles.logoWrap}>
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

        {/* ── Sign-in Card ── */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Text style={styles.label}>EMAIL</Text>
          <View style={styles.inputRow}>
            <View style={styles.fieldIconWrap}>
              <EmailIcon color={T.caption} size={18} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={T.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              value={email}
              onChangeText={(t) => { setEmail(t); if (errorMsg) setErrorMsg(null); }}
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={[styles.inputRow, { marginBottom: T.spacing.xxl }]}>
            <View style={styles.fieldIconWrap}>
              <LockIcon color={T.caption} size={18} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={T.placeholder}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={(t) => { setPassword(t); if (errorMsg) setErrorMsg(null); }}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showPass ? <EyeOffIcon color={T.caption} size={18} /> : <EyeIcon color={T.caption} size={18} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSignIn}
            accessibilityRole="button"
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.primaryBtnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.btnDisabled]}
            onPress={handleGoogleSignIn}
            accessibilityRole="button"
            disabled={loading}
          >
            <View style={styles.googleIconCircle}>
              <Text style={styles.googleLetter}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account? "}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              accessibilityRole="button"
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              disabled={loading}
            >
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: T.spacing.lg,  // 16px — Universal horizontal margin
    paddingTop: T.spacing.max,        // 40px
    paddingBottom: T.spacing.max,
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    marginBottom: T.spacing.xxxl,     // 32px
  },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: T.radius.large,     // 20px — large card scale
    backgroundColor: T.paleJade + '44',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.sageGreen + '55',
    marginBottom: T.spacing.lg,       // 16px
    ...T.cardShadow,
  },
  logoImage: {
    width: 76,
    height: 76,
  },
  appName: {
    fontSize: T.fontSize.title,       // 28sp bold
    fontWeight: '800',
    color: T.textColor,
    letterSpacing: 1.5,
    marginBottom: T.spacing.xs,       // 4px
  },
  appNameAccent: {
    color: T.sageGreenSolid,
  },
  tagline: {
    fontSize: T.fontSize.caption,     // 13sp
    color: T.midSlate,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── Card ──
  card: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,      // 16px — standard card
    padding: T.spacing.xxl,           // 24px — card padding minimum
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  cardTitle: {
    fontSize: T.fontSize.sectionHeading,  // 20sp bold
    fontWeight: '800',
    color: T.textColor,
    marginBottom: T.spacing.xl,           // 20px
    letterSpacing: -0.3,
  },

  // ── Error ──
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: T.spacing.sm,                // 8px
    backgroundColor: T.dangerClay + '14',
    borderWidth: 1,
    borderColor: T.dangerClay + '44',
    borderRadius: T.radius.small,     // 12px — small element scale
    padding: T.spacing.lg,            // 16px
    marginBottom: T.spacing.lg,
  },
  errorIcon: { fontSize: 14, color: T.dangerClaySolid },
  errorText: {
    flex: 1,
    color: T.dangerClaySolid,
    fontSize: T.fontSize.body,        // 16sp — body minimum
    fontWeight: '600',
  },

  // ── Form ──
  label: {
    fontSize: T.fontSize.label,       // 12sp semi-bold uppercase label
    fontWeight: '600',
    color: T.midSlate,
    marginBottom: T.spacing.sm,       // 8px
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.warmCocoa + '44',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    marginBottom: T.spacing.lg,
    paddingRight: 4,
    overflow: 'hidden',
  },
  fieldIconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    height: T.componentSize.inputHeight,
    fontSize: T.fontSize.body,
    color: T.textColor,
    paddingVertical: 0,
  },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 14 },

  // ── Buttons ──
  primaryBtn: {
    backgroundColor: T.sageGreenSolid,
    borderRadius: T.radius.large,     // 20px — primary button scale
    height: T.componentSize.buttonPrimary, // 56px
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.spacing.xl,       // 20px
    shadowColor: T.sageGreenSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    color: '#FFF',
    fontSize: T.fontSize.body,        // 16sp
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.spacing.xl,       // 20px
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: {
    marginHorizontal: T.spacing.lg,   // 16px
    color: T.midSlate,
    fontSize: T.fontSize.caption,     // 13sp
    fontWeight: '600',
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surfaceCard,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.large,     // 20px
    height: T.componentSize.buttonSecondary, // 48px secondary button
    marginBottom: T.spacing.xxl,      // 24px
    gap: T.spacing.sm,                // 8px
    ...T.subtleShadow,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,                 // hardcoded — geometric circle, must stay at width/2
    // Google brand color, not app palette — do not change
    backgroundColor: '#DB4437' + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DB4437' + '33',
  },
  // Google brand color, not app palette — do not change
  googleLetter: { fontSize: 14, fontWeight: '800', color: '#DB4437' },
  googleBtnText: {
    color: T.textColor,
    fontSize: T.fontSize.body,        // 16sp
    fontWeight: '600',
  },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: T.midSlate, fontSize: T.fontSize.caption },  // 13sp
  linkText: {
    color: T.mutedAccentSolid,
    fontSize: T.fontSize.caption,     // 13sp
    fontWeight: '700',
  },
});
