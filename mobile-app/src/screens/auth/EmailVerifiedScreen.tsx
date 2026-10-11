import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react-native';
import type { AuthStackParamList } from '../../navigation/RootNavigator';
import * as T from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'EmailVerified'>;
};

export default function EmailVerifiedScreen({ navigation }: Props) {
  const { session, user, refreshProfile } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [dbUpdated, setDbUpdated] = useState(false);

  useEffect(() => {
    // On entering this page, execute database profile update
    handleDatabaseUpdate();
  }, [user]);

  async function handleDatabaseUpdate() {
    if (!user) return;
    setUpdating(true);
    try {
      const fullName = user.user_metadata?.full_name || null;
      await (supabase.from('profiles') as any).upsert({
        id: user.id,
        full_name: fullName,
        account_type: 'standard',
        is_admin: false,
        updated_at: new Date().toISOString(),
      });
      await refreshProfile();
      setDbUpdated(true);
    } catch (err) {
      console.error('[EmailVerifiedScreen] DB update error:', err);
    } finally {
      setUpdating(false);
    }
  }

  const handleVerifiedPress = async () => {
    await handleDatabaseUpdate();
    if (session) {
      // If session exists, user goes directly into main app (handled by RootNavigator session state)
    } else {
      navigation.navigate('SignIn');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      <View style={styles.container}>
        <Animated.View entering={ZoomIn.duration(450)} style={styles.card}>
          <View style={styles.iconWrapOuter}>
            <View style={styles.iconWrapInner}>
              <CheckCircle2 size={42} color={T.sageGreenSolid} />
            </View>
          </View>

          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.subtitle}>
            Your email address has been successfully confirmed. Your account signup details have been recorded in the database.
          </Text>

          {updating && (
            <View style={styles.statusPill}>
              <ActivityIndicator size="small" color={T.sageGreenSolid} />
              <Text style={styles.statusPillText}>Updating Database Details…</Text>
            </View>
          )}

          {dbUpdated && (
            <View style={[styles.statusPill, { backgroundColor: T.sageGreen + '18' }]}>
              <ShieldCheck size={14} color={T.sageGreenSolid} />
              <Text style={[styles.statusPillText, { color: T.sageGreenSolid }]}>Database Record Synced</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleVerifiedPress}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Verified — Continue</Text>
            <ArrowRight size={18} color="#FFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.large,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: T.sageGreen + '33',
    ...T.cardShadow,
  },
  iconWrapOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: T.sageGreen + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  iconWrapInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: T.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.sageGreen + '44',
    ...T.subtleShadow,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: T.textColor,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: T.caption,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.warmCocoa + '44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: T.radius.pill,
    marginBottom: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.textColor,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
    backgroundColor: T.sageGreenSolid,
    borderRadius: T.radius.large,
    ...T.subtleShadow,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
