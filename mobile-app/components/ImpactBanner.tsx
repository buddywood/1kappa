import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchTotalDonations } from '../lib/api';
import { COLORS } from '../lib/constants';

export default function ImpactBanner() {
  const [totalDonations, setTotalDonations] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDonations = async () => {
      try {
        const amount = await fetchTotalDonations();
        setTotalDonations(amount);
      } catch (error) {
        console.error('Error loading donations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDonations();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    return `Q${quarter} ${year}`;
  };

  const displayAmount = loading ? 0 : (totalDonations !== null ? totalDonations : 0);

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.starIcon}>★</Text>
          </View>
          <View style={styles.textSection}>
            <Text style={styles.heading}>Our Impact</Text>
            <Text style={styles.subheading}>
              Supporting chapters through every purchase
            </Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.crimson} />
          ) : (
            <>
              <Text style={styles.amount}>{formatCurrency(displayAmount)}</Text>
              <Text style={styles.quarterText}>
                given back to chapters this {getCurrentQuarter()}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cream,
  },
  banner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.crimson}33`, // 20% opacity
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.crimson}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  starIcon: {
    fontSize: 24,
    color: COLORS.crimson,
  },
  textSection: {
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.crimson,
    marginBottom: 4,
  },
  quarterText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    textAlign: 'right',
  },
});


