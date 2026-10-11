import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, StatusBar, TextInput, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import {
  Shield, HeartHandshake, UserX, UserCheck, Trash2, Edit3,
  AlertTriangle, Search, X, ChevronDown, ChevronUp, FileText,
  Copy, Check, Clock, UserMinus, ShieldCheck, ClipboardList,
  Filter, Info, Key, User
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import * as T from '../../theme/colors';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';

// ── Action Visual Metadata Helper ───────────────────────────────────────────
interface ActionMeta {
  label: string;
  category: 'destructive' | 'update' | 'security' | 'info';
  color: string;
  bg: string;
  renderIcon: (size?: number) => React.ReactNode;
}

const getActionMeta = (actionStr: string): ActionMeta => {
  switch (actionStr) {
    case 'delete_user':
      return {
        label: 'Delete User Permanently',
        category: 'destructive',
        color: T.dangerClaySolid,
        bg: T.dangerClay + '18',
        renderIcon: (s = 18) => <Trash2 size={s} color={T.dangerClaySolid} />,
      };
    case 'deactivate_user':
      return {
        label: 'Deactivate / Ban User',
        category: 'destructive',
        color: T.dangerClaySolid,
        bg: T.dangerClay + '16',
        renderIcon: (s = 18) => <UserX size={s} color={T.dangerClaySolid} />,
      };
    case 'activate_user':
      return {
        label: 'Reactivate / Unban User',
        category: 'security',
        color: T.sageGreenSolid,
        bg: T.sageGreen + '18',
        renderIcon: (s = 18) => <UserCheck size={s} color={T.sageGreenSolid} />,
      };
    case 'disband_circle':
      return {
        label: 'Disband Family Circle',
        category: 'destructive',
        color: T.warningAmberSolid,
        bg: T.warningAmber + '18',
        renderIcon: (s = 18) => <AlertTriangle size={s} color={T.warningAmberSolid} />,
      };
    case 'update_profile':
      return {
        label: 'Update User Profile',
        category: 'update',
        color: T.infoTeal,
        bg: T.infoTeal + '18',
        renderIcon: (s = 18) => <Edit3 size={s} color={T.infoTeal} />,
      };
    case 'promote_caregiver':
      return {
        label: 'Promote Caregiver',
        category: 'security',
        color: T.sageGreenSolid,
        bg: T.sageGreen + '18',
        renderIcon: (s = 18) => <ShieldCheck size={s} color={T.sageGreenSolid} />,
      };
    case 'remove_member':
      return {
        label: 'Remove Family Member',
        category: 'update',
        color: T.warningAmberSolid,
        bg: T.warningAmber + '16',
        renderIcon: (s = 18) => <UserMinus size={s} color={T.warningAmberSolid} />,
      };
    case 'caregiver_edit':
      return {
        label: 'Caregiver Record Edit',
        category: 'info',
        color: T.infoTeal,
        bg: T.infoTeal + '16',
        renderIcon: (s = 18) => <FileText size={s} color={T.infoTeal} />,
      };
    default:
      const formattedLabel = actionStr.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return {
        label: formattedLabel,
        category: 'info',
        color: T.sageGreenSolid,
        bg: T.sageGreen + '18',
        renderIcon: (s = 18) => <ClipboardList size={s} color={T.sageGreenSolid} />,
      };
  }
};

// Format timestamp helper
const formatAuditTimestamp = (isoStr?: string) => {
  if (!isoStr) return { dateStr: 'N/A', timeStr: '' };
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const dateStr = isToday ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { dateStr, timeStr };
  } catch {
    return { dateStr: isoStr, timeStr: '' };
  }
};

// ── Log Card Component ──────────────────────────────────────────────────────
const LogCard = React.memo(({ item, index, isExpanded, onToggle }: {
  item: any;
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) => {
  const meta = getActionMeta(item.action);
  const { dateStr, timeStr } = formatAuditTimestamp(item.created_at);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const details = item.details || {};
  const reasonText = details.reason || details.audit_reason || null;
  const targetId = item.target_user_id || details.target_user_id || null;
  const adminId = item.admin_id || details.admin_id || null;

  const copyToClipboard = (text: string, keyName: string) => {
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index * 35, 300))} layout={Layout.springify()}>
      <TouchableOpacity
        style={[styles.card, isExpanded && styles.cardExpanded, { borderLeftColor: meta.color, borderLeftWidth: 4 }]}
        onPress={() => onToggle(item.id)}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        {/* Card Header Row */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
            {meta.renderIcon(20)}
          </View>

          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Text style={styles.actionTitle} numberOfLines={1}>
                {meta.label}
              </Text>
              <View style={[
                styles.categoryBadge,
                meta.category === 'destructive' && styles.badgeDestructive,
                meta.category === 'security' && styles.badgeSecurity,
                meta.category === 'update' && styles.badgeUpdate,
              ]}>
                <Text style={[
                  styles.categoryBadgeText,
                  meta.category === 'destructive' && { color: T.dangerClaySolid },
                  meta.category === 'security' && { color: T.sageGreenSolid },
                  meta.category === 'update' && { color: T.infoTeal },
                ]}>
                  {meta.category.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.timestampRow}>
              <Clock size={12} color={T.caption} />
              <Text style={styles.timestampText}>{dateStr} · {timeStr}</Text>
            </View>
          </View>

          <View style={styles.chevronWrap}>
            {isExpanded ? (
              <ChevronUp size={18} color={T.sageGreenSolid} />
            ) : (
              <ChevronDown size={18} color={T.caption} />
            )}
          </View>
        </View>

        {/* Collapsed Reason Snippet */}
        {!isExpanded && reasonText && (
          <View style={styles.collapsedReasonPreview}>
            <Text style={styles.collapsedReasonText} numberOfLines={1}>
              <Text style={{ fontWeight: '700' }}>Reason: </Text>
              {reasonText}
            </Text>
          </View>
        )}

        {/* Expanded Rich Details View */}
        {isExpanded && (
          <Animated.View entering={FadeInUp.duration(200)} style={styles.expandedDetailsContainer}>
            <View style={styles.detailsDivider} />

            {/* Audit Reason Callout Block */}
            {reasonText && (
              <View style={styles.reasonCard}>
                <View style={styles.reasonCardHeader}>
                  <FileText size={14} color={T.sageGreenSolid} />
                  <Text style={styles.reasonCardLabel}>AUDIT REASON</Text>
                </View>
                <Text style={styles.reasonCardBody}>"{reasonText}"</Text>
              </View>
            )}

            {/* Profile Diff Highlight if available */}
            {details.original && details.new && (
              <View style={styles.diffCard}>
                <Text style={styles.diffLabel}>PROFILE CHANGE</Text>
                <View style={styles.diffRow}>
                  <Text style={styles.diffOld}>{details.original}</Text>
                  <Text style={styles.diffArrow}>➔</Text>
                  <Text style={styles.diffNew}>{details.new}</Text>
                </View>
              </View>
            )}

            {/* Structured Metadata Chips */}
            <View style={styles.metaChipsGrid}>
              {targetId && (
                <TouchableOpacity
                  style={styles.metaChip}
                  onPress={() => copyToClipboard(targetId, 'target')}
                  activeOpacity={0.7}
                >
                  <User size={13} color={T.sageGreenSolid} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chipLabel}>TARGET USER ID</Text>
                    <Text style={styles.chipValueMono} numberOfLines={1}>{targetId}</Text>
                  </View>
                  {copiedKey === 'target' ? (
                    <Check size={14} color={T.sageGreenSolid} />
                  ) : (
                    <Copy size={13} color={T.caption} />
                  )}
                </TouchableOpacity>
              )}

              {adminId && (
                <TouchableOpacity
                  style={styles.metaChip}
                  onPress={() => copyToClipboard(adminId, 'admin')}
                  activeOpacity={0.7}
                >
                  <Shield size={13} color={T.sageGreenSolid} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chipLabel}>ADMIN ID</Text>
                    <Text style={styles.chipValueMono} numberOfLines={1}>{adminId}</Text>
                  </View>
                  {copiedKey === 'admin' ? (
                    <Check size={14} color={T.sageGreenSolid} />
                  ) : (
                    <Copy size={13} color={T.caption} />
                  )}
                </TouchableOpacity>
              )}

              {details.group_name && (
                <View style={styles.metaChip}>
                  <AlertTriangle size={13} color={T.warningAmberSolid} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chipLabel}>FAMILY CIRCLE</Text>
                    <Text style={styles.chipValue} numberOfLines={1}>{details.group_name}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Additional Custom Details Key-Value List */}
            {Object.keys(details).filter(k => !['reason', 'audit_reason', 'target_user_id', 'admin_id', 'original', 'new', 'group_name'].includes(k)).length > 0 && (
              <View style={styles.customKvContainer}>
                <Text style={styles.customKvTitle}>ADDITIONAL EVENT ATTRIBUTES</Text>
                {Object.entries(details)
                  .filter(([k]) => !['reason', 'audit_reason', 'target_user_id', 'admin_id', 'original', 'new', 'group_name'].includes(k))
                  .map(([key, val]) => (
                    <View key={key} style={styles.customKvRow}>
                      <Text style={styles.customKvKey}>{key.replace(/_/g, ' ')}:</Text>
                      <Text style={styles.customKvVal}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});
LogCard.displayName = 'LogCard';

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function AuditLogViewerScreen() {
  const [loading, setLoading] = useState(true);
  const [adminAudits, setAdminAudits] = useState<any[]>([]);
  const [caregiverAudits, setCaregiverAudits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'admin' | 'caregiver'>('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'destructive' | 'updates'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_dashboard_data', payload: {} }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch audit logs');
      setAdminAudits(json.admin_audits || []);
      setCaregiverAudits(json.caregiver_audits || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const rawData = activeTab === 'admin' ? adminAudits : caregiverAudits;

  // Real-time search & filter
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const meta = getActionMeta(item.action);

      // Search filter
      const matchesQuery = !q ||
        (item.action || '').toLowerCase().includes(q) ||
        (meta.label || '').toLowerCase().includes(q) ||
        (item.target_user_id || '').toLowerCase().includes(q) ||
        (item.admin_id || '').toLowerCase().includes(q) ||
        (item.details?.reason || '').toLowerCase().includes(q);

      if (!matchesQuery) return false;

      // Category filter
      if (activeCategoryFilter === 'destructive') return meta.category === 'destructive';
      if (activeCategoryFilter === 'updates') return meta.category === 'update' || meta.category === 'security';

      return true;
    });
  }, [rawData, searchQuery, activeCategoryFilter]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <LogCard
      item={item}
      index={index}
      isExpanded={expandedIds.has(item.id)}
      onToggle={toggleExpand}
    />
  ), [expandedIds, toggleExpand]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Audit Log</Text>
          <Text style={styles.subtitle}>
            {filteredData.length} of {rawData.length} {activeTab} security event{rawData.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filteredData.length} events</Text>
        </View>
      </View>

      {/* Segmented Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.segmentedTab, activeTab === 'admin' && styles.segmentedTabActive]}
          onPress={() => setActiveTab('admin')}
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <Shield size={16} color={activeTab === 'admin' ? '#FFF' : T.caption} />
          <Text style={[styles.tabLabel, activeTab === 'admin' && styles.tabLabelActive]}>
            Admin Audits
          </Text>
          {adminAudits.length > 0 && (
            <View style={[styles.tabBadgePill, activeTab === 'admin' && styles.tabBadgePillActive]}>
              <Text style={[styles.tabBadgePillText, activeTab === 'admin' && { color: '#FFF' }]}>
                {adminAudits.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentedTab, activeTab === 'caregiver' && styles.segmentedTabActive]}
          onPress={() => setActiveTab('caregiver')}
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <HeartHandshake size={16} color={activeTab === 'caregiver' ? '#FFF' : T.caption} />
          <Text style={[styles.tabLabel, activeTab === 'caregiver' && styles.tabLabelActive]}>
            Caregiver Logs
          </Text>
          {caregiverAudits.length > 0 && (
            <View style={[styles.tabBadgePill, activeTab === 'caregiver' && styles.tabBadgePillActive]}>
              <Text style={[styles.tabBadgePillText, activeTab === 'caregiver' && { color: '#FFF' }]}>
                {caregiverAudits.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search & Filter Controls */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={17} color={T.caption} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by action, reason, or user ID…"
            placeholderTextColor={T.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={T.caption} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeCategoryFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveCategoryFilter('all')}
          >
            <Text style={[styles.filterChipText, activeCategoryFilter === 'all' && styles.filterChipTextActive]}>All Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeCategoryFilter === 'destructive' && styles.filterChipActive]}
            onPress={() => setActiveCategoryFilter('destructive')}
          >
            <Text style={[styles.filterChipText, activeCategoryFilter === 'destructive' && styles.filterChipTextActive]}>Destructive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeCategoryFilter === 'updates' && styles.filterChipActive]}
            onPress={() => setActiveCategoryFilter('updates')}
          >
            <Text style={[styles.filterChipText, activeCategoryFilter === 'updates' && styles.filterChipTextActive]}>Updates &amp; Security</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audit Log Items */}
      {loading && rawData.length === 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonCard count={4} variant="compact" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={T.sageGreen} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <EmptyState
              title={`No ${activeTab === 'admin' ? 'Admin' : 'Caregiver'} Events Found`}
              description="System actions, account modifications, and security audit logs will automatically populate here as events occur."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: T.textColor, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: T.caption, marginTop: 2, fontWeight: '500' },
  countBadge: {
    flexShrink: 0,
    backgroundColor: T.sageGreen + '22',
    borderRadius: T.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  countText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.sageGreenSolid },

  // Segmented Tab Selector
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 4,
    borderWidth: 1,
    borderColor: T.border,
    gap: 4,
    ...T.subtleShadow,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: T.radius.card - 4,
  },
  segmentedTabActive: {
    backgroundColor: T.sageGreenSolid,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: T.caption,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBadgePill: {
    backgroundColor: T.mutedAccent + '18',
    borderRadius: T.radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tabBadgePillActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: T.caption,
  },

  // Search & Filter
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
    marginBottom: 8,
    ...T.subtleShadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: T.textColor,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.radius.pill,
    backgroundColor: T.surfaceCard,
    borderWidth: 1,
    borderColor: T.border,
  },
  filterChipActive: {
    backgroundColor: T.warmCocoa + '22',
    borderColor: T.sageGreenSolid,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: T.caption,
  },
  filterChipTextActive: {
    color: T.sageGreenSolid,
    fontWeight: '700',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 2 },

  // Log Card
  card: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  cardExpanded: {
    borderColor: T.sageGreenSolid + '66',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.textColor,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: T.background,
    borderWidth: 1,
    borderColor: T.border,
  },
  badgeDestructive: {
    backgroundColor: T.dangerClay + '12',
    borderColor: T.dangerClay + '33',
  },
  badgeSecurity: {
    backgroundColor: T.sageGreen + '12',
    borderColor: T.sageGreen + '33',
  },
  badgeUpdate: {
    backgroundColor: T.infoTeal + '12',
    borderColor: T.infoTeal + '33',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 12,
    color: T.caption,
    fontWeight: '500',
  },
  chevronWrap: {
    paddingLeft: 4,
  },

  // Collapsed Reason Preview
  collapsedReasonPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.border + '88',
  },
  collapsedReasonText: {
    fontSize: 12,
    color: T.caption,
    fontStyle: 'italic',
  },

  // Expanded View
  expandedDetailsContainer: {
    marginTop: 10,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 8,
  },

  // Reason Callout Card
  reasonCard: {
    backgroundColor: T.sageGreen + '0D',
    borderRadius: T.radius.card - 2,
    padding: 12,
    borderWidth: 1,
    borderColor: T.sageGreen + '28',
    marginBottom: 10,
  },
  reasonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reasonCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: T.sageGreenSolid,
    letterSpacing: 0.6,
  },
  reasonCardBody: {
    fontSize: 13,
    color: T.textColor,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Diff Card
  diffCard: {
    backgroundColor: T.infoTeal + '0D',
    borderRadius: T.radius.card - 2,
    padding: 10,
    borderWidth: 1,
    borderColor: T.infoTeal + '28',
    marginBottom: 10,
  },
  diffLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: T.infoTeal,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diffOld: {
    fontSize: 12,
    color: T.caption,
    textDecorationLine: 'line-through',
  },
  diffArrow: {
    fontSize: 12,
    color: T.infoTeal,
  },
  diffNew: {
    fontSize: 12,
    fontWeight: '700',
    color: T.textColor,
  },

  // Meta Chips Grid
  metaChipsGrid: {
    gap: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.background,
    borderRadius: T.radius.card - 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: T.caption,
    letterSpacing: 0.5,
  },
  chipValueMono: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: T.textColor,
    fontWeight: '600',
  },
  chipValue: {
    fontSize: 12,
    color: T.textColor,
    fontWeight: '600',
  },

  // Custom Key-Value Container
  customKvContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  customKvTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: T.caption,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  customKvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  customKvKey: {
    fontSize: 11,
    fontWeight: '600',
    color: T.caption,
    textTransform: 'capitalize',
  },
  customKvVal: {
    fontSize: 11,
    fontWeight: '700',
    color: T.textColor,
  },
});
