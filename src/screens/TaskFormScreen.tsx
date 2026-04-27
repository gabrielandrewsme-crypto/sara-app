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
import { useTasks } from '../hooks/useTasks';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { TaskPriority, TaskStatus } from '../types/database';
import { formatDateTimeLocal, parseDateTimeLocal } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskForm'>;

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Concluída' },
];

export function TaskFormScreen({ navigation, route }: Props) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { items, create, update, remove } = useTasks();
  const existing = useMemo(
    () => (id ? items.find((i) => i.id === id) : undefined),
    [id, items],
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setPriority(existing.priority);
      setStatus(existing.status);
      setDue(existing.due_date ? formatDateTimeLocal(existing.due_date) : '');
    }
  }, [existing]);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Dê um título para a tarefa.');
      return;
    }
    let dueValue: string | null = null;
    if (due.trim()) {
      dueValue = parseDateTimeLocal(due);
      if (!dueValue) {
        Alert.alert('Atenção', 'Data inválida. Use AAAA-MM-DD HH:mm.');
        return;
      }
    }
    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_date: dueValue,
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
    Alert.alert('Excluir tarefa', 'Esta ação não pode ser desfeita.', [
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
          placeholder="O que precisa ser feito?"
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
          label="Prioridade"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
        />
        <Segmented
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
        <Input
          label="Data limite (AAAA-MM-DD HH:mm)"
          value={due}
          onChangeText={setDue}
          placeholder="2026-04-30 18:00"
          keyboardType="numbers-and-punctuation"
        />

        <Button
          label={isEdit ? 'Salvar alterações' : 'Criar tarefa'}
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
