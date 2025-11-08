import { Router, Request, Response } from 'express';
import { getPendingSellers, updateSellerStatus, getAllOrders, getChapterDonations, getSellerById } from '../db/queries';
import { createConnectAccount } from '../services/stripe';
import { z } from 'zod';

const router = Router();

// Middleware to check admin authentication
const authenticateAdmin = (req: Request, res: Response, next: Function) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.use(authenticateAdmin);

const approveSellerSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

router.get('/sellers/pending', async (req: Request, res: Response) => {
  try {
    const sellers = await getPendingSellers();
    res.json(sellers);
  } catch (error) {
    console.error('Error fetching pending sellers:', error);
    res.status(500).json({ error: 'Failed to fetch pending sellers' });
  }
});

router.put('/sellers/:id', async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id);
    const body = approveSellerSchema.parse(req.body);
    
    let stripeAccountId: string | undefined;
    
    // If approving, create Stripe Connect account
    if (body.status === 'APPROVED') {
      const seller = await getSellerById(sellerId);
      
      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      const account = await createConnectAccount(seller.email);
      stripeAccountId = account.id;
    }

    const updatedSeller = await updateSellerStatus(sellerId, body.status, stripeAccountId);
    res.json(updatedSeller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating seller status:', error);
    res.status(500).json({ error: 'Failed to update seller status' });
  }
});

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/donations', async (req: Request, res: Response) => {
  try {
    const donations = await getChapterDonations();
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

export default router;

