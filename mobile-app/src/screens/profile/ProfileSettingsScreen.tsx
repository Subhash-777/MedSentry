import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { MapPin, X, Check, ChevronRight, ShieldCheck, Sliders, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import * as T from '../../theme/colors';
import {
  CapsuleIcon,
  StethoscopeIcon,
  GenomeIcon,
  ShieldIcon,
  LeafIcon,
  HeartIcon,
  AllergyAlertIcon,
  HospitalIcon,
  AgeCalendarIcon,
  ScaleWeightIcon,
  RulerHeightIcon,
  EditPencilIcon,
  LockIcon,
  PhoneCallIcon,
  LogoutIcon,
  SettingsGearIcon,
  UsersGroupIcon,
} from '../../components/common/MedIcons';

// ── Avatar Presets ───────────────────────────────────────────────────────────
const AVATAR_PRESETS = [
  { id: 'preset_meds', label: 'Capsule', renderIcon: (c: string) => <CapsuleIcon color={c} size={28} /> },
  { id: 'preset_doctor', label: 'Stethoscope', renderIcon: (c: string) => <StethoscopeIcon color={c} size={28} /> },
  { id: 'preset_dna', label: 'Genome', renderIcon: (c: string) => <GenomeIcon color={c} size={28} /> },
  { id: 'preset_shield', label: 'Guardian', renderIcon: (c: string) => <ShieldIcon color={c} size={28} /> },
  { id: 'preset_leaf', label: 'Herbal', renderIcon: (c: string) => <LeafIcon color={c} size={28} /> },
  { id: 'preset_heart', label: 'Wellness', renderIcon: (c: string) => <HeartIcon color={c} size={28} /> },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileSettingsScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();

  // Consent state
  const [consentRevoked, setConsentRevoked] = useState<boolean>(
    profile?.caregiver_consent_revoked ?? false
  );
  const [savingConsent, setSavingConsent] = useState(false);

  // Modals visibility
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [medicalIdModalVisible, setMedicalIdModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Profile Edit Form State
  const [fullNameInput, setFullNameInput] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [conditionsInput, setConditionsInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [regionInput, setRegionInput] = useState('');
  const [emergencyNameInput, setEmergencyNameInput] = useState('');
  const [emergencyPhoneInput, setEmergencyPhoneInput] = useState('');
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState<string | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Modal State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const openEditModal = () => {
    setFullNameInput(profile?.full_name || user?.user_metadata?.full_name || '');
    setAgeInput(profile?.age ? String(profile.age) : '');
    setWeightInput(profile?.weight_kg ? String(profile.weight_kg) : '');
    setHeightInput(profile?.height_cm ? String(profile.height_cm) : '');
    setConditionsInput(profile?.known_conditions ? profile.known_conditions.join(', ') : '');
    setAllergiesInput(profile?.allergies ? profile.allergies.join(', ') : '');
    setRegionInput(profile?.region || '');
    setEmergencyNameInput(user?.user_metadata?.emergency_contact_name || '');
    setEmergencyPhoneInput(user?.user_metadata?.emergency_contact_phone || '');
    setCustomAvatarUrl(user?.user_metadata?.avatar_url || null);
    setSelectedAvatarPreset(user?.user_metadata?.avatar_preset || null);
    setEditModalVisible(true);
  };

  // Image Picker Logic
  const handlePickImageFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Media library access is needed to select a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setCustomAvatarUrl(uri);
        setSelectedAvatarPreset(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select image from gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setCustomAvatarUrl(uri);
        setSelectedAvatarPreset(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to take photo.');
    }
  };

  const handleRemovePhoto = () => {
    setCustomAvatarUrl(null);
  };

  const handleSaveProfile = async () => {
    const userId = user?.id || profile?.id;
    if (!userId) return;
    setSavingProfile(true);
    try {
      const parsedAge = ageInput.trim() ? parseInt(ageInput.trim(), 10) : null;
      const parsedWeight = weightInput.trim() ? parseFloat(weightInput.trim()) : null;
      const parsedHeight = heightInput.trim() ? parseFloat(heightInput.trim()) : null;

      const knownConditionsArr = conditionsInput.trim()
        ? conditionsInput.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const allergiesArr = allergiesInput.trim()
        ? allergiesInput.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // 1. Update Supabase `profiles` row
      const { error: profileErr } = await (supabase.from('profiles') as any)
        .update({
          full_name: fullNameInput.trim() || null,
          age: parsedAge,
          weight_kg: parsedWeight,
          height_cm: parsedHeight,
          known_conditions: knownConditionsArr,
          allergies: allergiesArr,
          region: regionInput.trim() || null,
        })
        .eq('id', userId);

      if (profileErr) throw profileErr;

      // 2. Update Supabase Auth user_metadata
      const newMetadata: Record<string, any> = {
        ...user?.user_metadata,
        full_name: fullNameInput.trim() || user?.user_metadata?.full_name,
        emergency_contact_name: emergencyNameInput.trim(),
        emergency_contact_phone: emergencyPhoneInput.trim(),
      };

      if (customAvatarUrl) {
        newMetadata.avatar_url = customAvatarUrl;
        newMetadata.avatar_preset = null;
      } else if (selectedAvatarPreset) {
        newMetadata.avatar_url = null;
        newMetadata.avatar_preset = selectedAvatarPreset;
      } else {
        newMetadata.avatar_url = null;
        newMetadata.avatar_preset = null;
      }

      await supabase.auth.updateUser({ data: newMetadata });

      // 3. Refresh AuthContext so HomeScreen & Profile update instantly
      await refreshProfile();

      setEditModalVisible(false);
      Alert.alert('✅ Profile Updated', 'Your profile and health passport details have been saved.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConsentToggle = async (value: boolean) => {
    const userId = profile?.id || user?.id;
    if (!userId) return;
    setSavingConsent(true);
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ caregiver_consent_revoked: value })
        .eq('id', userId);

      if (error) throw error;
      setConsentRevoked(value);
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update caregiver consent setting.');
    } finally {
      setSavingConsent(false);
    }
  };

  const handleSelectLanguage = async (langCode: string) => {
    const userId = profile?.id || user?.id;
    if (!userId) return;
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ preferred_language: langCode })
        .eq('id', userId);

      if (error) throw error;
      setLangModalVisible(false);
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update language preference.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter both password fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => {
        setPasswordModalVisible(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg(null);
      }, 1500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out of MedSentry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  // ── Derived Profile Data & Metrics ───────────────────────────────────────
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const avatarPresetId = user?.user_metadata?.avatar_preset;
  const avatarPresetObj = AVATAR_PRESETS.find((p) => p.id === avatarPresetId);

  const fullName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    'User';

  const initials = fullName && fullName !== 'User'
    ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const accountTypeLabel = profile?.is_admin
    ? 'Admin Account'
    : profile?.account_type === 'linked_dependent'
    ? 'Dependent Account'
    : 'Standard Account';

  const accountTypeBadgeColor = profile?.is_admin
    ? T.dangerClaySolid
    : profile?.account_type === 'linked_dependent'
    ? T.mutedAccentSolid
    : T.sageGreenSolid;

  // BMI Calculation
  const weight = profile?.weight_kg;
  const height = profile?.height_cm;
  let bmiValue: string | null = null;
  let bmiCategory: string | null = null;
  let bmiColor = T.sageGreenSolid;

  if (weight && height && height > 0) {
    const bmiNum = weight / ((height / 100) * (height / 100));
    bmiValue = bmiNum.toFixed(1);
    if (bmiNum < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = T.warningAmberSolid;
    } else if (bmiNum < 25) {
      bmiCategory = 'Healthy Weight';
      bmiColor = T.sageGreenSolid;
    } else if (bmiNum < 30) {
      bmiCategory = 'Overweight';
      bmiColor = T.warningAmberSolid;
    } else {
      bmiCategory = 'Obese';
      bmiColor = T.dangerClaySolid;
    }
  }

  const currentLangObj = LANGUAGES.find((l) => l.code === (profile?.preferred_language || 'en')) || LANGUAGES[0];
  const emergencyName = user?.user_metadata?.emergency_contact_name;
  const emergencyPhone = user?.user_metadata?.emergency_contact_phone;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* ── Profile Hero Section ───────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.heroSection}>
        <TouchableOpacity style={styles.avatarOuter} onPress={openEditModal} activeOpacity={0.85}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : avatarPresetObj ? (
            <View style={styles.avatarPresetWrap}>
              {avatarPresetObj.renderIcon(T.sageGreenSolid)}
            </View>
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarRing} />
          <View style={styles.editAvatarBadge}>
            <EditPencilIcon color={T.sageGreenSolid} size={12} />
          </View>
        </TouchableOpacity>

        <Text style={styles.profileName}>{fullName}</Text>
        <Text style={styles.userEmail}>{user?.email || 'No email attached'}</Text>

        <View style={styles.heroBadgesRow}>
          <View
            style={[
              styles.accountBadge,
              { backgroundColor: accountTypeBadgeColor + '18', borderColor: accountTypeBadgeColor + '44' },
            ]}
          >
            <Text style={[styles.accountBadgeText, { color: accountTypeBadgeColor }]}>
              {accountTypeLabel}
            </Text>
          </View>
          {profile?.region && (
            <View style={styles.regionBadge}>
              <MapPin color={T.sageGreenSolid} size={12} style={{ marginRight: 4 }} />
              <Text style={styles.regionBadgeText}>{profile.region}</Text>
            </View>
          )}
        </View>

        {/* Quick Health Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <View style={{ marginBottom: 2 }}>
              <AgeCalendarIcon color={T.sageGreenSolid} size={18} />
            </View>
            <Text style={styles.statBoxVal}>{profile?.age ? `${profile.age} yrs` : '--'}</Text>
            <Text style={styles.statBoxSub}>Age</Text>
          </View>

          <View style={styles.statBoxDivider} />

          <View style={styles.statBox}>
            <View style={{ marginBottom: 2 }}>
              <ScaleWeightIcon color={T.sageGreenSolid} size={18} />
            </View>
            <Text style={styles.statBoxVal}>{profile?.weight_kg ? `${profile.weight_kg} kg` : '--'}</Text>
            <Text style={styles.statBoxSub}>Weight</Text>
          </View>

          <View style={styles.statBoxDivider} />

          <View style={styles.statBox}>
            <View style={{ marginBottom: 2 }}>
              <RulerHeightIcon color={T.sageGreenSolid} size={18} />
            </View>
            <Text style={styles.statBoxVal}>{profile?.height_cm ? `${profile.height_cm} cm` : '--'}</Text>
            <Text style={styles.statBoxSub}>Height</Text>
          </View>

          <View style={styles.statBoxDivider} />

          <View style={styles.statBox}>
            <View style={{ marginBottom: 2 }}>
              <AllergyAlertIcon color={T.warningAmberSolid} size={18} />
            </View>
            <Text style={styles.statBoxVal}>
              {profile?.allergies && profile.allergies.length > 0 ? profile.allergies.length : 0}
            </Text>
            <Text style={styles.statBoxSub}>Allergies</Text>
          </View>
        </View>

        {/* Primary Edit Button */}
        <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal} activeOpacity={0.8}>
          <EditPencilIcon color="#FFF" size={14} />
          <Text style={styles.editProfileBtnText}>Edit Profile &amp; Health Data</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Admin Control Portal Banner (If Admin) ─────────────────────────── */}
      {profile?.is_admin && (
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => navigation.navigate('AdminTab' as any)}
            activeOpacity={0.88}
          >
            <View style={styles.adminBannerHeaderRow}>
              <View style={styles.adminBadgePill}>
                <View style={styles.adminLiveDot} />
                <Text style={styles.adminBadgeText}>ADMIN SYSTEM CONSOLE</Text>
              </View>
              <View style={styles.adminActionPill}>
                <Text style={styles.adminActionPillText}>Console</Text>
                <ChevronRight color={T.sageGreenSolid} size={14} />
              </View>
            </View>
            <View style={styles.adminBannerMain}>
              <View style={styles.adminBannerIconOuter}>
                <View style={styles.adminBannerIconInner}>
                  <ShieldCheck color={T.sageGreenSolid} size={22} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminBannerTitle}>Admin Control Panel</Text>
                <Text style={styles.adminBannerSub}>Manage accounts, inspect audit trails &amp; AMR heatmaps</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Clinical & Health Passport Section ─────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <StethoscopeIcon color={T.mutedAccentSolid} size={18} />
            <Text style={styles.sectionTitle}>Medical Profile &amp; Clinical Data</Text>
          </View>
          <TouchableOpacity onPress={openEditModal}>
            <Text style={styles.sectionEditAction}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* BMI Card */}
        {bmiValue ? (
          <View style={styles.bmiCard}>
            <View style={styles.bmiLeft}>
              <Text style={styles.bmiLabel}>Body Mass Index (BMI)</Text>
              <Text style={[styles.bmiCategory, { color: bmiColor }]}>{bmiCategory}</Text>
            </View>
            <View style={[styles.bmiBadge, { borderColor: bmiColor + '66', backgroundColor: bmiColor + '18' }]}>
              <Text style={[styles.bmiValueText, { color: bmiColor }]}>{bmiValue}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addHealthPrompt} onPress={openEditModal}>
            <Text style={styles.addHealthPromptText}>Add height &amp; weight to calculate your BMI score</Text>
          </TouchableOpacity>
        )}

        {/* Known Conditions */}
        <View style={styles.clinicalBlock}>
          <Text style={styles.clinicalLabel}>KNOWN MEDICAL CONDITIONS</Text>
          {profile?.known_conditions && profile.known_conditions.length > 0 ? (
            <View style={styles.chipRow}>
              {profile.known_conditions.map((cond, idx) => (
                <View key={idx} style={styles.conditionChip}>
                  <Text style={styles.conditionChipText}>{cond}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyClinicalText}>No medical conditions specified</Text>
          )}
        </View>

        {/* Allergies */}
        <View style={[styles.clinicalBlock, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <Text style={styles.clinicalLabel}>ALLERGIES &amp; INTOLERANCES</Text>
          {profile?.allergies && profile.allergies.length > 0 ? (
            <View style={styles.chipRow}>
              {profile.allergies.map((allergy, idx) => (
                <View key={idx} style={styles.allergyChip}>
                  <Text style={styles.allergyChipText}>{allergy}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyClinicalText}>No known drug or food allergies</Text>
          )}
        </View>

        {/* Emergency Medical ID CTA */}
        <TouchableOpacity
          style={styles.medicalIdCta}
          onPress={() => setMedicalIdModalVisible(true)}
          activeOpacity={0.8}
        >
          <ShieldIcon color={T.sageGreenSolid} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={styles.medicalIdCtaTitle}>Digital Emergency Medical ID Card</Text>
            <Text style={styles.medicalIdCtaSub}>View high-priority responder health badge</Text>
          </View>
          <Text style={styles.medicalIdCtaArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Caregiver & Family Circle Sovereignty ───────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <ShieldIcon color={T.sageGreenSolid} size={18} />
            <Text style={styles.sectionTitle}>Caregiver Self-Sovereignty</Text>
          </View>
        </View>

        <Text style={styles.helpText}>
          Control whether caregivers in your Family Circle can manage your medications and log doses on your behalf.
          You can revoke or grant this at any time — overrides Circle Owner permissions.
        </Text>

        <View style={styles.sovereigntyRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.rowLabel}>Allow Caregiver Edits</Text>
            <Text
              style={[
                styles.consentStatus,
                { color: consentRevoked ? T.dangerClaySolid : T.sageGreenSolid },
              ]}
            >
              {consentRevoked ? 'Revoked — Read-Only Mode' : 'Granted — Full Caregiver Access'}
            </Text>
          </View>
          <Switch
            value={!consentRevoked}
            onValueChange={(v) => handleConsentToggle(!v)}
            disabled={savingConsent}
            trackColor={{ true: T.sageGreen, false: T.dangerClay }}
            thumbColor={T.surfaceElevated}
          />
        </View>

        <TouchableOpacity
          style={styles.familyCircleLink}
          onPress={() => navigation.navigate('FamilyTab' as any)}
          activeOpacity={0.8}
        >
          <UsersGroupIcon color={T.sageGreenSolid} size={18} />
          <Text style={styles.familyCircleLinkText}>Manage Family Circle &amp; Cabinet</Text>
          <Text style={{ fontSize: 16, color: T.caption }}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Preferences & Account Settings ─────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <SettingsGearIcon color={T.caption} size={18} />
            <Text style={styles.sectionTitle}>App &amp; Regional Preferences</Text>
          </View>
        </View>

        {/* Language Item */}
        <TouchableOpacity style={styles.rowItem} onPress={() => setLangModalVisible(true)} activeOpacity={0.7}>
          <Text style={styles.rowLabel}>Preferred Language</Text>
          <View style={styles.rowValueWrap}>
            <Text style={styles.rowValue}>
              {currentLangObj.flag} {currentLangObj.label}
            </Text>
            <Text style={styles.rowArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Region Item */}
        <TouchableOpacity style={styles.rowItem} onPress={openEditModal} activeOpacity={0.7}>
          <Text style={styles.rowLabel}>Surveillance Region</Text>
          <View style={styles.rowValueWrap}>
            <Text style={styles.rowValue}>{profile?.region || 'Not set'}</Text>
            <Text style={styles.rowArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Security & Password */}
        <TouchableOpacity
          style={[styles.rowItem, { borderBottomWidth: 0 }]}
          onPress={() => {
            setPasswordMsg(null);
            setPasswordModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.rowLabel}>Security &amp; Password</Text>
          <View style={styles.rowValueWrap}>
            <Text style={styles.rowValue}>Change Password</Text>
            <Text style={styles.rowArrow}>›</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Emergency Contacts Section ─────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400).delay(240)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <PhoneCallIcon color={T.sageGreenSolid} size={18} />
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>
          <TouchableOpacity onPress={openEditModal}>
            <Text style={styles.sectionEditAction}>Edit</Text>
          </TouchableOpacity>
        </View>

        {emergencyName || emergencyPhone ? (
          <View style={styles.emergencyDisplay}>
            <Text style={styles.emergencyNameText}>{emergencyName || 'Primary Contact'}</Text>
            {emergencyPhone && <Text style={styles.emergencyPhoneText}>{emergencyPhone}</Text>}
          </View>
        ) : (
          <TouchableOpacity style={styles.addEmergencyPrompt} onPress={openEditModal}>
            <Text style={styles.addEmergencyPromptText}>Add emergency contact details for first responders</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Sign Out & Footer ──────────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.duration(400).delay(280)} style={styles.dangerSection}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} accessibilityRole="button">
          <LogoutIcon color={T.dangerClaySolid} size={18} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.versionText}>MedSentry · v1.0.0 (Production Build)</Text>

      {/* ── EDIT PROFILE MODAL ─────────────────────────────────────────────── */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp.duration(350)} style={styles.modalSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile &amp; Health Info</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X color={T.textColor} size={20} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                {/* Profile Photo Upload Section */}
                <Text style={styles.inputSectionLabel}>PROFILE PHOTO &amp; AVATAR</Text>
                
                <View style={styles.photoUploadContainer}>
                  <View style={styles.modalAvatarPreview}>
                    {customAvatarUrl ? (
                      <Image source={{ uri: customAvatarUrl }} style={styles.modalAvatarImg} resizeMode="cover" />
                    ) : selectedAvatarPreset ? (
                      AVATAR_PRESETS.find((p) => p.id === selectedAvatarPreset)?.renderIcon(T.sageGreenSolid)
                    ) : (
                      <Text style={styles.modalAvatarInitials}>{initials}</Text>
                    )}
                  </View>

                  <View style={styles.photoUploadActions}>
                    <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImageFromGallery}>
                      <Text style={styles.uploadBtnText}>Choose Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadBtnSecondary} onPress={handleTakePhoto}>
                      <Text style={styles.uploadBtnSecondaryText}>Take Photo</Text>
                    </TouchableOpacity>
                    {customAvatarUrl && (
                      <TouchableOpacity style={styles.removePhotoBtn} onPress={handleRemovePhoto}>
                        <Text style={styles.removePhotoText}>Remove Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Preset Avatars Selection */}
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>OR CHOOSE MEDICAL ICON PRESET</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = !customAvatarUrl && selectedAvatarPreset === preset.id;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                        onPress={() => {
                          setSelectedAvatarPreset(preset.id);
                          setCustomAvatarUrl(null);
                        }}
                      >
                        {preset.renderIcon(isSelected ? T.sageGreenSolid : T.caption)}
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextSelected]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.inputSectionLabel}>PERSONAL INFORMATION</Text>

                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Subhash Ravichandran"
                  placeholderTextColor={T.placeholder}
                  value={fullNameInput}
                  onChangeText={setFullNameInput}
                />

                <View style={styles.inputsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Age (Years)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 28"
                      placeholderTextColor={T.placeholder}
                      keyboardType="numeric"
                      value={ageInput}
                      onChangeText={setAgeInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 70"
                      placeholderTextColor={T.placeholder}
                      keyboardType="numeric"
                      value={weightInput}
                      onChangeText={setWeightInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Height (cm)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 175"
                      placeholderTextColor={T.placeholder}
                      keyboardType="numeric"
                      value={heightInput}
                      onChangeText={setHeightInput}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Region / State (AMR Surveillance)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. California, USA or Tamil Nadu, India"
                  placeholderTextColor={T.placeholder}
                  value={regionInput}
                  onChangeText={setRegionInput}
                />

                <Text style={styles.inputSectionLabel}>CLINICAL &amp; ALLERGY DETAILS</Text>

                <Text style={styles.inputLabel}>Known Health Conditions (Comma Separated)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Asthma, Hypertension, Type 2 Diabetes"
                  placeholderTextColor={T.placeholder}
                  value={conditionsInput}
                  onChangeText={setConditionsInput}
                />

                <Text style={styles.inputLabel}>Drug / Food Allergies (Comma Separated)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Penicillin, Sulfa, NSAIDs, Peanuts"
                  placeholderTextColor={T.placeholder}
                  value={allergiesInput}
                  onChangeText={setAllergiesInput}
                />

                <Text style={styles.inputSectionLabel}>EMERGENCY CONTACT DETAILS</Text>

                <Text style={styles.inputLabel}>Emergency Contact Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dr. Sarah Jenkins / Parent"
                  placeholderTextColor={T.placeholder}
                  value={emergencyNameInput}
                  onChangeText={setEmergencyNameInput}
                />

                <Text style={styles.inputLabel}>Emergency Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="+1 (555) 019-2834"
                  placeholderTextColor={T.placeholder}
                  keyboardType="phone-pad"
                  value={emergencyPhoneInput}
                  onChangeText={setEmergencyPhoneInput}
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveBtn, savingProfile && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── HIGH-AESTHETIC DIGITAL EMERGENCY MEDICAL ID CARD MODAL ─────────── */}
      <Modal visible={medicalIdModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(350)} style={styles.idCardPassOuter}>
            {/* Top Accent Header Bar */}
            <View style={styles.idPassTopBar}>
              <View style={{ flex: 1, paddingRight: 36 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <ShieldIcon color="#81C784" size={18} />
                  <Text style={styles.idPassEmblemTitle}>MedSentry Medical ID</Text>
                </View>
                <View style={styles.idPassVerifiedPill}>
                  <View style={styles.idPassVerifiedDot} />
                  <Text style={styles.idPassVerifiedText}>VERIFIED EMERGENCY PASS</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.idPassCloseIcon}
                onPress={() => setMedicalIdModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X color="#FFF" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.idPassContent}>
              {/* Patient Hero Info */}
              <View style={styles.idPassPatientRow}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.idPassAvatarImg} resizeMode="cover" />
                ) : avatarPresetObj ? (
                  <View style={styles.idPassAvatarPreset}>
                    {avatarPresetObj.renderIcon('#81C784')}
                  </View>
                ) : (
                  <View style={styles.idPassAvatarFallback}>
                    <Text style={styles.idPassAvatarText}>{initials}</Text>
                  </View>
                )}

                <View style={styles.idPassPatientMeta}>
                  <Text style={styles.idPassPatientName}>{fullName}</Text>
                  <Text style={styles.idPassPatientEmail}>{user?.email || 'No email registered'}</Text>
                  <View style={styles.idPassBloodGroupBadge}>
                    <Text style={styles.idPassBloodText}>MEDICAL EMERGENCY PASS</Text>
                  </View>
                </View>
              </View>

              {/* Vitals Grid Matrix */}
              <View style={styles.idPassMatrix}>
                <View style={styles.idPassMatrixCol}>
                  <Text style={styles.idPassMatrixLabel}>AGE</Text>
                  <Text style={styles.idPassMatrixVal}>{profile?.age ? `${profile.age} yrs` : 'N/A'}</Text>
                </View>
                <View style={styles.idPassMatrixDivider} />
                <View style={styles.idPassMatrixCol}>
                  <Text style={styles.idPassMatrixLabel}>WEIGHT</Text>
                  <Text style={styles.idPassMatrixVal}>{profile?.weight_kg ? `${profile.weight_kg} kg` : 'N/A'}</Text>
                </View>
                <View style={styles.idPassMatrixDivider} />
                <View style={styles.idPassMatrixCol}>
                  <Text style={styles.idPassMatrixLabel}>HEIGHT</Text>
                  <Text style={styles.idPassMatrixVal}>{profile?.height_cm ? `${profile.height_cm} cm` : 'N/A'}</Text>
                </View>
                <View style={styles.idPassMatrixDivider} />
                <View style={styles.idPassMatrixCol}>
                  <Text style={styles.idPassMatrixLabel}>BMI</Text>
                  <Text style={[styles.idPassMatrixVal, { color: bmiColor }]}>{bmiValue || 'N/A'}</Text>
                </View>
              </View>

              {/* Known Allergies Section */}
              <View style={styles.idPassSec}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <AllergyAlertIcon color="#FCA5A5" size={14} />
                  <Text style={styles.idPassSecHeader}>HIGH-RISK DRUG / FOOD ALLERGIES</Text>
                </View>
                {profile?.allergies && profile.allergies.length > 0 ? (
                  <View style={styles.idPassTagContainer}>
                    {profile.allergies.map((allergy, i) => (
                      <View key={i} style={styles.idPassAllergyTag}>
                        <Text style={styles.idPassAllergyTagText}>{allergy}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.idPassEmptyBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Check color={T.sageGreenSolid} size={14} />
                      <Text style={styles.idPassEmptyText}>NO KNOWN ALLERGIES RECORDED</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Known Conditions Section */}
              <View style={styles.idPassSec}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <HospitalIcon color="#5EEAD4" size={14} />
                  <Text style={styles.idPassSecHeader}>CHRONIC CONDITIONS &amp; DIAGNOSES</Text>
                </View>
                {profile?.known_conditions && profile.known_conditions.length > 0 ? (
                  <View style={styles.idPassTagContainer}>
                    {profile.known_conditions.map((cond, i) => (
                      <View key={i} style={styles.idPassConditionTag}>
                        <Text style={styles.idPassCondTagText}>{cond}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.idPassEmptyBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Check color={T.sageGreenSolid} size={14} />
                      <Text style={styles.idPassEmptyText}>NO CHRONIC CONDITIONS RECORDED</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Emergency Contact & Call Action */}
              <View style={styles.idPassEmergencyBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.idPassEmergLabel}>PRIMARY EMERGENCY CONTACT</Text>
                  <Text style={styles.idPassEmergName}>{emergencyName || 'Not configured'}</Text>
                  {emergencyPhone && <Text style={styles.idPassEmergPhone}>{emergencyPhone}</Text>}
                </View>
                {emergencyPhone && (
                  <TouchableOpacity
                    style={styles.idPassCallBtn}
                    onPress={() => Linking.openURL(`tel:${emergencyPhone}`)}
                  >
                    <PhoneCallIcon color="#092C23" size={14} />
                    <Text style={styles.idPassCallBtnText}>DIAL NOW</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Pass Footer Security Stamp */}
              <View style={styles.idPassFooter}>
                <Text style={styles.idPassFooterHash}>
                  SECURITY STAMP: MS-HEALTH-{user?.id?.slice(0, 8).toUpperCase()}
                </Text>
                <Text style={styles.idPassFooterBrand}>MedSentry Emergency Response Network</Text>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ── CHANGE PASSWORD MODAL ──────────────────────────────────────────── */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp.duration(350)} style={styles.modalSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Account Password</Text>
                <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                  <X color={T.textColor} size={20} />
                </TouchableOpacity>
              </View>

              {passwordMsg && (
                <View
                  style={[
                    styles.msgBanner,
                    passwordMsg.type === 'error' ? styles.msgBannerError : styles.msgBannerSuccess,
                  ]}
                >
                  <Text
                    style={[
                      styles.msgBannerText,
                      { color: passwordMsg.type === 'error' ? T.dangerClaySolid : T.sageGreenSolid },
                    ]}
                  >
                    {passwordMsg.text}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="At least 6 characters"
                placeholderTextColor={T.placeholder}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter new password"
                placeholderTextColor={T.placeholder}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                style={[styles.saveBtn, savingPassword && { opacity: 0.6 }]}
                onPress={handleUpdatePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── LANGUAGE PICKER MODAL ─────────────────────────────────────────── */}
      <Modal visible={langModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Select Preferred Language</Text>
            <View style={{ marginVertical: 14 }}>
              {LANGUAGES.map((lang) => {
                const isSelected = (profile?.preferred_language || 'en') === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langRow, isSelected && styles.langRowSelected]}
                    onPress={() => handleSelectLanguage(lang.code)}
                  >
                    <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                    <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>{lang.label}</Text>
                    {isSelected && <Check color={T.sageGreenSolid} size={18} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setLangModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: 24 },
  avatarOuter: {
    position: 'relative',
    width: 96,
    height: 96,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: T.sageGreen,
    borderStyle: 'dashed',
  },
  avatarInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: T.sageGreen + '28',
    alignItems: 'center',
    justifyContent: 'center',
    ...T.cardShadow,
  },
  avatarPresetWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: T.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.border,
    ...T.cardShadow,
  },
  avatarImage: { width: 82, height: 82, borderRadius: 41 },
  avatarText: { fontSize: 30, fontWeight: '800', color: T.sageGreenSolid },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.sageGreen,
    ...T.subtleShadow,
  },
  profileName: { fontSize: 26, fontWeight: '800', color: T.textColor, marginBottom: 2, letterSpacing: -0.5 },
  userEmail: { fontSize: T.fontSize.caption, color: T.caption, marginBottom: 10 },
  heroBadgesRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 },
  accountBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: T.radius.pill, borderWidth: 1 },
  accountBadgeText: { fontSize: T.fontSize.caption, fontWeight: '700', letterSpacing: 0.3 },
  regionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    backgroundColor: T.warmCocoa + '33',
    borderWidth: 1,
    borderColor: T.border,
  },
  regionBadgeText: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '600' },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    paddingVertical: 12,
    paddingHorizontal: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
    ...T.cardShadow,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statBoxIcon: { fontSize: 16, marginBottom: 2 },
  statBoxVal: { fontSize: 15, fontWeight: '800', color: T.textColor },
  statBoxSub: { fontSize: 10, color: T.caption, fontWeight: '600', textTransform: 'uppercase' },
  statBoxDivider: { width: 1, height: 28, backgroundColor: T.border },

  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.sageGreenSolid,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: T.radius.pill,
    ...T.subtleShadow,
  },
  editProfileBtnIcon: { fontSize: 14 },
  editProfileBtnText: { color: '#FFF', fontWeight: '700', fontSize: T.fontSize.caption },

  // Admin banner
  adminBanner: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.large,
    padding: 18,
    borderWidth: 1.5,
    borderColor: T.sageGreen + '44',
    marginBottom: 18,
    ...T.cardShadow,
  },
  adminBannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  adminBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.sageGreen + '38',
  },
  adminLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: T.sageGreenSolid,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: T.sageGreenSolid,
    letterSpacing: 0.8,
  },
  adminActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
  },
  adminActionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.sageGreenSolid,
  },
  adminBannerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  adminBannerIconOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.sageGreen + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.sageGreen + '38',
  },
  adminBannerIconInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.sageGreen + '28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: T.textColor,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  adminBannerSub: {
    fontSize: 12,
    color: T.caption,
    lineHeight: 16,
  },

  // Section
  section: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: T.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionEditAction: { color: T.mutedAccentSolid, fontWeight: '700', fontSize: T.fontSize.caption },

  // BMI Card
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.background,
    borderRadius: T.radius.card,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  bmiLeft: { flex: 1 },
  bmiLabel: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '600', marginBottom: 2 },
  bmiCategory: { fontSize: T.fontSize.body, fontWeight: '800' },
  bmiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: T.radius.pill,
    borderWidth: 1,
  },
  bmiValueText: { fontSize: 18, fontWeight: '800' },

  addHealthPrompt: {
    backgroundColor: T.sageGreen + '14',
    padding: 12,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
    marginBottom: 14,
  },
  addHealthPromptText: { fontSize: T.fontSize.caption, color: T.sageGreenSolid, fontWeight: '600' },

  clinicalBlock: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border },
  clinicalLabel: { fontSize: 11, fontWeight: '700', color: T.caption, letterSpacing: 0.6, marginBottom: 8 },
  emptyClinicalText: { fontSize: T.fontSize.caption, color: T.placeholder, fontStyle: 'italic' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionChip: {
    backgroundColor: T.mutedAccent + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.mutedAccent + '44',
  },
  conditionChipText: { fontSize: T.fontSize.caption, color: T.mutedAccentSolid, fontWeight: '700' },
  allergyChip: {
    backgroundColor: T.dangerClay + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.dangerClay + '44',
  },
  allergyChipText: { fontSize: T.fontSize.caption, color: T.dangerClaySolid, fontWeight: '700' },

  medicalIdCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.sageGreen + '18',
    borderRadius: T.radius.large,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  medicalIdCtaTitle: { fontSize: T.fontSize.body, fontWeight: '800', color: T.sageGreenSolid, marginBottom: 2 },
  medicalIdCtaSub: { fontSize: 11, color: T.caption, fontWeight: '500' },
  medicalIdCtaArrow: { fontSize: 20, color: T.sageGreenSolid, fontWeight: '700' },

  // Sovereignty
  helpText: { fontSize: T.fontSize.caption, color: T.caption, lineHeight: 18, marginBottom: 12 },
  sovereigntyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 10,
  },
  consentStatus: { fontSize: T.fontSize.caption, fontWeight: '700', marginTop: 3 },
  familyCircleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  familyCircleLinkText: { flex: 1, fontSize: T.fontSize.caption, fontWeight: '700', color: T.sageGreenSolid },

  // Rows
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  rowLabel: { fontSize: T.fontSize.caption, color: T.textColor, fontWeight: '600' },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '500' },
  rowArrow: { fontSize: 16, color: T.caption },

  // Emergency
  emergencyDisplay: { gap: 4, paddingVertical: 4 },
  emergencyNameText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.textColor },
  emergencyPhoneText: { fontSize: T.fontSize.caption, color: T.sageGreenSolid, fontWeight: '700' },
  addEmergencyPrompt: {
    backgroundColor: T.warmCocoa + '22',
    padding: 12,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  addEmergencyPromptText: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '600' },

  // Danger / Sign Out
  dangerSection: { marginTop: 10, marginBottom: 20 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: T.dangerClay + '14',
    borderRadius: T.radius.large,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: T.dangerClay + '33',
  },
  signOutIconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  signOutIcon: { fontSize: 16 },
  signOutText: { fontSize: T.fontSize.body, fontWeight: '800', color: T.dangerClaySolid },

  versionText: { textAlign: 'center', color: T.caption, fontSize: 11, fontWeight: '600' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: T.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.warmCocoa,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: T.textColor },
  modalCloseX: { fontSize: 20, color: T.caption, fontWeight: '700' },

  // Photo Upload Section
  photoUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: T.background,
    padding: 14,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 12,
  },
  modalAvatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.sageGreen + '28',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.sageGreen,
    overflow: 'hidden',
  },
  modalAvatarImg: { width: 64, height: 64, borderRadius: 32 },
  modalAvatarInitials: { fontSize: 22, fontWeight: '800', color: T.sageGreenSolid },
  photoUploadActions: { flex: 1, gap: 6 },
  uploadBtn: {
    backgroundColor: T.sageGreenSolid,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: T.radius.pill,
    alignItems: 'center',
  },
  uploadBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  uploadBtnSecondary: {
    backgroundColor: T.surfaceCard,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: T.radius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  uploadBtnSecondaryText: { color: T.textColor, fontWeight: '600', fontSize: 12 },
  removePhotoBtn: { paddingVertical: 4, alignItems: 'center' },
  removePhotoText: { color: T.dangerClaySolid, fontSize: 11, fontWeight: '700' },

  inputSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: T.mutedAccentSolid,
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 10,
  },
  inputLabel: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.textColor, marginBottom: 6 },
  textInput: {
    backgroundColor: T.background,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: T.fontSize.body,
    color: T.textColor,
    marginBottom: 12,
  },
  inputsRow: { flexDirection: 'row', gap: 10 },

  presetsRow: { gap: 10, marginBottom: 12, paddingVertical: 4 },
  presetChip: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: T.radius.card,
    backgroundColor: T.background,
    borderWidth: 1.5,
    borderColor: T.border,
    minWidth: 70,
  },
  presetChipSelected: { borderColor: T.sageGreenSolid, backgroundColor: T.sageGreen + '18' },
  presetChipText: { fontSize: 10, fontWeight: '700', color: T.caption, marginTop: 4 },
  presetChipTextSelected: { color: T.sageGreenSolid },

  saveBtn: {
    backgroundColor: T.sageGreenSolid,
    borderRadius: T.radius.large,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    ...T.subtleShadow,
  },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: T.fontSize.body },

  // ── HIGH-AESTHETIC DIGITAL EMERGENCY MEDICAL ID PASS STYLES ────────────────
  idCardPassOuter: {
    backgroundColor: '#072A22',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(129,199,132,0.35)',
    marginHorizontal: 16,
    alignSelf: 'center',
    width: '92%',
    maxHeight: '85%',
    overflow: 'hidden',
    ...T.cardShadow,
  },
  idPassTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#041C16',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  idPassEmblemWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idPassEmblemTitle: { color: '#81C784', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  idPassVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(129,199,132,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129,199,132,0.35)',
    alignSelf: 'flex-start',
  },
  idPassVerifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#81C784' },
  idPassVerifiedText: { color: '#81C784', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  idPassCloseIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  idPassContent: { padding: 18 },

  // Patient Row
  idPassPatientRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  idPassAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#81C784',
    overflow: 'hidden',
  },
  idPassAvatarPreset: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F4738',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#81C784',
  },
  idPassAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F4738',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#81C784',
  },
  idPassAvatarText: { fontSize: 24, fontWeight: '800', color: '#81C784' },
  idPassPatientMeta: { flex: 1 },
  idPassPatientName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  idPassPatientEmail: { fontSize: 12, color: '#A0AEC0', marginBottom: 6 },
  idPassBloodGroupBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  idPassBloodText: { color: '#E2E8F0', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Matrix
  idPassMatrix: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  idPassMatrixCol: { flex: 1, alignItems: 'center' },
  idPassMatrixLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5 },
  idPassMatrixVal: { fontSize: 14, color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  idPassMatrixDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)' },

  // Sections
  idPassSec: { marginBottom: 14 },
  idPassSecHeader: { fontSize: 10, fontWeight: '800', color: '#CBD5E1', letterSpacing: 0.8, marginBottom: 8 },
  idPassTagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  idPassAllergyTag: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
  },
  idPassAllergyTagText: { color: '#FCA5A5', fontSize: 12, fontWeight: '800' },
  idPassConditionTag: {
    backgroundColor: 'rgba(45,212,191,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.4)',
  },
  idPassCondTagText: { color: '#5EEAD4', fontSize: 12, fontWeight: '800' },
  idPassEmptyBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  idPassEmptyText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },

  // Emergency Box & Dial
  idPassEmergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,71,56,0.8)',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#174A3C',
  },
  idPassEmergLabel: { fontSize: 9, color: '#D4AF37', fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  idPassEmergName: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
  idPassEmergPhone: { fontSize: 12, color: '#81C784', fontWeight: '700', marginTop: 1 },
  idPassCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#81C784',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  idPassCallBtnText: { color: '#092C23', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  // Footer
  idPassFooter: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  idPassFooterHash: { color: '#64748B', fontSize: 9, fontWeight: '700', fontFamily: 'monospace' },
  idPassFooterBrand: { color: '#475569', fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Password Messages
  msgBanner: { padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1 },
  msgBannerError: { backgroundColor: T.dangerClay + '18', borderColor: T.dangerClay + '44' },
  msgBannerSuccess: { backgroundColor: T.sageGreen + '18', borderColor: T.sageGreen + '44' },
  msgBannerText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Language Modal
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: T.radius.card,
    backgroundColor: T.background,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  langRowSelected: { borderColor: T.sageGreenSolid, backgroundColor: T.sageGreen + '18' },
  langLabel: { flex: 1, fontSize: T.fontSize.body, fontWeight: '600', color: T.textColor },
  langLabelSelected: { fontWeight: '800', color: T.sageGreenSolid },

  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: T.caption, fontWeight: '700', fontSize: T.fontSize.body },
});
