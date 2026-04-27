import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../styles/theme';

type Props = {
  onPress: () => void;
  label?: string;
};

export function FAB({ onPress, label = '+' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  pressed: {
    backgroundColor: theme.colors.primaryPressed,
    transform: [{ scale: 0.96 }],
  },
  label: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 36,
  },
});
