'use client';

import { Product } from '@/lib/api';

type ProductStatus = 'pending' | 'available' | 'sold';

interface ProductStatusBadgeProps {
  product: Product;
  className?: string;
}

export function getProductStatus(product: Product): ProductStatus {
  // Check if seller is not approved or doesn't have Stripe account
  if (!product.seller_status || product.seller_status !== 'APPROVED' || !product.seller_stripe_account_id) {
    return 'pending';
  }
  
  // TODO: Add sold out logic when inventory tracking is implemented
  // For now, all approved products with Stripe are available
  return 'available';
}

export default function ProductStatusBadge({ product, className = '' }: ProductStatusBadgeProps) {
  const status = getProductStatus(product);

  const statusConfig = {
    pending: {
      label: 'Pending',
      bgColor: 'bg-yellow-500/90',
      textColor: 'text-white',
    },
    available: {
      label: 'Available',
      bgColor: 'bg-green-500/90',
      textColor: 'text-white',
    },
    sold: {
      label: 'Sold',
      bgColor: 'bg-gray-500/90',
      textColor: 'text-white',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} shadow-lg z-10 ${className}`}
    >
      {config.label}
    </div>
  );
}

