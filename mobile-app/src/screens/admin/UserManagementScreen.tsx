import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, RefreshControl, StatusBar, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
  UserCheck, UserX, Trash2, Edit3, Copy, Check, Users, Pill,
  Calendar, Mail, Clock, AlertTriangle, ShieldCheck, ChevronRight, X, Search, Filter
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import * as T from '../../theme/colors';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';

const ACCOUNT_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  standard:          { label: 'Standard', color: T.sageGreenSolid, bg: T.sageGreen + '18' },
  linked_dependent:  { label: 'Dependent', color: T.warningAmberSolid, bg: T.warningAmber + '18' },
  admin:             { label: 'Admin', color: T.dangerClaySolid, bg: T.dangerClay + '18' },
};

const getAccountMeta = (type: string, isAdmin: boolean) => {
  if (isAdmin) return ACCOUNT_TYPE_META.admin;
  return ACCOUNT_TYPE_META[type] ?? ACCOUNT_TYPE_META.standard;
};

export default function UserManagementScreen() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'banned' | 'admin'>('all');

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchData = React.useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_dashboard_data', payload: {} }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch');
      setUsers(json.users || []);
      setGroups(json.groups || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (u.full_name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.id || '').toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (activeFilter === 'active') return !u.is_banned;
      if (activeFilter === 'banned') return u.is_banned;
      if (activeFilter === 'admin') return !!u.is_admin;
      return true;
    });
  }, [users, searchQuery, activeFilter]);

  const fetchUserDetails = async (userId: string) => {
    setDetailsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_user_details', payload: { target_user_id: userId } }),
      });
      const json = await response.json();
      if (response.ok) {
        setUserDetails(json);
      }
    } catch (err) {
      console.warn('Failed to fetch user extra details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setNewName(user.full_name || '');
    setEditingName(false);
    setReason('');
    setCopiedId(false);
    setUserDetails(null);
    fetchUserDetails(user.id);
  };

  const handleAction = async (action: string, payload: any, confirmMsg?: string) => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'A mandatory audit reason must be provided for all administrative actions.');
      return;
    }

    const execute = async () => {
      setActionLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload: { ...payload, reason: reason.trim() } }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Action failed');

        // Dynamically update state immediately for instant feedback across all views & tabs
        if (action === 'deactivate_user') {
          setUsers(prev => prev.map(u => u.id === payload.target_user_id ? { ...u, is_banned: true } : u));
        } else if (action === 'activate_user') {
          setUsers(prev => prev.map(u => u.id === payload.target_user_id ? { ...u, is_banned: false } : u));
        } else if (action === 'delete_user') {
          setUsers(prev => prev.filter(u => u.id !== payload.target_user_id));
        } else if (action === 'update_profile') {
          setUsers(prev => prev.map(u => u.id === payload.target_user_id ? { ...u, full_name: payload.full_name } : u));
        }

        Alert.alert('Success', 'Administrative action executed successfully.');
        setSelectedUser(null);
        setReason('');
        await fetchData();
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        setActionLoading(false);
      }
    };

    if (confirmMsg) {
      Alert.alert('Confirm Action', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', style: 'destructive', onPress: execute },
      ]);
    } else {
      execute();
    }
  };

  const copyUserId = (id: string) => {
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isOwner = groups.some(g => g.owner_id === item.id);
    const meta = getAccountMeta(item.account_type || 'standard', !!item.is_admin);
    const initials = (item.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 40)}>
        <TouchableOpacity
          style={[styles.userCard, item.is_banned && styles.userCardBanned]}
          onPress={() => handleSelectUser(item)}
          accessibilityRole="button"
          activeOpacity={0.78}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: meta.bg, borderColor: meta.color + '44' }]}>
            <Text style={[styles.avatarText, { color: meta.color }]}>{initials}</Text>
            <View style={[styles.statusDot, { backgroundColor: item.is_banned ? T.dangerClaySolid : T.sageGreenSolid }]} />
          </View>

          {/* Info */}
          <View style={styles.userInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.userName} numberOfLines={1}>{item.full_name || 'Unnamed User'}</Text>
              {item.is_banned && (
                <View style={styles.bannedTag}>
                  <Text style={styles.bannedTagText}>BANNED</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email || item.id}
            </Text>
          </View>

          {/* Badges */}
          <View style={styles.badgesCol}>
            <View style={[styles.typeBadge, { backgroundColor: meta.bg, borderColor: meta.color + '44' }]}>
              <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>⭐ Owner</Text>
              </View>
            )}
          </View>

          <ChevronRight size={18} color={T.caption} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const isSelectedOwner = selectedUser && groups.some(g => g.owner_id === selectedUser.id);
  const selectedMeta = selectedUser ? getAccountMeta(selectedUser.account_type || 'standard', !!selectedUser.is_admin) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitleHeader}>Inspect profiles, manage accounts &amp; audit controls</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filteredUsers.length} of {users.length}</Text>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={T.caption} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or user ID…"
            placeholderTextColor={T.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={T.caption} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>All ({users.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'active' && styles.filterChipActive]}
            onPress={() => setActiveFilter('active')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'active' && styles.filterChipTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'banned' && styles.filterChipActive]}
            onPress={() => setActiveFilter('banned')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'banned' && styles.filterChipTextActive]}>Banned</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'admin' && styles.filterChipActive]}
            onPress={() => setActiveFilter('admin')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'admin' && styles.filterChipTextActive]}>Admins</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading && users.length === 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonCard count={4} variant="compact" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={T.sageGreen} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No Users Found"
              description="No registered user accounts match your active search query or filter selection."
            />
          }
        />
      )}

      {/* Action & Detail Sheet Modal */}
      <Modal visible={!!selectedUser} animationType="slide" transparent onRequestClose={() => setSelectedUser(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.overlay}>
            <Animated.View entering={FadeInUp.duration(350)} style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Modal Top Header */}
                <View style={styles.sheetTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>Manage User Account</Text>
                    <Text style={styles.sheetSub}>Full administration panel for account details</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedUser(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={20} color={T.caption} />
                  </TouchableOpacity>
                </View>

                {selectedUser && (
                  <>
                    {/* User Hero Profile Card */}
                    <View style={styles.userSummaryCard}>
                      <View style={[styles.avatarLarge, { backgroundColor: selectedMeta?.bg, borderColor: selectedMeta?.color + '44' }]}>
                        <Text style={[styles.avatarLargeText, { color: selectedMeta?.color }]}>
                          {(selectedUser.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        {editingName ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <TextInput
                              style={styles.nameEditInput}
                              value={newName}
                              onChangeText={setNewName}
                              placeholder="Enter full name"
                              autoFocus
                            />
                            <TouchableOpacity
                              style={styles.saveNameBtn}
                              onPress={() => {
                                handleAction('update_profile', {
                                  target_user_id: selectedUser.id,
                                  original_name: selectedUser.full_name,
                                  full_name: newName.trim(),
                                });
                                setEditingName(false);
                              }}
                            >
                              <Check size={16} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={styles.summaryName}>{selectedUser.full_name || 'Unnamed User'}</Text>
                            <TouchableOpacity style={styles.editPillBtn} onPress={() => setEditingName(true)}>
                              <Edit3 size={13} color={T.sageGreenSolid} />
                              <Text style={styles.editPillText}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        <Text style={styles.summaryEmail}>{selectedUser.email || 'No email registered'}</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <View style={[styles.typeBadge, { backgroundColor: selectedMeta?.bg, borderColor: selectedMeta?.color + '44' }]}>
                            <Text style={[styles.typeBadgeText, { color: selectedMeta?.color }]}>{selectedMeta?.label}</Text>
                          </View>
                          {selectedUser.is_banned ? (
                            <View style={styles.bannedBadge}>
                              <Text style={styles.bannedBadgeText}>• BANNED</Text>
                            </View>
                          ) : (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>• ACTIVE</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Detailed Metadata Grid */}
                    <Text style={styles.sectionHeading}>ACCOUNT METADATA</Text>
                    <View style={styles.metaGrid}>
                      <TouchableOpacity style={styles.metaGridItem} onPress={() => copyUserId(selectedUser.id)}>
                        <View style={styles.metaIconWrap}>
                          <Copy size={15} color={T.sageGreenSolid} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.metaLabel}>USER ID</Text>
                          <Text style={styles.metaValueMono} numberOfLines={1}>{selectedUser.id}</Text>
                        </View>
                        {copiedId ? <Text style={styles.copiedText}>COPIED!</Text> : <Text style={styles.copyHint}>Tap to copy</Text>}
                      </TouchableOpacity>

                      <View style={styles.metaRowTwo}>
                        <View style={styles.metaGridItemHalf}>
                          <View style={styles.metaIconWrap}>
                            <Calendar size={15} color={T.sageGreenSolid} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.metaLabel}>JOINED</Text>
                            <Text style={styles.metaValue}>{formatDate(selectedUser.created_at)}</Text>
                          </View>
                        </View>

                        <View style={styles.metaGridItemHalf}>
                          <View style={styles.metaIconWrap}>
                            <Clock size={15} color={T.sageGreenSolid} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.metaLabel}>LAST LOGIN</Text>
                            <Text style={styles.metaValue}>{formatDate(selectedUser.last_sign_in_at)}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Extra Telemetry */}
                      {detailsLoading ? (
                        <ActivityIndicator size="small" color={T.sageGreenSolid} style={{ marginVertical: 10 }} />
                      ) : userDetails ? (
                        <View style={styles.telemetryRow}>
                          <View style={styles.telemetryChip}>
                            <Pill size={14} color={T.sageGreenSolid} />
                            <Text style={styles.telemetryText}>{userDetails.courses?.length || 0} Med Courses</Text>
                          </View>
                          <View style={styles.telemetryChip}>
                            <Users size={14} color={T.sageGreenSolid} />
                            <Text style={styles.telemetryText}>
                              {userDetails.family?.length ? userDetails.family[0]?.family_groups?.name || 'In Family' : 'No Circle'}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    {/* Audit Reason */}
                    <Text style={styles.reasonLabel}>AUDIT REASON (REQUIRED)</Text>
                    <TextInput
                      style={styles.reasonInput}
                      placeholder="Describe the reason for this administrative action…"
                      placeholderTextColor={T.placeholder}
                      value={reason}
                      onChangeText={setReason}
                      multiline
                    />

                    {/* Action Buttons */}
                    <Text style={styles.sectionHeading}>ADMINISTRATIVE ACTIONS</Text>
                    <View style={styles.actionBtns}>

                      {/* Deactivate/Ban vs Activate/Unban */}
                      {selectedUser.is_banned ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnSuccess, actionLoading && { opacity: 0.5 }]}
                          onPress={() => handleAction('activate_user', { target_user_id: selectedUser.id })}
                          disabled={actionLoading}
                          accessibilityRole="button"
                        >
                          {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                            <View style={styles.btnInner}>
                              <UserCheck size={18} color="#FFF" />
                              <Text style={styles.actionBtnText}>Reactivate / Unban Account</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnDanger, actionLoading && { opacity: 0.5 }]}
                          onPress={() => handleAction('deactivate_user', { target_user_id: selectedUser.id })}
                          disabled={actionLoading}
                          accessibilityRole="button"
                        >
                          {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                            <View style={styles.btnInner}>
                              <UserX size={18} color="#FFF" />
                              <Text style={styles.actionBtnText}>Deactivate / Ban User</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Disband Circle (If Owner) */}
                      {isSelectedOwner && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnWarn, actionLoading && { opacity: 0.5 }]}
                          onPress={() => handleAction(
                            'disband_circle',
                            { target_group_id: groups.find(g => g.owner_id === selectedUser.id)?.id },
                            'Are you sure you want to disband this family circle? All members will be unlinked.'
                          )}
                          disabled={actionLoading}
                          accessibilityRole="button"
                        >
                          <View style={styles.btnInner}>
                            <AlertTriangle size={18} color="#FFF" />
                            <Text style={styles.actionBtnText}>Disband Family Circle</Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Delete User Permanently */}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnPurge, actionLoading && { opacity: 0.5 }]}
                        onPress={() => handleAction(
                          'delete_user',
                          { target_user_id: selectedUser.id },
                          `Are you sure you want to PERMANENTLY DELETE ${selectedUser.full_name || 'this user'}? This will erase their profile, medication records, and login auth account permanently.`
                        )}
                        disabled={actionLoading}
                        accessibilityRole="button"
                      >
                        {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                          <View style={styles.btnInner}>
                            <Trash2 size={18} color="#FFF" />
                            <Text style={styles.actionBtnText}>Delete User Permanently</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setSelectedUser(null); setReason(''); }}
                >
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
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
    paddingTop: 54,
    paddingBottom: 12,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: T.textColor, letterSpacing: -0.5 },
  subtitleHeader: { fontSize: 13, color: T.caption, marginTop: 2, fontWeight: '500' },
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

  // Search & Filter
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
    marginBottom: 10,
    ...T.subtleShadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: T.textColor,
  },
  filterScroll: { gap: 8, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: T.radius.pill,
    backgroundColor: T.surfaceCard,
    borderWidth: 1,
    borderColor: T.border,
  },
  filterChipActive: {
    backgroundColor: T.sageGreenSolid,
    borderColor: T.sageGreenSolid,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.caption,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 4 },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
    gap: 12,
    ...T.cardShadow,
  },
  userCardBanned: {
    borderColor: T.dangerClay + '55',
    backgroundColor: T.dangerClay + '08',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: T.surfaceCard,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor },
  userEmail: { fontSize: T.fontSize.caption, color: T.caption, marginTop: 2 },
  badgesCol: { alignItems: 'flex-end', gap: 4 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radius.pill,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  ownerBadge: {
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: T.radius.pill,
  },
  ownerBadgeText: { fontSize: 10, color: T.sageGreenSolid, fontWeight: '700' },
  bannedTag: {
    backgroundColor: T.dangerClaySolid + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannedTagText: { fontSize: 9, fontWeight: '800', color: T.dangerClaySolid },

  // Modal Sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: T.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: T.warmCocoa,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: T.textColor, letterSpacing: -0.4 },
  sheetSub: { fontSize: 13, color: T.caption, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: T.warmCocoa + '55',
    alignItems: 'center', justifyContent: 'center',
  },

  // User Hero Card
  userSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '14',
    borderRadius: T.radius.large,
    padding: 16,
    gap: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: T.sageGreen + '33',
  },
  avatarLarge: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarLargeText: { fontSize: 24, fontWeight: '800' },
  summaryName: { fontSize: 18, fontWeight: '800', color: T.textColor },
  summaryEmail: { fontSize: 13, color: T.caption },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.sageGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  editPillText: { fontSize: 11, fontWeight: '700', color: T.sageGreenSolid },
  nameEditInput: {
    flex: 1,
    backgroundColor: T.surfaceCard,
    borderWidth: 1,
    borderColor: T.sageGreen,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: '700',
    color: T.textColor,
  },
  saveNameBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: T.sageGreenSolid,
    alignItems: 'center', justifyContent: 'center',
  },
  bannedBadge: {
    backgroundColor: T.dangerClaySolid + '22',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: T.radius.pill,
  },
  bannedBadgeText: { fontSize: 10, fontWeight: '800', color: T.dangerClaySolid },
  activeBadge: {
    backgroundColor: T.sageGreen + '22',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: T.radius.pill,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: T.sageGreenSolid },

  sectionHeading: {
    fontSize: 11, fontWeight: '800', color: T.caption,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  // Metadata Grid
  metaGrid: { marginBottom: 20 },
  metaGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.background,
    borderRadius: T.radius.small,
    padding: 12, gap: 10,
    marginBottom: 8, borderWidth: 1, borderColor: T.border,
  },
  metaRowTwo: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  metaGridItemHalf: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.background, borderRadius: T.radius.small,
    padding: 12, gap: 10, borderWidth: 1, borderColor: T.border,
  },
  metaIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: T.sageGreen + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  metaLabel: { fontSize: 10, fontWeight: '800', color: T.caption, letterSpacing: 0.5 },
  metaValue: { fontSize: 13, fontWeight: '700', color: T.textColor, marginTop: 1 },
  metaValueMono: { fontSize: 12, fontWeight: '700', color: T.textColor, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 1 },
  copyHint: { fontSize: 10, fontWeight: '600', color: T.caption },
  copiedText: { fontSize: 10, fontWeight: '800', color: T.sageGreenSolid },

  telemetryRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  telemetryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.sageGreen + '15',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: T.radius.pill, borderWidth: 1, borderColor: T.sageGreen + '33',
  },
  telemetryText: { fontSize: 12, fontWeight: '700', color: T.sageGreenSolid },

  // Form Reason
  reasonLabel: {
    fontSize: 11, fontWeight: '800', color: T.caption,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: T.background,
    borderWidth: 1, borderColor: T.border,
    borderRadius: T.radius.card,
    padding: 14, fontSize: T.fontSize.body, color: T.textColor,
    minHeight: 74, textAlignVertical: 'top', marginBottom: 20,
  },

  // Actions
  actionBtns: { gap: 10, marginBottom: 14 },
  actionBtn: {
    borderRadius: T.radius.large, paddingVertical: 14,
    alignItems: 'center', ...T.subtleShadow,
  },
  actionBtnDanger: { backgroundColor: T.dangerClaySolid },
  actionBtnSuccess: { backgroundColor: T.sageGreenSolid },
  actionBtnWarn: { backgroundColor: T.warningAmberSolid },
  actionBtnPurge: { backgroundColor: '#8B0000' },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  cancelBtn: {
    alignItems: 'center', paddingVertical: 12, marginTop: 4,
    borderRadius: T.radius.large, borderWidth: 1, borderColor: T.border,
    backgroundColor: T.surfaceCard,
  },
  cancelText: { color: T.textColor, fontWeight: '700', fontSize: T.fontSize.body },
});
