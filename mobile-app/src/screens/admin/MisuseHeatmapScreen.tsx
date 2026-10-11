import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import * as T from '../../theme/colors';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';

type HeatmapRow = {
  region: string;
  drug_category: string;
  event_type: string;
  total_30d_count: number;
  is_elevated: boolean;
};

const EVENT_TYPE_OPTIONS = ['all', 'unprescribed_purchase', 'early_stop', 'unnecessary_use'];
const DRUG_CATEGORY_OPTIONS = ['all', 'Antibiotics', 'Antivirals', 'Analgesics', 'Other'];

/**
 * MisuseHeatmapScreen — Admin-only.
 * Calls the get_amr_heatmap() RPC via the admin-api Edge Function
 * and renders region/drug/event aggregations with drill-down filters.
 *
 * plan.md §2.7: "Misuse Heatmap Admin View: drill-down filters (region, drug category,
 * event type, time range)"
 */
export default function MisuseHeatmapScreen() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<HeatmapRow[]>([]);

  // Filters
  const [regionFilter, setRegionFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showElevatedOnly, setShowElevatedOnly] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_amr_heatmap');
      if (error) throw error;
      setRows(data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data, error } = await supabase.rpc('get_amr_heatmap');
        if (error) throw error;
        if (active) setRows(data || []);
      } catch (err: any) {
        if (active) Alert.alert('Error', err.message || 'Failed to load heatmap data');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const filtered = React.useMemo(() => {
    let result = [...rows];
    if (regionFilter.trim()) {
      result = result.filter(r => r.region?.toLowerCase().includes(regionFilter.toLowerCase()));
    }
    if (eventTypeFilter !== 'all') {
      result = result.filter(r => r.event_type === eventTypeFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter(r => r.drug_category === categoryFilter);
    }
    if (showElevatedOnly) {
      result = result.filter(r => r.is_elevated);
    }
    // Sort: elevated first, then by count descending
    result.sort((a, b) => {
      if (a.is_elevated !== b.is_elevated) return a.is_elevated ? -1 : 1;
      return b.total_30d_count - a.total_30d_count;
    });
    return result;
  }, [rows, regionFilter, eventTypeFilter, categoryFilter, showElevatedOnly]);

  const getEventLabel = (et: string) => {
    if (et === 'unprescribed_purchase') return 'Unprescribed';
    if (et === 'early_stop') return 'Early Stop';
    if (et === 'unnecessary_use') return 'Unnecessary Use';
    return et;
  };

  const renderRow = ({ item }: { item: HeatmapRow }) => (
    <View style={[styles.row, item.is_elevated && styles.rowElevated]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowRegion}>{item.region || '—'}</Text>
        <Text style={styles.rowSub}>{item.drug_category} · {getEventLabel(item.event_type)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowCount, item.is_elevated && styles.rowCountElevated]}>
          {item.total_30d_count}
        </Text>
        {item.is_elevated && (
          <View style={styles.elevatedBadge}>
            <Text style={styles.elevatedBadgeText}>⚠ HIGH</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by region…"
          placeholderTextColor={T.disabled}
          value={regionFilter}
          onChangeText={setRegionFilter}
        />
        <Text style={styles.filterLabel}>Event Type</Text>
        <View style={styles.chipRow}>
          {EVENT_TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, eventTypeFilter === opt && styles.chipActive]}
              onPress={() => setEventTypeFilter(opt)}
            >
              <Text style={[styles.chipText, eventTypeFilter === opt && styles.chipTextActive]}>
                {opt === 'all' ? 'All' : getEventLabel(opt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.chip, showElevatedOnly && styles.chipActive]}
            onPress={() => setShowElevatedOnly(v => !v)}
          >
            <Text style={[styles.chipText, showElevatedOnly && styles.chipTextActive]}>
              ⚠ Elevated Only
            </Text>
          </TouchableOpacity>
          <Text style={styles.resultCount}>{filtered.length} results</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <SkeletonCard count={3} variant="grid" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderRow}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
          ListEmptyComponent={
            <EmptyState
              title="No Misuse Signals"
              description="No aggregate regional antimicrobial misuse events match your active filter criteria."
            />
          }
          ListHeaderComponent={
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Region / Category</Text>
              <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>30-Day Count</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  filterSection: {
    backgroundColor: T.surfaceCard,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  searchInput: {
    backgroundColor: T.background,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: T.textColor,
    marginBottom: 12,
  },
  filterLabel: { fontSize: 11, fontWeight: '700', color: T.caption, marginBottom: 8, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.background,
  },
  chipActive: { backgroundColor: T.sageGreen + '22', borderColor: T.sageGreen },
  chipText: { fontSize: 11, color: T.caption, fontWeight: '600' },
  chipTextActive: { color: T.sageGreen },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { fontSize: 12, color: T.caption },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  tableHeaderText: { fontSize: 11, color: T.caption, fontWeight: '700', textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    backgroundColor: T.surfaceCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
  },
  rowElevated: { borderColor: T.dangerClay + '88', backgroundColor: T.dangerClay + '0D' },
  rowLeft: { flex: 2 },
  rowRegion: { fontSize: 15, fontWeight: '700', color: T.textColor, marginBottom: 2 },
  rowSub: { fontSize: 12, color: T.caption },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowCount: { fontSize: 22, fontWeight: '800', color: T.textColor },
  rowCountElevated: { color: T.dangerClay },
  elevatedBadge: {
    backgroundColor: T.dangerClay + '22',
    borderWidth: 1,
    borderColor: T.dangerClay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  elevatedBadgeText: { fontSize: 9, fontWeight: '800', color: T.dangerClay, letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', color: T.caption, fontSize: 15, marginTop: 60 },
});
