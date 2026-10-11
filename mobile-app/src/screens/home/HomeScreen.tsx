import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Image,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn, SlideInRight } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BotMessageSquare, ArrowRight, Check, ShieldCheck, ChevronRight, Sparkles,
  Clock, Pill, Plus, Users, CheckCircle2
} from 'lucide-react-native';
import * as T from '../../theme/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MainTabParamList } from '../../navigation/AppNavigator';

import {
  CapsuleIcon,
  StethoscopeIcon,
  GenomeIcon,
  ShieldIcon,
  LeafIcon,
  HeartIcon,
  SunMoonIcon,
} from '../../components/common/MedIcons';
import { ScanIcon, JournalIcon, FamilyIcon } from '../../navigation/TabIcons';

type NavigationProp = NativeStackNavigationProp<MainTabParamList, 'HomeTab'>;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const AVATAR_PRESETS = [
  { id: 'preset_meds', label: 'Capsule', renderIcon: (c: string) => <CapsuleIcon color={c} size={20} /> },
  { id: 'preset_doctor', label: 'Stethoscope', renderIcon: (c: string) => <StethoscopeIcon color={c} size={20} /> },
  { id: 'preset_dna', label: 'Genome', renderIcon: (c: string) => <GenomeIcon color={c} size={20} /> },
  { id: 'preset_shield', label: 'Guardian', renderIcon: (c: string) => <ShieldIcon color={c} size={20} /> },
  { id: 'preset_leaf', label: 'Herbal', renderIcon: (c: string) => <LeafIcon color={c} size={20} /> },
  { id: 'preset_heart', label: 'Wellness', renderIcon: (c: string) => <HeartIcon color={c} size={20} /> },
];

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [adherencePercent, setAdherencePercent] = useState<number>(100);
  const [nextDose, setNextDose] = useState<{ time: Date; drugName: string } | null>(null);
  const [activeCourseCount, setActiveCourseCount] = useState(0);
  const [familyAlertsCount, setFamilyAlertsCount] = useState(0);
  const [takenToday, setTakenToday] = useState(0);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const avatarPresetId = user?.user_metadata?.avatar_preset;
  const avatarPresetObj = AVATAR_PRESETS.find((p) => p.id === avatarPresetId);
  const fullName = profile?.full_name?.trim() || user?.user_metadata?.full_name?.trim() || user?.user_metadata?.name?.trim() || 'User';
  const firstName = fullName.split(' ')[0] || 'User';

  const getSortedHours = (course: any) => {
    let hours: number[] = [];
    if (course.frequency && course.frequency.length > 0) {
      hours = course.frequency.map((freq: string) => {
        const lower = freq.toLowerCase();
        if (lower.includes('morning')) return 8;
        if (lower.includes('afternoon')) return 14;
        if (lower.includes('evening')) return 18;
        if (lower.includes('night') || lower.includes('bed')) return 20;
        const match = freq.match(/^(\d{1,2}):\d{2}/);
        if (match) return parseInt(match[1], 10);
        return 9;
      });
    }
    if (hours.length === 0) {
      const count = course.daily_dose || 1;
      if (count === 1) hours = [9];
      else if (count === 2) hours = [8, 20];
      else if (count === 3) hours = [8, 14, 20];
      else hours = Array.from({ length: count }, (_, i) => 8 + Math.floor(i * (12 / count)));
    }
    return Array.from(new Set(hours)).sort((a, b) => a - b);
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: courses } = await supabase
        .from('medication_courses')
        .select(`id, start_date, frequency, daily_dose, custom_name, drug:drugs (name)`)
        .eq('user_id', user.id)
        .eq('status', 'active');

      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - 7);
      windowStart.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from('dose_logs')
        .select('course_id, logged_at, status')
        .gte('logged_at', windowStart.toISOString());

      const activeCourses: any[] = courses || [];
      const recentLogs: any[] = logs || [];
      setActiveCourseCount(activeCourses.length);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentHour = new Date().getHours();

      // Taken today count
      const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
      setTakenToday(recentLogs.filter(l => l.status === 'taken' && new Date(l.logged_at) >= startOfToday).length);

      // Next Dose
      let earliestNextDose: { time: Date; drugName: string } | null = null;
      activeCourses.forEach(course => {
        let courseStart = course.start_date ? new Date(course.start_date) : new Date();
        courseStart.setHours(0, 0, 0, 0);
        const hours = getSortedHours(course);
        const name = course.drug?.name || course.custom_name || 'Unknown Drug';
        const logsToday = recentLogs.filter(l =>
          l.course_id === course.id && new Date(l.logged_at) >= today
        );
        const actionedCount = logsToday.length;
        let derivedNextTime = new Date();
        if (courseStart > today) {
          derivedNextTime = new Date(courseStart);
          derivedNextTime.setHours(hours[0], 0, 0, 0);
        } else if (actionedCount < hours.length) {
          derivedNextTime.setHours(hours[actionedCount], 0, 0, 0);
        } else {
          derivedNextTime.setDate(derivedNextTime.getDate() + 1);
          derivedNextTime.setHours(hours[0], 0, 0, 0);
        }
        if (!earliestNextDose || derivedNextTime < earliestNextDose.time) {
          earliestNextDose = { time: derivedNextTime, drugName: name };
        }
      });
      setNextDose(earliestNextDose);

      // Adherence
      let totalExpected = 0;
      let totalTaken = 0;
      activeCourses.forEach(course => {
        let courseStart = course.start_date ? new Date(course.start_date) : new Date();
        courseStart.setHours(0, 0, 0, 0);
        const effectiveStart = courseStart > windowStart ? courseStart : windowStart;
        if (effectiveStart <= today) {
          const msPerDay = 86400000;
          let daysActive = Math.floor((today.getTime() - effectiveStart.getTime()) / msPerDay);
          daysActive = Math.max(0, Math.min(7, daysActive));
          let expectedDoses = daysActive * getSortedHours(course).length;
          if (courseStart <= today) {
            const hours = getSortedHours(course);
            for (const h of hours) { if (h <= currentHour) expectedDoses++; }
          }
          totalExpected += expectedDoses;
        }
      });
      totalTaken = recentLogs.filter(l => l.status === 'taken').length;
      const calcAdherence = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 100;
      setAdherencePercent(Math.min(100, calcAdherence));
      setFamilyAlertsCount(0);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { fetchDashboardData(); }, [user]));

  const formatTime = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const today = new Date();
    const isTomorrow = d.getDate() !== today.getDate();
    return { time: `${h}:${m} ${ampm}`, suffix: isTomorrow ? 'Tomorrow' : 'Today' };
  };

  const adherenceColor =
    adherencePercent >= 80 ? T.sageGreenSolid :
    adherencePercent >= 50 ? T.warningAmberSolid :
    T.dangerClaySolid;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />
        <ActivityIndicator size="large" color={T.sageGreen} />
        <Text style={styles.loadingText}>Loading your dashboard…</Text>
      </View>
    );
  }

  const nextDoseFormatted = nextDose ? formatTime(nextDose.time) : null;
  const isNight = new Date().getHours() >= 17 || new Date().getHours() < 6;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* ── Hero Header ── */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <SunMoonIcon isNight={isNight} color={T.clayOchre} size={18} />
            <Text style={styles.greeting}>{getGreeting()},</Text>
          </View>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('ProfileTab' as any)}
          accessibilityRole="button"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : avatarPresetObj ? (
            <View style={styles.avatar}>
              {avatarPresetObj.renderIcon(T.sageGreenSolid)}
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Stats Row ── */}
      <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{activeCourseCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{takenToday}</Text>
          <Text style={styles.statLabel}>Taken today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statChip}>
          <Text style={[styles.statValue, { color: adherenceColor }]}>{adherencePercent}%</Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
      </Animated.View>

      {/* ── Next Dose Hero Card ── */}
      <Animated.View entering={ZoomIn.duration(450).delay(150)} style={styles.heroCard}>
        <View style={styles.heroCardHeaderRow}>
          <View style={styles.heroBadgePill}>
            <Clock color={T.sageGreenSolid} size={13} />
            <Text style={styles.heroBadgePillText}>UPCOMING DOSE</Text>
          </View>
          {nextDoseFormatted && (
            <View
              style={[
                styles.heroSuffixPill,
                {
                  backgroundColor:
                    nextDoseFormatted.suffix === 'Today' ? T.sageGreen + '20' : T.warningAmber + '20',
                  borderColor:
                    nextDoseFormatted.suffix === 'Today' ? T.sageGreen + '44' : T.warningAmber + '44',
                },
              ]}
            >
              <Text
                style={[
                  styles.heroSuffixText,
                  {
                    color:
                      nextDoseFormatted.suffix === 'Today'
                        ? T.sageGreenSolid
                        : T.warningAmberSolid,
                  },
                ]}
              >
                {nextDoseFormatted.suffix.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.heroCardMain}>
          <View style={styles.heroCardLeft}>
            {nextDoseFormatted ? (
              <>
                <Text style={styles.heroTime}>{nextDoseFormatted.time}</Text>
                <Text style={styles.heroDrug} numberOfLines={1}>{nextDose!.drugName}</Text>
                <TouchableOpacity
                  style={styles.heroActionBtn}
                  onPress={() => navigation.navigate('MedicationsTab' as any)}
                  activeOpacity={0.8}
                >
                  <Check color="#FFF" size={14} style={{ marginRight: 4 }} />
                  <Text style={styles.heroActionBtnText}>Log Dose</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.heroEmptyTitle}>All Caught Up!</Text>
                <Text style={styles.heroEmptySub}>No pending doses scheduled for today.</Text>
                <TouchableOpacity
                  style={styles.heroActionBtnSecondary}
                  onPress={() => navigation.navigate('MedicationsTab' as any)}
                  activeOpacity={0.8}
                >
                  <Plus color={T.sageGreenSolid} size={14} style={{ marginRight: 4 }} />
                  <Text style={styles.heroActionBtnTextSecondary}>Add Medication</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.heroCardRight}>
            <View style={styles.heroIconWrapOuter}>
              <View style={styles.heroIconWrapInner}>
                {nextDoseFormatted ? (
                  <CapsuleIcon size={28} color={T.sageGreenSolid} />
                ) : (
                  <CheckCircle2 size={28} color={T.sageGreenSolid} />
                )}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── Adherence + Quick Scan ── */}
      <View style={styles.row}>
        {/* Adherence Ring Card */}
        <Animated.View entering={SlideInRight.duration(400).delay(250)} style={[styles.card, styles.adherenceCard]}>
          <Text style={styles.cardLabel}>ADHERENCE</Text>
          <View style={styles.ringWrap}>
            <View style={[styles.ringOuter, { borderColor: adherenceColor + '30' }]}>
              <View style={[styles.ringInner, { borderColor: adherenceColor }]}>
                <Text style={[styles.ringValue, { color: adherenceColor }]}>{adherencePercent}%</Text>
              </View>
            </View>
          </View>
          <Text style={styles.ringLabel}>
            {adherencePercent >= 80 ? 'On track' : adherencePercent >= 50 ? 'Needs attention' : 'Off track'}
          </Text>
        </Animated.View>

        {/* Quick Scan Card */}
        <Animated.View entering={SlideInRight.duration(400).delay(320)} style={[styles.card, styles.scanCard]}>
          <TouchableOpacity style={styles.scanInner} onPress={() => navigation.navigate('ScanTab' as any)}>
            <View style={{ marginBottom: 4 }}>
              <ScanIcon size={28} color="#FFF" />
            </View>
            <Text style={styles.scanTitle}>Quick</Text>
            <Text style={styles.scanTitle}>Scan</Text>
            <View style={styles.scanArrow}>
              <ArrowRight color="#FFF" size={16} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Bottom Row ── */}
      <View style={styles.row}>
        {/* My Medications shortcut */}
        <Animated.View entering={FadeInUp.duration(400).delay(380)} style={[styles.card, styles.medCard]}>
          <TouchableOpacity style={styles.medInner} onPress={() => navigation.navigate('MedicationsTab' as any)}>
            <View style={styles.medIconWrap}>
              <JournalIcon size={22} color={T.sageGreenSolid} />
            </View>
            <Text style={styles.medTitle}>My{'\n'}Medications</Text>
            <Text style={styles.medCount}>{activeCourseCount} active</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Family Alerts */}
        <Animated.View entering={FadeInUp.duration(400).delay(420)} style={[styles.card, styles.familyCard]}>
          <TouchableOpacity
            style={styles.familyInner}
            onPress={() => navigation.navigate('FamilyTab' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>FAMILY</Text>
              <View style={[styles.alertDot, { backgroundColor: familyAlertsCount > 0 ? T.dangerClaySolid : T.sageGreenSolid }]} />
            </View>
            
            <View style={styles.familyCenterBody}>
              <View style={styles.familyIconWrap}>
                <Users color={T.sageGreenSolid} size={22} />
              </View>
              {familyAlertsCount > 0 ? (
                <View style={styles.familyAlertBadge}>
                  <Text style={styles.familyAlertVal}>{familyAlertsCount}</Text>
                  <Text style={styles.familyAlertText}>Alert{familyAlertsCount > 1 ? 's' : ''}</Text>
                </View>
              ) : (
                <View style={styles.familySyncedBadge}>
                  <Check color={T.sageGreenSolid} size={14} style={{ marginRight: 2 }} />
                  <Text style={styles.familySyncedText}>Synced</Text>
                </View>
              )}
            </View>

            <View style={styles.familyFooterRow}>
              <Text style={styles.familyNote}>
                {familyAlertsCount > 0 ? 'Requires attention' : 'All members good'}
              </Text>
              <ChevronRight color={T.caption} size={14} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── AI Consultant shortcut ── */}
      <Animated.View entering={FadeInUp.duration(400).delay(460)} style={styles.aiCard}>
        <TouchableOpacity style={styles.aiInner} onPress={() => navigation.navigate('AITab' as any)}>
          <View style={styles.aiLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Sparkles color={T.sageGreenSolid} size={14} />
              <Text style={styles.aiTitle}>AI Consultant</Text>
            </View>
            <Text style={styles.aiSub}>Ask about your medications or scan an image</Text>
          </View>
          <View style={styles.aiIconWrap}>
            <BotMessageSquare color={T.sageGreenSolid} size={24} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Admin Control Portal Shortcut (If Admin) ── */}
      {profile?.is_admin && (
        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={{ marginTop: 12 }}>
          <TouchableOpacity
            style={styles.homeAdminCard}
            onPress={() => navigation.navigate('AdminTab' as any)}
            activeOpacity={0.88}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.homeAdminIconWrap}>
                <ShieldCheck color={T.sageGreenSolid} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.homeAdminTitle}>Admin Control Console</Text>
                  <View style={styles.homeAdminBadge}>
                    <Text style={styles.homeAdminBadgeText}>ADMIN</Text>
                  </View>
                </View>
                <Text style={styles.homeAdminSub}>Manage users, system logs &amp; AMR heatmaps</Text>
              </View>
              <ChevronRight color={T.sageGreenSolid} size={18} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  loadingText: { marginTop: 12, color: T.caption, fontSize: T.fontSize.caption },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { fontSize: 15, color: T.caption, fontWeight: '500', marginBottom: 2 },
  name: { fontSize: 28, fontWeight: '800', color: T.textColor, letterSpacing: -0.5 },
  avatarBtn: { marginTop: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.sageGreen + '33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.sageGreen,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: T.sageGreen,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: T.sageGreenSolid },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  statChip: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: T.textColor },
  statLabel: { fontSize: T.fontSize.caption, color: T.caption, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: T.border },

  // Hero Card
  heroCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.large,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: T.sageGreen + '33',
    ...T.cardShadow,
  },
  heroCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  heroBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: T.sageGreenSolid,
    letterSpacing: 0.8,
  },
  heroSuffixPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    borderWidth: 1,
  },
  heroSuffixText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSuffixPillSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    backgroundColor: T.warmCocoa + '22',
    borderWidth: 1,
    borderColor: T.border,
  },
  heroSuffixTextSecondary: {
    fontSize: 10,
    fontWeight: '700',
    color: T.caption,
    letterSpacing: 0.5,
  },
  heroCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heroTime: {
    fontSize: 34,
    fontWeight: '800',
    color: T.textColor,
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  heroDrug: {
    fontSize: 14,
    color: T.caption,
    fontWeight: '600',
    marginBottom: 12,
  },
  heroEmptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: T.textColor,
    marginBottom: 2,
  },
  heroEmptySub: {
    fontSize: 13,
    color: T.caption,
    fontWeight: '500',
    marginBottom: 12,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreenSolid,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: T.radius.button,
    alignSelf: 'flex-start',
    ...T.subtleShadow,
  },
  heroActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: T.radius.button,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  heroActionBtnTextSecondary: {
    fontSize: 13,
    fontWeight: '700',
    color: T.sageGreenSolid,
  },
  heroCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconWrapOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.sageGreen + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  heroIconWrapInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.sageGreen + '44',
    ...T.subtleShadow,
  },

  // Generic card base
  card: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: T.fontSize.label,
    color: T.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Two-column row
  row: { flexDirection: 'row', gap: 14, marginBottom: 14 },

  // Adherence
  adherenceCard: { flex: 1, padding: 18, alignItems: 'center' },
  ringWrap: { marginVertical: 12, alignItems: 'center' },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surfaceCard,
  },
  ringValue: { fontSize: 18, fontWeight: '800' },
  ringLabel: { fontSize: T.fontSize.caption, color: T.caption, textAlign: 'center', fontWeight: '500' },

  // Scan card
  scanCard: {
    flex: 0.7,
    backgroundColor: T.mutedAccentSolid,
    borderWidth: 0,
    overflow: 'hidden',
  },
  scanInner: { flex: 1, padding: 18, justifyContent: 'space-between', minHeight: 150 },
  scanIcon: { fontSize: 30, marginBottom: 4 },
  scanTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', lineHeight: 24 },
  scanArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  scanArrowText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  // Meds card
  medCard: { flex: 1, overflow: 'hidden' },
  medInner: { padding: 18, flex: 1 },
  medIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: T.warmCocoa + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  medIcon: { fontSize: 20 },
  medTitle: { fontSize: 16, fontWeight: '700', color: T.textColor, lineHeight: 22, marginBottom: 4 },
  medCount: { fontSize: T.fontSize.caption, color: T.sageGreenSolid, fontWeight: '600' },

  // Family card
  familyCard: { flex: 0.85, overflow: 'hidden' },
  familyInner: { flex: 1, padding: 16, justifyContent: 'space-between' },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  familyCenterBody: { marginVertical: 8, alignItems: 'flex-start' },
  familyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: T.sageGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  familyAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.dangerClaySolid + '18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
  },
  familyAlertVal: { fontSize: 13, fontWeight: '800', color: T.dangerClaySolid },
  familyAlertText: { fontSize: 11, fontWeight: '700', color: T.dangerClaySolid },
  familySyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
  },
  familySyncedText: { fontSize: 11, fontWeight: '700', color: T.sageGreenSolid },
  familyFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  familyNote: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '500' },

  // AI Card
  aiCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.infoTeal + '44',
    ...T.cardShadow,
    overflow: 'hidden',
  },
  aiInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  aiLeft: { flex: 1 },
  aiTitle: { fontSize: 16, fontWeight: '700', color: T.textColor, marginBottom: 4 },
  aiSub: { fontSize: T.fontSize.caption, color: T.caption, lineHeight: 18 },
  aiIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.sageGreen + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  aiIcon: { fontSize: 26 },

  // Home Admin Card
  homeAdminCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    borderWidth: 1.5,
    borderColor: T.sageGreen + '44',
    ...T.cardShadow,
  },
  homeAdminIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.sageGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeAdminTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: T.textColor,
  },
  homeAdminBadge: {
    backgroundColor: T.sageGreen + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  homeAdminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: T.sageGreenSolid,
    letterSpacing: 0.5,
  },
  homeAdminSub: {
    fontSize: 12,
    color: T.caption,
    marginTop: 2,
  },
});
