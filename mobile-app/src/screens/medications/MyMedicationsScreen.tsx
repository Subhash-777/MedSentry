import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, Modal, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MedicationsStackParamList } from '../../navigation/AppNavigator';
import * as T from '../../theme/colors';

import { Clock, Pill, ClipboardList, AlertTriangle, Check, X, Search, Camera, Plus, HelpCircle } from 'lucide-react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { CapsuleIcon } from '../../components/common/MedIcons';

type NavigationProp = NativeStackNavigationProp<MedicationsStackParamList, 'MyMedications'>;

const AWARE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Access:   { bg: T.sageGreen + '22', text: T.sageGreenSolid, border: T.sageGreen + '55' },
  Watch:    { bg: T.warningAmber + '22', text: T.warningAmberSolid, border: T.warningAmber + '55' },
  Reserve:  { bg: T.dangerClay + '22', text: T.dangerClaySolid, border: T.dangerClay + '55' },
  'Not recommended': { bg: T.dangerClay + '33', text: T.dangerClaySolid, border: T.dangerClay + '88' },
};

const getAwareStyle = (cls: string | null) =>
  AWARE_COLORS[cls ?? ''] ?? { bg: T.mutedAccent + '22', text: T.mutedAccentSolid, border: T.mutedAccent + '55' };

const MedicationCard = React.memo(({ item, index, loggingDose, onLogDose, onDelete }: any) => {
  const drugName = item.drug?.name || item.custom_name || 'Unknown Drug';
  const isLowStock = item.days_remaining !== null && item.days_remaining <= 2;
  const isMidStock = item.days_remaining !== null && item.days_remaining > 2 && item.days_remaining <= 7;
  const awareStyle = getAwareStyle(item.drug?.aware_class);
  const schedule = item.frequency?.join(' · ') || (item.daily_dose ? `${item.daily_dose}× daily` : 'morning');
  const dosage = item.dosage_amount || (item.daily_dose ? `${item.daily_dose} dose/day` : null);

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 60)} style={styles.card}>
      <View style={[styles.cardAccent, {
        backgroundColor: isLowStock ? T.dangerClay : isMidStock ? T.warningAmber : T.sageGreen,
      }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.drugName} numberOfLines={1}>{drugName}</Text>
            {item.drug?.aware_class ? (
              <View style={[styles.awareBadge, { backgroundColor: awareStyle.bg, borderColor: awareStyle.border }]}>
                <Text style={[styles.awareBadgeText, { color: awareStyle.text }]}>
                  {item.drug.aware_class}
                </Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => onDelete(item.id, drugName)} style={styles.deleteBtn} accessibilityRole="button">
            <X color={T.caption} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleRow}>
          <View style={styles.schedulePill}>
            <Clock color={T.sageGreenSolid} size={14} style={{ marginRight: 4 }} />
            <Text style={styles.scheduleText}>{schedule}</Text>
          </View>
          {dosage ? (
            <View style={styles.schedulePill}>
              <Pill color={T.sageGreenSolid} size={14} style={{ marginRight: 4 }} />
              <Text style={styles.scheduleText}>{dosage}</Text>
            </View>
          ) : null}
        </View>

        {!!item.instructions && (
          <View style={styles.instructionRow}>
            <ClipboardList color={T.caption} size={14} style={{ marginRight: 6 }} />
            <Text style={styles.instructionText}>{item.instructions}</Text>
          </View>
        )}

        {item.days_remaining !== null && (
          <View style={styles.daysRow}>
            <View style={styles.daysInfo}>
              <Text style={styles.daysLabel}>Days remaining</Text>
              <Text style={[styles.daysValue, {
                color: isLowStock ? T.dangerClaySolid : isMidStock ? T.warningAmberSolid : T.sageGreenSolid
              }]}>
                {item.days_remaining}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {
                width: `${Math.min(100, (item.days_remaining / 30) * 100)}%`,
                backgroundColor: isLowStock ? T.dangerClay : isMidStock ? T.warningAmber : T.sageGreen,
              }]} />
            </View>
          </View>
        )}

        {isLowStock && (
          <View style={styles.nudgeBox}>
            <AlertTriangle color={T.warningAmberSolid} size={14} style={{ marginRight: 6 }} />
            <Text style={styles.nudgeText}>Running low — time to refill!</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.logBtn, loggingDose === item.id && styles.logBtnDisabled]}
          onPress={() => onLogDose(item.id)}
          disabled={loggingDose === item.id}
          accessibilityRole="button"
        >
          {loggingDose === item.id ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <View style={styles.logBtnInner}>
              <Check color="#FFF" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.logBtnText}>Log Dose Taken</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});
MedicationCard.displayName = 'MedicationCard';

export default function MyMedicationsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingDose, setLoggingDose] = useState<string | null>(null);

  // Search & Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<any | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Form Inputs
  const [totalPills, setTotalPills] = useState('30');
  const [dailyDose, setDailyDose] = useState('2');
  const [dosageAmount, setDosageAmount] = useState('500mg');
  const [instructions, setInstructions] = useState('Take after meals');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('medication_courses')
        .select(`id, total_pills, daily_dose, dosage_amount, frequency, instructions, custom_name, days_remaining, status, drug:drugs (id, name, aware_class)`)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        if (error.code === '42703') {
          const { data: fallback } = await supabase
            .from('medication_courses')
            .select(`id, total_pills, daily_dose, days_remaining, status, drug:drugs (id, name, aware_class)`)
            .eq('user_id', user.id).eq('status', 'active');
          setCourses(fallback || []);
          return;
        }
        throw error;
      }
      setCourses(data || []);
    } catch (err) {
      console.error('Fetch courses error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchCourses());
    return unsub;
  }, [navigation, fetchCourses]);

  const handleDrugSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('drugs')
        .select('id, name, aware_class, category')
        .ilike('name', `%${text.trim()}%`)
        .limit(8);
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectDrug = (drug: any) => {
    setSelectedDrug(drug);
    setIsCustomMode(false);
    setSearchResults([]);
  };

  const handleUseCustomFallback = () => {
    if (!searchQuery.trim()) return;
    setSelectedDrug(null);
    setIsCustomMode(true);
    setSearchResults([]);

    // Log missing drug search to api_usage_logs
    if (user) {
      (supabase.from('api_usage_logs') as any).insert({
        user_id: user.id,
        provider_name: 'missing_drug_search',
        request_type: 'custom_drug_unmatched',
        outcome: searchQuery.trim(),
        tokens_estimated: 0,
        latency_ms: 0,
      }).then(() => {}).catch(() => {});
    }
  };

  const resetModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedDrug(null);
    setIsCustomMode(false);
    setTotalPills('30');
    setDailyDose('2');
    setDosageAmount('500mg');
    setInstructions('Take after meals');
  };

  const handleSaveCourse = async () => {
    if (!user) return;
    if (!selectedDrug && !isCustomMode) {
      Alert.alert('Selection Required', 'Please search and select a drug from the list, or choose custom medication.');
      return;
    }
    const pCount = parseInt(totalPills) || 30;
    const dDose = parseInt(dailyDose) || 1;
    const daysRem = Math.floor(pCount / dDose);

    setSubmitting(true);
    try {
      const payload: any = {
        user_id: user.id,
        status: 'active',
        total_pills: pCount,
        daily_dose: dDose,
        dosage_amount: dosageAmount.trim() || null,
        frequency: ['morning', 'night'],
        instructions: instructions.trim() || null,
        days_remaining: daysRem,
      };

      if (selectedDrug) {
        payload.drug_id = selectedDrug.id;
        payload.custom_name = null;
      } else {
        payload.drug_id = null;
        payload.custom_name = searchQuery.trim() || 'Custom Medication';
      }

      const { error } = await (supabase.from('medication_courses') as any).insert(payload);
      if (error) throw error;

      setModalVisible(false);
      resetModal();
      fetchCourses();
      Alert.alert('✅ Course Created', 'Medication course added successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save medication course');
    } finally {
      setSubmitting(false);
    }
  };

  const logDose = useCallback(async (courseId: string) => {
    setLoggingDose(courseId);
    try {
      const { error } = await (supabase.from('dose_logs') as any).insert({ course_id: courseId, status: 'taken' });
      if (error) throw error;
      Alert.alert('✅ Dose Logged', 'Great job staying on track! Keep it up.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to log dose.');
    } finally {
      setLoggingDose(null);
    }
  }, []);

  const deleteCourse = useCallback((courseId: string, name: string) => {
    Alert.alert('Remove Medication', `Stop tracking ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('medication_courses').delete().eq('id', courseId);
          if (!error) setCourses(prev => prev.filter(c => c.id !== courseId));
        }
      }
    ]);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <MedicationCard
      item={item}
      index={index}
      loggingDose={loggingDose}
      onLogDose={logDose}
      onDelete={deleteCourse}
    />
  ), [loggingDose, logDose, deleteCourse]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />
        <View style={styles.header}>
          <Text style={styles.title}>My Medications</Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonCard count={3} variant="list" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        {courses.length > 0 && (
          <TouchableOpacity style={styles.countBadge} onPress={() => setModalVisible(true)}>
            <Plus size={14} color={T.sageGreenSolid} style={{ marginRight: 4 }} />
            <Text style={styles.countText}>Add ({courses.length})</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {courses.length === 0 ? (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <EmptyState
            icon={<CapsuleIcon color={T.sageGreenSolid} size={36} />}
            title="No Active Medications"
            description="Search our catalog of medications or scan a prescription strip to start tracking your daily doses."
            actionLabel="+ Add Medication"
            onAction={() => setModalVisible(true)}
          />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      {/* FAB */}
      {courses.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} accessibilityRole="button">
          <Plus size={26} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Search & Add Medication Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Medication Course</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetModal(); }}>
                  <X color={T.caption} size={20} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                {/* Secondary Scan Instead Banner */}
                <TouchableOpacity
                  style={styles.scanBanner}
                  onPress={() => {
                    setModalVisible(false);
                    resetModal();
                    navigation.navigate('ScanTab' as any);
                  }}
                >
                  <Camera color={T.sageGreenSolid} size={20} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scanBannerTitle}>Scan Prescription or Bottle Instead</Text>
                    <Text style={styles.scanBannerSub}>Use AI OCR to automatically extract medication name & dosing</Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>SEARCH MEDICINE CATALOG</Text>
                <View style={styles.searchBarWrap}>
                  <Search color={T.caption} size={18} style={{ marginLeft: 12, marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search Paracetamol, Amoxicillin, Ibuprofen…"
                    placeholderTextColor={T.placeholder}
                    value={searchQuery}
                    onChangeText={handleDrugSearch}
                    autoFocus
                  />
                  {searching && <ActivityIndicator color={T.sageGreenSolid} size="small" style={{ marginRight: 12 }} />}
                </View>

                {/* Search Typeahead Results */}
                {searchResults.length > 0 && (
                  <View style={styles.resultsContainer}>
                    {searchResults.map((drug) => (
                      <TouchableOpacity
                        key={drug.id}
                        style={styles.resultRow}
                        onPress={() => handleSelectDrug(drug)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultName}>{drug.name}</Text>
                          {!!drug.category && <Text style={styles.resultSub}>{drug.category}</Text>}
                        </View>
                        {!!drug.aware_class && (
                          <View style={[styles.resultBadge, { backgroundColor: getAwareStyle(drug.aware_class).bg }]}>
                            <Text style={[styles.resultBadgeText, { color: getAwareStyle(drug.aware_class).text }]}>
                              {drug.aware_class}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Unmatched Custom Fallback option */}
                {searchQuery.trim().length >= 2 && searchResults.length === 0 && !selectedDrug && !isCustomMode && (
                  <TouchableOpacity style={styles.customFallbackCard} onPress={handleUseCustomFallback}>
                    <HelpCircle color={T.warningAmberSolid} size={20} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customFallbackTitle}>Can&apos;t find &ldquo;{searchQuery}&rdquo;?</Text>
                      <Text style={styles.customFallbackSub}>Tap to track as custom medication</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Selected Drug / Custom Mode Confirmation Card */}
                {(selectedDrug || isCustomMode) && (
                  <View style={styles.selectedCard}>
                    <View style={styles.selectedTop}>
                      <CapsuleIcon color={T.sageGreenSolid} size={22} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectedName}>
                          {selectedDrug ? selectedDrug.name : searchQuery}
                        </Text>
                        <Text style={styles.selectedSub}>
                          {selectedDrug ? `Catalog Match · ${selectedDrug.aware_class || 'Standard'}` : 'Custom Medication Tracked'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => { setSelectedDrug(null); setIsCustomMode(false); }}>
                        <Text style={styles.changeText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Dosage & Course Inputs */}
                {(selectedDrug || isCustomMode) && (
                  <View style={styles.formSection}>
                    <View style={styles.rowInputs}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>TOTAL PILLS / BOTTLE</Text>
                        <TextInput
                          style={styles.inputNum}
                          keyboardType="numeric"
                          value={totalPills}
                          onChangeText={setTotalPills}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>DAILY DOSES</Text>
                        <TextInput
                          style={styles.inputNum}
                          keyboardType="numeric"
                          value={dailyDose}
                          onChangeText={setDailyDose}
                        />
                      </View>
                    </View>

                    <Text style={styles.fieldLabel}>DOSAGE AMOUNT</Text>
                    <TextInput
                      style={styles.inputText}
                      placeholder="e.g. 500mg or 1 tablet"
                      placeholderTextColor={T.placeholder}
                      value={dosageAmount}
                      onChangeText={setDosageAmount}
                    />

                    <Text style={styles.fieldLabel}>INSTRUCTIONS</Text>
                    <TextInput
                      style={styles.inputText}
                      placeholder="e.g. Take after food"
                      placeholderTextColor={T.placeholder}
                      value={instructions}
                      onChangeText={setInstructions}
                    />

                    <TouchableOpacity
                      style={[styles.saveCourseBtn, submitting && { opacity: 0.5 }]}
                      onPress={handleSaveCourse}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.saveCourseBtnText}>Add Medication Course</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: T.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  title: { fontSize: 26, fontWeight: '800', color: T.textColor, letterSpacing: -0.5 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '22',
    borderRadius: T.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.sageGreen + '55',
  },
  countText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.sageGreenSolid },

  list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },

  // Card
  card: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  drugName: { fontSize: T.fontSize.body, fontWeight: '800', color: T.textColor, flexShrink: 1 },
  awareBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: T.radius.pill, borderWidth: 1 },
  awareBadgeText: { fontSize: 10, fontWeight: '700' },
  deleteBtn: { padding: 4 },

  scheduleRow: { flexDirection: 'row', gap: 8 },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
  },
  scheduleText: { fontSize: 12, fontWeight: '600', color: T.sageGreenSolid },

  instructionRow: { flexDirection: 'row', alignItems: 'center' },
  instructionText: { fontSize: T.fontSize.caption, color: T.caption },

  daysRow: { gap: 4 },
  daysInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  daysLabel: { fontSize: T.fontSize.caption, color: T.caption },
  daysValue: { fontSize: T.fontSize.caption, fontWeight: '700' },
  progressBar: { height: 6, backgroundColor: T.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  nudgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.warningAmber + '18',
    padding: 8,
    borderRadius: 8,
  },
  nudgeText: { fontSize: T.fontSize.caption, fontWeight: '600', color: T.warningAmberSolid },

  logBtn: {
    backgroundColor: T.sageGreenSolid,
    paddingVertical: 12,
    borderRadius: T.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logBtnDisabled: { opacity: 0.5 },
  logBtnInner: { flexDirection: 'row', alignItems: 'center' },
  logBtnText: { fontSize: T.fontSize.body, fontWeight: '700', color: '#FFF' },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.sageGreenSolid,
    alignItems: 'center',
    justifyContent: 'center',
    ...T.subtleShadow,
  },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: T.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.border, alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: T.textColor },
  modalBody: { paddingBottom: 32 },

  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    padding: 14,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
    marginBottom: 16,
  },
  scanBannerTitle: { fontSize: 13, fontWeight: '700', color: T.sageGreenSolid },
  scanBannerSub: { fontSize: 11, color: T.caption, marginTop: 2 },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: T.caption, letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.background,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: T.fontSize.body, color: T.textColor },

  resultsContainer: {
    backgroundColor: T.surfaceElevated,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.border,
    marginTop: 6,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  resultName: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor },
  resultSub: { fontSize: T.fontSize.caption, color: T.caption, marginTop: 2 },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: T.radius.pill },
  resultBadgeText: { fontSize: 10, fontWeight: '700' },

  customFallbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.warningAmber + '18',
    padding: 14,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.warningAmber + '44',
    marginTop: 10,
  },
  customFallbackTitle: { fontSize: 13, fontWeight: '700', color: T.textColor },
  customFallbackSub: { fontSize: 11, color: T.caption, marginTop: 2 },

  selectedCard: {
    backgroundColor: T.sageGreen + '18',
    borderRadius: T.radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
    marginTop: 14,
  },
  selectedTop: { flexDirection: 'row', alignItems: 'center' },
  selectedName: { fontSize: T.fontSize.body, fontWeight: '800', color: T.textColor },
  selectedSub: { fontSize: T.fontSize.caption, color: T.sageGreenSolid, marginTop: 2 },
  changeText: { fontSize: 12, fontWeight: '700', color: T.sageGreenSolid },

  formSection: { marginTop: 10 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  inputNum: {
    backgroundColor: T.background,
    borderRadius: T.radius.card,
    padding: 12,
    fontSize: T.fontSize.body,
    fontWeight: '700',
    color: T.textColor,
    borderWidth: 1,
    borderColor: T.border,
  },
  inputText: {
    backgroundColor: T.background,
    borderRadius: T.radius.card,
    padding: 12,
    fontSize: T.fontSize.body,
    color: T.textColor,
    borderWidth: 1,
    borderColor: T.border,
  },

  saveCourseBtn: {
    backgroundColor: T.sageGreenSolid,
    paddingVertical: 14,
    borderRadius: T.radius.pill,
    alignItems: 'center',
    marginTop: 20,
  },
  saveCourseBtnText: { fontSize: T.fontSize.body, fontWeight: '800', color: '#FFF' },
});
