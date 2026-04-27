import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Segmented } from '../components/Segmented';
import { useFinances } from '../hooks/useFinances';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { FinanceType } from '../types/database';
import { formatDateTimeLocal, parseDateTimeLocal } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'FinanceForm'>;

const TYPE_OPTIONS: { value: FinanceType; label: string }[] = [
  { value: 'income', label: 'Entrada' },
  { value: 'expense', label: 'Saída' },
];

function parseAmount(input: string): number | null {
  const normalized = input.trim().replace(',', '.').replace(/[^\d.-]/g, '');
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function FinanceFormScreen({ navigation, route }: Props) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const { items, create, update, remove } = useFinances();
  const existing = useMemo(
    () => (id ? items.find((i) => i.id === id) : undefined),
    [id, items],
  );

  const [type, setType] = useState<FinanceType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(formatDateTimeLocal(new Date().toISOString()));
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setType(existing.type);
      setAmount(String(existing.amount).replace('.', ','));
      setCategory(existing.category ?? '');
      setDate(formatDateTimeLocal(existing.date));
      setRecurring(existing.recurring);
    }
  }, [existing]);

  async function handleSave() {
    const value = parseAmount(amount);
    if (value === null || value <= 0) {
      Alert.alert('Atenção', 'Valor inválido. Use um número positivo.');
      return;
    }
    const dateValue = parseDateTimeLocal(date);
    if (!dateValue) {
      Alert.alert('Atenção', 'Data inválida (AAAA-MM-DD HH:mm).');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        type,
        amount: value,
        category: category.trim() || null,
        date: dateValue,
        recurring,
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
    Alert.alert('Excluir lançamento', 'Esta ação não pode ser desfeita.', [
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
        <Segmented
          label="Tipo"
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
        />
        <Input
          label="Valor (R$)"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          keyboardType="decimal-pad"
        />
        <Input
          label="Categoria"
          value={category}
          onChangeText={setCategory}
          placeholder="Ex: Alimentação"
          autoCapitalize="sentences"
        />
        <Input
          label="Data (AAAA-MM-DD HH:mm)"
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
        />

        <View style={styles.toggleWrapper}>
          <Text style={styles.toggleLabel}>Recorrente</Text>
          <Pressable
            onPress={() => setRecurring((r) => !r)}
            style={[styles.toggle, recurring && styles.toggleOn]}
          >
            <Text style={[styles.toggleText, recurring && styles.toggleTextOn]}>
              {recurring ? 'Sim' : 'Não'}
            </Text>
          </Pressable>
        </View>

        <Button
          label={isEdit ? 'Salvar alterações' : 'Registrar'}
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
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  toggleLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  toggle: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextOn: {
    color: '#FFFFFF',
  },
});
