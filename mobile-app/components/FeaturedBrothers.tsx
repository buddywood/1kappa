import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { fetchProducts, fetchChapters, Product, Chapter } from '../lib/api';
import { COLORS } from '../lib/constants';

interface FeaturedSeller {
  id: number;
  name: string;
  products: Product[];
  chapter?: string;
}

interface FeaturedBrothersProps {
  onSellerPress?: (sellerId: number) => void;
}

export default function FeaturedBrothers({ onSellerPress }: FeaturedBrothersProps) {
  const [featuredSellers, setFeaturedSellers] = useState<FeaturedSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, chapters] = await Promise.all([
          fetchProducts(),
          fetchChapters(),
        ]);

        // Group products by seller
        const sellerMap = new Map<number, { id: number; name: string; products: Product[] }>();
        products.forEach((product) => {
          if (product.seller_name && product.seller_id) {
            if (!sellerMap.has(product.seller_id)) {
              sellerMap.set(product.seller_id, {
                id: product.seller_id,
                name: product.seller_name,
                products: [],
              });
            }
            sellerMap.get(product.seller_id)!.products.push(product);
          }
        });

        // Get first 3 sellers
        const sellers = Array.from(sellerMap.values()).slice(0, 3);

        // Add chapter names
        const sellersWithChapters = sellers.map((seller) => {
          const firstProduct = seller.products[0];
          const chapterId = firstProduct?.seller_sponsoring_chapter_id;
          const chapter = chapterId
            ? chapters.find((c) => c.id === chapterId)
            : null;

          return {
            ...seller,
            chapter: chapter?.name || null,
          };
        });

        setFeaturedSellers(sellersWithChapters);
      } catch (error) {
        console.error('Error loading featured brothers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9B111E&color=fff&size=200&bold=true&font-size=0.5`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Featured Brothers</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
      </View>
    );
  }

  if (featuredSellers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Featured Brothers</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No featured brothers available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured Brothers</Text>
      <FlatList
        data={featuredSellers}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSellerPress?.(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: getAvatarUrl(item.name) }}
                  style={styles.avatar}
                />
              </View>
              <Text style={styles.brotherName}>{item.name}</Text>
              {item.chapter && (
                <Text style={styles.chapterName}>{item.chapter}</Text>
              )}
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => onSellerPress?.(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.shopButtonText}>Shop Collection</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cream,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.crimson,
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingRight: 16,
  },
  card: {
    width: 200,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginRight: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  brotherName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 4,
    textAlign: 'center',
  },
  chapterName: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 12,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 8,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.crimson,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
});


