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
import { useRoutines } from '../hooks/useRoutines';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { WEEKDAY_LABELS, formatTime, parseTime } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'RoutineForm'>;

const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, i) => ({ value: i, label }));

export function RoutineFormScreen({ navigation, route }: Props) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { items, create, update, remove } = useRoutines();
  const existing = useMemo(
    () => (id ? items.find((i) => i.id === id) : undefined),
    [id, items],
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState<number>(0);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setDay(existing.day_of_week);
      setTime(existing.time ? formatTime(existing.time) : '');
    }
  }, [existing]);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Dê um título para a rotina.');
      return;
    }
    let timeValue: string | null = null;
    if (time.trim()) {
      timeValue = parseTime(time);
      if (!timeValue) {
        Alert.alert('Atenção', 'Horário inválido. Use HH:mm (ex: 08:30).');
        return;
      }
    }
    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        day_of_week: day,
        time: timeValue,
      };
      if (isEdit && id) {
        await update(id, payload);
      } else {
        await create({ ...payload, is_active: true });
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
    Alert.alert('Excluir rotina', 'Esta ação não pode ser desfeita.', [
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
          placeholder="Ex: Beber água"
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
          label="Dia da semana"
          options={WEEKDAY_OPTIONS}
          value={day}
          onChange={setDay}
        />
        <Input
          label="Horário (HH:mm)"
          value={time}
          onChangeText={setTime}
          placeholder="08:30"
          keyboardType="numbers-and-punctuation"
        />

        <Button
          label={isEdit ? 'Salvar alterações' : 'Criar rotina'}
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
