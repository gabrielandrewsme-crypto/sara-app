import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { FAB } from '../components/FAB';
import { ListItemCard } from '../components/ListItemCard';
import { useFinances } from '../hooks/useFinances';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { formatCurrencyBRL, formatDateBR } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'Finances'>;

export function FinancesScreen({ navigation }: Props) {
  const { items, loading } = useFinances();

  const { income, expense, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const f of items) {
      const value = Number(f.amount);
      if (f.type === 'income') inc += value;
      else exp += value;
    }
    return { income: inc, expense: exp, balance: inc - exp };
  }, [items]);

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo</Text>
          <Text
            style={[
              styles.balanceValue,
              balance < 0 && { color: theme.colors.danger },
            ]}
          >
            {formatCurrencyBRL(balance)}
          </Text>
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Entradas</Text>
              <Text style={[styles.cellValue, { color: theme.colors.primary }]}>
                {formatCurrencyBRL(income)}
              </Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Saídas</Text>
              <Text style={[styles.cellValue, { color: theme.colors.danger }]}>
                {formatCurrencyBRL(expense)}
              </Text>
            </View>
          </View>
        </View>

        {loading && items.length === 0 ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{ marginTop: theme.spacing.xl }}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Sem lançamentos"
            hint="Toque no + para registrar entrada ou saída."
          />
        ) : (
          items.map((f) => {
            const value = Number(f.amount);
            const sign = f.type === 'income' ? '+' : '-';
            const color =
              f.type === 'income' ? theme.colors.primary : theme.colors.danger;
            return (
              <ListItemCard
                key={f.id}
                title={f.category || (f.type === 'income' ? 'Entrada' : 'Saída')}
                subtitle={f.recurring ? 'Recorrente' : null}
                meta={formatDateBR(f.date)}
                accent={color}
                onPress={() => navigation.navigate('FinanceForm', { id: f.id })}
                editable
                trailing={
                  <Text style={[styles.amount, { color }]}>
                    {sign} {formatCurrencyBRL(value).replace('-', '')}
                  </Text>
                }
              />
            );
          })
        )}
      </ScrollView>

      <FAB onPress={() => navigation.navigate('FinanceForm', undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
  },
  balanceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  balanceLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '700',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cell: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  cellLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  cellValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: theme.spacing.xs,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'right',
  },
});
