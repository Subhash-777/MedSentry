import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Keyboard, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ScanStackParamList } from '../../navigation/AppNavigator';
import { scheduleDailyDoseReminder, requestNotificationPermissions } from '../../lib/notifications';
import * as T from '../../theme/colors';

import { ParsedMedicine } from '../../lib/ocr';

type VerifyPrescriptionRouteProp = RouteProp<ScanStackParamList, 'VerifyPrescription'>;
type NavigationProp = NativeStackNavigationProp<ScanStackParamList, 'VerifyPrescription'>;

// Item 3: 30-day staleness window
const STALENESS_DAYS = 30;

export default function VerifyPrescriptionScreen() {
  const route = useRoute<VerifyPrescriptionRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const { extractedData, rawText, photoUri } = route.params;

  const [patientName, setPatientName] = useState(extractedData.patientName || '');
  const [age, setAge] = useState(extractedData.age || '');
  const [weight, setWeight] = useState(extractedData.weight || '');
  const [height, setHeight] = useState(extractedData.height || ''); // item 1: height rendered
  const [conditions, setConditions] = useState(extractedData.conditions?.join(', ') || '');
  const [medicines, setMedicines] = useState<ParsedMedicine[]>(
    Array.isArray(extractedData.medicines) && typeof extractedData.medicines[0] !== 'string' 
      ? extractedData.medicines 
      : []
  );
  const [doctorReg, setDoctorReg] = useState(extractedData.doctorReg || '');
  const [prescDate, setPrescDate] = useState(extractedData.prescriptionDate || '');
  const [isSaving, setIsSaving] = useState(false);
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

  const [now] = useState(() => Date.now());

  // Item 3: non-blocking staleness warning
  const isStale = useMemo(() => {
    if (!prescDate) return false;
    const parsed = new Date(prescDate);
    if (isNaN(parsed.getTime())) return false;
    const diffDays = (now - parsed.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > STALENESS_DAYS;
  }, [prescDate, now]);

  // Phase 4: Family Circle prompt (simplified for Phase 2)
  const isNameMismatch = user?.user_metadata?.full_name &&
    patientName.trim().toLowerCase() !== (user.user_metadata.full_name as string).toLowerCase();

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prescPayload: any = {
        user_id: user.id,
        raw_ocr_text: rawText,
        patient_name_extracted: patientName,
        weight_extracted: parseFloat(weight) || null,
        height_extracted: parseFloat(height) || null,  // item 1
        conditions_extracted: conditions.split(',').map((s: string) => s.trim()).filter(Boolean),
        doctor_reg_number: doctorReg,
        prescription_date: prescDate ? new Date(prescDate).toISOString().split('T')[0] : null,
        scanned_image_url: photoUri,
      };

      const { data: prescData, error } = await (supabase
        .from('prescriptions')
        .insert(prescPayload)
        .select()
        .single() as any);

      if (error) throw error;

      // Add to tracker
      for (const med of medicines) {
        if (!med.name) continue;

        // Try to match drug by name
        const { data: drugData } = await (supabase
          .from('drugs')
          .select('id')
          .ilike('name', `%${med.name}%`)
          .limit(1)
          .single() as any);

        const { data: newCourse, error: courseErr } = await (supabase.from('medication_courses').insert({
          user_id: user.id,
          prescription_id: prescData.id,
          drug_id: drugData?.id || null,
          custom_name: drugData ? null : med.name,
          dosage_amount: med.dosage,
          frequency: med.frequency,
          instructions: med.instructions,
          status: 'active',
          days_remaining: med.durationDays || 30,
          start_date: new Date().toISOString().split('T')[0]
        } as any).select('id').single() as any);

        if (!courseErr && newCourse) {
           await requestNotificationPermissions();
           await scheduleDailyDoseReminder(newCourse.id, med.name, med.frequency);
        }
      }

      Alert.alert('Saved', 'Prescription saved and medications added to your tracker!', [
        { text: 'OK', onPress: () => navigation.navigate('Scan') }
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to save prescription');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(60, keyboardHeight + 40) }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Verify Prescription</Text>

      {/* Name mismatch — Phase 4: will prompt to add to Circle */}
      {isNameMismatch && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {`⚠️ Name mismatch: "${patientName}" doesn't match your profile. Is this for a Family Circle member?`}
          </Text>
        </View>
      )}

      {/* Item 3: 30-day staleness warning, non-blocking */}
      {isStale && (
        <View style={styles.staleBox}>
          <Text style={styles.staleText}>
            📅 This prescription is over {STALENESS_DAYS} days old. Please verify it is still valid before tracking.
          </Text>
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.label}>Patient Name</Text>
        <TextInput style={styles.input} value={patientName} onChangeText={setPatientName} />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Age / DOB</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={prescDate} onChangeText={setPrescDate} placeholder="2025-01-01" placeholderTextColor={T.placeholder} />
          </View>
        </View>

        {/* Item 1: Weight AND Height rendered side-by-side */}
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
          </View>
        </View>

        <Text style={styles.label}>Diagnosed Conditions</Text>
        <TextInput style={styles.input} value={conditions} onChangeText={setConditions} />

        <Text style={styles.label}>Prescribed Medicines (Structured)</Text>
        {medicines.length === 0 && <Text style={{ color: T.caption, marginBottom: 10 }}>No medicines found.</Text>}
        {medicines.map((med, index) => (
          <View key={index} style={styles.medCard}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.medLabel}>Name</Text>
                <TextInput 
                  style={styles.medInput} 
                  value={med.name} 
                  onChangeText={v => setMedicines(m => m.map((x, i) => i === index ? {...x, name: v} : x))}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.medLabel}>Dosage</Text>
                <TextInput 
                  style={styles.medInput} 
                  value={med.dosage} 
                  onChangeText={v => setMedicines(m => m.map((x, i) => i === index ? {...x, dosage: v} : x))}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.medLabel}>Frequency (comma sep)</Text>
                <TextInput 
                  style={styles.medInput} 
                  value={med.frequency.join(', ')} 
                  onChangeText={v => setMedicines(m => m.map((x, i) => i === index ? {...x, frequency: v.split(',').map(s=>s.trim()).filter(Boolean)} : x))}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.medLabel}>Duration (days)</Text>
                <TextInput 
                  style={styles.medInput} 
                  value={med.durationDays ? med.durationDays.toString() : ''} 
                  keyboardType="numeric"
                  onChangeText={v => setMedicines(m => m.map((x, i) => i === index ? {...x, durationDays: parseInt(v)||null} : x))}
                />
              </View>
            </View>
            <Text style={styles.medLabel}>Instructions</Text>
            <TextInput 
              style={styles.medInput} 
              value={med.instructions} 
              onChangeText={v => setMedicines(m => m.map((x, i) => i === index ? {...x, instructions: v} : x))}
            />
          </View>
        ))}

        <Text style={styles.label}>Doctor Reg / Name</Text>
        <TextInput style={styles.input} value={doctorReg} onChangeText={setDoctorReg} />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Prescription</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '700', color: T.textColor, marginBottom: 20 },
  // Name mismatch — warningAmber accent per design doc §3 low-stock nudge pattern
  warningBox: {
    backgroundColor: T.warningAmber + '18',
    padding: 14,
    borderRadius: T.radius.small,
    borderWidth: 1,
    borderColor: T.warningAmber + '55',
    marginBottom: 16,
  },
  warningText: { color: T.warningAmber, fontSize: T.fontSize.caption, fontWeight: '600' },
  // Staleness warning — warningAmber tint (non-blocking, secondary urgency)
  staleBox: {
    backgroundColor: T.warningAmber + '14',
    padding: 14,
    borderRadius: T.radius.small,
    borderWidth: 1,
    borderColor: T.warningAmber + '44',
    marginBottom: 16,
  },
  staleText: { color: T.warningAmber, fontSize: T.fontSize.caption, fontWeight: '600' },
  form: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 24,
    ...T.cardShadow,
  },
  label: {
    fontSize: T.fontSize.caption,
    color: T.caption,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  // warmCocoa-tinted inputs per design doc §3 component styling
  input: {
    backgroundColor: T.warmCocoa + '44',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    color: T.textColor,
    padding: 12,
    marginBottom: 16,
    fontSize: T.fontSize.body,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: T.sageGreen,
    padding: 16,
    borderRadius: T.radius.large,
    alignItems: 'center',
    ...T.subtleShadow,
  },
  saveButtonText: { color: '#FFF', fontWeight: '700', fontSize: T.fontSize.body },
  medCard: {
    backgroundColor: T.surfaceElevated,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.small,
    padding: 12,
    marginBottom: 12
  },
  medLabel: {
    fontSize: 11,
    color: T.caption,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  medInput: {
    backgroundColor: T.background,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    fontSize: 14,
    color: T.textColor
  }
});

