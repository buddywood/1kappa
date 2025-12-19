import React from "react";
import { View, Text, type TextInputProps } from "react-native";
import { Input } from "./input";
import { cn } from "~/lib/utils";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  className?: string;
}

export default function TextField({
  label,
  value,
  onChangeText,
  error,
  className,
  placeholder,
  ...textInputProps
}: TextFieldProps) {
  return (
    <View className={cn("mb-6", className)}>
      <Text className="text-base font-medium text-foreground mb-2">
        {label}
      </Text>
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        error={!!error}
        {...textInputProps}
      />
      {error && (
        <Text className="text-xs text-destructive mt-1.5">{error}</Text>
      )}
    </View>
  );
}
