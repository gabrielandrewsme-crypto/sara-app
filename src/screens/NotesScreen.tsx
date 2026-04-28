import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { FAB } from '../components/FAB';
import { ListItemCard } from '../components/ListItemCard';
import { useNotes } from '../hooks/useNotes';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { formatDateBR } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'Notes'>;

export function NotesScreen({ navigation }: Props) {
  const { items, loading } = useNotes();

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading && items.length === 0 ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{ marginTop: theme.spacing.xl }}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Sem notas ainda"
            hint="Toque no + para começar a escrever."
          />
        ) : (
          items.map((note) => (
            <ListItemCard
              key={note.id}
              title={note.title || 'Sem título'}
              subtitle={note.content}
              meta={formatDateBR(note.updated_at)}
              onPress={() => navigation.navigate('NoteForm', { id: note.id })}
              editable
            />
          ))
        )}
      </ScrollView>

      <FAB onPress={() => navigation.navigate('NoteForm', undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
  },
});
