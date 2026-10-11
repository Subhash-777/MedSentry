import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Alert, RefreshControl, TouchableOpacity, StatusBar,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import * as T from '../../theme/colors';
import { ChevronRight } from 'lucide-react-native';
import { ThermometerIcon, UsersGroupIcon } from '../../components/common/MedIcons';
import { AIIcon, JournalIcon } from '../../navigation/TabIcons';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ usage: any[]; syncs: any[] }>({ usage: [], syncs: [] });

  const fetchData = React.useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_dashboard_data', payload: {} }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch dashboard data');
      setData({ usage: json.usage || [], syncs: json.syncs || [] });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const totalCalls = data.usage.length;
  const geminiCalls = data.usage.filter(u => u.provider === 'gemini').length;
  const groqCalls = data.usage.filter(u => u.provider === 'groq').length;
  const otherCalls = totalCalls - geminiCalls - groqCalls;
  const latestSync = data.syncs.length > 0 ? new Date(data.syncs[0].last_refreshed_at).toLocaleString() : 'Never';
  const syncStatus = data.syncs.length > 0 ? data.syncs[0].status : 'unknown';
  const syncOk = syncStatus === 'success';

  const QUICK_LINKS = [
    { label: 'User Management', renderIcon: (c: string) => <UsersGroupIcon color={c} size={20} />, route: 'AdminUsers', color: T.mutedAccentSolid },
    { label: 'API Usage', renderIcon: (c: string) => <AIIcon color={c} size={20} />, route: 'AdminApiUsage', color: T.sageGreenSolid },
    { label: 'Audit Log', renderIcon: (c: string) => <JournalIcon color={c} size={20} />, route: 'AdminAuditLog', color: T.warningAmberSolid },
    { label: 'AMR Heatmap', renderIcon: (c: string) => <ThermometerIcon color={c} size={20} />, route: 'AdminMisuseHeatmap', color: T.dangerClaySolid },
  ] as const;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={T.sageGreen} />}
    >
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>SYSTEM CONTROL</Text>
        </View>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>System metrics, API usage & dataset sync log</Text>
      </Animated.View>

      {/* ── Quick Nav Grid ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <Text style={styles.sectionLabel}>QUICK NAVIGATE</Text>
        <View style={styles.navGrid}>
          {QUICK_LINKS.map((link, i) => (
            <Animated.View key={link.route} entering={ZoomIn.duration(350).delay(i * 60)} style={{ flex: 1 }}>
              <TouchableOpacity
                style={[styles.navCard, { borderColor: link.color + '33' }]}
                onPress={() => navigation.navigate(link.route as any)}
                accessibilityRole="button"
              >
                <View style={[styles.navIconWrap, { backgroundColor: link.color + '18' }]}>
                  {link.renderIcon(link.color)}
                </View>
                <Text style={[styles.navLabel, { color: link.color }]} numberOfLines={2}>{link.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* ── API Stats Bento ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Text style={styles.sectionLabel}>API USAGE · LAST 30 DAYS</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardHero]}>
            <Text style={styles.statLabel}>Total Calls</Text>
            <Text style={styles.statValue}>{totalCalls}</Text>
          </View>
          <View style={styles.statsCol}>
            <View style={styles.statCardSmall}>
              <View style={[styles.statDot, { backgroundColor: T.infoTeal }]} />
              <View>
                <Text style={styles.statSmallLabel}>Gemini</Text>
                <Text style={styles.statSmallValue}>{geminiCalls}</Text>
              </View>
            </View>
            <View style={styles.statCardSmall}>
              <View style={[styles.statDot, { backgroundColor: T.sageGreen }]} />
              <View>
                <Text style={styles.statSmallLabel}>Groq</Text>
                <Text style={styles.statSmallValue}>{groqCalls}</Text>
              </View>
            </View>
            {otherCalls > 0 && (
              <View style={styles.statCardSmall}>
                <View style={[styles.statDot, { backgroundColor: T.warmCocoa }]} />
                <View>
                  <Text style={styles.statSmallLabel}>Other</Text>
                  <Text style={styles.statSmallValue}>{otherCalls}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* ── Dataset Sync ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(280)}>
        <Text style={styles.sectionLabel}>DATASET SYNC STATUS</Text>
        <View style={styles.syncCard}>
          <View style={styles.syncRow}>
            <View style={styles.syncLeft}>
              <Text style={styles.syncDb}>pharma_az_db</Text>
              <Text style={styles.syncTime} numberOfLines={1}>
                {data.syncs.length === 0
                  ? 'Status: Not configured'
                  : syncOk
                    ? `Last synced: ${latestSync}`
                    : `Last attempt: ${latestSync}`}
              </Text>
            </View>
            {data.syncs.length === 0 ? (
              <View style={[styles.syncBadge, { backgroundColor: T.caption + '18', borderColor: T.caption + '44' }]}>
                <View style={[styles.syncDot, { backgroundColor: T.caption }]} />
                <Text style={[styles.syncBadgeText, { color: T.caption }]}>UNKNOWN</Text>
              </View>
            ) : (
              <View style={[styles.syncBadge, {
                backgroundColor: syncOk ? T.sageGreen + '18' : T.warningAmber + '18',
                borderColor: syncOk ? T.sageGreen + '44' : T.warningAmber + '44',
              }]}>
                <View style={[styles.syncDot, { backgroundColor: syncOk ? T.sageGreenSolid : T.warningAmberSolid }]} />
                <Text style={[styles.syncBadgeText, { color: syncOk ? T.sageGreenSolid : T.warningAmberSolid }]}>
                  {syncOk ? 'SYNCED' : 'NOT SYNCED'}
                </Text>
              </View>
            )}
          </View>
          {syncOk && data.syncs[0]?.details?.drugs_seeded && (
            <Text style={[styles.syncTime, { marginTop: 10, lineHeight: 18 }]}>
              ✅  {data.syncs[0].details.drugs_seeded} drugs · {data.syncs[0].details.interactions_seeded?.toLocaleString()} interactions loaded
            </Text>
          )}
        </View>
      </Animated.View>

      {/* ── AMR Heatmap CTA Banner ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(340)}>
        <Text style={styles.sectionLabel}>AMR SURVEILLANCE</Text>
        <TouchableOpacity
          style={styles.heatmapBanner}
          onPress={() => navigation.navigate('AdminMisuseHeatmap')}
          activeOpacity={0.88}
          accessibilityRole="button"
        >
          <View style={styles.heatmapHeaderRow}>
            <View style={styles.heatmapBadgePill}>
              <View style={styles.heatmapLiveDot} />
              <Text style={styles.heatmapBadgeText}>LIVE HEATMAP ENGINE</Text>
            </View>
            <View style={styles.heatmapActionPill}>
              <Text style={styles.heatmapActionPillText}>Explore</Text>
              <ChevronRight color={T.dangerClaySolid} size={14} />
            </View>
          </View>
          <View style={styles.heatmapMain}>
            <View style={styles.heatmapIconOuter}>
              <View style={styles.heatmapIconInner}>
                <ThermometerIcon color={T.dangerClaySolid} size={22} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heatmapTitle}>AMR Misuse Heatmap</Text>
              <Text style={styles.heatmapSub}>Drill-down by region, drug category &amp; event type</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 60 },

  // Header
  header: { marginBottom: 28 },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: T.dangerClay + '18',
    borderRadius: T.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.dangerClay + '44',
  },
  adminBadgeText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.dangerClaySolid, letterSpacing: 0.8 },
  title: { fontSize: 30, fontWeight: '800', color: T.textColor, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: T.fontSize.caption, color: T.caption },

  sectionLabel: {
    fontSize: T.fontSize.label,
    fontWeight: '700',
    color: T.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Nav grid
  navGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  navCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    ...T.cardShadow,
  },
  navIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: T.fontSize.caption, fontWeight: '700', textAlign: 'center', lineHeight: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  statCardHero: { flex: 1.2, justifyContent: 'center', alignItems: 'center', minHeight: 130 },
  statLabel: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 48, fontWeight: '800', color: T.textColor, letterSpacing: -2 },

  statsCol: { flex: 1, gap: 10 },
  statCardSmall: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...T.subtleShadow,
  },
  statDot: { width: 10, height: 10, borderRadius: 5 },
  statSmallLabel: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '500' },
  statSmallValue: { fontSize: 20, fontWeight: '800', color: T.textColor },

  // Sync
  syncCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 28,
    ...T.cardShadow,
  },
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  syncLeft: { flex: 1, flexShrink: 1 },
  syncDb: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor, marginBottom: 4 },
  syncTime: { fontSize: T.fontSize.caption, color: T.caption },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    flexShrink: 0,
  },
  syncDot: { width: 7, height: 7, borderRadius: 3.5 },
  syncBadgeText: { fontSize: T.fontSize.caption, fontWeight: '700', letterSpacing: 0.3 },

  // AMR Heatmap CTA Banner
  heatmapBanner: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.large,
    padding: 18,
    borderWidth: 1.5,
    borderColor: T.dangerClay + '44',
    marginBottom: 20,
    ...T.cardShadow,
  },
  heatmapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heatmapBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.dangerClay + '16',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.dangerClay + '38',
  },
  heatmapLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: T.dangerClaySolid,
  },
  heatmapBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: T.dangerClaySolid,
    letterSpacing: 0.8,
  },
  heatmapActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: T.dangerClay + '16',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
  },
  heatmapActionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.dangerClaySolid,
  },
  heatmapMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heatmapIconOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.dangerClay + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.dangerClay + '38',
  },
  heatmapIconInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.dangerClay + '28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: T.textColor,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  heatmapSub: {
    fontSize: 12,
    color: T.caption,
    lineHeight: 16,
  },
});
