import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Keyboard, Platform } from 'react-native';
import { invokeAIRouter, AIMessage } from '../../lib/aiRouterClient';
import { useAuth } from '../../context/AuthContext';
import * as T from '../../theme/colors';

export default function AIChatbotScreen() {
  const { profile } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await invokeAIRouter('chatbot', newMessages, undefined, { userId: profile?.id });
      
      setMessages([...newMessages, { role: 'assistant', content: res.text }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const inputBottomMargin = keyboardHeight > 0
    ? Math.max(0, keyboardHeight - (Platform.OS === 'android' ? 48 : 50))
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Ask MedSentry Chatbot anything about your medications, symptoms, or health routine.</Text>
          </View>
        )}

        {messages.map((msg, index) => (
          <View key={index} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userBubbleText : styles.botBubbleText]}>{msg.content}</Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.botBubble]}>
            <ActivityIndicator color={T.mutedAccent} size="small" />
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputArea, { marginBottom: inputBottomMargin }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={T.placeholder}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || !input.trim()} accessibilityRole="button">
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.background,
  },
  chatArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: T.caption,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    fontSize: T.fontSize.body,
  },
  bubble: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: T.sageGreenSolid,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: T.surfaceCard,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: T.infoTeal,
    ...T.subtleShadow,
  },
  bubbleText: {
    fontSize: T.fontSize.body,
    lineHeight: 24,
  },
  userBubbleText: {
    color: '#FFF',
  },
  botBubbleText: {
    color: T.textColor,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: T.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  input: {
    flex: 1,
    backgroundColor: T.warmCocoa + '44',
    color: T.textColor,
    borderRadius: T.radius.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: T.border,
    fontSize: T.fontSize.body,
  },
  sendButton: {
    backgroundColor: T.sageGreenSolid,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: T.radius.large,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: T.fontSize.body,
  },
});
