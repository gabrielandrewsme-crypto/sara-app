import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSaraDispatcher } from '../hooks/useSaraDispatcher';
import { AppStackParamList } from '../navigation/types';
import { saraService } from '../services/saraService';
import { theme } from '../styles/theme';
import { SaraMessage } from '../types/sara';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

type Bubble = {
  role: 'user' | 'assistant';
  content: string;
  hint?: string;
  isError?: boolean;
};

const GREETING: Bubble = {
  role: 'assistant',
  content: 'Oi! Me conta o que você quer organizar hoje.',
};

export function ChatScreen({}: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useSaraDispatcher();
  const scrollRef = useRef<ScrollView>(null);

  function scrollToEnd() {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const nextBubbles: Bubble[] = [...bubbles, { role: 'user', content: text }];
    setBubbles(nextBubbles);
    setInput('');
    setLoading(true);
    scrollToEnd();

    try {
      const history: SaraMessage[] = nextBubbles
        .filter((b) => !b.isError)
        .map((b) => ({ role: b.role, content: b.content }));

      const action = await saraService.chat(history);
      const result = await dispatch(action);

      const reply: Bubble = {
        role: 'assistant',
        content: action.response || 'Ok.',
        hint: result.ok
          ? result.summary
          : result.error
            ? `Não consegui executar: ${result.error}`
            : undefined,
        isError: !result.ok,
      };
      setBubbles((curr) => [...curr, reply]);
    } catch (e: any) {
      setBubbles((curr) => [
        ...curr,
        {
          role: 'assistant',
          content: e?.message ?? 'Algo deu errado. Tenta de novo?',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollToEnd}
      >
        {bubbles.map((b, i) => (
          <View
            key={i}
            style={[
              styles.bubbleWrapper,
              b.role === 'user' ? styles.userWrapper : styles.assistantWrapper,
            ]}
          >
            <View
              style={[
                styles.bubble,
                b.role === 'user' ? styles.userBubble : styles.assistantBubble,
                b.isError && styles.errorBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  b.role === 'user' && styles.userBubbleText,
                ]}
              >
                {b.content}
              </Text>
            </View>
            {b.hint ? (
              <Text style={[styles.hint, b.isError && styles.hintError]}>
                {b.hint}
              </Text>
            ) : null}
          </View>
        ))}

        {loading ? (
          <View style={[styles.bubbleWrapper, styles.assistantWrapper]}>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <ActivityIndicator color={theme.colors.textMuted} size="small" />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Fala com a Sara…"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          editable={!loading}
          onSubmitEditing={send}
          blurOnSubmit
          returnKeyType="send"
        />
        <Pressable
          onPress={send}
          disabled={!input.trim() || loading}
          style={({ pressed }) => [
            styles.sendButton,
            (!input.trim() || loading) && styles.sendButtonDisabled,
            pressed && styles.sendButtonPressed,
          ]}
        >
          <Text style={styles.sendText}>{loading ? '…' : '↑'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  bubbleWrapper: {
    marginBottom: theme.spacing.md,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  assistantWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.lg,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.radius.sm,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: theme.radius.sm,
  },
  errorBubble: {
    borderColor: theme.colors.danger,
  },
  bubbleText: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  hint: {
    color: theme.colors.primary,
    fontSize: 12,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  hintError: {
    color: theme.colors.danger,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 140,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    color: theme.colors.text,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surface,
  },
  sendButtonPressed: {
    backgroundColor: theme.colors.primaryPressed,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
});
