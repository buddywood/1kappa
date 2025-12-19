import React, { useEffect, useRef } from "react";
import { View, Animated, Text, StyleProp, ViewStyle } from "react-native";
import { cn } from "~/lib/utils";

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  variant?: "elevated" | "flat" | "bordered";
  animated?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
}

export default function FormCard({
  children,
  className,
  style,
  variant = "elevated",
  animated = false,
  headerTitle,
  headerSubtitle,
}: FormCardProps) {
  const fade = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slide = useRef(new Animated.Value(animated ? 12 : 0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, fade, slide]);

  const variantClasses = {
    elevated: "shadow-md",
    flat: "",
    bordered: "border border-border",
  };

  return (
    <Animated.View
      className={cn(
        "bg-card rounded-2xl p-6 mx-2 mt-4",
        variantClasses[variant],
        className
      )}
      style={[
        animated
          ? {
              opacity: fade,
              transform: [{ translateY: slide }],
            }
          : undefined,
        style,
      ]}
    >
      {headerTitle && (
        <Text className="text-xl font-bold text-card-foreground mb-2">
          {headerTitle}
        </Text>
      )}
      {headerSubtitle && (
        <Text className="text-sm text-muted-foreground mb-4">
          {headerSubtitle}
        </Text>
      )}
      {children}
    </Animated.View>
  );
}
