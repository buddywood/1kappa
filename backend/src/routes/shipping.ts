import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getProductById, getSellerById } from '../db/queries-sequelize';
import { calculateProductShipping } from '../services/shipping';
import { z } from 'zod';

const router: ExpressRouter = Router();

const shippingRateSchema = z.object({
  productId: z.number().int().positive().optional(),
  sellerId: z.number().int().positive().optional(),
  toAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zip: z.string().min(5),
    country: z.string().length(2).default('US'),
  }),
});

/**
 * Calculate shipping rates for a product
 * POST /api/shipping/rates
 * Body: { productId, toAddress }
 */
router.post('/rates', async (req: Request, res: Response) => {
  try {
    const body = shippingRateSchema.safeParse(req.body);
    
    if (!body.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: body.error.errors,
      });
    }

    const { productId, sellerId, toAddress } = body.data;

    // If productId is provided, get seller from product
    if (productId) {
      const product = await getProductById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const seller = await getSellerById(product.seller_id);
      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      const rates = await calculateProductShipping(productId, seller, toAddress);
      return res.json({ rates });
    }

    // If sellerId is provided directly
    if (sellerId) {
      const seller = await getSellerById(sellerId);
      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      // Use default product dimensions
      const { calculateShippingRates, getSellerShippingAddress } = await import('../services/shipping');
      const fromAddress = getSellerShippingAddress(seller);

      if (!fromAddress) {
        return res.json({
          rates: [
            {
              service: 'Standard',
              carrier: 'Flat Rate',
              rate: 599,
              estimatedDays: 5,
            },
          ],
        });
      }

      const rates = await calculateShippingRates({
        fromAddress,
        toAddress,
        weight: 16,
        dimensions: { length: 10, width: 8, height: 4 },
      });

      return res.json({ rates });
    }

    return res.status(400).json({
      error: 'Either productId or sellerId must be provided',
    });
  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    res.status(500).json({
      error: 'Failed to calculate shipping rates',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
    });
  }
});

export default router;

