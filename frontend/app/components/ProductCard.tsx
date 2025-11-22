'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Product } from '@/lib/api';
import UserRoleBadges from './UserRoleBadges';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  isStewardItem?: boolean;
  badge?: string;
  badgeColor?: string;
  className?: string;
}

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  isStewardItem = false,
  badge,
  badgeColor = '#9B111E', // crimson
  className = '',
}: ProductCardProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [isPressed, setIsPressed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const { items } = useCart();

  const priceValue = product.price_cents / 100;
  const [priceDollars, priceCents] = priceValue.toFixed(2).split('.');
  const sellerName = product.seller_fraternity_member_id
    ? `Brother ${product.seller_name}`
    : product.seller_business_name || product.seller_name;

  // Check if product is in cart
  const cartItem = items.find((item) => item.product.id === product.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;

  useEffect(() => {
    // Fade in animation on mount
    setFadeIn(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (onPress) {
      e.preventDefault();
      onPress();
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.();
  };

  // Check if user can add to cart
  // Kappa branded products require member status
  const isKappaBranded = product.is_kappa_branded === true;
  
  // Determine if user can add this product to cart
  let canAddToCart = true; // Default: everyone can add non-Kappa products
  
  if (isKappaBranded) {
    // For Kappa products, must be authenticated AND be a member
    const isAuthenticated = sessionStatus === 'authenticated' && !!session?.user;
    if (!isAuthenticated) {
      canAddToCart = false; // Guests cannot add Kappa products
    } else {
      // Check if user is a member
      const isMember = (session.user as any)?.is_fraternity_member === true || 
                       ((session.user as any)?.memberId !== null && 
                        (session.user as any)?.memberId !== undefined && 
                        (session.user as any)?.memberId > 0);
      canAddToCart = isMember; // Only members can add Kappa products
    }
  }
  
  // Only show button if onAddToCart is provided AND user can add to cart
  const shouldShowAddButton = onAddToCart && canAddToCart;

  return (
    <div
      className={`relative bg-white rounded-2xl overflow-hidden mb-4 shadow-sm border border-frost-gray/33 transition-all duration-200 ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      } ${isPressed ? 'opacity-85 scale-[0.98]' : ''} ${isStewardItem ? 'opacity-70' : ''} ${className}`}
      style={{
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.06)',
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      <Link
        href={`/product/${product.id}`}
        onClick={handleClick}
        className="block"
        aria-label={`View product: ${product.name}`}
      >
        {/* Product Image */}
        <div className="relative w-full bg-frost-gray" style={{ aspectRatio: '1 / 1.2' }}>
          {product.image_url ? (
            <>
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className={`object-cover transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-frost-gray animate-pulse" />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-60">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto text-midnight-navy/50 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs text-midnight-navy font-medium opacity-70">No Image</p>
              </div>
            </div>
          )}
        </div>

        {/* Badge (top-left) */}
        {badge && (
          <div
            className="absolute top-2 left-2 px-2 py-1 rounded-xl z-10"
            style={{ backgroundColor: badgeColor }}
          >
            <span className="text-white text-[10px] font-semibold leading-none">{badge}</span>
          </div>
        )}

        {/* Members Only badge (top-right) */}
        {isStewardItem && (
          <div className="absolute top-2 right-2 bg-crimson px-2 py-1 rounded-xl z-10">
            <span className="text-white text-[10px] font-semibold leading-none">Members Only</span>
          </div>
        )}

        {/* Product Info */}
        <div className="p-[18px]">
          <h3 className="font-semibold text-sm text-midnight-navy mb-1 line-clamp-2 min-h-[2.25rem] leading-tight tracking-wide">
            {product.name}
          </h3>

          {/* Seller Name and Role Badges */}
          {sellerName && (
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap min-w-0">
              <p className="text-xs text-midnight-navy/70 line-clamp-1 truncate leading-[18px] min-w-0 flex-1">
                by {sellerName}
              </p>
              <UserRoleBadges
                is_member={product.is_fraternity_member}
                is_seller={product.is_seller}
                is_promoter={product.is_promoter}
                is_steward={product.is_steward}
                size="sm"
              />
            </div>
          )}

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-baseline">
              <span className="text-base font-bold text-crimson tracking-wide">${priceDollars}</span>
              <span className="text-xs font-semibold text-crimson ml-0.5 mt-0.5">{priceCents}</span>
            </div>
            {shouldShowAddButton && (
              <button
                onClick={handleAddToCart}
                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold tracking-wide hover:opacity-90 active:scale-95 transition-all duration-150 ${
                  isInCart
                    ? 'bg-crimson text-white'
                    : 'bg-midnight-navy text-white'
                }`}
                aria-label={isInCart ? `${product.name} in cart (${cartQuantity})` : `Add ${product.name} to cart`}
              >
                {isInCart ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {cartQuantity > 1 ? `${cartQuantity}` : 'Added'}
                  </span>
                ) : (
                  'Add'
                )}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
