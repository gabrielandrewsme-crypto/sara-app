import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { AppStackParamList } from '../navigation/types';
import {
  SARA_VOICE_OPTIONS,
  SaraVoice,
  ttsService,
} from '../services/ttsService';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { formatDateBR } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'Account'>;

function getDisplayName(metadata: Record<string, unknown> | undefined): string {
  const name = metadata?.full_name;
  return typeof name === 'string' ? name : '';
}

function getInitial(name: string, email: string): string {
  const source = name || email;
  return source ? source.trim().charAt(0).toUpperCase() : '?';
}

export function AccountScreen({}: Props) {
  const { user, signOut, updateName, saraVoice, updateSaraVoice } = useAuth();
  const currentName = getDisplayName(user?.user_metadata);
  const email = user?.email ?? '';
  const initial = getInitial(currentName, email);
  const memberSince = user?.created_at ? formatDateBR(user.created_at) : '—';

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [savingVoice, setSavingVoice] = useState<SaraVoice | null>(null);
  const [previewing, setPreviewing] = useState<SaraVoice | null>(null);

  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  async function handleSelectVoice(voice: SaraVoice) {
    if (savingVoice || voice === saraVoice) return;
    try {
      setSavingVoice(voice);
      await updateSaraVoice(voice);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível salvar a voz.');
    } finally {
      setSavingVoice(null);
    }
  }

  async function handlePreview(voice: SaraVoice) {
    if (previewing) {
      ttsService.stop();
      setPreviewing(null);
      return;
    }
    try {
      setPreviewing(voice);
      await ttsService.speakSample(voice, () => setPreviewing(null));
    } catch (e: any) {
      setPreviewing(null);
      Alert.alert('Erro', e?.message ?? 'Não foi possível tocar a amostra.');
    }
  }

  useEffect(() => {
    if (!editing) setDraft(currentName);
  }, [currentName, editing]);

  async function handleSaveName() {
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert('Atenção', 'O nome não pode ficar vazio.');
      return;
    }
    if (trimmed === currentName) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      await updateName(trimmed);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível atualizar o nome.');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sair', 'Tem certeza que quer sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e: any) {
            Alert.alert('Erro', e?.message ?? 'Falha ao sair.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Nome</Text>
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              autoFocus
              autoCapitalize="words"
              placeholder="Seu nome"
              placeholderTextColor={theme.colors.textMuted}
              editable={!saving}
            />
            <Pressable
              onPress={() => {
                setDraft(currentName);
                setEditing(false);
              }}
              disabled={saving}
              style={styles.iconButton}
            >
              <Text style={styles.iconText}>✕</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveName}
              disabled={saving}
              style={[styles.iconButton, styles.iconButtonPrimary]}
            >
              <Text style={[styles.iconText, styles.iconTextPrimary]}>✓</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)} style={styles.row}>
            <Text style={styles.value}>{currentName || 'Sem nome'}</Text>
            <Text style={styles.editIcon}>✎</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <Text style={[styles.value, styles.valueMuted]}>{email || '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Voz da Sara</Text>
        <Text style={styles.voiceHint}>
          Usada no modo voz. As vozes "naturais" usam o TTS da OpenAI;
          "voz do dispositivo" não tem custo.
        </Text>
        <View style={styles.voiceList}>
          {SARA_VOICE_OPTIONS.map((opt) => {
            const selected = saraVoice === opt.id;
            const isPreviewing = previewing === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => handleSelectVoice(opt.id)}
                style={[
                  styles.voiceRow,
                  selected && styles.voiceRowSelected,
                ]}
              >
                <View
                  style={[styles.radio, selected && styles.radioSelected]}
                >
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.voiceText}>
                  <Text style={styles.voiceLabel}>{opt.label}</Text>
                  <Text style={styles.voiceSub}>{opt.hint}</Text>
                </View>
                <Pressable
                  onPress={() => handlePreview(opt.id)}
                  hitSlop={12}
                  style={styles.previewButton}
                >
                  <Text style={styles.previewIcon}>
                    {isPreviewing ? '■' : '▶'}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Plano</Text>
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Gratuito</Text>
          <Text style={styles.planHint}>
            Acesso completo às funcionalidades atuais.
          </Text>
          <Text style={styles.planSoon}>
            Mais opções de plano em breve.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Membro desde</Text>
        <Text style={[styles.value, styles.valueMuted]}>{memberSince}</Text>
      </View>

      <Button
        label="Sair da conta"
        variant="ghost"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.text,
    fontSize: 40,
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  value: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  valueMuted: {
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    overflow: 'hidden',
  },
  editIcon: {
    color: theme.colors.textMuted,
    fontSize: 18,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  iconText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  iconTextPrimary: {
    color: '#FFFFFF',
  },
  planCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  planTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  planHint: {
    color: theme.colors.text,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  planSoon: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  signOut: {
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  voiceHint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: theme.spacing.sm,
    lineHeight: 16,
  },
  voiceList: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  voiceRowSelected: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  voiceText: {
    flex: 1,
  },
  voiceLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  voiceSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
