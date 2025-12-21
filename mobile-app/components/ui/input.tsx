import * as React from "react";
import { TextInput, type TextInputProps, Platform } from "react-native";
import { cn } from "~/lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
  error?: boolean;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, error, placeholderTextColor, style, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    // Background color: white with tint by default, pure white when focused
    const backgroundColor = Platform.select({
      native: isFocused ? "#FFFFFF" : "#FAFAFA", // pure white when focused, tinted white otherwise
      default: isFocused ? "#FFFFFF" : "hsl(var(--background))",
    });
    
    const borderColor = error
      ? "#DC2626" // destructive
      : isFocused
      ? "#9B111E" // primary/crimson
      : "#E8E5DA"; // input border (lighter cream)

    const textColor = Platform.select({
      native: "#0D0D0F", // midnight navy
      default: "hsl(var(--foreground))",
    });

    return (
      <TextInput
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "web:flex h-12 native:h-12 web:w-full rounded-lg border bg-background px-4 web:py-2 text-base lg:text-sm native:text-base native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
          isFocused
            ? "border-primary ring-2 ring-primary/30"
            : "border-input",
          error && "border-destructive",
          props.editable === false && "opacity-50 web:cursor-not-allowed",
          className
        )}
        style={[
          {
            backgroundColor: backgroundColor,
            borderWidth: 1,
            borderColor: borderColor,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: textColor,
            textAlignVertical: props.multiline ? "top" : "center",
          },
          isFocused && !error && {
            backgroundColor: "#FFFFFF", // pure white when focused
            borderColor: "#9B111E",
            borderWidth: 2,
          },
          error && {
            borderColor: "#DC2626",
            borderWidth: 1,
          },
          style,
        ]}
        placeholderTextColor={
          placeholderTextColor ?? "#666666"
        }
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
