import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SHADOW, SPACING } from '../../constants/theme';

interface PasswordFieldProps extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function PasswordField({
  label,
  value,
  onChangeText,
  showPassword,
  onToggleVisibility,
  error,
  containerStyle,
  placeholder,
  ...textInputProps
}: PasswordFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.midnightNavy + '50'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          {...textInputProps}
        />
        <TouchableOpacity
          onPress={onToggleVisibility}
          style={styles.passwordIcon}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={COLORS.midnightNavy + '80'}
          />
        </TouchableOpacity>
      </View>
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.frostGray + 'AA',
    ...SHADOW.input,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    ...FONT.body,
    color: COLORS.midnightNavy,
  },
  passwordIcon: {
    padding: SPACING.lg,
    paddingLeft: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: SPACING.xs,
  },
});

