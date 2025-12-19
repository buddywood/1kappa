import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
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
  loading?: boolean;
}

function Button({
  className,
  variant,
  size,
  label,
  labelClasses,
  loading,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size, className }),
        (props.disabled || loading) && 'opacity-50'
      )}
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
