'use client';

import { useSession } from 'next-auth/react';
import { Product } from '@/lib/api';
import ProductCard from './ProductCard';
import { useCart } from '../contexts/CartContext';

interface FeaturedProductsSectionProps {
  products: Product[];
}

export default function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { addToCart } = useCart();

  // Helper to check if user can add product to cart
  const canAddToCart = (product: Product) => {
    const isKappaBranded = product.is_kappa_branded === true;
    // For guests (no session or not authenticated), isMember is always false
    const isAuthenticated = sessionStatus === 'authenticated' && !!session?.user;
    const isMember = isAuthenticated && (
      (session.user as any)?.is_fraternity_member === true || 
      ((session.user as any)?.memberId !== null && (session.user as any)?.memberId !== undefined && (session.user as any)?.memberId > 0)
    );
    // Explicitly block Kappa products for non-members, allow everyone for non-Kappa products
    return isKappaBranded ? isMember : true;
  };

  return (
    <section id="shop" className="max-w-7xl mx-auto py-16 px-4">
      <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Featured Products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={canAddToCart(product) ? () => addToCart(product) : undefined}
          />
        ))}
      </div>
    </section>
  );
}

