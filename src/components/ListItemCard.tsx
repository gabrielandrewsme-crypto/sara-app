import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';

type Props = {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
  accent?: string;
  trailing?: React.ReactNode;
};

export function ListItemCard({
  title,
  subtitle,
  meta,
  onPress,
  onLongPress,
  accent,
  trailing,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {accent ? <View style={[styles.accent, { backgroundColor: accent }]} /> : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: theme.spacing.md,
  },
  trailing: {
    paddingRight: theme.spacing.md,
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
});
