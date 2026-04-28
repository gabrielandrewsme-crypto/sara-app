import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
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
import { Segmented } from '../components/Segmented';
import { useTasks } from '../hooks/useTasks';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { Task, TaskPriority, TaskStatus } from '../types/database';
import { formatDateTimeBR } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'Tasks'>;

type Filter = 'all' | TaskStatus;

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Concluídas' },
];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: theme.colors.textMuted,
  medium: theme.colors.primary,
  high: theme.colors.danger,
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluída',
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
};

export function TasksScreen({ navigation }: Props) {
  const { items, loading, update } = useTasks();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((t) => t.status === filter);
  }, [items, filter]);

  async function cycleStatus(task: Task) {
    try {
      await update(task.id, { status: NEXT_STATUS[task.status] });
    } catch {
      // ignore — list shows previous state
    }
  }

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Segmented options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

        {loading && items.length === 0 ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{ marginTop: theme.spacing.xl }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nada por aqui"
            hint={
              filter === 'all'
                ? 'Toque no + para criar sua primeira tarefa.'
                : 'Nenhuma tarefa nesse status.'
            }
          />
        ) : (
          filtered.map((task) => (
            <ListItemCard
              key={task.id}
              title={task.title}
              subtitle={task.description}
              meta={
                task.due_date
                  ? `${STATUS_LABEL[task.status]} · ${formatDateTimeBR(task.due_date)}`
                  : STATUS_LABEL[task.status]
              }
              accent={PRIORITY_COLOR[task.priority]}
              onPress={() => navigation.navigate('TaskForm', { id: task.id })}
              onLongPress={() => cycleStatus(task)}
              editable
              trailing={
                <Text style={styles.statusDot}>
                  {task.status === 'done' ? '✓' : task.status === 'in_progress' ? '~' : '·'}
                </Text>
              }
            />
          ))
        )}

        <Text style={styles.footnote}>
          Toque para editar · pressione e segure para alternar status
        </Text>
      </ScrollView>

      <FAB onPress={() => navigation.navigate('TaskForm', undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
  },
  statusDot: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  footnote: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
