import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

type ModuleRoute = Extract<
  keyof AppStackParamList,
  'Routines' | 'Tasks' | 'Events' | 'Notes' | 'Ideas' | 'Finances'
>;

const MODULES: { route: ModuleRoute; title: string; hint: string }[] = [
  { route: 'Routines', title: 'Rotinas', hint: 'Seu dia em blocos.' },
  { route: 'Tasks', title: 'Tarefas', hint: 'O que precisa sair hoje.' },
  { route: 'Events', title: 'Agenda', hint: 'Compromissos e prazos.' },
  { route: 'Notes', title: 'Notas', hint: 'Pra não esquecer.' },
  { route: 'Ideas', title: 'Ideias', hint: 'Pensamentos soltos.' },
  { route: 'Finances', title: 'Finanças', hint: 'Entra e sai.' },
];

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

      <View style={styles.grid}>
        {MODULES.map((m) => (
          <Pressable
            key={m.route}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => navigation.navigate(m.route)}
          >
            <Text style={styles.tileTitle}>{m.title}</Text>
            <Text style={styles.tileHint}>{m.hint}</Text>
          </Pressable>
        ))}
      </View>

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

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  tile: {
    width: '47.5%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  tilePressed: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.primary,
  },
  tileTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  tileHint: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: theme.spacing.xs,
  },
});
