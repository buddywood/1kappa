import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SPACING, SHADOW } from '../../constants/theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
}

export default function Checkbox({ checked, onPress, label }: CheckboxProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          checked && styles.checkboxChecked,
        ]}
      >
        {checked && (
          <Ionicons
            name="checkmark"
            size={18}
            color={COLORS.white}
          />
        )}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADII.sm,
    borderWidth: 2,
    borderColor: COLORS.crimson,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.midnightNavy,
    borderColor: COLORS.midnightNavy,
  },
  label: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.8,
  },
});

