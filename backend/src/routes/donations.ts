import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getTotalDonations } from '../db/queries-sequelize';

const router: ExpressRouter = Router();

router.get('/total', async (req: Request, res: Response) => {
  try {
    const totalDonationsCents = await getTotalDonations();
    res.json({ total_donations_cents: totalDonationsCents });
  } catch (error) {
    console.error('Error fetching total donations:', error);
    res.status(500).json({ error: 'Failed to fetch total donations' });
  }
});

export default router;


