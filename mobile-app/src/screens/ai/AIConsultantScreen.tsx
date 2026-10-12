import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  RotateCcw,
  Send,
} from 'lucide-react-native';
import { invokeAIRouter, AIMessage, StructuredRetrieval } from '../../lib/aiRouterClient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SafeMarkdown } from '../../components/common/SafeMarkdown';
import { SourceAttributionCard } from '../../components/ai/SourceAttributionCard';
import * as T from '../../theme/colors';

export interface ConsultantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string | null;
  provider?: string;
  flagged?: boolean;
  error?: boolean;
  timestamp: number;
  retrieval?: StructuredRetrieval | null;
}

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
  const [messages, setMessages] = useState<ConsultantMessage[]>([]);
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

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
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

  const clearImage = () => {
    setImageUri(null);
    setImageBase64(null);
  };

  const resetConsultation = () => {
    setMessages([]);
    setQuery('');
    clearImage();
  };

  const promptImageSource = () => {
    Alert.alert(
      'Attach Medication Image',
      'Choose image source',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitQuery = async () => {
    if ((!query.trim() && !imageBase64) || loading) return;

    const userText = query.trim();
    const userImgUri = imageUri;
    const userImgB64 = imageBase64;
    const userMsgId = `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const assistantMsgId = `a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const effectiveQuery = userText || (userImgB64 ? 'Identify this medicine, explain what it is used for, and check its suitability and safety.' : '');

    // Immediately clear input and pending image state
    setQuery('');
    setImageUri(null);
    setImageBase64(null);
    Keyboard.dismiss();

    // Immediately add user message exactly once
    const userMessage: ConsultantMessage = {
      id: userMsgId,
      role: 'user',
      content: userText || (userImgUri ? 'Identify this medicine and explain its uses' : ''),
      imageUri: userImgUri,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);
    scrollToBottom();

    try {
      const historyForApi: AIMessage[] = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await invokeAIRouter('consultant', historyForApi, userImgB64 || undefined, {
        userId: profile?.id,
        query: effectiveQuery,
      });

      const assistantMessage: ConsultantMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: res.text || 'No response generated.',
        provider: res.provider,
        flagged: res.flagged,
        error: false,
        timestamp: Date.now(),
        retrieval: res.retrieval,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      scrollToBottom();

      if (profile?.id) {
        (supabase.from('ai_consultations') as any).insert({
          user_id: profile.id,
          input_text: userText || 'Image consultation',
          ai_response: res.text,
          provider_used: res.provider || 'ai_router',
        }).then(() => {}).catch(() => {});
      }
    } catch (err: any) {
      const errorMessage: ConsultantMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: err.message || 'An error occurred during consultation. Please try again.',
        error: true,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  const inputBottomMargin = keyboardHeight > 0
    ? Math.max(0, keyboardHeight - (Platform.OS === 'android' ? 48 : 50))
    : 0;

  const hasMessages = messages.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={T.statusBarStyle} backgroundColor={T.background} />

      {/* ── Collapsible Header ── */}
      {hasMessages ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.compactHeader}>
          <View style={styles.compactHeaderLeft}>
            <View style={styles.compactHeaderIcon}>
              <BotMessageSquare color={T.sageGreenSolid} size={18} />
            </View>
            <View>
              <Text style={styles.compactHeaderTitle}>AI Consultant</Text>
              <Text style={styles.compactHeaderSub}>Active consultation</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={resetConsultation}
            accessibilityRole="button"
            accessibilityLabel="New consultation"
          >
            <RotateCcw color={T.sageGreenSolid} size={14} style={{ marginRight: 4 }} />
            <Text style={styles.resetBtnText}>New</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroHeader}>
          <View style={styles.heroHeaderIcon}>
            <BotMessageSquare color={T.sageGreenSolid} size={22} />
          </View>
          <View style={styles.heroHeaderTextWrap}>
            <Text style={styles.heroHeaderTitle}>AI Consultant</Text>
            <Text style={styles.heroHeaderSub}>Scan an image or ask a question</Text>
          </View>
        </Animated.View>
      )}

      {/* ── Main Scroll / Conversation Area ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          hasMessages ? styles.scrollContentActive : styles.scrollContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollToBottom}
      >
        {/* ── Welcome Mode: Suggested Prompts & Drop Zone ── */}
        {!hasMessages && (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(80)}>
              <Text style={styles.promptsLabel}>SUGGESTED QUESTIONS</Text>
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

            <Animated.View entering={FadeInDown.duration(400).delay(150)}>
              {imageUri ? (
                <View style={styles.previewCard}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.clearImgBtn} onPress={clearImage} accessibilityRole="button">
                    <X color="#FFF" size={14} style={{ marginRight: 4 }} />
                    <Text style={styles.clearImgText}>Remove</Text>
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
          </>
        )}

        {/* ── Conversation Stream ── */}
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <View key={msg.id} style={styles.userMessageWrap}>
                {msg.imageUri ? (
                  <View style={styles.userThumbWrap}>
                    <Image source={{ uri: msg.imageUri }} style={styles.userThumb} resizeMode="cover" />
                  </View>
                ) : null}
                {msg.content ? (
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{msg.content}</Text>
                  </View>
                ) : null}
              </View>
            );
          }

          // Assistant Response Card
          return (
            <Animated.View
              key={msg.id}
              entering={FadeInDown.duration(350)}
              style={[
                styles.responseCard,
                msg.error && styles.responseCardError,
                msg.flagged && styles.responseCardWarning,
              ]}
            >
              {/* Provider Badge */}
              <View style={styles.providerBadge}>
                <View style={{ marginRight: 6 }}>{renderProviderIcon(msg.provider)}</View>
                <Text style={styles.providerText}>
                  {msg.error ? 'Error' : `Powered by ${msg.provider || 'AI'}`}
                </Text>
                {msg.flagged && (
                  <View style={styles.flaggedChip}>
                    <AlertTriangle color={T.warningAmberSolid} size={12} style={{ marginRight: 4 }} />
                    <Text style={styles.flaggedChipText}>Safety Flagged</Text>
                  </View>
                )}
              </View>

              {/* Rendered Markdown Body */}
              <SafeMarkdown content={msg.content} />

              {/* Source Attribution Card */}
              <SourceAttributionCard retrieval={msg.retrieval} />

              {!msg.error && (
                <View style={styles.disclaimer}>
                  <Info color={T.caption} size={13} style={{ marginRight: 6 }} />
                  <Text style={styles.disclaimerText}>
                    This is not medical advice. Always consult a qualified healthcare provider.
                  </Text>
                </View>
              )}
            </Animated.View>
          );
        })}

        {/* ── Active Loading State ── */}
        {loading && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.loadingCard}>
            <ActivityIndicator color={T.sageGreenSolid} size="small" />
            <Text style={styles.loadingText}>Analyzing with AI Consultant…</Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Input Bar ── */}
      <View style={[styles.inputBarContainer, { marginBottom: inputBottomMargin }]}>
        {/* Attached thumbnail chip (if user picked an image during active conversation) */}
        {hasMessages && imageUri && (
          <View style={styles.attachedPill}>
            <Image source={{ uri: imageUri }} style={styles.attachedThumb} resizeMode="cover" />
            <Text style={styles.attachedText} numberOfLines={1}>Image attached</Text>
            <TouchableOpacity onPress={clearImage} style={styles.attachedClearBtn} accessibilityRole="button">
              <X color={T.caption} size={14} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          {/* Quick attach icon for active chat */}
          {hasMessages && (
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={promptImageSource}
              accessibilityRole="button"
              accessibilityLabel="Attach photo"
            >
              <ImagePlus color={T.caption} size={22} />
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.input}
            placeholder="Ask about medications, dosage, symptoms…"
            placeholderTextColor={T.placeholder}
            value={query}
            onChangeText={setQuery}
            multiline
            maxLength={500}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!query.trim() && !imageBase64) && styles.sendBtnDisabled]}
            onPress={submitQuery}
            disabled={loading || (!query.trim() && !imageBase64)}
            accessibilityRole="button"
            accessibilityLabel="Send consultation message"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Send color="#FFF" size={18} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.background },

  // Hero Header (When empty)
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: T.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    ...T.subtleShadow,
  },
  heroHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.infoTeal + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeaderTextWrap: { flex: 1 },
  heroHeaderTitle: { fontSize: 20, fontWeight: '800', color: T.textColor, letterSpacing: -0.4 },
  heroHeaderSub: { fontSize: T.fontSize.caption, color: T.caption, marginTop: 2 },

  // Compact Header (When active conversation)
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: T.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    ...T.subtleShadow,
  },
  compactHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.infoTeal + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactHeaderTitle: { fontSize: 16, fontWeight: '800', color: T.textColor },
  compactHeaderSub: { fontSize: 11, color: T.caption },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.radius.pill,
    backgroundColor: T.sageGreen + '18',
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.sageGreenSolid,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  scrollContentEmpty: { gap: 18 },
  scrollContentActive: { gap: 14, paddingBottom: 20 },

  // Suggested Prompts
  promptsLabel: {
    fontSize: T.fontSize.label,
    fontWeight: '700',
    color: T.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  promptsRow: { flexDirection: 'row' },
  promptChip: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  promptChipText: { fontSize: T.fontSize.caption, color: T.textColor, fontWeight: '600' },

  // Drop Zone
  dropZone: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    borderWidth: 1.5,
    borderColor: T.sageGreen + '44',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...T.subtleShadow,
  },
  dropZoneTitle: { fontSize: T.fontSize.body, fontWeight: '700', color: T.textColor },
  dropZoneSub: { fontSize: T.fontSize.caption, color: T.caption, textAlign: 'center', marginBottom: 10 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreenSolid,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: T.radius.pill,
    ...T.subtleShadow,
  },
  cameraBtnText: { fontSize: T.fontSize.caption, fontWeight: '700', color: '#FFF' },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.sageGreen + '18',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.sageGreen + '44',
  },
  galleryBtnText: { fontSize: T.fontSize.caption, fontWeight: '700', color: T.sageGreenSolid },

  // Preview Card
  previewCard: {
    borderRadius: T.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    position: 'relative',
  },
  previewImage: { width: '100%', height: 180 },
  clearImgBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: T.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearImgText: { color: '#FFF', fontSize: T.fontSize.caption, fontWeight: '700' },

  // User Message
  userMessageWrap: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    gap: 6,
  },
  userThumbWrap: {
    borderRadius: T.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    alignSelf: 'flex-end',
  },
  userThumb: {
    width: 140,
    height: 140,
    borderRadius: T.radius.card,
  },
  userBubble: {
    backgroundColor: T.sageGreenSolid,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    ...T.subtleShadow,
  },
  userBubbleText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },

  // Assistant Response Card
  responseCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...T.cardShadow,
    gap: 10,
  },
  responseCardError: { borderColor: T.dangerClay + '66', backgroundColor: T.dangerClay + '0A' },
  responseCardWarning: { borderColor: T.warningAmber + '66', backgroundColor: T.warningAmber + '0A' },

  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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

  disclaimer: {
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 10,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclaimerText: { fontSize: 11, color: T.caption, lineHeight: 16, flex: 1 },

  // Loading
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: T.border,
    alignSelf: 'flex-start',
    ...T.subtleShadow,
  },
  loadingText: { fontSize: T.fontSize.caption, color: T.caption, fontWeight: '600' },

  // Input Bar Container
  inputBarContainer: {
    backgroundColor: T.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: T.border,
    ...T.subtleShadow,
  },
  attachedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: T.background,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 8,
  },
  attachedThumb: { width: 28, height: 28, borderRadius: 4 },
  attachedText: { flex: 1, fontSize: 12, color: T.textColor, fontWeight: '600' },
  attachedClearBtn: { padding: 4 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  attachBtn: {
    padding: 8,
    borderRadius: T.radius.pill,
  },
  input: {
    flex: 1,
    backgroundColor: T.warmCocoa + '33',
    borderRadius: T.radius.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: T.textColor,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: T.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.sageGreenSolid,
    alignItems: 'center',
    justifyContent: 'center',
    ...T.subtleShadow,
  },
  sendBtnDisabled: { opacity: 0.35 },
});
