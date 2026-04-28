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
import { useEvents } from '../hooks/useEvents';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { CalendarEvent, EventType } from '../types/database';
import { formatDateBR, formatDateTimeBR } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'Events'>;

const TYPE_COLOR: Record<EventType, string> = {
  short: theme.colors.textMuted,
  medium: theme.colors.primary,
  long: theme.colors.danger,
};

const TYPE_LABEL: Record<EventType, string> = {
  short: 'Curto',
  medium: 'Médio',
  long: 'Longo',
};

type Section = { key: string; label: string; events: CalendarEvent[] };

function groupByDay(events: CalendarEvent[]): Section[] {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = formatDateBR(ev.start_date);
    const list = map.get(key) ?? [];
    list.push(ev);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([key, evs]) => ({
    key,
    label: key,
    events: evs,
  }));
}

export function EventsScreen({ navigation }: Props) {
  const { items, loading } = useEvents();

  const sections = useMemo(() => groupByDay(items), [items]);

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading && items.length === 0 ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{ marginTop: theme.spacing.xl }}
          />
        ) : sections.length === 0 ? (
          <EmptyState
            title="Agenda vazia"
            hint="Toque no + para adicionar um evento."
          />
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              {section.events.map((ev) => (
                <ListItemCard
                  key={ev.id}
                  title={ev.title}
                  subtitle={ev.description}
                  meta={`${TYPE_LABEL[ev.type]} · ${formatDateTimeBR(ev.start_date)}${
                    ev.end_date ? ` → ${formatDateTimeBR(ev.end_date)}` : ''
                  }`}
                  accent={TYPE_COLOR[ev.type]}
                  onPress={() => navigation.navigate('EventForm', { id: ev.id })}
                  editable
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <FAB onPress={() => navigation.navigate('EventForm', undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
