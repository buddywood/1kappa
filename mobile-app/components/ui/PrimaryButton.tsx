import React from 'react';
import { ViewStyle } from 'react-native';
import { Button } from './button';
import { cn } from '~/lib/utils';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  loadingText,
  disabled = false,
  style,
  className,
}: PrimaryButtonProps) {
  return (
    <Button
      variant="default"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      label={loading && loadingText ? loadingText : title}
      className={cn("h-auto", className)}
      // Overriding base button styles to match the original PrimaryButton's look
      style={[{
        borderRadius: 14,
        paddingVertical: 15,
        backgroundColor: '#9B111E', // Matching COLORS.crimson
      }, style]}
      labelClasses="text-white text-[17px] font-bold tracking-[0.3px]"
      labelStyle={{ color: 'white' }}
    />
  );
}


