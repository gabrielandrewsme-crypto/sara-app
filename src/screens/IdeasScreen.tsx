import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { FAB } from '../components/FAB';
import { ListItemCard } from '../components/ListItemCard';
import { useIdeas } from '../hooks/useIdeas';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { formatDateBR } from '../utils/datetime';

type Props = NativeStackScreenProps<AppStackParamList, 'Ideas'>;

export function IdeasScreen({ navigation }: Props) {
  const { items, loading } = useIdeas();

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
            title="Nada anotado por aqui"
            hint="Toque no + e jogue uma ideia."
          />
        ) : (
          items.map((idea) => (
            <ListItemCard
              key={idea.id}
              title={idea.title || 'Sem título'}
              subtitle={idea.content}
              meta={`${idea.type === 'mindmap' ? 'Mapa mental' : 'Texto'} · ${formatDateBR(idea.updated_at)}`}
              onPress={() => navigation.navigate('IdeaForm', { id: idea.id })}
            />
          ))
        )}
      </ScrollView>

      <FAB onPress={() => navigation.navigate('IdeaForm', undefined)} />
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
