import React, { useState, useRef, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import * as T from '../../theme/colors';
import {
  UserIcon, EmailIcon, LockIcon, KeyIcon, EyeIcon, EyeOffIcon,
} from '../../navigation/TabIcons';

import { CapsuleIcon } from '../../components/common/MedIcons';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

// ── Mini field icon badge ──────────────────────────────────────────────────
function FieldIcon({ icon }: { icon: string }) {
  return (
    <View style={styles.fieldIconWrap}>
      <Text style={styles.fieldIconText}>{icon}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SignUpScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  async function handleSignUp() {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setErrorMsg('Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const verifyUrl = `${supabaseUrl}/functions/v1/verify-email?name=${encodeURIComponent(trimmedName)}&email=${encodeURIComponent(trimmedEmail)}`;

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: verifyUrl,
        data: {
          full_name: trimmedName,
        },
      },
    });

    setLoading(false);

    if (error) {
      let displayError = error.message;
      if (displayError.startsWith('{') && displayError.includes('"status":500')) {
        displayError = "Failed to send confirmation email. Please check your Supabase SMTP configuration or disable 'Confirm email' in the Supabase dashboard.";
      }
      setErrorMsg(displayError || 'Failed to sign up.');
    } else if (data.session) {
      // Instant session returned (e.g. if confirm email is disabled on server)
    } else {
      // Standard email confirmation flow — user must confirm email link
      setSignupSuccess(true);
    }
  }

  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  async function handleResendEmail() {
    setResending(true);
    setResendMsg(null);
    try {
      const redirectTo = Linking.createURL('');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setResendMsg('Confirmation email resent! Check your Inbox & Spam folders.');
    } catch (err: any) {
      let msg = err.message;
      if (msg?.includes('rate limit') || msg?.includes('too many requests')) {
        msg = 'Supabase email rate limit reached (max 3/hour). Disable "Confirm email" in Supabase Dashboard -> Auth -> Providers for instant dev sign in.';
      }
      setResendMsg(msg || 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  }

  const clearError = () => { if (errorMsg) setErrorMsg(null); };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(40, keyboardHeight) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Back button ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.backRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            disabled={loading}
            accessibilityRole="button"
            hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
          >
            <View style={styles.backIconWrap}>
              <Text style={styles.backIconText}>‹</Text>
            </View>
            <Text style={styles.backLabel}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Brand mark ───────────────────────────────────────────── */}
        <Animated.View entering={ZoomIn.duration(400).delay(80)} style={styles.brandWrap}>
          <View style={styles.brandRing}>
            <View style={styles.brandCircle}>
              <CapsuleIcon color={T.sageGreenSolid} size={32} />
            </View>
          </View>
          <Text style={styles.brandName}>MedSentry</Text>
          <Text style={styles.brandTagline}>{"Your family's medication guardian"}</Text>
        </Animated.View>

        {signupSuccess ? (
          /* ── Success State ───────────────────────────────────────── */
          <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
            <View style={styles.successIconWrap}>
              <Text style={styles.successIcon}>✉️</Text>
            </View>
            <Text style={styles.cardTitle}>Check your email</Text>
            <Text style={styles.cardSubtitle}>
              We sent a confirmation link to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>{'\n\n'}
              Tap the link in the email to activate your account.
            </Text>

            {resendMsg && (
              <View style={[styles.errorBox, { backgroundColor: T.infoTeal + '18', borderColor: T.infoTeal + '55', marginBottom: 16 }]}>
                <Text style={[styles.errorText, { color: T.infoTeal }]}>{resendMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, resending && { opacity: 0.5 }]}
              onPress={handleResendEmail}
              disabled={resending}
              accessibilityRole="button"
            >
              {resending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Resend Confirmation Email</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.border, shadowOpacity: 0, elevation: 0 }]}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Text style={[styles.primaryBtnText, { color: T.textColor }]}>Return to Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* ── Sign-Up Form ────────────────────────────────────────── */
          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSub}>Join thousands managing meds smarter</Text>

            {/* Error box */}
            {errorMsg !== null && (
              <Animated.View entering={FadeInDown.duration(280)} style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </Animated.View>
            )}

            {/* Full Name */}
            <Text style={styles.label}>FULL NAME</Text>
            <View style={styles.inputRow}>
              <View style={styles.fieldIconWrap}>
                <UserIcon color={T.caption} size={18} />
              </View>
              <TextInput
                ref={nameRef}
                style={styles.input}
                placeholder="e.g. Jane Doe"
                placeholderTextColor={T.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                value={fullName}
                onChangeText={(t) => { setFullName(t); clearError(); }}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                editable={!loading}
              />
            </View>

            {/* Email */}
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputRow}>
              <View style={styles.fieldIconWrap}>
                <EmailIcon color={T.caption} size={18} />
              </View>
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={T.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                editable={!loading}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputRow}>
              <View style={styles.fieldIconWrap}>
                <LockIcon color={T.caption} size={18} />
              </View>
              <TextInput
                ref={passRef}
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor={T.placeholder}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showPass ? <EyeOffIcon color={T.caption} size={18} /> : <EyeIcon color={T.caption} size={18} />}
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View style={styles.inputRow}>
              <View style={styles.fieldIconWrap}>
                <KeyIcon color={T.caption} size={18} />
              </View>
              <TextInput
                ref={confirmRef}
                style={styles.input}
                placeholder="Repeat your password"
                placeholderTextColor={T.placeholder}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showConfirm ? <EyeOffIcon color={T.caption} size={18} /> : <EyeIcon color={T.caption} size={18} />}
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSignUp}
              accessibilityRole="button"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Footer link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?  </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
  },

  // ── Back button ──────────────────────────────────────────────────────────
  backRow: { marginBottom: 8 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.surfaceCard,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...T.subtleShadow,
  },
  backIconText: { fontSize: 20, color: T.mutedAccentSolid, lineHeight: 22, marginTop: -2 },
  backLabel: { fontSize: T.fontSize.caption, color: T.mutedAccentSolid, fontWeight: '700' },

  // ── Brand ───────────────────────────────────────────────────────────────
  brandWrap: { alignItems: 'center', marginTop: 12, marginBottom: 28 },
  brandRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: T.sageGreen + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: T.sageGreen + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: { fontSize: 30 },
  brandName: { fontSize: 24, fontWeight: '800', color: T.textColor, letterSpacing: -0.5, marginBottom: 4 },
  brandTagline: { fontSize: T.fontSize.caption, color: T.caption },

  // ── Card ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 22,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  cardTitle: {
    fontSize: T.fontSize.sectionHeading,
    fontWeight: '800',
    color: T.textColor,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSub: { fontSize: T.fontSize.caption, color: T.caption, marginBottom: 20 },

  // ── Error ───────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: T.dangerClay + '14',
    borderWidth: 1,
    borderColor: T.dangerClay + '55',
    borderRadius: T.radius.small,
    padding: 14,
    marginBottom: 16,
  },
  errorIcon: { fontSize: 14, color: T.dangerClaySolid },
  errorText: { flex: 1, color: T.dangerClaySolid, fontSize: T.fontSize.caption, fontWeight: '600', lineHeight: 18 },

  // ── Form fields ─────────────────────────────────────────────────────────
  label: {
    fontSize: T.fontSize.label,
    fontWeight: '700',
    color: T.caption,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.warmCocoa + '44',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    marginBottom: 16,
    paddingRight: 4,
    overflow: 'hidden',
  },
  fieldIconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  fieldIconText: { fontSize: 15 },
  input: {
    flex: 1,
    height: 52,
    fontSize: T.fontSize.body,
    color: T.textColor,
    paddingVertical: 0,
  },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 14 },
  eyeText: { fontSize: 15 },

  // ── Primary button ───────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: T.sageGreenSolid,
    borderRadius: T.radius.large,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 4,
    shadowColor: T.sageGreenSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: '#FFF', fontSize: T.fontSize.body, fontWeight: '700', letterSpacing: 0.3 },

  // ── Footer ──────────────────────────────────────────────────────────────
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: T.fontSize.caption, color: T.caption },
  linkText: { fontSize: T.fontSize.caption, color: T.mutedAccentSolid, fontWeight: '800' },

  // ── Success ─────────────────────────────────────────────────────────────
  successIconWrap: { alignItems: 'center', marginBottom: 14 },
  successIcon: { fontSize: 52 },
  cardSubtitle: {
    fontSize: T.fontSize.caption,
    color: T.caption,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  emailHighlight: { color: T.mutedAccentSolid, fontWeight: '700' },
});
