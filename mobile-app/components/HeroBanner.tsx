import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { COLORS } from '../lib/constants';

interface HeroBannerProps {
  onShopPress?: () => void;
}

const { width } = Dimensions.get('window');

export default function HeroBanner({ onShopPress }: HeroBannerProps) {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/stacked-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Headline */}
      <View style={styles.textContainer}>
        <Text style={styles.headline}>One Family. One Step. One Kappa.</Text>
        <Text style={styles.subtitle}>
          A digital home for Brothers worldwide — where Community, Commerce, Culture, and Contribution unite in excellence and distinction.
        </Text>

        {/* Shop CTA */}
        <TouchableOpacity
          onPress={onShopPress}
          style={styles.shopButton}
          activeOpacity={0.8}
        >
          <Text style={styles.shopButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    backgroundColor: COLORS.crimson,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: width - 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    opacity: 0.95,
  },
  shopButton: {
    backgroundColor: COLORS.crimson,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

