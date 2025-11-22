import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../lib/constants';

interface HeroBannerProps {
  // No props needed - just displays text
}

const { width } = Dimensions.get('window');

export default function HeroBanner({}: HeroBannerProps) {

  return (
    <View style={styles.container}>
      {/* Headline - Compact */}
      <View style={styles.textContainer}>
        <Text style={styles.headline}>One Family. One Step. One Kappa.</Text>
        <Text style={styles.subtitle}>
          A digital home for Brothers worldwide — where Community, Commerce, Culture, and Contribution unite in excellence and distinction.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.crimson,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: width - 40,
  },
  headline: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.95,
  },
});

