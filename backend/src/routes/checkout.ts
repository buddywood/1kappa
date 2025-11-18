import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getProductById, getOrderByStripeSessionId } from '../db/queries';
import { createCheckoutSession } from '../services/stripe';
import { createOrder } from '../db/queries';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const router: ExpressRouter = Router();

const checkoutSchema = z.object({
  buyer_email: z.string().email(),
});

router.post('/:productId', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const body = checkoutSchema.parse(req.body);

    // Get product
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate product has a price
    if (!product.price_cents || product.price_cents <= 0) {
      return res.status(400).json({ error: 'Product does not have a valid price' });
    }

    // Get seller to check status and get Stripe account
    const { getSellerById } = await import('../db/queries');
    const seller = await getSellerById(product.seller_id);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    if (seller.status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Seller is not approved',
        details: `Seller status: ${seller.status}. Please contact support if you believe this is an error.`
      });
    }

    if (!seller.stripe_account_id) {
      // Notify seller immediately (don't await - send in background)
      const { sendSellerStripeSetupRequiredEmail } = await import('../services/email');
      sendSellerStripeSetupRequiredEmail(
        seller.email,
        seller.name,
        product.name,
        product.id
      ).catch(error => {
        console.error('Failed to send Stripe setup required email:', error);
      });

      // Create notification for seller about blocked purchase
      const { createNotification } = await import('../db/queries-notifications');
      createNotification({
        user_email: seller.email,
        type: 'PURCHASE_BLOCKED',
        title: 'Purchase Attempted - Stripe Setup Required',
        message: `A Brother attempted to purchase "${product.name}" but couldn't complete the purchase because your Stripe account isn't connected. Connect your Stripe account to start receiving payments.`,
        related_product_id: product.id,
      }).catch(error => {
        console.error('Failed to create seller notification:', error);
      });

      // Create notification for buyer that item is pending
      createNotification({
        user_email: body.buyer_email,
        type: 'PURCHASE_BLOCKED',
        title: 'Item Temporarily Unavailable',
        message: `"${product.name}" is temporarily unavailable. The seller is finalizing their payout setup. We'll notify you when it becomes available!`,
        related_product_id: product.id,
      }).catch(error => {
        console.error('Failed to create buyer notification:', error);
      });

      return res.status(400).json({ 
        error: 'STRIPE_NOT_CONNECTED',
        message: 'The seller is finalizing their payout setup. This item will be available soon.',
        sellerName: seller.name,
        productName: product.name
      });
    }

    // Use seller's sponsoring_chapter_id instead of product's sponsored_chapter_id
    const chapterId = (product as any).seller_sponsoring_chapter_id || seller.sponsoring_chapter_id || undefined;

    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      productId: product.id,
      productName: product.name,
      priceCents: product.price_cents,
      connectedAccountId: seller.stripe_account_id,
      buyerEmail: body.buyer_email,
      successUrl: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/cancel`,
      chapterId: chapterId,
    });

    if (!session || !session.id || !session.url) {
      throw new Error('Stripe session creation returned invalid response');
    }

    // Create order record
    await createOrder({
      product_id: product.id,
      buyer_email: body.buyer_email,
      amount_cents: product.price_cents,
      stripe_session_id: session.id,
      chapter_id: chapterId,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    
    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      console.error('Stripe error creating checkout session:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param,
      });
      
      return res.status(400).json({ 
        error: 'Payment processing error',
        details: stripeError.message || 'Unable to create checkout session. Please try again.'
      });
    }

    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get order details by session ID (for success page verification)
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const order = await getOrderByStripeSessionId(sessionId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get product details
    const product = await getProductById(order.product_id);

    res.json({
      order: {
        id: order.id,
        status: order.status,
        amount_cents: order.amount_cents,
        buyer_email: order.buyer_email,
        created_at: order.created_at,
      },
      product: product ? {
        id: product.id,
        name: product.name,
        price_cents: product.price_cents,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching order by session ID:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

export default router;

