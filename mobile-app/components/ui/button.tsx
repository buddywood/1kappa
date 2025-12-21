import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { Pressable, Text, ActivityIndicator, Platform, ViewStyle, TextStyle } from 'react-native';
import { cn } from '~/lib/utils';

const buttonVariants = cva(
  'group flex flex-row items-center justify-center rounded-md active:opacity-90',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary',
        ghost: 'active:bg-accent',
        link: 'bg-transparent',
      },
      size: {
        default: 'h-12 px-6',
        sm: 'h-9 px-3',
        lg: 'h-14 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('text-base font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
  label?: string;
  labelClasses?: string;
  labelStyle?: TextStyle;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  label,
  labelClasses,
  labelStyle,
  loading,
  children,
  style,
  ...props
}: ButtonProps) {
  // Get button background and border colors based on variant
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      opacity: (props.disabled || loading) ? 0.5 : 1,
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          backgroundColor: '#9B111E', // primary/crimson
          height: size === 'sm' ? 36 : size === 'lg' ? 56 : 48,
          paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 32 : 24,
        };
      case 'destructive':
        return {
          ...baseStyle,
          backgroundColor: '#DC2626',
          height: size === 'sm' ? 36 : size === 'lg' ? 56 : 48,
          paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 32 : 24,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: '#F7F4E9', // background/cream
          borderWidth: 1,
          borderColor: '#E8E5DA', // input border
          height: size === 'sm' ? 36 : size === 'lg' ? 56 : 48,
          paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 32 : 24,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: '#E8E5DA', // secondary
          height: size === 'sm' ? 36 : size === 'lg' ? 56 : 48,
          paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 32 : 24,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          height: size === 'sm' ? 36 : size === 'lg' ? 56 : 48,
          paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 32 : 24,
        };
      case 'link':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          height: undefined,
          minHeight: 44,
          paddingHorizontal: 0,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#9B111E',
          height: size === 'sm' ? 36 : size === 'lg' ? 56 : 48,
          paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 32 : 24,
        };
    }
  };

  // Get text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'default':
      case 'destructive':
        return '#FFFFFF';
      case 'outline':
      case 'secondary':
      case 'ghost':
        return '#0D0D0F'; // foreground/midnight navy
      case 'link':
        return '#9B111E'; // primary/crimson
      default:
        return '#FFFFFF';
    }
  };

  const buttonStyles = getButtonStyles();
  const textColor = getTextColor();

  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size, className }),
        (props.disabled || loading) && 'opacity-50'
      )}
      style={[buttonStyles, style]}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' || variant === 'link' ? '#9B111E' : 'white'} 
        />
      ) : (
        <>
          {label ? (
            <Text
              className={cn(
                buttonTextVariants({ variant, className: labelClasses })
              )}
              style={[
                {
                  fontSize: 16,
                  fontWeight: '600',
                  color: textColor,
                  textAlign: 'center',
                },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}

export { Button, buttonVariants, buttonTextVariants };
