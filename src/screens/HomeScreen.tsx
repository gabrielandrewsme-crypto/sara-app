import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

function getDisplayName(metadata: Record<string, unknown> | undefined) {
  const name = metadata?.full_name;
  return typeof name === 'string' && name.length > 0 ? name : 'por aí';
}

export function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const displayName = getDisplayName(user?.user_metadata);

  return (
    <ScrollView
      style={globalStyles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={globalStyles.title}>Olá, {displayName}</Text>
        <Text style={globalStyles.muted}>O que vamos organizar hoje?</Text>
      </View>

      <PlaceholderCard
        title="Rotina do dia"
        hint="Em breve: seus blocos de tempo."
      />
      <PlaceholderCard
        title="Tarefas"
        hint="Em breve: lista simples e direta."
      />
      <PlaceholderCard
        title="Agenda"
        hint="Em breve: seus próximos compromissos."
      />

      <Button
        label="Falar com a Sara"
        onPress={() => navigation.navigate('Chat')}
        style={{ marginTop: theme.spacing.lg }}
      />

      <Button
        label="Sair"
        variant="ghost"
        onPress={signOut}
        style={{ marginTop: theme.spacing.md }}
      />
    </ScrollView>
  );
}

function PlaceholderCard({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    ...theme.typography.heading,
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardHint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
});
