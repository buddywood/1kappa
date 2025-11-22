import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { COLORS, FONT, SPACING } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  logoSource?: ImageSourcePropType;
}

export default function SectionHeader({
  title,
  subtitle,
  logoSource,
}: SectionHeaderProps) {
  return (
    <View style={styles.headerWrapper}>
      <View style={styles.headerContainer}>
        {logoSource && (
          <View style={styles.logoColumn}>
            <Image
              source={logoSource}
              style={styles.logo}
              resizeMode="contain"
              width={60}
              height={60}
            />
          </View>
        )}
        <View style={styles.textColumn}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.cream,
    marginTop: 6,
    marginBottom: 0,
    alignSelf: 'center',
    width: 'auto',
    gap: SPACING.sm,
  },
  logoColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  logo: {
    width: 80,
    height: 80,
    marginTop: 0,
    marginBottom: 0,
  },
  title: {
    ...FONT.title,
    color: COLORS.midnightNavy,
    textAlign: 'center',
  },
  subtitle: {
    ...FONT.subtitle,
    color: COLORS.midnightNavy,
    textAlign: 'center',
    maxWidth: 280,
  },
});

