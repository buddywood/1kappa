import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { COLORS, FONT, SHADOW, SPACING } from '../../constants/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function TextField({
  label,
  value,
  onChangeText,
  error,
  containerStyle,
  placeholder,
  ...textInputProps
}: TextFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.midnightNavy + '50'}
        value={value}
        onChangeText={onChangeText}
        {...textInputProps}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...FONT.label,
    color: COLORS.midnightNavy,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.lg,
    ...FONT.body,
    color: COLORS.midnightNavy,
    borderWidth: 1,
    borderColor: COLORS.frostGray + 'AA',
    ...SHADOW.input,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: SPACING.xs,
  },
});

