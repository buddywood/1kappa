import dotenv from 'dotenv';
import { getProductById } from '../db/queries';
import type { Seller } from '../types';

dotenv.config();

// EasyPost API key
const EASYPOST_API_KEY = process.env.EASYPOST_API_KEY || '';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ShippingRate {
  service: string;
  carrier: string;
  rate: number; // in cents
  estimatedDays?: number;
}

interface ShippingOptions {
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  weight?: number; // in ounces, default 16oz (1lb)
  dimensions?: {
    length: number; // in inches
    width: number;
    height: number;
  };
}

/**
 * Calculate shipping rates using EasyPost API
 * Falls back to flat rate if EasyPost is not configured
 */
export async function calculateShippingRates(
  options: ShippingOptions
): Promise<ShippingRate[]> {
  // If EasyPost is not configured, return flat rate
  if (!EASYPOST_API_KEY || EASYPOST_API_KEY === '') {
    console.warn('⚠️ EasyPost API key not configured. Using flat rate shipping.');
    console.warn('   Set EASYPOST_API_KEY in backend/.env to enable real-time shipping rates');
    return [
      {
        service: 'Standard',
        carrier: 'Flat Rate',
        rate: 599, // $5.99 in cents
        estimatedDays: 5,
      },
    ];
  }

  try {
    // Use EasyPost REST API (no SDK needed for simple rate calculation)
    const fromAddress = {
      street1: options.fromAddress.street,
      city: options.fromAddress.city,
      state: options.fromAddress.state,
      zip: options.fromAddress.zip,
      country: options.fromAddress.country || 'US',
    };

    const toAddress = {
      street1: options.toAddress.street,
      city: options.toAddress.city,
      state: options.toAddress.state,
      zip: options.toAddress.zip,
      country: options.toAddress.country || 'US',
    };

    // Default package dimensions if not provided
    const parcel = {
      length: options.dimensions?.length || 10,
      width: options.dimensions?.width || 8,
      height: options.dimensions?.height || 4,
      weight: options.weight || 16, // Default 1lb (16oz)
    };

    // Create shipment to get rates
    const response = await fetch('https://api.easypost.com/v2/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${EASYPOST_API_KEY}`,
      },
      body: JSON.stringify({
        shipment: {
          to_address: toAddress,
          from_address: fromAddress,
          parcel: parcel,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('EasyPost API error:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
      });
      // Fall back to flat rate on error
      return [
        {
          service: 'Standard',
          carrier: 'Flat Rate',
          rate: 599,
          estimatedDays: 5,
        },
      ];
    }

    const data = await response.json();

    // Transform EasyPost rates to our format
    const rates: ShippingRate[] = (data.rates || []).map((rate: any) => ({
      service: rate.service || rate.service_name || 'Standard',
      carrier: rate.carrier || 'Unknown',
      rate: Math.round(rate.rate * 100), // Convert to cents
      estimatedDays: rate.est_delivery_days || undefined,
    }));

    // If no rates returned, fall back to flat rate
    if (rates.length === 0) {
      return [
        {
          service: 'Standard',
          carrier: 'Flat Rate',
          rate: 599,
          estimatedDays: 5,
        },
      ];
    }

    // Sort by price (cheapest first)
    return rates.sort((a, b) => a.rate - b.rate);
  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    // Fall back to flat rate on error
    return [
      {
        service: 'Standard',
        carrier: 'Flat Rate',
        rate: 599,
        estimatedDays: 5,
      },
    ];
  }
}

/**
 * Get seller's shipping address from their business address
 */
export function getSellerShippingAddress(seller: Seller): ShippingAddress | null {
  if (
    !seller.business_address_line1 ||
    !seller.business_city ||
    !seller.business_state ||
    !seller.business_postal_code
  ) {
    return null;
  }

  return {
    street: seller.business_address_line1 + (seller.business_address_line2 ? ` ${seller.business_address_line2}` : ''),
    city: seller.business_city,
    state: seller.business_state,
    zip: seller.business_postal_code,
    country: seller.business_country || 'US',
  };
}

/**
 * Calculate shipping for a product order
 */
export async function calculateProductShipping(
  productId: number,
  seller: Seller,
  toAddress: ShippingAddress
): Promise<ShippingRate[]> {
  const fromAddress = getSellerShippingAddress(seller);

  if (!fromAddress) {
    // If seller doesn't have address, use flat rate
    console.warn(`Seller ${seller.id} does not have a shipping address configured. Using flat rate.`);
    return [
      {
        service: 'Standard',
        carrier: 'Flat Rate',
        rate: 599,
        estimatedDays: 5,
      },
    ];
  }

  // Get product for weight/dimensions (if stored)
  // For now, use defaults
  const product = await getProductById(productId);
  
  // TODO: Add weight and dimensions to products table
  // For now, use reasonable defaults
  return calculateShippingRates({
    fromAddress,
    toAddress,
    weight: 16, // 1lb default
    dimensions: {
      length: 10,
      width: 8,
      height: 4,
    },
  });
}

