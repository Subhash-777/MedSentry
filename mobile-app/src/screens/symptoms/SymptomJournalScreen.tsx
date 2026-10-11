import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, ScrollView, Alert, StatusBar,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X, Pill, Clock, Tag, CheckCircle2, Circle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import * as T from '../../theme/colors';
import { JournalIcon } from '../../navigation/TabIcons';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';

// Severity → color mapping
const getSeverityStyle = (raw: string) => {
  const n = parseInt(raw) || 0;
  if (n >= 8) return { color: T.dangerClaySolid, bg: T.dangerClay + '18', border: T.dangerClay + '44', label: 'Severe' };
  if (n >= 4) return { color: T.warningAmberSolid, bg: T.warningAmber + '18', border: T.warningAmber + '44', label: 'Moderate' };
  return { color: T.sageGreenSolid, bg: T.sageGreen + '18', border: T.sageGreen + '44', label: 'Mild' };
};

const SEVERITY_COLORS: Record<number, string> = {
  1: T.sageGreen, 2: T.sageGreen, 3: T.sageGreen,
  4: T.warningAmber, 5: T.warningAmber, 6: T.warningAmber, 7: T.warningAmber,
  8: T.dangerClay, 9: T.dangerClay, 10: T.dangerClay,
};

const CATEGORY_OPTIONS = [
  'Head & Brain', 'Stomach & Digestive', 'Skin & Rash',
  'Respiratory', 'Muscle & Joint', 'General / Other',
];

const ONSET_OPTIONS = [
  'Just started', '< 24 hours', '1-3 days', '4-7 days', '> 1 week',
];

const SymptomCard = React.memo(({ item, index, onToggleStatus }: { item: any; index: number; onToggleStatus: (id: string, currentStatus: string) => void }) => {
  const sev = getSeverityStyle(item.severity);
  const date = new Date(item.created_at);
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isResolved = item.status === 'resolved';

  const linkedMedName = item.course?.drug?.name || item.course?.custom_name;

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 50)} style={[styles.card, isResolved && styles.cardResolved]}>
      <View style={[styles.cardAccent, { backgroundColor: isResolved ? T.caption : sev.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.symptomText, isResolved && styles.symptomTextResolved]} numberOfLines={2}>
            {item.symptom}
          </Text>
          <View style={[styles.severityBadge, { backgroundColor: sev.bg, borderColor: sev.border }]}>
            <Text style={[styles.severityBadgeText, { color: sev.color }]}>{item.severity}/10</Text>
          </View>
        </View>

        {/* Chips row for Linked Med, Category, Onset */}
        <View style={styles.chipsRow}>
          {!!linkedMedName && (
            <View style={styles.chipMed}>
              <Pill size={12} color={T.sageGreenSolid} style={{ marginRight: 4 }} />
              <Text style={styles.chipMedText}>{linkedMedName}</Text>
            </View>
          )}

          {!!item.category_location && (
            <View style={styles.chipTag}>
              <Tag size={12} color={T.infoTealSolid} style={{ marginRight: 4 }} />
              <Text style={styles.chipTagText}>{item.category_location}</Text>
            </View>
          )}

          {!!item.duration_onset && (
            <View style={styles.chipOnset}>
              <Clock size={12} color={T.warningAmberSolid} style={{ marginRight: 4 }} />
              <Text style={styles.chipOnsetText}>{item.duration_onset}</Text>
            </View>
          )}
        </View>

        {/* Image attachment preview if present */}
        {!!item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.attachedImagePreview} resizeMode="cover" />
        )}

        <View style={styles.cardBottom}>
          <View style={styles.cardMeta}>
            <Text style={styles.metaDate}>{dateStr}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaTime}>{timeStr}</Text>
          </View>

          <TouchableOpacity
            style={[styles.statusToggleBtn, isResolved && styles.statusToggleBtnResolved]}
            onPress={() => onToggleStatus(item.id, item.status)}
            accessibilityRole="button"
          >
            {isResolved ? (
              <CheckCircle2 size={14} color={T.caption} style={{ marginRight: 4 }} />
            ) : (
              <Circle size={14} color={T.sageGreenSolid} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.statusToggleText, isResolved && styles.statusToggleTextResolved]}>
              {isResolved ? 'Resolved' : 'Ongoing'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});
SymptomCard.displayName = 'SymptomCard';

export default function SymptomJournalScreen() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [newSymptom, setNewSymptom] = useState('');
  const [newSeverity, setNewSeverity] = useState(5);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('General / Other');
  const [selectedOnset, setSelectedOnset] = useState<string>('Just started');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchActiveCourses();
  }, [user]);

  async function fetchLogs() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('symptom_journal')
        .select(`*, course:medication_courses(id, custom_name, drug:drugs(name))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Fetch logs error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveCourses() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('medication_courses')
        .select('id, custom_name, drug:drugs(name)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      setActiveCourses(data || []);
    } catch (err) {
      console.error('Fetch active courses error:', err);
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'ongoing' : 'resolved';
    try {
      const { error } = await (supabase.from('symptom_journal') as any)
        .update({ status: nextStatus })
        .eq('id', id);
      if (error) throw error;
      setLogs(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus } : l));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is required to attach symptom photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setNewSymptom('');
    setNewSeverity(5);
    setSelectedCourseId(null);
    setSelectedCategory('General / Other');
    setSelectedOnset('Just started');
    setImageUri(null);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!newSymptom.trim()) { Alert.alert('Required', 'Please describe the symptom.'); return; }
    setSubmitting(true);
    try {
      const { error } = await (supabase.from('symptom_journal') as any).insert({
        user_id: user.id,
        symptom: newSymptom.trim(),
        severity: newSeverity.toString(),
        status: 'ongoing',
        linked_course_id: selectedCourseId || null,
        category_location: selectedCategory,
        duration_onset: selectedOnset,
        image_url: imageUri || null,
      });
      if (error) throw error;
      setModalVisible(false);
      resetForm();
      fetchLogs();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <SymptomCard item={item} index={index} onToggleStatus={toggleStatus} />
  ), []);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />
        <View style={styles.header}>
          <Text style={styles.title}>Symptom Journal</Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonCard count={3} variant="compact" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View>
          <Text style={styles.title}>Symptom Journal</Text>
          <Text style={styles.subtitle}>{logs.length} {logs.length === 1 ? 'entry' : 'entries'} logged</Text>
        </View>
        {logs.length > 0 && (
          <View style={styles.summaryChip}>
            <Text style={styles.summaryText}>
              {logs.filter(l => parseInt(l.severity) >= 8 && l.status !== 'resolved').length} active severe
            </Text>
          </View>
        )}
      </Animated.View>

      <FlatList
        data={logs}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <EmptyState
            icon={<JournalIcon size={36} color={T.sageGreenSolid} />}
            title="No Symptoms Logged"
            description="Record how medications affect you by logging symptoms after taking doses."
            actionLabel="+ Log Symptom"
            onAction={() => setModalVisible(true)}
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} accessibilityRole="button">
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Entry Sheet */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.overlay}>
            <Animated.View entering={FadeInUp.duration(350)} style={styles.sheet}>
              <View style={styles.handle} />
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Log a Symptom</Text>

                {/* Symptom Description */}
                <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mild headache or rash after taking dose…"
                  placeholderTextColor={T.placeholder}
                  value={newSymptom}
                  onChangeText={setNewSymptom}
                  multiline
                  autoFocus
                />

                {/* Link to Active Medication */}
                <Text style={styles.fieldLabel}>LINK TO MEDICATION (OPTIONAL)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
                  <TouchableOpacity
                    style={[styles.selectChip, selectedCourseId === null && styles.selectChipActive]}
                    onPress={() => setSelectedCourseId(null)}
                  >
                    <Text style={[styles.selectChipText, selectedCourseId === null && styles.selectChipTextActive]}>
                      None / General
                    </Text>
                  </TouchableOpacity>
                  {activeCourses.map((c) => {
                    const name = c.drug?.name || c.custom_name || 'Medication';
                    const active = selectedCourseId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.selectChip, active && styles.selectChipActive]}
                        onPress={() => setSelectedCourseId(c.id)}
                      >
                        <Pill size={12} color={active ? '#FFF' : T.sageGreenSolid} style={{ marginRight: 4 }} />
                        <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Category / Body System */}
                <Text style={styles.fieldLabel}>CATEGORY / BODY SYSTEM</Text>
                <View style={styles.gridWrap}>
                  {CATEGORY_OPTIONS.map((cat) => {
                    const active = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.gridChip, active && styles.gridChipActive]}
                        onPress={() => setSelectedCategory(cat)}
                      >
                        <Text style={[styles.gridChipText, active && styles.gridChipTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Onset / Duration */}
                <Text style={styles.fieldLabel}>ONSET / DURATION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
                  {ONSET_OPTIONS.map((ons) => {
                    const active = selectedOnset === ons;
                    return (
                      <TouchableOpacity
                        key={ons}
                        style={[styles.selectChip, active && styles.selectChipActive]}
                        onPress={() => setSelectedOnset(ons)}
                      >
                        <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>{ons}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Severity Slider */}
                <Text style={styles.fieldLabel}>
                  SEVERITY —{' '}
                  <Text style={{ color: SEVERITY_COLORS[newSeverity] }}>
                    {newSeverity}/10 ({getSeverityStyle(String(newSeverity)).label})
                  </Text>
                </Text>

                <View style={styles.severityRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const active = newSeverity === n;
                    const col = SEVERITY_COLORS[n];
                    return (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.sevBubble,
                          { borderColor: col + '55', backgroundColor: active ? col : col + '18' },
                        ]}
                        onPress={() => setNewSeverity(n)}
                      >
                        <Text style={[styles.sevBubbleText, { color: active ? '#FFF' : col }]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Photo Attachment */}
                <Text style={styles.fieldLabel}>PHOTO ATTACHMENT (OPTIONAL)</Text>
                {imageUri ? (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.clearImageBtn} onPress={() => setImageUri(null)}>
                      <X color="#FFF" size={14} style={{ marginRight: 4 }} />
                      <Text style={styles.clearImageText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoActionsRow}>
                    <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                      <Camera size={16} color={T.sageGreenSolid} style={{ marginRight: 6 }} />
                      <Text style={styles.photoBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                      <ImagePlus size={16} color={T.sageGreenSolid} style={{ marginRight: 6 }} />
                      <Text style={styles.photoBtnText}>Choose Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setModalVisible(false); resetForm(); }}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.5 }]} onPress={handleSave} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save Entry</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
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
  subtitle: { fontSize: T.fontSize.caption, color: T.caption, marginTop: 2 },
  summaryChip: {
    backgroundColor: T.dangerClay + '18',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.dangerClay + '44',
  },
  summaryText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.dangerClaySolid },

  listContent: { padding: 16, gap: 12, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  cardResolved: {
    opacity: 0.65,
    backgroundColor: T.background,
  },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  symptomText: { flex: 1, fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor },
  symptomTextResolved: { textDecorationLine: 'line-through', color: T.caption },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: T.radius.pill,
    borderWidth: 1,
  },
  severityBadgeText: { fontSize: T.fontSize.caption, fontWeight: '700' },

  // Chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chipMed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  chipMedText: { fontSize: 11, fontWeight: '600', color: T.sageGreenSolid },
  chipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.infoTeal + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: T.infoTeal + '44',
  },
  chipTagText: { fontSize: 11, fontWeight: '600', color: T.infoTealSolid },
  chipOnset: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.warningAmber + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: T.warningAmber + '44',
  },
  chipOnsetText: { fontSize: 11, fontWeight: '600', color: T.warningAmberSolid },

  attachedImagePreview: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    marginTop: 4,
  },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDate: { fontSize: T.fontSize.caption, color: T.caption },
  metaDot: { fontSize: T.fontSize.caption, color: T.caption },
  metaTime: { fontSize: T.fontSize.caption, color: T.caption },

  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
  },
  statusToggleBtnResolved: {
    backgroundColor: T.caption + '18',
  },
  statusToggleText: { fontSize: 11, fontWeight: '700', color: T.sageGreenSolid },
  statusToggleTextResolved: { color: T.caption },

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
  fabText: { fontSize: 32, color: '#FFF', fontWeight: '400', marginTop: -2 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: T.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  sheetContent: { paddingBottom: 32 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: T.textColor, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: T.caption, letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: T.background,
    borderRadius: T.radius.card,
    padding: 14,
    fontSize: T.fontSize.body,
    color: T.textColor,
    borderWidth: 1,
    borderColor: T.border,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  selectorRow: { flexDirection: 'row', marginBottom: 4 },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.border,
    marginRight: 8,
  },
  selectChipActive: {
    backgroundColor: T.sageGreenSolid,
    borderColor: T.sageGreenSolid,
  },
  selectChipText: { fontSize: T.fontSize.caption, fontWeight: '600', color: T.textColor },
  selectChipTextActive: { color: '#FFF' },

  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridChip: {
    backgroundColor: T.background,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  gridChipActive: {
    backgroundColor: T.infoTeal + '22',
    borderColor: T.infoTealSolid,
  },
  gridChipText: { fontSize: 12, fontWeight: '600', color: T.textColor },
  gridChipTextActive: { color: T.infoTealSolid, fontWeight: '700' },

  severityRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  sevBubble: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sevBubbleText: { fontSize: 12, fontWeight: '800' },

  photoActionsRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingVertical: 10,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: T.sageGreenSolid },

  imagePreviewWrap: { position: 'relative', marginTop: 4 },
  imagePreview: { width: '100%', height: 120, borderRadius: T.radius.card },
  clearImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearImageText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: T.radius.pill, borderWidth: 1, borderColor: T.border },
  cancelText: { fontSize: T.fontSize.body, fontWeight: '700', color: T.caption },
  saveBtn: { flex: 1.5, paddingVertical: 14, alignItems: 'center', borderRadius: T.radius.pill, backgroundColor: T.sageGreenSolid },
  saveBtnText: { fontSize: T.fontSize.body, fontWeight: '800', color: '#FFF' },
});
