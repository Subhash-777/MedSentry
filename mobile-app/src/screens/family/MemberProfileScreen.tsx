import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FamilyStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import * as T from '../../theme/colors';

import {
  User,
  HeartPulse,
  Crown,
  Eye,
  Pill,
  Clock,
  ClipboardList,
  AlertTriangle,
  Check,
  ShieldCheck,
  ShieldAlert,
  Tag,
} from 'lucide-react-native';

import {
  AllergyAlertIcon,
  AgeCalendarIcon,
  ScaleWeightIcon,
  RulerHeightIcon,
} from '../../components/common/MedIcons';

import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';

type RouteProps = RouteProp<FamilyStackParamList, 'MemberProfile'>;
type NavigationProp = NativeStackNavigationProp<FamilyStackParamList, 'MemberProfile'>;

const AWARE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Access:   { bg: T.sageGreen + '22', text: T.sageGreenSolid, border: T.sageGreen + '55' },
  Watch:    { bg: T.warningAmber + '22', text: T.warningAmberSolid, border: T.warningAmber + '55' },
  Reserve:  { bg: T.dangerClay + '22', text: T.dangerClaySolid, border: T.dangerClay + '55' },
  'Not recommended': { bg: T.dangerClay + '33', text: T.dangerClaySolid, border: T.dangerClay + '88' },
};

const getAwareStyle = (cls: string | null) =>
  AWARE_COLORS[cls ?? ''] ?? { bg: T.mutedAccent + '22', text: T.mutedAccentSolid, border: T.mutedAccent + '55' };

export default function MemberProfileScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { memberId, memberName, role, isLinkedDependent } = route.params;

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [loggingDoseId, setLoggingDoseId] = useState<string | null>(null);

  const fetchMemberDetails = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile (succeeds for self, owner, caregiver)
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .maybeSingle();

      if (prof) {
        setProfileData({ ...(prof as any), isRestrictedViewer: false });
      } else {
        // Fallback for Viewer role: fetch basic non-sensitive demographics from circle_member_profiles view
        const { data: restrictedProf } = await (supabase
          .from('circle_member_profiles')
          .select('id, full_name, account_type')
          .eq('id', memberId)
          .maybeSingle() as any);
        setProfileData(restrictedProf ? { ...restrictedProf, isRestrictedViewer: true } : null);
      }

      // 2. Fetch Active Medication Courses for Member
      const { data: crs, error: crsErr } = await supabase
        .from('medication_courses')
        .select(`id, total_pills, daily_dose, dosage_amount, frequency, instructions, custom_name, days_remaining, status, drug:drugs (id, name, aware_class)`)
        .eq('user_id', memberId)
        .eq('status', 'active');

      if (crsErr) console.error('Fetch courses error:', crsErr.message);
      setCourses(crs || []);

      // 3. Fetch Symptom Journal for Member
      const { data: sym, error: symErr } = await supabase
        .from('symptom_journal')
        .select('*')
        .eq('user_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (symErr) console.error('Fetch symptoms error:', symErr.message);
      setSymptoms(sym || []);
    } catch (err: any) {
      console.error('Fetch member details error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMemberDetails();
  }, [fetchMemberDetails]);

  const handleLogDoseForMember = async (courseId: string, drugLabel: string) => {
    setLoggingDoseId(courseId);
    try {
      const { error } = await (supabase.from('dose_logs') as any).insert({
        course_id: courseId,
        status: 'taken',
      });
      if (error) throw error;

      // Log Caregiver Audit entry if caregiver acting on dependent's behalf
      if (user && user.id !== memberId) {
        await (supabase.from('caregiver_audit_log') as any).insert({
          caregiver_id: user.id,
          target_member_id: memberId,
          action: 'dose_logged_for_dependent',
          details: { course_id: courseId, drug_name: drugLabel },
        }).catch(() => {});
      }

      Alert.alert('✅ Dose Logged', `Logged dose for ${memberName} (${drugLabel}).`);
      fetchMemberDetails();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to log dose.');
    } finally {
      setLoggingDoseId(null);
    }
  };

  const initial = (memberName || 'M').charAt(0).toUpperCase();
  const consentRevoked = profileData?.caregiver_consent_revoked ?? false;

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <SkeletonCard count={3} variant="list" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header Card ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileHeaderCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{initial}</Text>
          </View>
          <Text style={styles.profileName}>{memberName}</Text>
          <Text style={styles.profileSub}>
            {isLinkedDependent ? 'Linked Dependent Account' : 'Standard Member Account'}
          </Text>

          <View style={styles.badgesRow}>
            <View style={[styles.roleBadge, role === 'owner' ? styles.ownerBadge : {}]}>
              {role === 'owner' ? (
                <Crown color={T.sageGreenSolid} size={12} style={{ marginRight: 4 }} />
              ) : role === 'caregiver' ? (
                <HeartPulse color={T.mutedAccentSolid} size={12} style={{ marginRight: 4 }} />
              ) : (
                <Eye color={T.caption} size={12} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.roleBadgeText, role === 'owner' ? styles.ownerBadgeText : {}]}>
                {role.toUpperCase()}
              </Text>
            </View>

            {isLinkedDependent && (
              <View style={[styles.roleBadge, { backgroundColor: T.warningAmber + '22', borderColor: T.warningAmber }]}>
                <User color={T.warningAmber} size={12} style={{ marginRight: 4 }} />
                <Text style={[styles.roleBadgeText, { color: T.warningAmber }]}>DEPENDENT</Text>
              </View>
            )}
          </View>

          {/* Standing Consent Banner (Only shown to caregivers/owners) */}
          {!profileData?.isRestrictedViewer && (
            <View style={[styles.consentBanner, consentRevoked && styles.consentBannerRevoked]}>
              {consentRevoked ? (
                <>
                  <ShieldAlert color={T.dangerClaySolid} size={16} style={{ marginRight: 8 }} />
                  <Text style={styles.consentTextRevoked}>
                    Caregiver edit access revoked by member (Self-Sovereignty Active)
                  </Text>
                </>
              ) : (
                <>
                  <ShieldCheck color={T.sageGreenSolid} size={16} style={{ marginRight: 8 }} />
                  <Text style={styles.consentTextActive}>
                    Standing Caregiver Access Active
                  </Text>
                </>
              )}
            </View>
          )}
        </Animated.View>

        {/* ── Demographics & Medical Safety Card ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Medical &amp; Physical Profile</Text>

          {profileData?.isRestrictedViewer ? (
            <View style={styles.restrictedNoticeBox}>
              <ShieldAlert color={T.caption} size={20} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.restrictedNoticeTitle}>Protected Health Details</Text>
                <Text style={styles.restrictedNoticeSub}>
                  Clinical metrics, conditions, and allergies are private to the member and designated Caregivers.
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <AgeCalendarIcon color={T.sageGreenSolid} size={20} />
                  <Text style={styles.statValue}>{profileData?.age ? `${profileData.age} yrs` : 'N/A'}</Text>
                  <Text style={styles.statLabel}>Age</Text>
                </View>
                <View style={styles.statBox}>
                  <ScaleWeightIcon color={T.sageGreenSolid} size={20} />
                  <Text style={styles.statValue}>{profileData?.weight_kg ? `${profileData.weight_kg} kg` : 'N/A'}</Text>
                  <Text style={styles.statLabel}>Weight</Text>
                </View>
                <View style={styles.statBox}>
                  <RulerHeightIcon color={T.sageGreenSolid} size={20} />
                  <Text style={styles.statValue}>{profileData?.height_cm ? `${profileData.height_cm} cm` : 'N/A'}</Text>
                  <Text style={styles.statLabel}>Height</Text>
                </View>
              </View>

              {/* Known Conditions */}
              <Text style={styles.subSectionTitle}>KNOWN MEDICAL CONDITIONS</Text>
              {profileData?.known_conditions && profileData.known_conditions.length > 0 ? (
                <View style={styles.chipsWrap}>
                  {profileData.known_conditions.map((cond: string, idx: number) => (
                    <View key={idx} style={styles.conditionChip}>
                      <Tag size={12} color={T.infoTealSolid} style={{ marginRight: 4 }} />
                      <Text style={styles.conditionChipText}>{cond}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No pre-existing conditions recorded.</Text>
              )}

              {/* Recorded Allergies */}
              <Text style={styles.subSectionTitle}>RECORDED ALLERGIES</Text>
              {profileData?.allergies && profileData.allergies.length > 0 ? (
                <View style={styles.chipsWrap}>
                  {profileData.allergies.map((alg: string, idx: number) => (
                    <View key={idx} style={styles.allergyChip}>
                      <AllergyAlertIcon color={T.dangerClaySolid} size={14} style={{ marginRight: 4 }} />
                      <Text style={styles.allergyChipText}>{alg}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No drug allergies recorded.</Text>
              )}
            </>
          )}
        </Animated.View>

        {/* ── Active Medication Courses ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Medications ({courses.length})</Text>
          </View>

          {courses.length === 0 ? (
            <EmptyState
              icon={<Pill color={T.sageGreenSolid} size={32} />}
              title="No Active Medications"
              description="This member currently has no active medication courses."
            />
          ) : (
            courses.map((item, idx) => {
              const drugName = item.drug?.name || item.custom_name || 'Medication';
              const awareStyle = getAwareStyle(item.drug?.aware_class);
              const schedule = item.frequency?.join(' · ') || (item.daily_dose ? `${item.daily_dose}× daily` : 'daily');
              const isLowStock = item.days_remaining !== null && item.days_remaining <= 2;

              return (
                <View key={item.id || idx} style={styles.medCard}>
                  <View style={styles.medCardHeader}>
                    <Text style={styles.medName}>{drugName}</Text>
                    {item.drug?.aware_class ? (
                      <View style={[styles.awareBadge, { backgroundColor: awareStyle.bg, borderColor: awareStyle.border }]}>
                        <Text style={[styles.awareBadgeText, { color: awareStyle.text }]}>
                          {item.drug.aware_class}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.medScheduleRow}>
                    <View style={styles.schedulePill}>
                      <Clock color={T.sageGreenSolid} size={12} style={{ marginRight: 4 }} />
                      <Text style={styles.scheduleText}>{schedule}</Text>
                    </View>
                    {item.dosage_amount ? (
                      <View style={styles.schedulePill}>
                        <Pill color={T.sageGreenSolid} size={12} style={{ marginRight: 4 }} />
                        <Text style={styles.scheduleText}>{item.dosage_amount}</Text>
                      </View>
                    ) : null}
                  </View>

                  {!!item.instructions && (
                    <Text style={styles.medInstructions}>Instructions: {item.instructions}</Text>
                  )}

                  {item.days_remaining !== null && (
                    <View style={styles.daysBarWrap}>
                      <View style={styles.daysInfo}>
                        <Text style={styles.daysLabel}>Days Remaining</Text>
                        <Text style={[styles.daysValue, { color: isLowStock ? T.dangerClaySolid : T.sageGreenSolid }]}>
                          {item.days_remaining} days
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(100, (item.days_remaining / 30) * 100)}%`,
                              backgroundColor: isLowStock ? T.dangerClay : T.sageGreen,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  {/* Caregiver Action: Log Dose for Dependent (Restricted to Caregiver/Owner) */}
                  {!consentRevoked && !profileData?.isRestrictedViewer && (
                    <TouchableOpacity
                      style={[styles.logDoseBtn, loggingDoseId === item.id && { opacity: 0.5 }]}
                      onPress={() => handleLogDoseForMember(item.id, drugName)}
                      disabled={loggingDoseId === item.id}
                      accessibilityRole="button"
                    >
                      {loggingDoseId === item.id ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <View style={styles.logDoseBtnInner}>
                          <Check color="#FFF" size={14} style={{ marginRight: 6 }} />
                          <Text style={styles.logDoseBtnText}>Log Dose for {memberName.split(' ')[0]}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </Animated.View>

        {/* ── Symptom Journal History (Restricted to Self, Owner, and Caregivers) ── */}
        {!profileData?.isRestrictedViewer && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Symptom History ({symptoms.length})</Text>

            {symptoms.length === 0 ? (
              <Text style={styles.emptyText}>No recent symptoms logged for this member.</Text>
            ) : (
              symptoms.map((sym, idx) => {
                const date = new Date(sym.created_at);
                const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const isSevere = parseInt(sym.severity) >= 8;

                return (
                  <View key={sym.id || idx} style={styles.symptomRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.symptomTitle}>{sym.symptom}</Text>
                      <Text style={styles.symptomMeta}>
                        {dateStr} · {sym.category_location || 'General'} · {sym.duration_onset || 'Ongoing'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.severityChip,
                        {
                          backgroundColor: isSevere ? T.dangerClay + '22' : T.warningAmber + '22',
                          borderColor: isSevere ? T.dangerClay : T.warningAmber,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityChipText,
                          { color: isSevere ? T.dangerClaySolid : T.warningAmberSolid },
                        ]}
                      >
                        {sym.severity}/10
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },

  // Header Card
  profileHeaderCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.sageGreen + '22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.sageGreenSolid,
    marginBottom: 10,
  },
  avatarTextLarge: { fontSize: 28, fontWeight: '800', color: T.sageGreenSolid },
  profileName: { fontSize: 22, fontWeight: '800', color: T.textColor },
  profileSub: { fontSize: T.fontSize.caption, color: T.caption, marginTop: 2, marginBottom: 10 },

  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    backgroundColor: T.surfaceCard,
    borderWidth: 1,
    borderColor: T.border,
  },
  ownerBadge: { backgroundColor: T.sageGreen + '22', borderColor: T.sageGreen + '55' },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: T.caption },
  ownerBadgeText: { color: T.sageGreenSolid },

  consentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  consentBannerRevoked: {
    backgroundColor: T.dangerClay + '18',
    borderColor: T.dangerClay + '44',
  },
  consentTextActive: { fontSize: 12, fontWeight: '700', color: T.sageGreenSolid },
  consentTextRevoked: { fontSize: 12, fontWeight: '700', color: T.dangerClaySolid },

  // Section Card
  sectionCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T.textColor, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: T.background,
    padding: 12,
    borderRadius: T.radius.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  statValue: { fontSize: 14, fontWeight: '800', color: T.textColor, marginTop: 4 },
  statLabel: { fontSize: 11, color: T.caption, marginTop: 2 },

  subSectionTitle: { fontSize: 11, fontWeight: '800', color: T.caption, letterSpacing: 0.5, marginTop: 8, marginBottom: 6 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.infoTeal + '18',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.infoTeal + '44',
  },
  conditionChipText: { fontSize: 12, fontWeight: '600', color: T.infoTealSolid },

  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.dangerClay + '18',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.dangerClay + '44',
  },
  allergyChipText: { fontSize: 12, fontWeight: '600', color: T.dangerClaySolid },

  emptyText: { fontSize: T.fontSize.caption, color: T.caption, fontStyle: 'italic', marginBottom: 10 },

  // Med Card inside Member Profile
  medCard: {
    backgroundColor: T.background,
    borderRadius: T.radius.small,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  medCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medName: { fontSize: T.fontSize.body, fontWeight: '800', color: T.textColor },
  awareBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: T.radius.pill, borderWidth: 1 },
  awareBadgeText: { fontSize: 10, fontWeight: '700' },

  medScheduleRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radius.pill,
  },
  scheduleText: { fontSize: 11, fontWeight: '600', color: T.sageGreenSolid },

  medInstructions: { fontSize: T.fontSize.caption, color: T.caption, marginTop: 6 },

  daysBarWrap: { marginTop: 8 },
  daysInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  daysLabel: { fontSize: 11, color: T.caption },
  daysValue: { fontSize: 11, fontWeight: '700' },
  progressBar: { height: 6, backgroundColor: T.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  logDoseBtn: {
    backgroundColor: T.sageGreenSolid,
    paddingVertical: 10,
    borderRadius: T.radius.pill,
    alignItems: 'center',
    marginTop: 10,
  },
  logDoseBtnInner: { flexDirection: 'row', alignItems: 'center' },
  logDoseBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Symptom Row
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  symptomTitle: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor },
  symptomMeta: { fontSize: 11, color: T.caption, marginTop: 2 },
  severityChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: T.radius.pill, borderWidth: 1 },
  severityChipText: { fontSize: 11, fontWeight: '800' },

  restrictedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.warmCocoa + '22',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    padding: 14,
    marginTop: 8,
  },
  restrictedNoticeTitle: {
    fontSize: T.fontSize.body,
    fontWeight: '700',
    color: T.textColor,
    marginBottom: 2,
  },
  restrictedNoticeSub: {
    fontSize: T.fontSize.caption,
    color: T.caption,
    lineHeight: 18,
  },
});
