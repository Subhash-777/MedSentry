import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Keyboard, Platform } from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { scheduleDailyDoseReminder, scheduleRefillReminder, requestNotificationPermissions } from '../../lib/notifications';
import * as T from '../../theme/colors';

type MedicineDetailRouteProp = RouteProp<HomeStackParamList, 'MedicineDetail'>;
type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'MedicineDetail'>;

// Prescription recency window: 180 days (6 months). A prescription older than
// this is treated as stale and not counted as a valid cover for an antibiotic course.
const PRESCRIPTION_VALID_DAYS = 180;

export default function MedicineDetailScreen() {
  const route = useRoute<MedicineDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { drugId, stripData } = route.params;

  const [drug, setDrug] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pre-fill pill count from OCR strip scan if available
  const [dailyDose, setDailyDose] = useState('1'); // Numeric count for DB
  const [dosageAmount, setDosageAmount] = useState('1 pill'); // Descriptive
  const [frequency, setFrequency] = useState('morning'); // Comma separated
  const [instructions, setInstructions] = useState('');
  const [totalPills, setTotalPills] = useState(stripData?.pillCount ? String(stripData.pillCount) : '10');
  const [isAdding, setIsAdding] = useState(false);
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

  useEffect(() => {
    async function fetchDrug() {
      try {
        const { data, error } = await supabase
          .from('drugs')
          .select('*')
          .eq('id', drugId)
          .single();
        if (error) throw error;
        setDrug(data);
      } catch (err) {
        console.error('Error fetching drug:', err);
        Alert.alert('Error', 'Failed to load medicine details.');
      } finally {
        setLoading(false);
      }
    }
    fetchDrug();
  }, [drugId]);

  /**
   * Item 3: Check if a valid prescription exists for this user + drug.
   * Recency window: PRESCRIPTION_VALID_DAYS (180 days = 6 months).
   * Match: same user_id + prescription_date within window + drug name in raw_ocr_text or conditions_extracted.
   */
  async function checkNecessityFlag(drugName: string): Promise<string> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PRESCRIPTION_VALID_DAYS);

    const { data, error } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('user_id', user!.id)
      .gte('prescription_date', cutoff.toISOString().split('T')[0])
      .or(`raw_ocr_text.ilike.%${drugName}%,conditions_extracted.cs.{${drugName}}`)
      .limit(1);

    if (error) {
      console.error('Necessity check error:', error);
      return 'flagged_unprescribed'; // fail-safe
    }
    return data && data.length > 0 ? 'valid' : 'flagged_unprescribed';
  }

  const handleAddToTracker = async () => {
    if (!user) return;
    setIsAdding(true);

    try {
      const dose = parseInt(dailyDose);
      const pills = parseInt(totalPills);

      if (isNaN(dose) || isNaN(pills) || dose <= 0 || pills <= 0) {
        throw new Error('Please enter valid positive numbers for doses and pills.');
      }

      const daysRemaining = Math.ceil(pills / dose);
      const startDate = new Date();
      // Item 5: refill_date = start_date + days_remaining
      const refillDate = new Date(startDate);
      refillDate.setDate(refillDate.getDate() + daysRemaining);

      // Item 3: necessity flag for antibiotics only
      const isAntibiotic = !!drug?.aware_class;
      let necessityFlag: string | null = null;
      if (isAntibiotic) {
        necessityFlag = await checkNecessityFlag(drug.name);
      }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coursePayload: any = {
        user_id: user.id,
        drug_id: drugId,
        total_pills: pills,
        daily_dose: dose,
        dosage_amount: dosageAmount,
        frequency: frequency.split(',').map(s=>s.trim()).filter(Boolean),
        instructions: instructions,
        start_date: startDate.toISOString().split('T')[0],
        days_remaining: daysRemaining,
        refill_date: refillDate.toISOString().split('T')[0],  // item 5
        is_antibiotic: isAntibiotic,
        necessity_flag: necessityFlag,
        status: 'active',
        // item 2: expiry and batch from strip scan
        expiry_date: stripData?.expiryDate ?? null,
        batch_number: stripData?.batchNumber ?? null,
      };

      const { data: insertedCourse, error } = await supabase
        .from('medication_courses')
        .insert(coursePayload)
        .select('id')
        .single();

      if (error) throw error;

      // Non-blocking warning if antibiotic is unprescribed
      if (necessityFlag === 'flagged_unprescribed') {
        Alert.alert(
          '⚠️ No Prescription Found',
          `No valid prescription for ${drug.name} found within the last ${PRESCRIPTION_VALID_DAYS} days. This course has been flagged as unprescribed.`,
          [{ text: 'Understood' }]
        );
      }

      // Schedule notifications
      await requestNotificationPermissions();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const courseId = (insertedCourse as any).id;
      if (courseId) {
        const parsedFreq = frequency.split(',').map(s=>s.trim()).filter(Boolean);
        await scheduleDailyDoseReminder(courseId, drug.name, parsedFreq);
        await scheduleRefillReminder(courseId, drug.name, refillDate); // item 5
      }

      Alert.alert('Added!', 'Medication added to your tracker.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Failed', err.message || 'Could not add to tracker.');
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={T.sageGreen} />
      </View>
    );
  }

  if (!drug) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Medicine not found.</Text>
      </View>
    );
  }

  const AWARE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Access:   { bg: T.sageGreen + '22', text: T.sageGreenSolid, border: T.sageGreen + '55' },
    Watch:    { bg: T.warningAmber + '22', text: T.warningAmberSolid, border: T.warningAmber + '55' },
    Reserve:  { bg: T.dangerClay + '22', text: T.dangerClaySolid, border: T.dangerClay + '55' },
  };
  const awareStyle = AWARE_COLORS[drug.aware_class ?? ''] ?? { bg: T.mutedAccent + '22', text: T.mutedAccentSolid, border: T.mutedAccent + '55' };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(40, keyboardHeight + 20) }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* ── Hero Header ── */}
      <View style={styles.hero}>
        <View style={styles.pillIconWrap}>
          <Text style={styles.pillIcon}>💊</Text>
        </View>
        <Text style={styles.drugName}>{drug.name}</Text>
        {drug.category && (
          <Text style={styles.drugCategory}>{drug.category}</Text>
        )}
        {drug.aware_class && (
          <View style={[styles.awareBadge, { backgroundColor: awareStyle.bg, borderColor: awareStyle.border }]}>
            <Text style={[styles.awareBadgeText, { color: awareStyle.text }]}>AWaRe · {drug.aware_class}</Text>
          </View>
        )}
      </View>

      {/* ── Strip scan info ── */}
      {stripData && (stripData.expiryDate || stripData.batchNumber) && (
        <View style={styles.stripCard}>
          <Text style={styles.stripCardTitle}>📦 Scanned from strip</Text>
          <View style={styles.stripRow}>
            {stripData.expiryDate && (
              <View style={styles.stripChip}>
                <Text style={styles.stripChipLabel}>Expires</Text>
                <Text style={styles.stripChipValue}>{stripData.expiryDate}</Text>
              </View>
            )}
            {stripData.batchNumber && (
              <View style={styles.stripChip}>
                <Text style={styles.stripChipLabel}>Batch</Text>
                <Text style={styles.stripChipValue}>{stripData.batchNumber}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Drug info sections ── */}
      {drug.common_uses && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>🩺</Text>
            <Text style={styles.infoTitle}>Common Uses</Text>
          </View>
          <Text style={styles.infoText}>{drug.common_uses}</Text>
        </View>
      )}

      {drug.side_effects && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>⚠️</Text>
            <Text style={styles.infoTitle}>Side Effects</Text>
          </View>
          <Text style={styles.infoText}>{drug.side_effects}</Text>
        </View>
      )}

      {/* ── Add to Tracker form ── */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Start Tracking</Text>
          <Text style={styles.formSub}>Configure your course below</Text>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>TOTAL PILLS</Text>
            <TextInput
              style={styles.fieldInput}
              value={totalPills}
              onChangeText={setTotalPills}
              keyboardType="number-pad"
              placeholderTextColor={T.placeholder}
            />
          </View>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>DAILY DOSE</Text>
            <TextInput
              style={styles.fieldInput}
              value={dailyDose}
              onChangeText={setDailyDose}
              keyboardType="number-pad"
              placeholderTextColor={T.placeholder}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>DOSAGE AMOUNT</Text>
        <TextInput
          style={[styles.fieldInput, styles.fieldInputFull]}
          value={dosageAmount}
          onChangeText={setDosageAmount}
          placeholder="e.g. 500mg or 1 tablet"
          placeholderTextColor={T.placeholder}
        />

        <Text style={styles.fieldLabel}>SCHEDULE (comma separated)</Text>
        <TextInput
          style={[styles.fieldInput, styles.fieldInputFull]}
          value={frequency}
          onChangeText={setFrequency}
          placeholder="morning, afternoon, night"
          placeholderTextColor={T.placeholder}
        />

        <Text style={styles.fieldLabel}>INSTRUCTIONS</Text>
        <TextInput
          style={[styles.fieldInput, styles.fieldInputFull]}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g. Take after meals"
          placeholderTextColor={T.placeholder}
        />

        <TouchableOpacity
          style={[styles.addBtn, isAdding && styles.addBtnDisabled]}
          onPress={handleAddToTracker}
          accessibilityRole="button"
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <View style={styles.addBtnInner}>
              <Text style={styles.addBtnIcon}>+</Text>
              <Text style={styles.addBtnText}>Start Tracking</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 60 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { color: T.dangerClay, fontSize: T.fontSize.body },

  // Hero
  hero: { alignItems: 'center', marginBottom: 24 },
  pillIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: T.sageGreen + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: T.sageGreen + '33',
    ...T.cardShadow,
  },
  pillIcon: { fontSize: 44 },
  drugName: { fontSize: 28, fontWeight: '800', color: T.textColor, textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 },
  drugCategory: { fontSize: T.fontSize.caption, color: T.caption, textAlign: 'center', marginBottom: 12 },
  awareBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: T.radius.pill,
    borderWidth: 1,
  },
  awareBadgeText: { fontSize: T.fontSize.caption, fontWeight: '700', letterSpacing: 0.3 },

  // Strip card
  stripCard: {
    backgroundColor: T.infoTeal + '10',
    borderRadius: T.radius.card,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.infoTeal + '33',
    borderLeftWidth: 4,
    borderLeftColor: T.infoTeal,
  },
  stripCardTitle: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.infoTeal, marginBottom: 10 },
  stripRow: { flexDirection: 'row', gap: 12 },
  stripChip: {
    flex: 1,
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.small,
    padding: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  stripChipLabel: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '600', marginBottom: 2 },
  stripChipValue: { fontSize: T.fontSize.caption, color: T.textColor, fontWeight: '700' },

  // Info card
  infoCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoIcon: { fontSize: 16 },
  infoTitle: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.textColor },
  infoText: { fontSize: T.fontSize.caption, color: T.caption, lineHeight: 22 },

  // Form
  formCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: T.borderStrong,
    ...T.cardShadow,
  },
  formHeader: { marginBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: '800', color: T.textColor, marginBottom: 2 },
  formSub: { fontSize: T.fontSize.caption, color: T.caption },

  formRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  formField: { flex: 1 },
  fieldLabel: {
    fontSize: T.fontSize.label,
    fontWeight: '700',
    color: T.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
    marginTop: 14,
  },
  fieldInput: {
    backgroundColor: T.warmCocoa + '44',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: T.fontSize.body,
    color: T.textColor,
    fontWeight: '500',
  },
  fieldInputFull: { marginBottom: 2 },

  addBtn: {
    backgroundColor: T.sageGreenSolid,
    borderRadius: T.radius.large,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: T.sageGreenSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtnIcon: { color: '#FFF', fontSize: 22, fontWeight: '300', marginTop: -2 },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: T.fontSize.body, letterSpacing: 0.2 },
});

