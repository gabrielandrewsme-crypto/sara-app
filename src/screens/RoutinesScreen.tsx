import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { FAB } from '../components/FAB';
import { Segmented } from '../components/Segmented';
import { useRoutines } from '../hooks/useRoutines';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { Routine } from '../types/database';
import {
  WEEKDAY_FULL,
  WEEKDAY_LABELS,
  formatTime,
  todayWeekday,
} from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'Routines'>;

const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, i) => ({
  value: i,
  label,
}));

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function RoutinesScreen({ navigation }: Props) {
  const { items, loading, update } = useRoutines();
  const [day, setDay] = useState<number>(todayWeekday());
  // Visual-only "done today" state: not persisted across app restarts.
  // The spec calls for "marcar como concluída (visual apenas por dia)".
  const [doneToday, setDoneToday] = useState<Set<string>>(new Set());
  const [bucketKey] = useState(todayKey());

  const visible = useMemo(
    () => items.filter((r) => r.day_of_week === day),
    [items, day],
  );

  function toggleDone(id: string) {
    setDoneToday((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleActive(r: Routine) {
    try {
      await update(r.id, { is_active: !r.is_active });
    } catch (e) {
      // swallow — UI keeps previous state
    }
  }

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Segmented
          options={WEEKDAY_OPTIONS}
          value={day}
          onChange={setDay}
          style={{ marginBottom: theme.spacing.md }}
        />

        <Text style={styles.heading}>{WEEKDAY_FULL[day]}</Text>

        {loading && items.length === 0 ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{ marginTop: theme.spacing.xl }}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Sem rotinas pra esse dia"
            hint="Toque no + para adicionar."
          />
        ) : (
          visible.map((r) => {
            const isDone = doneToday.has(r.id);
            const isInactive = !r.is_active;
            return (
              <Pressable
                key={r.id}
                style={[
                  styles.row,
                  isInactive && styles.rowInactive,
                  isDone && styles.rowDone,
                ]}
                onPress={() => toggleDone(r.id)}
                onLongPress={() =>
                  navigation.navigate('RoutineForm', { id: r.id })
                }
              >
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>
                    {r.time ? formatTime(r.time) : '--:--'}
                  </Text>
                </View>
                <View style={styles.bodyCol}>
                  <Text
                    style={[
                      styles.title,
                      isDone && styles.titleDone,
                      isInactive && styles.titleInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {r.title}
                  </Text>
                  {r.description ? (
                    <Text style={styles.subtitle} numberOfLines={2}>
                      {r.description}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  hitSlop={12}
                  onPress={() => toggleActive(r)}
                  style={styles.toggle}
                >
                  <Text style={styles.toggleText}>
                    {r.is_active ? 'on' : 'off'}
                  </Text>
                </Pressable>
                <Pressable
                  hitSlop={12}
                  onPress={() =>
                    navigation.navigate('RoutineForm', { id: r.id })
                  }
                  style={styles.editButton}
                >
                  <Text style={styles.editIcon}>✎</Text>
                </Pressable>
              </Pressable>
            );
          })
        )}

        <Text style={styles.footnote}>
          Toque para marcar como feita hoje · ✎ para editar
        </Text>
      </ScrollView>

      <FAB onPress={() => navigation.navigate('RoutineForm', undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  rowInactive: {
    opacity: 0.4,
  },
  rowDone: {
    borderColor: theme.colors.primary,
  },
  timeCol: {
    width: 60,
  },
  timeText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  bodyCol: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  titleInactive: {
    color: theme.colors.textMuted,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  toggle: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
    marginRight: theme.spacing.sm,
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    color: theme.colors.textMuted,
    fontSize: 18,
  },
  footnote: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
