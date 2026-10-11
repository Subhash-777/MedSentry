import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as T from '../../theme/colors';
import { CabinetIcon } from '../../components/common/MedIcons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';

type InventoryItem = {
  id: string;
  group_id: string;
  drug_id: string | null;
  quantity: number | null;
  expiry_date: string | null;
  added_by: string | null;
  drugs: { name: string } | null;
};

/**
 * CabinetInventoryScreen — plan.md §2.2 §4
 * Shared medicine cabinet: Circle-level OTC stock list with expiry tracking.
 * RLS: owners and caregivers can insert/update/delete; viewers can only select.
 */
export default function CabinetInventoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add form
  const [drugSearch, setDrugSearch] = useState('');
  const [drugResults, setDrugResults] = useState<any[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<any | null>(null);
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const fetchInventory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get user's group_id and role
      const { data: membership } = await (supabase
        .from('family_members')
        .select('group_id, role')
        .eq('member_id', user.id)
        .limit(1)
        .single() as any);

      if (!membership) {
        setItems([]);
        setLoading(false);
        return;
      }

      setGroupId(membership.group_id);
      setUserRole(membership.role);

      const { data, error } = await (supabase
        .from('cabinet_inventory')
        .select('*, drugs(name)')
        .eq('group_id', membership.group_id)
        .order('expiry_date', { ascending: true }) as any);

      if (error) throw error;
      setItems((data as InventoryItem[]) || []);
    } catch (err) {
      console.error('Error fetching cabinet inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchInventory(); }, [user]));

  const handleDrugSearch = async (query: string) => {
    setDrugSearch(query);
    if (query.length < 2) { setDrugResults([]); return; }
    const { data } = await supabase
      .from('drugs')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(6);
    setDrugResults(data || []);
  };

  const handleAdd = async () => {
    if (!selectedDrug) return Alert.alert('Error', 'Please search and select a drug first.');
    if (!quantity || isNaN(parseInt(quantity))) return Alert.alert('Error', 'Please enter a valid quantity.');
    if (!groupId) return Alert.alert('Error', 'You must be in a Family Circle to add items.');

    setSubmitting(true);
    try {
      const { error } = await (supabase.from('cabinet_inventory').insert({
        group_id: groupId,
        drug_id: selectedDrug.id,
        quantity: parseInt(quantity),
        expiry_date: expiryDate || null,
        added_by: user?.id,
      } as any) as any);
      if (error) throw error;
      setModalVisible(false);
      setDrugSearch('');
      setDrugResults([]);
      setSelectedDrug(null);
      setQuantity('');
      setExpiryDate('');
      fetchInventory();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    Alert.alert('Remove Item', `Remove ${name} from the cabinet?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('cabinet_inventory').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchInventory();
      }},
    ]);
  };

  const canEdit = userRole === 'owner' || userRole === 'caregiver';
  const [now] = useState(() => Date.now());

  const isExpiringSoon = (expiry: string | null, currentNow: number): boolean => {
    if (!expiry) return false;
    const expiryMs = new Date(expiry).getTime();
    const thirtyDaysMs = currentNow + 30 * 24 * 60 * 60 * 1000;
    return expiryMs < thirtyDaysMs;
  };

  const isExpired = (expiry: string | null, currentNow: number): boolean => {
    if (!expiry) return false;
    return new Date(expiry).getTime() < currentNow;
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const name = item.drugs?.name || 'Unknown Drug';
    const expired = isExpired(item.expiry_date, now);
    const expiringSoon = !expired && isExpiringSoon(item.expiry_date, now);

    return (
      <View style={[styles.card, expired && styles.cardExpired, expiringSoon && styles.cardExpiring]}>
        <View style={styles.cardLeft}>
          <Text style={styles.drugName}>{name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Qty: {item.quantity ?? '—'}</Text>
            {item.expiry_date && (
              <Text style={[styles.meta, expired && { color: T.dangerClay }, expiringSoon && { color: T.warningAmber }]}>
                Exp: {new Date(item.expiry_date).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                {expired ? ' ⛔ EXPIRED' : expiringSoon ? ' ⚠ Soon' : ''}
              </Text>
            )}
          </View>
        </View>
        {canEdit && (
          <TouchableOpacity onPress={() => handleDelete(item.id, name)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Medicine Cabinet</Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonCard count={3} variant="list" />
        </View>
      </View>
    );
  }

  if (!groupId) {
    return (
      <View style={[styles.container, { padding: 24, justifyContent: 'center' }]}>
        <EmptyState
          icon={<CabinetIcon color={T.sageGreenSolid} size={36} />}
          title="No Family Circle"
          description="Join or create a Family Circle first to access the shared medicine cabinet."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medicine Cabinet</Text>
        {canEdit && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            icon={<CabinetIcon color={T.sageGreenSolid} size={36} />}
            title="Cabinet is Empty"
            description={canEdit ? 'Tap "+ Add" to add OTC medications to your shared cabinet.' : 'No OTC medications in cabinet.'}
            actionLabel={canEdit ? '+ Add to Cabinet' : undefined}
            onAction={canEdit ? () => setModalVisible(true) : undefined}
          />
        }
      />

      {/* Add Item Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>Add to Cabinet</Text>
          <Text style={styles.inputLabel}>Search Drug</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Paracetamol"
            placeholderTextColor={T.placeholder}
            value={drugSearch}
            onChangeText={handleDrugSearch}
          />
          {selectedDrug ? (
            <View style={styles.selectedDrugBadge}>
              <Text style={styles.selectedDrugText}>✓ {selectedDrug.name}</Text>
              <TouchableOpacity onPress={() => { setSelectedDrug(null); setDrugSearch(''); }}>
                <Text style={{ color: T.dangerClaySolid, fontWeight: '700' }}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            drugResults.map(d => (
              <TouchableOpacity
                key={d.id}
                style={styles.drugResult}
                onPress={() => { setSelectedDrug(d); setDrugSearch(d.name); setDrugResults([]); }}
              >
                <Text style={{ color: T.textColor }}>{d.name}</Text>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.inputLabel}>Quantity</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 30"
            placeholderTextColor={T.placeholder}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.inputLabel}>Expiry Date (YYYY-MM-DD, optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 2026-12-31"
            placeholderTextColor={T.placeholder}
            value={expiryDate}
            onChangeText={setExpiryDate}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!selectedDrug || !quantity) && { opacity: 0.5 }]}
            onPress={handleAdd}
            disabled={submitting || !selectedDrug || !quantity}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Adding…' : 'Add to Cabinet'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
    backgroundColor: T.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    ...T.subtleShadow,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: T.textColor, letterSpacing: -0.3 },
  addBtn: {
    backgroundColor: T.sageGreenSolid,
    borderRadius: T.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    ...T.subtleShadow,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: T.fontSize.caption, letterSpacing: 0.3 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    ...T.cardShadow,
  },
  cardExpired: { borderColor: T.dangerClay + '77', backgroundColor: T.dangerClay + '08' },
  cardExpiring: { borderColor: T.warningAmber + '77' },
  cardLeft: { flex: 1, padding: 14 },
  drugName: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor, marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { fontSize: T.fontSize.caption, color: T.caption },

  deleteBtn: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: T.border,
    minWidth: 48,
  },
  deleteBtnText: { color: T.dangerClaySolid, fontSize: 14, fontWeight: '700' },

  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.textColor, marginBottom: 8 },
  emptySubtitle: { fontSize: T.fontSize.caption, color: T.caption, textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: T.surfaceCard,
    borderTopLeftRadius: T.radius.large,
    borderTopRightRadius: T.radius.large,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: T.textColor, marginBottom: 16 },
  inputLabel: {
    fontSize: T.fontSize.caption, fontWeight: '700', color: T.caption,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  textInput: {
    backgroundColor: T.background,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    paddingHorizontal: 14,
    fontSize: T.fontSize.body,
    color: T.textColor,
  },
  drugResult: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surfaceCard,
  },
  selectedDrug: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  selectedDrugBadge: {
    backgroundColor: T.sageGreen + '20',
    padding: 12,
    borderRadius: T.radius.small,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  selectedDrugText: { color: T.sageGreenSolid, fontWeight: '700', fontSize: T.fontSize.caption },

  modalActions: { flexDirection: 'row', gap: 12 },
  submitBtn: {
    flex: 1,
    backgroundColor: T.sageGreenSolid,
    borderRadius: T.radius.large,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: T.fontSize.body, fontWeight: '700' },
  cancelBtn: {
    flex: 1,
    backgroundColor: T.background,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.large,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: T.caption, fontSize: T.fontSize.caption, fontWeight: '600' },
});
