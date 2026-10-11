import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Switch, Alert, Clipboard, Keyboard, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronRight, ShieldCheck, Crown, HeartPulse, Eye, User, Copy, Check, Trash2, LogOut,
  PlusCircle, KeyRound, UserPlus, Plus, UserCheck, Users, Sparkles
} from 'lucide-react-native';
import * as T from '../../theme/colors';
import { CabinetIcon } from '../../components/common/MedIcons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { FamilyStackParamList } from '../../navigation/AppNavigator';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';

export default function FamilyCircleScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<FamilyStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [emptyTab, setEmptyTab] = useState<'create' | 'join'>('create');
  const [copiedCode, setCopiedCode] = useState(false);

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
  
  // Empty state form variables
  const [joinCode, setJoinCode] = useState('');
  const [isJoiningAsDependent, setIsJoiningAsDependent] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCircleData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Check if user is in a circle
      const { data: myMember, error: myMemberErr } = await (supabase
        .from('family_members')
        .select('group_id, role')
        .eq('member_id', user.id)
        .limit(1)
        .single() as any);

      if (myMemberErr || !myMember) {
        setCircle(null);
        setMembers([]);
        setUserRole('');
        return;
      }

      setUserRole(myMember.role);

      // Fetch group details
      const { data: group, error: groupErr } = await (supabase
        .from('family_groups')
        .select('*')
        .eq('id', myMember.group_id)
        .single() as any);
      
      if (groupErr) throw groupErr;
      setCircle(group);

      // Fetch all members
      const { data: allMembers, error: membersErr } = await (supabase
        .from('family_members')
        .select(`
          id,
          member_id,
          role,
          is_linked_dependent,
          joined_at
        `)
        .eq('group_id', myMember.group_id)
        .order('joined_at', { ascending: true }) as any);

      if (membersErr) throw membersErr;

      // Fetch member names via circle_member_profiles view (accessible by all roles including viewers)
      const memberIds = (allMembers || []).map((m: any) => m.member_id);
      let profilesMap = new Map();
      if (memberIds.length > 0) {
        const { data: memberProfiles } = await (supabase
          .from('circle_member_profiles')
          .select('id, full_name, account_type')
          .in('id', memberIds) as any);

        if (memberProfiles) {
          profilesMap = new Map(memberProfiles.map((p: any) => [p.id, p]));
        }
      }

      const enriched = (allMembers || []).map((m: any) => ({
        ...m,
        profiles: profilesMap.get(m.member_id) || { full_name: 'Circle Member' },
      }));

      setMembers(enriched);
    } catch (err) {
      console.error('Error fetching circle', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCircleData();
    }, [user])
  );

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const handleCopyInviteCode = () => {
    if (!circle?.invite_code) return;
    Clipboard.setString(circle.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) return Alert.alert('Error', 'Please enter a circle name');
    if (!user) return;
    
    setActionLoading(true);
    try {
      const inviteCode = generateInviteCode();
      const { data: newGroup, error: groupErr } = await (supabase
        .from('family_groups')
        .insert({ name: newCircleName.trim(), owner_id: user.id, invite_code: inviteCode } as any)
        .select()
        .single() as any);
        
      if (groupErr) throw groupErr;

      const { error: memberErr } = await (supabase
        .from('family_members')
        .insert({ group_id: newGroup.id, member_id: user.id, role: 'owner' } as any) as any);

      if (memberErr) throw memberErr;
      
      fetchCircleData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create circle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinCircle = async () => {
    if (!joinCode.trim()) return Alert.alert('Error', 'Please enter an invite code');
    
    setActionLoading(true);
    try {
      const { error } = await (supabase.rpc('join_family_circle', { 
        invite_code: joinCode.trim().toUpperCase(), 
        is_linked_dependent: isJoiningAsDependent 
      } as any) as any);
      
      if (error) throw error;
      fetchCircleData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join circle. Check your invite code.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberRecordId: string, memberName: string) => {
    Alert.alert('Remove Member', `Are you sure you want to remove ${memberName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase.from('family_members').delete().eq('id', memberRecordId);
            if (error) throw error;
            fetchCircleData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
      }}
    ]);
  };

  const handlePromoteCaregiver = async (memberRecordId: string) => {
    try {
      const { error } = await (supabase as any).from('family_members').update({ role: 'caregiver' }).eq('id', memberRecordId);
      if (error) throw error;
      fetchCircleData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteCircle = async () => {
    if (!circle) return;
    Alert.alert(
      'Delete Family Circle',
      `Are you sure you want to delete "${circle.name}"? This will disband the circle for all members and remove all shared inventory.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Circle',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase.from('family_groups').delete().eq('id', circle.id);
              if (error) throw error;
              fetchCircleData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete circle');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLeaveCircle = async () => {
    if (!circle || !user) return;
    Alert.alert(
      'Leave Family Circle',
      `Are you sure you want to leave "${circle.name}"? You will lose access to shared family medications.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Circle',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('family_members')
                .delete()
                .eq('group_id', circle.id)
                .eq('member_id', user.id);
              if (error) throw error;
              fetchCircleData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to leave circle');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Family Circle</Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonCard count={2} variant="list" />
        </View>
      </View>
    );
  }

  if (!circle) {
    return (
      <View style={{ flex: 1, backgroundColor: T.background }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.emptyStateContent, { paddingBottom: Math.max(40, keyboardHeight) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero Header ── */}
          <Animated.View entering={FadeInDown.duration(450)} style={styles.heroSection}>
            <View style={styles.heroRingOuter}>
              <View style={styles.heroRingInner}>
                <Users color={T.sageGreenSolid} size={36} />
              </View>
            </View>
            <Text style={styles.heroTitle}>Family Health Circle</Text>
            <Text style={styles.heroSubtitle}>
              Co-manage prescriptions, share medicine cabinet inventory &amp; receive adherence updates for your family.
            </Text>
          </Animated.View>

          {/* ── Form Card with Segmented Control ── */}
          <Animated.View entering={FadeInUp.duration(450).delay(100)} style={styles.formCard}>
            {/* Segmented Tab Switcher */}
            <View style={styles.segmentTrack}>
              <TouchableOpacity
                style={[styles.segmentTab, emptyTab === 'create' && styles.segmentTabActive]}
                onPress={() => setEmptyTab('create')}
                activeOpacity={0.8}
              >
                <PlusCircle color={emptyTab === 'create' ? T.sageGreenSolid : T.caption} size={15} />
                <Text style={[styles.segmentText, emptyTab === 'create' && styles.segmentTextActive]}>
                  Create Circle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentTab, emptyTab === 'join' && styles.segmentTabActive]}
                onPress={() => setEmptyTab('join')}
                activeOpacity={0.8}
              >
                <KeyRound color={emptyTab === 'join' ? T.sageGreenSolid : T.caption} size={15} />
                <Text style={[styles.segmentText, emptyTab === 'join' && styles.segmentTextActive]}>
                  Join with Code
                </Text>
              </TouchableOpacity>
            </View>

            {emptyTab === 'create' ? (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Text style={styles.cardHeaderTitle}>Create a New Circle</Text>
                <Text style={styles.cardHeaderSub}>
                  You will be assigned as the Circle Owner with full administrative control.
                </Text>

                <Text style={styles.inputLabelText}>CIRCLE NAME</Text>
                <View style={styles.inputWrap}>
                  <Users color={T.caption} size={18} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. The Smith Family"
                    placeholderTextColor={T.placeholder}
                    value={newCircleName}
                    onChangeText={setNewCircleName}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryPillBtn, actionLoading && { opacity: 0.7 }]}
                  onPress={handleCreateCircle}
                  disabled={actionLoading}
                  activeOpacity={0.85}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Plus color="#FFF" size={18} style={{ marginRight: 6 }} />
                      <Text style={styles.primaryPillBtnText}>Create Family Circle</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Text style={styles.cardHeaderTitle}>Join an Existing Circle</Text>
                <Text style={styles.cardHeaderSub}>
                  Enter the 6-character invite code provided by your circle owner.
                </Text>

                <Text style={styles.inputLabelText}>INVITE CODE</Text>
                <View style={styles.inputWrap}>
                  <KeyRound color={T.caption} size={18} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.inputField, { letterSpacing: 2, fontWeight: '700' }]}
                    placeholder="e.g. L61BQN"
                    placeholderTextColor={T.placeholder}
                    autoCapitalize="characters"
                    value={joinCode}
                    onChangeText={setJoinCode}
                    maxLength={6}
                  />
                </View>

                <View style={styles.dependentBox}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <UserCheck color={T.sageGreenSolid} size={16} />
                      <Text style={styles.dependentTitle}>Join as Dependent</Text>
                    </View>
                    <Text style={styles.dependentSub}>
                      Allows family caregivers to manage and log doses on your behalf.
                    </Text>
                  </View>
                  <Switch
                    value={isJoiningAsDependent}
                    onValueChange={setIsJoiningAsDependent}
                    trackColor={{ true: T.sageGreenSolid, false: T.border }}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.secondaryPillBtn, actionLoading && { opacity: 0.7 }]}
                  onPress={handleJoinCircle}
                  disabled={actionLoading}
                  activeOpacity={0.85}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <UserPlus color="#FFF" size={18} style={{ marginRight: 6 }} />
                      <Text style={styles.secondaryPillBtnText}>Join Family Circle</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>ACTIVE CIRCLE</Text>
          </View>
          <Text style={styles.headerTitle}>{circle.name}</Text>
        </View>
        {userRole === 'owner' && (
          <TouchableOpacity
            style={styles.inviteBox}
            onPress={handleCopyInviteCode}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.inviteLabel}>INVITE CODE</Text>
              {copiedCode ? <Check color={T.sageGreenSolid} size={12} /> : <Copy color={T.sageGreenSolid} size={12} />}
            </View>
            <Text style={styles.inviteCode}>{circle.invite_code}</Text>
            {copiedCode && <Text style={styles.copiedTag}>COPIED!</Text>}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {/* Cabinet inventory quick-access card */}
        <TouchableOpacity
          style={styles.cabinetCard}
          onPress={() => navigation.navigate('Cabinet')}
          accessibilityRole="button"
          activeOpacity={0.88}
        >
          <View style={styles.cabinetIconWrap}>
            <CabinetIcon color={T.sageGreenSolid} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text style={styles.cabinetCardTitle}>Medicine Cabinet</Text>
              <View style={styles.cabinetTag}>
                <Text style={styles.cabinetTagText}>Shared Stock</Text>
              </View>
            </View>
            <Text style={styles.cabinetCardSub}>View shared OTC inventory &amp; expiry tracking</Text>
          </View>
          <ChevronRight color={T.caption} size={20} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
        {members.length === 0 ? (
          <EmptyState
            icon={<Users color={T.sageGreenSolid} size={36} />}
            title="No Members in Circle"
            description="Share your circle invite code above with family members or caregivers to join."
          />
        ) : (
          members.map(m => {
            const isMe = m.member_id === user?.id;
            const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
            const name = prof?.full_name || 'Unknown User';
            
            return (
              <View key={m.id} style={styles.memberCard}>
                <TouchableOpacity
                  style={styles.memberRow}
                  onPress={() => navigation.navigate('MemberProfile', {
                    memberId: m.member_id,
                    memberName: name,
                    role: m.role,
                    isLinkedDependent: m.is_linked_dependent,
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={`View profile for ${name}`}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{name} {isMe ? '(You)' : ''}</Text>
                    <View style={styles.badgesRow}>
                      <View style={[styles.roleBadge, m.role === 'owner' ? styles.ownerBadge : {}]}>
                        {m.role === 'owner' ? (
                          <Crown color={T.sageGreenSolid} size={12} style={{ marginRight: 4 }} />
                        ) : m.role === 'caregiver' ? (
                          <HeartPulse color={T.mutedAccentSolid} size={12} style={{ marginRight: 4 }} />
                        ) : (
                          <Eye color={T.caption} size={12} style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.roleBadgeText, m.role === 'owner' ? styles.ownerBadgeText : {}]}>
                          {m.role.toUpperCase()}
                        </Text>
                      </View>
                      {m.is_linked_dependent && (
                        <View style={[styles.roleBadge, { backgroundColor: T.warningAmber + '22', borderColor: T.warningAmber }]}>
                          <User color={T.warningAmber} size={12} style={{ marginRight: 4 }} />
                          <Text style={[styles.roleBadgeText, { color: T.warningAmber }]}>DEPENDENT</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {userRole === 'owner' && !isMe ? (
                    <View style={styles.ownerActions}>
                      {m.role === 'viewer' && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handlePromoteCaregiver(m.id)}>
                          <Text style={styles.actionBtnText}>Make Caregiver</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.actionBtnRemove} onPress={() => handleRemoveMember(m.id, name)}>
                        <Text style={styles.actionBtnTextRemove}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ChevronRight color={T.caption} size={18} style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* ── Circle Management & Actions ── */}
        <View style={styles.circleActionCard}>
          <Text style={styles.circleActionTitle}>CIRCLE MANAGEMENT</Text>
          {userRole === 'owner' ? (
            <TouchableOpacity
              style={styles.deleteCircleBtn}
              onPress={handleDeleteCircle}
              disabled={actionLoading}
              accessibilityRole="button"
            >
              <Trash2 color={T.dangerClaySolid} size={18} style={{ marginRight: 8 }} />
              <Text style={styles.deleteCircleBtnText}>
                {actionLoading ? 'Deleting Circle...' : 'Delete & Disband Circle'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.leaveCircleBtn}
              onPress={handleLeaveCircle}
              disabled={actionLoading}
              accessibilityRole="button"
            >
              <LogOut color={T.dangerClaySolid} size={18} style={{ marginRight: 8 }} />
              <Text style={styles.leaveCircleBtnText}>
                {actionLoading ? 'Leaving Circle...' : 'Leave Family Circle'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyStateContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
  listContent: { padding: 20, paddingBottom: 60 },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroRingOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.sageGreen + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  heroRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: T.sageGreen + '28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: T.textColor,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: T.caption,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 19,
  },

  // Form Card & Segmented Control
  formCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.large,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: T.warmCocoa + '44',
    borderRadius: T.radius.pill,
    padding: 4,
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: T.radius.pill,
  },
  segmentTabActive: {
    backgroundColor: T.surfaceCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.caption,
  },
  segmentTextActive: {
    fontWeight: '800',
    color: T.sageGreenSolid,
  },

  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: T.textColor,
    marginBottom: 4,
  },
  cardHeaderSub: {
    fontSize: 12,
    color: T.caption,
    marginBottom: 16,
    lineHeight: 17,
  },
  inputLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: T.caption,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.warmCocoa + '25',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: T.textColor,
    padding: 0,
  },
  primaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.sageGreenSolid,
    paddingVertical: 14,
    borderRadius: T.radius.pill,
    marginTop: 6,
    ...T.subtleShadow,
  },
  primaryPillBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.mutedAccentSolid,
    paddingVertical: 14,
    borderRadius: T.radius.pill,
    marginTop: 6,
    ...T.subtleShadow,
  },
  secondaryPillBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  dependentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.sageGreen + '12',
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
    borderRadius: T.radius.card,
    padding: 14,
    marginBottom: 16,
  },
  dependentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.textColor,
  },
  dependentSub: {
    fontSize: 11,
    color: T.caption,
    marginTop: 2,
    lineHeight: 15,
  },

  // Active Circle Header
  header: {
    backgroundColor: T.surfaceCard,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    ...T.subtleShadow,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.sageGreenSolid,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: T.sageGreenSolid,
    letterSpacing: 0.6,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T.textColor, letterSpacing: -0.3 },
  inviteBox: {
    alignItems: 'flex-end',
    backgroundColor: T.sageGreen + '18',
    borderRadius: T.radius.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  inviteLabel: { fontSize: 10, fontWeight: '800', color: T.sageGreenSolid, letterSpacing: 0.5 },
  inviteCode: { fontSize: 18, fontWeight: '800', color: T.sageGreenSolid, letterSpacing: 3 },
  copiedTag: { fontSize: 9, fontWeight: '800', color: T.sageGreenSolid, marginTop: 2 },

  // Cabinet Card
  cabinetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.large,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: T.sageGreen + '38',
    ...T.cardShadow,
  },
  cabinetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.sageGreen + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  cabinetCardTitle: { fontSize: 15, fontWeight: '700', color: T.textColor },
  cabinetTag: {
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cabinetTagText: { fontSize: 9, fontWeight: '700', color: T.sageGreenSolid },
  cabinetCardSub: { fontSize: 12, color: T.caption },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: T.caption,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  memberCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 12,
    ...T.cardShadow,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.mutedAccent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.mutedAccent + '55',
  },
  memberAvatarText: { fontSize: 18, fontWeight: '800', color: T.mutedAccentSolid },
  memberInfo: { flex: 1 },
  memberName: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor, marginBottom: 4 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.mutedAccent + '22',
    borderWidth: 1,
    borderColor: T.mutedAccent + '55',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radius.pill,
  },
  roleBadgeText: { fontSize: 10, color: T.mutedAccentSolid, fontWeight: '700', letterSpacing: 0.5 },
  ownerBadge: { backgroundColor: T.sageGreen + '22', borderColor: T.sageGreen + '55' },
  ownerBadgeText: { color: T.sageGreenSolid },
  ownerActions: { alignItems: 'flex-end', gap: 6 },
  actionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: T.sageGreen + '18',
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: T.sageGreenSolid },
  actionBtnRemove: { paddingVertical: 5, paddingHorizontal: 10 },
  actionBtnTextRemove: { fontSize: 11, fontWeight: '700', color: T.dangerClay },

  // Circle Action Management Card
  circleActionCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 18,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: T.dangerClay + '33',
    ...T.cardShadow,
  },
  circleActionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: T.caption,
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  deleteCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.dangerClay + '15',
    borderWidth: 1,
    borderColor: T.dangerClay + '44',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: T.radius.pill,
  },
  deleteCircleBtnText: {
    color: T.dangerClaySolid,
    fontSize: 14,
    fontWeight: '700',
  },
  leaveCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.dangerClay + '15',
    borderWidth: 1,
    borderColor: T.dangerClay + '44',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: T.radius.pill,
  },
  leaveCircleBtnText: {
    color: T.dangerClaySolid,
    fontSize: 14,
    fontWeight: '700',
  },
});

