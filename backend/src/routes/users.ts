import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getUserById } from '../db/queries';
import pool from '../db/connection';

const router = Router();

// Get current user info
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get name based on role
    let name: string | null = null;
    if (user.member_id) {
      const memberResult = await pool.query('SELECT name FROM members WHERE id = $1', [user.member_id]);
      name = memberResult.rows[0]?.name || null;
    } else if (user.seller_id) {
      const sellerResult = await pool.query('SELECT name FROM sellers WHERE id = $1', [user.seller_id]);
      name = sellerResult.rows[0]?.name || null;
    } else if (user.promoter_id) {
      const promoterResult = await pool.query('SELECT name FROM promoters WHERE id = $1', [user.promoter_id]);
      name = promoterResult.rows[0]?.name || null;
    }

    res.json({
      id: user.id,
      cognito_sub: user.cognito_sub,
      email: user.email,
      role: user.role,
      onboarding_status: user.onboarding_status,
      member_id: user.member_id,
      seller_id: user.seller_id,
      promoter_id: user.promoter_id,
      features: user.features,
      name: name,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;

