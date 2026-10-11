import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import * as T from '../../theme/colors';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

import { UsersGroupIcon, ThermometerIcon } from '../../components/common/MedIcons';
import { AIIcon, JournalIcon } from '../../navigation/TabIcons';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

// ── Stat Tile ──────────────────────────────────────────────────────────────
function StatTile({
  value, label, color, bg, delay = 0,
}: { value: string | number; label: string; color: string; bg: string; delay?: number }) {
  return (
    <Animated.View entering={ZoomIn.duration(380).delay(delay)} style={[styles.statTile, { borderColor: color + '33' }]}>
      <View style={[styles.statTileDot, { backgroundColor: bg }]} />
      <Text style={[styles.statTileValue, { color }]}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Navigation Card ────────────────────────────────────────────────────────
function NavCard({
  renderIcon, title, desc, color, onPress, delay = 0,
}: { renderIcon: (c: string) => React.ReactNode; title: string; desc: string; color: string; onPress: () => void; delay?: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(380).delay(delay)} style={styles.navCardWrapper}>
      <TouchableOpacity
        style={[styles.navCard, { borderColor: color + '33' }]}
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        <View style={[styles.navCardIconWrap, { backgroundColor: color + '16' }]}>
          {renderIcon(color)}
        </View>
        <Text style={[styles.navCardTitle, { color }]}>{title}</Text>
        <Text style={styles.navCardDesc}>{desc}</Text>
        <Text style={[styles.navCardArrow, { color }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── User Row ────────────────────────────────────────────────────────────────
function UserRow({ user, groups }: { user: any; groups: any[] }) {
  const isAdmin = !!user.is_admin;
  const isOwner = groups.some((g: any) => g.owner_id === user.id);
  const initials = (user.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const dotColor = isAdmin ? T.dangerClaySolid : T.sageGreenSolid;

  return (
    <View style={styles.userRow}>
      <View style={[styles.userAvatar, { backgroundColor: dotColor + '18', borderColor: dotColor + '44' }]}>
        <Text style={[styles.userAvatarText, { color: dotColor }]}>{initials}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.full_name || 'Unnamed'}</Text>
        <Text style={styles.userId} numberOfLines={1}>{user.id?.slice(0, 22)}…</Text>
      </View>
      <View style={styles.userBadges}>
        {isAdmin && (
          <View style={[styles.badge, { backgroundColor: T.dangerClay + '16', borderColor: T.dangerClay + '44' }]}>
            <Text style={[styles.badgeText, { color: T.dangerClaySolid }]}>Admin</Text>
          </View>
        )}
        {isOwner && (
          <View style={[styles.badge, { backgroundColor: T.sageGreen + '18', borderColor: T.sageGreen + '44' }]}>
            <Text style={[styles.badgeText, { color: T.sageGreenSolid }]}>Owner</Text>
          </View>
        )}
        {!isAdmin && !isOwner && (
          <View style={[styles.badge, { backgroundColor: T.warmCocoa + '44', borderColor: T.border }]}>
            <Text style={[styles.badgeText, { color: T.caption }]}>Standard</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminHomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    users: any[];
    groups: any[];
    usage: any[];
    syncs: any[];
    admin_audits: any[];
    caregiver_audits: any[];
  }>({ users: [], groups: [], usage: [], syncs: [], admin_audits: [], caregiver_audits: [] });

  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_dashboard_data', payload: {} }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setData({
        users: json.users || [],
        groups: json.groups || [],
        usage: json.usage || [],
        syncs: json.syncs || [],
        admin_audits: json.admin_audits || [],
        caregiver_audits: json.caregiver_audits || [],
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
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

  // ── Derived stats ──────────────────────────────────────────────────────
  const totalUsers    = data.users.length;
  const adminCount    = data.users.filter(u => u.is_admin).length;
  const circleCount   = data.groups.length;
  const totalAPICalls = data.usage.length;
  const geminiCalls   = data.usage.filter(u => u.provider === 'gemini').length;
  const groqCalls     = data.usage.filter(u => u.provider === 'groq').length;
  const otherCalls    = totalAPICalls - geminiCalls - groqCalls;
  const latestSync    = data.syncs[0]
    ? new Date(data.syncs[0].last_refreshed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : 'Never';
  const syncOk        = data.syncs[0]?.status === 'success';
  const totalAudits   = data.admin_audits.length + data.caregiver_audits.length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={T.sageGreen} />}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>🔐  ADMIN PANEL</Text>
              </View>
              <Text style={styles.headerTitle}>Control Centre</Text>
              <Text style={styles.headerSub}>MedSentry management dashboard</Text>
            </View>
            {loading && <ActivityIndicator color={T.sageGreen} />}
          </View>
        </Animated.View>

        {/* ── Top-level stat strip ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.statsStrip}>
          <StatTile value={totalUsers}   label="Users"   color={T.mutedAccentSolid} bg={T.mutedAccent}       delay={0} />
          <StatTile value={circleCount}  label="Circles" color={T.sageGreenSolid}   bg={T.sageGreen}         delay={50} />
          <StatTile value={totalAPICalls}label="AI Calls" color={T.warningAmberSolid} bg={T.warningAmber}   delay={100} />
          <StatTile value={totalAudits}  label="Audits"  color={T.dangerClaySolid}  bg={T.dangerClay}        delay={150} />
        </Animated.View>

        {/* ── Navigate ─────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>SECTIONS</Text>
        {/* Row 1 */}
        <View style={styles.navRow}>
          <NavCard
            renderIcon={(c) => <UsersGroupIcon color={c} size={22} />}
            title="Users" desc="View & manage all accounts"
            color={T.mutedAccentSolid}
            onPress={() => navigation.navigate('AdminUsers')}
            delay={80}
          />
          <NavCard
            renderIcon={(c) => <AIIcon color={c} size={22} />}
            title="API Usage" desc="Provider breakdown & logs"
            color={T.sageGreenSolid}
            onPress={() => navigation.navigate('AdminAPIUsage')}
            delay={130}
          />
        </View>
        {/* Row 2 */}
        <View style={[styles.navRow, { marginBottom: 24 }]}>
          <NavCard
            renderIcon={(c) => <JournalIcon color={c} size={22} />}
            title="Audit Log" desc="Admin & caregiver events"
            color={T.warningAmberSolid}
            onPress={() => navigation.navigate('AdminAuditLog')}
            delay={180}
          />
          <NavCard
            renderIcon={(c) => <ThermometerIcon color={c} size={22} />}
            title="Heatmap" desc="AMR misuse by region"
            color={T.dangerClaySolid}
            onPress={() => navigation.navigate('AdminMisuseHeatmap')}
            delay={230}
          />
        </View>

        {/* ── User List ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>REGISTERED USERS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminUsers')}>
              <Text style={styles.seeAll}>Manage all ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {data.users.length === 0 ? (
              <Text style={styles.empty}>No users found</Text>
            ) : (
              data.users.slice(0, 5).map((u, i) => (
                <View key={u.id}>
                  <UserRow user={u} groups={data.groups} />
                  {i < Math.min(data.users.length, 5) - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
            {data.users.length > 5 && (
              <TouchableOpacity style={styles.showMoreBtn} onPress={() => navigation.navigate('AdminUsers')}>
                <Text style={styles.showMoreText}>+{data.users.length - 5} more users  ›</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── API Usage breakdown ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(380)} style={styles.section}>
          <Text style={styles.sectionLabel}>API USAGE · LAST 30 DAYS</Text>
          <View style={styles.card}>
            <View style={styles.apiHeroRow}>
              <View style={styles.apiHeroLeft}>
                <Text style={styles.apiHeroValue}>{totalAPICalls}</Text>
                <Text style={styles.apiHeroLabel}>Total calls</Text>
              </View>
              <View style={styles.apiBreakdown}>
                {[
                  { label: 'Gemini',  count: geminiCalls, color: T.infoTeal },
                  { label: 'Groq',    count: groqCalls,   color: T.sageGreen },
                  { label: 'Other',   count: otherCalls,  color: T.warmCocoa },
                ].filter(r => r.count > 0).map(row => (
                  <View key={row.label} style={styles.apiRow}>
                    <View style={[styles.apiDot, { backgroundColor: row.color }]} />
                    <Text style={styles.apiProviderLabel}>{row.label}</Text>
                    <Text style={styles.apiProviderCount}>{row.count}</Text>
                    {totalAPICalls > 0 && (
                      <View style={styles.apiBarBg}>
                        <View style={[styles.apiBarFill, {
                          width: `${Math.round((row.count / totalAPICalls) * 100)}%` as any,
                          backgroundColor: row.color,
                        }]} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.viewDetailBtn} onPress={() => navigation.navigate('AdminAPIUsage')}>
              <Text style={styles.viewDetailText}>View detailed logs  ›</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Dataset Sync Status ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(440)} style={styles.section}>
          <Text style={styles.sectionLabel}>DATASET SYNC STATUS</Text>
          <View style={styles.card}>
            <View style={styles.syncRow}>
              <View style={styles.syncLeft}>
                <Text style={styles.syncDb}>pharma_az_db</Text>
                <Text style={styles.syncTime} numberOfLines={1}>
                  {data.syncs.length === 0
                    ? 'Status: Not configured'
                    : data.syncs[0]?.status === 'success'
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

        {/* ── Recent Audit Events ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECENT AUDIT EVENTS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminAuditLog')}>
              <Text style={styles.seeAll}>View all ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {data.admin_audits.length === 0 ? (
              <Text style={styles.empty}>No recent admin events</Text>
            ) : (
              data.admin_audits.slice(0, 4).map((e: any, i: number) => (
                <View key={e.id || i}>
                  <View style={styles.auditRow}>
                    <View style={styles.auditDot} />
                    <View style={styles.auditContent}>
                      <Text style={styles.auditAction}>{e.action?.replace(/_/g, ' ')}</Text>
                      <Text style={styles.auditTime}>
                        {new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  {i < Math.min(data.admin_audits.length, 4) - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.background },
  scroll: { paddingHorizontal: 16 },

  // Header
  header: { marginBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: T.dangerClay + '18',
    borderRadius: T.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.dangerClay + '44',
  },
  adminBadgeText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.dangerClaySolid, letterSpacing: 0.6 },
  headerTitle: { fontSize: 30, fontWeight: '800', color: T.textColor, letterSpacing: -0.8, marginBottom: 4 },
  headerSub: { fontSize: T.fontSize.caption, color: T.caption },

  // Stats strip
  statsStrip: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statTile: {
    flex: 1,
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    ...T.cardShadow,
  },
  statTileDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  statTileValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  statTileLabel: { fontSize: 9, color: T.caption, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  // Section
  sectionLabel: {
    fontSize: T.fontSize.label,
    fontWeight: '700',
    color: T.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { fontSize: T.fontSize.caption, color: T.mutedAccentSolid, fontWeight: '700' },
  section: { marginBottom: 24 },

  // Nav grid — explicit rows to prevent flex stretch bug
  navRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  navCardWrapper: { flex: 1 },
  navCard: {
    flex: 1,
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    borderWidth: 1,
    minHeight: 130,
    ...T.cardShadow,
    gap: 6,
  },
  navCardIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  navCardIcon: { fontSize: 22 },
  navCardTitle: { fontSize: T.fontSize.body, fontWeight: '700' },
  navCardDesc: { fontSize: T.fontSize.caption, color: T.caption, lineHeight: 17 },
  navCardArrow: { fontSize: 18, fontWeight: '700', marginTop: 4 },

  // Card
  card: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 10 },
  empty: { color: T.caption, textAlign: 'center', paddingVertical: 12, fontSize: T.fontSize.caption },

  // User list
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  userAvatarText: { fontSize: 16, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.textColor, marginBottom: 2 },
  userId: { fontSize: 10, color: T.caption, fontFamily: 'monospace' },
  userBadges: { gap: 4, alignItems: 'flex-end' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: T.radius.pill, borderWidth: 1 },
  badgeText: { fontSize: 9.5, fontWeight: '700' },
  showMoreBtn: { alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border, marginTop: 8 },
  showMoreText: { color: T.mutedAccentSolid, fontWeight: '700', fontSize: T.fontSize.caption },

  // API usage
  apiHeroRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  apiHeroLeft: { justifyContent: 'center', alignItems: 'center', minWidth: 70 },
  apiHeroValue: { fontSize: 40, fontWeight: '800', color: T.textColor, letterSpacing: -1 },
  apiHeroLabel: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  apiBreakdown: { flex: 1, justifyContent: 'center', gap: 8 },
  apiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apiDot: { width: 8, height: 8, borderRadius: 4 },
  apiProviderLabel: { width: 50, fontSize: T.fontSize.caption, color: T.textColor, fontWeight: '600' },
  apiProviderCount: { width: 28, fontSize: T.fontSize.caption, fontWeight: '800', color: T.textColor, textAlign: 'right' },
  apiBarBg: { flex: 1, height: 6, backgroundColor: T.warmCocoa + '44', borderRadius: 3, overflow: 'hidden' },
  apiBarFill: { height: 6, borderRadius: 3 },
  viewDetailBtn: { alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border },
  viewDetailText: { color: T.sageGreenSolid, fontWeight: '700', fontSize: T.fontSize.caption },

  // Sync
  syncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  syncLeft: { flex: 1, flexShrink: 1 },
  syncDb: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor, marginBottom: 3 },
  syncTime: { fontSize: T.fontSize.caption, color: T.caption },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: T.radius.pill, borderWidth: 1, flexShrink: 0 },
  syncDot: { width: 7, height: 7, borderRadius: 3.5 },
  syncBadgeText: { fontSize: T.fontSize.caption, fontWeight: '700', letterSpacing: 0.3 },

  // Audit
  auditRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 2 },
  auditDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: T.warningAmberSolid, marginTop: 5 },
  auditContent: { flex: 1 },
  auditAction: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.textColor, textTransform: 'capitalize', marginBottom: 2 },
  auditTime: { fontSize: T.fontSize.caption, color: T.caption },
});
