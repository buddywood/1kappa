import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchFeaturedProducts, Product } from '../lib/api';
import { COLORS } from '../lib/constants';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/auth';
import ProductCard from './ProductCard';

interface FeaturedProductsProps {
  onProductPress?: (product: Product) => void;
}

export default function FeaturedProducts({ onProductPress }: FeaturedProductsProps) {
  const { addToCart } = useCart();
  const { isGuest, isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to check if user can add product to cart
  const canAddToCart = (product: Product) => {
    const isKappaBranded = product.is_kappa_branded === true;
    // For guests or non-authenticated users, isMember is always false
    // For authenticated users, check if they are a member (must have is_fraternity_member === true OR memberId > 0)
    const isMember = isAuthenticated && (
      user?.is_fraternity_member === true || 
      (user?.memberId !== null && user?.memberId !== undefined && user?.memberId > 0)
    );
    // Explicitly block Kappa products for non-members, allow everyone for non-Kappa products
    return isKappaBranded ? isMember : true;
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchFeaturedProducts();
        setProducts(data); // Featured products endpoint returns last 10 products
      } catch (error) {
        console.error('Error loading featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Featured Products</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Featured Products</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured Products</Text>
      <View style={styles.productsGrid}>
        {products.map((item) => (
          <ProductCard
            key={item.id.toString()}
            product={item}
            onPress={() => onProductPress?.(item)}
            onAddToCart={canAddToCart(item) ? () => addToCart(item) : undefined}
          />
        ))}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.crimson,
    marginBottom: 16,
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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


