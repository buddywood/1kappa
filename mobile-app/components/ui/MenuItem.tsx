import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADII, SPACING } from '../../constants/theme';

interface MenuItemProps {
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  variant?: 'default' | 'logout';
}

export default function MenuItem({
  label,
  onPress,
  showArrow = true,
  variant = 'default',
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        variant === 'logout' && styles.logoutItem,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.menuItemText,
          variant === 'logout' && styles.logoutText,
        ]}
      >
        {label}
      </Text>
      {showArrow && variant !== 'logout' && (
        <Text style={styles.menuItemArrow}>→</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    fontWeight: '500',
  },
  menuItemArrow: {
    fontSize: 18,
    color: COLORS.crimson,
    fontWeight: 'bold',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: COLORS.crimson,
  },
});

