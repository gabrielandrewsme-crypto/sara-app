import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Sara</Text>
      <ActivityIndicator color={theme.colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  spinner: {
    marginTop: theme.spacing.xl,
  },
});
