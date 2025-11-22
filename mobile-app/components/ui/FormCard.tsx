import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ViewStyle, Animated, Text } from "react-native";
import { COLORS, SHADOW, SPACING, RADII } from "../../constants/theme";

interface FormCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "elevated" | "flat" | "bordered";
  padding?: number;
  borderRadius?: number;
  animated?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
}

export default function FormCard({
  children,
  style,
  variant = "elevated",
  padding = SPACING.xl,
  borderRadius = RADII.lg,
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
  }, [animated]);

  const variantStyle =
    variant === "flat"
      ? {}
      : variant === "bordered"
      ? { borderWidth: 1, borderColor: COLORS.frostGray }
      : SHADOW.card;

  return (
    <Animated.View
      style={[
        styles.card,
        variantStyle,
        { padding, borderRadius },
        animated && { opacity: fade, transform: [{ translateY: slide }] },
        style,
      ]}
    >
      {headerTitle && <Text style={styles.headerTitle}>{headerTitle}</Text>}
      {headerSubtitle && (
        <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
      )}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    // padding and borderRadius handled via props
    // padding: SPACING.xl,
    // borderRadius: 16,
    ...SHADOW.card,
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.midnightNavy,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.midnightNavy + "AA",
    marginBottom: SPACING.md,
  },
});
