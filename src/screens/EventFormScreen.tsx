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
import { Segmented } from '../components/Segmented';
import { useEvents } from '../hooks/useEvents';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { EventType } from '../types/database';
import { formatDateTimeLocal, parseDateTimeLocal } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'EventForm'>;

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'short', label: 'Curto' },
  { value: 'medium', label: 'Médio' },
  { value: 'long', label: 'Longo' },
];

export function EventFormScreen({ navigation, route }: Props) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { items, create, update, remove } = useEvents();
  const existing = useMemo(
    () => (id ? items.find((i) => i.id === id) : undefined),
    [id, items],
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('short');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setType(existing.type);
      setStart(formatDateTimeLocal(existing.start_date));
      setEnd(existing.end_date ? formatDateTimeLocal(existing.end_date) : '');
    }
  }, [existing]);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Dê um título para o evento.');
      return;
    }
    const startValue = parseDateTimeLocal(start);
    if (!startValue) {
      Alert.alert('Atenção', 'Data de início obrigatória (AAAA-MM-DD HH:mm).');
      return;
    }
    let endValue: string | null = null;
    if (end.trim()) {
      endValue = parseDateTimeLocal(end);
      if (!endValue) {
        Alert.alert('Atenção', 'Data de fim inválida (AAAA-MM-DD HH:mm).');
        return;
      }
    }
    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        start_date: startValue,
        end_date: endValue,
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
    Alert.alert('Excluir evento', 'Esta ação não pode ser desfeita.', [
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
          placeholder="Ex: Consulta médica"
          autoCapitalize="sentences"
        />
        <Input
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholder="Opcional"
          multiline
          autoCapitalize="sentences"
          style={{ height: 100, paddingTop: theme.spacing.md }}
        />
        <Segmented
          label="Duração"
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
        />
        <Input
          label="Início (AAAA-MM-DD HH:mm)"
          value={start}
          onChangeText={setStart}
          placeholder="2026-04-30 14:00"
          keyboardType="numbers-and-punctuation"
        />
        <Input
          label="Fim (opcional)"
          value={end}
          onChangeText={setEnd}
          placeholder="2026-04-30 15:00"
          keyboardType="numbers-and-punctuation"
        />

        <Button
          label={isEdit ? 'Salvar alterações' : 'Criar evento'}
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
