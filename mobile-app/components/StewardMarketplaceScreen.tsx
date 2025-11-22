import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../lib/constants';
import { getStewardMarketplacePublic, StewardListing } from '../lib/api';
import ProductCard from './ProductCard';
import ScreenHeader from './ScreenHeader';
import { useAuth } from '../lib/auth';

interface StewardMarketplaceScreenProps {
  onBack: () => void;
  onListingPress?: (listing: StewardListing) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function StewardMarketplaceScreen({
  onBack,
  onListingPress,
  onSearchPress,
  onUserPress,
}: StewardMarketplaceScreenProps) {
  const { isGuest } = useAuth();
  const [listings, setListings] = useState<StewardListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const data = await getStewardMarketplacePublic();
        setListings(data);
      } catch (error) {
        console.error('Error loading steward listings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  const convertListingToProduct = (listing: StewardListing) => {
    return {
      id: listing.id,
      seller_id: 0,
      name: listing.name,
      description: listing.description || '',
      price_cents: listing.shipping_cost_cents + listing.chapter_donation_cents,
      image_url: listing.image_url,
      category_id: listing.category_id,
      seller_name: listing.steward?.member?.name || 'Steward',
      is_steward: true,
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title="Steward Marketplace"
          onBack={onBack}
          showSearch={true}
          onSearchPress={onSearchPress}
          onUserPress={onUserPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading legacy items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Steward Marketplace"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isGuest && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              Members Only: Sign in to claim legacy items
            </Text>
          </View>
        )}
        {listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No legacy items available</Text>
          </View>
        ) : (
          <View style={styles.listingsContainer}>
            <FlatList
              data={listings}
              renderItem={({ item }) => (
                <ProductCard
                  product={convertListingToProduct(item)}
                  onPress={() => onListingPress?.(item)}
                  isStewardItem={true}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  guestBanner: {
    backgroundColor: COLORS.crimson,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  guestBannerText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  listingsContainer: {
    width: '100%',
  },
  row: {
    justifyContent: 'space-between',
  },
});

