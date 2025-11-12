import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { verifyWebhookSignature } from '../services/stripe';
import { getOrderByStripeSessionId, updateOrderStatus } from '../db/queries';
import dotenv from 'dotenv';

dotenv.config();

const router: ExpressRouter = Router();

// Stripe webhook endpoint (must be raw body for signature verification)
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event;

  try {
    // req.body is already a Buffer from express.raw() middleware
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    event = verifyWebhookSignature(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    try {
      const order = await getOrderByStripeSessionId(session.id);
      
      if (order && order.status === 'PENDING') {
        await updateOrderStatus(order.id, 'PAID');
        console.log(`Order ${order.id} marked as PAID`);
      }
    } catch (error) {
      console.error('Error processing checkout.session.completed:', error);
    }
  }

  res.json({ received: true });
});

export default router;
