import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';

const VOICE_FAB_BOTTOM = theme.spacing.xl;

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

function getDisplayName(metadata: Record<string, unknown> | undefined): string {
  const name = metadata?.full_name;
  return typeof name === 'string' && name.length > 0 ? name : '';
}

function getInitial(name: string, email: string): string {
  const source = name || email;
  return source ? source.trim().charAt(0).toUpperCase() : '?';
}

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const displayName = getDisplayName(user?.user_metadata);
  const initial = getInitial(displayName, user?.email ?? '');
  const greeting = displayName || 'por aí';

  return (
    <View style={globalStyles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={globalStyles.title}>Olá, {greeting}</Text>
          <Text style={globalStyles.muted}>O que vamos organizar hoje?</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Account')}
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && styles.avatarButtonPressed,
          ]}
          hitSlop={8}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
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
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('VoiceMode')}
        style={({ pressed }) => [
          styles.voiceFab,
          pressed && styles.voiceFabPressed,
        ]}
        hitSlop={8}
      >
        <Image
          source={require('../../assets/voice-icon.jpg')}
          style={styles.voiceFabIcon}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonPressed: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  avatarText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
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
  voiceFab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: VOICE_FAB_BOTTOM,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  voiceFabPressed: {
    backgroundColor: '#E5E5E5',
    transform: [{ scale: 0.96 }],
  },
  voiceFabIcon: {
    width: 38,
    height: 38,
  },
});
