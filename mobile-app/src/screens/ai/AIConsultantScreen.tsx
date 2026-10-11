import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, StatusBar, Keyboard,
  Platform, Alert,
} from 'react-native';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import {
  BotMessageSquare,
  ImagePlus,
  Camera,
  X,
  Sparkles,
  Zap,
  Brain,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import { invokeAIRouter } from '../../lib/aiRouterClient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import * as T from '../../theme/colors';

const renderProviderIcon = (provider?: string) => {
  const p = provider?.toLowerCase();
  if (p === 'gemini') return <Sparkles color={T.sageGreenSolid} size={14} />;
  if (p === 'groq') return <Zap color={T.warningAmberSolid} size={14} />;
  if (p === 'system') return <BotMessageSquare color={T.sageGreenSolid} size={14} />;
  return <Brain color={T.mutedAccentSolid} size={14} />;
};

export default function AIConsultantScreen() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

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

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is required to take photos of medications or symptoms.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const clearImage = () => { setImageUri(null); setImageBase64(null); };

  const submitQuery = async () => {
    if (!query && !imageBase64) return;
    Keyboard.dismiss();
    setLoading(true);
    setResponse(null);
    try {
      const res = await invokeAIRouter('consultant', [], imageBase64 || undefined, {
        userId: profile?.id, query,
      });
      setResponse(res);
      if (profile?.id) {
        await (supabase.from('ai_consultations') as any).insert({
          user_id: profile.id,
          input_text: query,
          ai_response: res.text,
          provider_used: 'ai_router',
        });
      }
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err: any) {
      setResponse({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  // Calculate bottom offset for input bar when keyboard opens
  // Subtract ~48px for bottom tab bar inset
  const inputBottomMargin = keyboardHeight > 0
    ? Math.max(0, keyboardHeight - (Platform.OS === 'android' ? 48 : 50))
    : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.headerIcon}>
          <BotMessageSquare color={T.sageGreenSolid} size={22} />
        </View>
        <View>
          <Text style={styles.headerTitle}>AI Consultant</Text>
          <Text style={styles.headerSub}>Scan an image or ask a question</Text>
        </View>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Suggested prompts ── */}
        {!response && !loading && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={styles.promptsLabel}>SUGGESTED</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsRow}>
              {[
                'Can I take this with food?',
                'What are the side effects?',
                'Missed dose instructions',
                'Drug interaction check',
              ].map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.promptChip}
                  onPress={() => setQuery(p)}
                  accessibilityRole="button"
                >
                  <Text style={styles.promptChipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Image picker drop zone ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)}>
          {imageUri ? (
            <View style={styles.previewCard}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity style={styles.clearImgBtn} onPress={clearImage} accessibilityRole="button">
                <X color="#FFF" size={14} style={{ marginRight: 4 }} />
                <Text style={styles.clearImgText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dropZone}>
              <Text style={styles.dropZoneTitle}>Scan Medicine or Symptom Image</Text>
              <Text style={styles.dropZoneSub}>Take a photo of a rash, medicine bottle, strip, or prescription</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto} accessibilityRole="button">
                  <Camera color="#FFF" size={18} style={{ marginRight: 6 }} />
                  <Text style={styles.cameraBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.galleryBtn} onPress={pickImage} accessibilityRole="button">
                  <ImagePlus color={T.sageGreenSolid} size={18} style={{ marginRight: 6 }} />
                  <Text style={styles.galleryBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ── Response Card ── */}
        {loading && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.loadingCard}>
            <ActivityIndicator color={T.sageGreenSolid} size="large" />
            <Text style={styles.loadingText}>Analyzing with AI…</Text>
          </Animated.View>
        )}

        {response && (
          <Animated.View
            entering={SlideInUp.duration(450)}
            style={[
              styles.responseCard,
              response.error && styles.responseCardError,
              response.flagged && styles.responseCardWarning,
            ]}
          >
            {/* Provider badge */}
            <View style={styles.providerBadge}>
              <View style={{ marginRight: 6 }}>
                {renderProviderIcon(response.provider)}
              </View>
              <Text style={styles.providerText}>
                {response.error ? 'Error' : `Powered by ${response.provider || 'AI'}`}
              </Text>
              {response.flagged && (
                <View style={styles.flaggedChip}>
                  <AlertTriangle color={T.warningAmberSolid} size={12} style={{ marginRight: 4 }} />
                  <Text style={styles.flaggedChipText}>Flagged</Text>
                </View>
              )}
            </View>
            <Text style={styles.responseText}>{response.text}</Text>
            <View style={styles.disclaimer}>
              <Info color={T.caption} size={14} style={{ marginRight: 6 }} />
              <Text style={styles.disclaimerText}>
                This is not medical advice. Always consult a qualified healthcare provider.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Input bar (dynamically moves above keyboard) ── */}
      <View style={[styles.inputBar, { marginBottom: inputBottomMargin }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your medications…"
          placeholderTextColor={T.placeholder}
          value={query}
          onChangeText={setQuery}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!query && !imageBase64) && styles.sendBtnDisabled]}
          onPress={submitQuery}
          disabled={loading || (!query && !imageBase64)}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>▶</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: T.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    ...T.subtleShadow,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.infoTeal + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T.textColor, letterSpacing: -0.4 },
  headerSub: { fontSize: T.fontSize.caption, color: T.caption, marginTop: 2 },

  // Content
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20 },

  // Prompts
  promptsLabel: {
    fontSize: T.fontSize.label,
    fontWeight: '700',
    color: T.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  promptsRow: { flexDirection: 'row' },
  promptChip: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  promptChipText: { fontSize: T.fontSize.caption, color: T.textColor, fontWeight: '600' },

  // Drop zone
  dropZone: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    borderWidth: 1.5,
    borderColor: T.sageGreen + '44',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...T.subtleShadow,
  },
  dropZoneTitle: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor },
  dropZoneSub: { fontSize: T.fontSize.caption, color: T.caption, textAlign: 'center', marginBottom: 12 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreenSolid,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: T.radius.pill,
    ...T.subtleShadow,
  },
  cameraBtnText: { fontSize: T.fontSize.caption, fontWeight: '700', color: '#FFF' },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  galleryBtnText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.sageGreenSolid },

  previewCard: {
    borderRadius: T.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    position: 'relative',
  },
  previewImage: { width: '100%', height: 200 },
  clearImgBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: T.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearImgText: { color: '#FFF', fontSize: T.fontSize.caption, fontWeight: '700' },

  // Loading
  loadingCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  loadingText: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '600' },

  // Response card
  responseCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
    gap: 14,
  },
  responseCardError: { borderColor: T.dangerClay + '66', backgroundColor: T.dangerClay + '0A' },
  responseCardWarning: { borderColor: T.warningAmber + '66', backgroundColor: T.warningAmber + '0A' },

  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  providerIcon: { fontSize: 16 },
  providerText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.caption },
  flaggedChip: {
    backgroundColor: T.dangerClay + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radius.pill,
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  flaggedChipText: { fontSize: 11, fontWeight: '700', color: T.dangerClaySolid },

  responseText: { fontSize: T.fontSize.body, color: T.textColor, lineHeight: 24 },
  disclaimer: {
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclaimerText: { fontSize: 11, color: T.caption, lineHeight: 16 },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 10,
    ...T.subtleShadow,
  },
  input: {
    flex: 1,
    backgroundColor: T.warmCocoa + '44',
    borderRadius: T.radius.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: T.fontSize.body,
    color: T.textColor,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: T.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.sageGreenSolid,
    alignItems: 'center',
    justifyContent: 'center',
    ...T.subtleShadow,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 16, color: '#FFF', marginLeft: 2 },
});
