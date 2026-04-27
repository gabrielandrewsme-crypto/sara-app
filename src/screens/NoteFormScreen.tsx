import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useNotes } from '../hooks/useNotes';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'NoteForm'>;

export function NoteFormScreen({ navigation, route }: Props) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { items, create, update, remove } = useNotes();
  const existing = useMemo(
    () => (id ? items.find((i) => i.id === id) : undefined),
    [id, items],
  );

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title ?? '');
      setContent(existing.content ?? '');
    }
  }, [existing]);

  async function handleSave() {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Atenção', 'Escreva algo antes de salvar.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: title.trim() || null,
        content: content.trim() || null,
      };
      if (isEdit && id) {
        await update(id, payload);
      } else {
        await create(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert('Excluir nota', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Erro', e?.message ?? 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={globalStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Título"
          value={title}
          onChangeText={setTitle}
          placeholder="Opcional"
          autoCapitalize="sentences"
        />
        <Input
          label="Conteúdo"
          value={content}
          onChangeText={setContent}
          placeholder="Escreva aqui…"
          multiline
          autoCapitalize="sentences"
          style={{ height: 240, paddingTop: theme.spacing.md }}
        />

        <Button
          label={isEdit ? 'Salvar alterações' : 'Salvar nota'}
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: theme.spacing.md }}
        />
        {isEdit ? (
          <Button
            label="Excluir"
            variant="ghost"
            onPress={handleDelete}
            style={{ marginTop: theme.spacing.sm }}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
});
