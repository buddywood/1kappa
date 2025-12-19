import React from "react";
import { View, Text, TouchableOpacity, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "./input";
import { cn } from "~/lib/utils";

interface PasswordFieldProps
  extends Omit<TextInputProps, "style" | "secureTextEntry"> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  error?: string;
  className?: string;
}

export default function PasswordField({
  label,
  value,
  onChangeText,
  showPassword,
  onToggleVisibility,
  error,
  className,
  placeholder,
  ...textInputProps
}: PasswordFieldProps) {
  return (
    <View className={cn("mb-6", className)}>
      <Text className="text-base font-medium text-foreground mb-2">
        {label}
      </Text>
      <View className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          error={!!error}
          className="pr-12"
          {...textInputProps}
        />
        <TouchableOpacity
          onPress={onToggleVisibility}
          className="absolute right-0 top-0 h-14 w-12 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={24}
            color="hsl(var(--muted-foreground))"
          />
        </TouchableOpacity>
      </View>
      {error && (
        <Text className="text-xs text-destructive mt-1.5">{error}</Text>
      )}
    </View>
  );
}
