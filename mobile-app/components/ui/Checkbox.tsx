import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '~/lib/utils';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  className?: string;
}

export default function Checkbox({ checked, onPress, label, className }: CheckboxProps) {
  return (
    <TouchableOpacity
      className={cn("flex-row items-center", className)}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className={cn(
          "h-6 w-6 items-center justify-center rounded-md border-2 border-primary mr-2",
          checked ? "bg-primary" : "bg-transparent"
        )}
      >
        {checked && (
          <Ionicons
            name="checkmark"
            size={16}
            color="white"
          />
        )}
      </View>
      {label && <Text className="text-sm font-medium text-foreground opacity-80">{label}</Text>}
    </TouchableOpacity>
  );
}

