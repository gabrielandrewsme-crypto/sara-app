import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { AppStackParamList } from '../navigation/types';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

export function ChatScreen({ navigation }: Props) {
  return (
    <View style={[globalStyles.centered]}>
      <Text style={globalStyles.heading}>Chat Sara</Text>
      <Text style={[globalStyles.muted, styles.hint]}>
        A conversa com a Sara chega em breve.
      </Text>
      <Button
        label="Voltar"
        variant="secondary"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
});
