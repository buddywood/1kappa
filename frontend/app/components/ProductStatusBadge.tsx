'use client';

import { Product } from '@/lib/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      tooltip: 'This item will be available soon. Check back later.',
    },
    available: {
      label: 'Available',
      bgColor: 'bg-green-500/90',
      textColor: 'text-white',
      tooltip: undefined,
    },
    sold: {
      label: 'Sold',
      bgColor: 'bg-gray-500/90',
      textColor: 'text-white',
      tooltip: undefined,
    },
  };

  const config = statusConfig[status];
  
  const badgeElement = (
    <div
      className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} shadow-lg z-10 ${className}`}
    >
      {config.label}
    </div>
  );

  // Wrap with tooltip if pending
  if (status === 'pending' && config.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} shadow-lg z-10 cursor-help ${className}`}
            >
              {config.label}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs bg-midnight-navy text-white border-midnight-navy">
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeElement;
}

