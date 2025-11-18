import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../middleware/auth';
import { getUserById, upsertUserOnLogin } from '../db/queries';
import { verifyCognitoToken, extractUserInfoFromToken } from '../services/cognito';
import pool from '../db/connection';

const router: ExpressRouter = Router();

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

    // Get name and role flags based on role
    let name: string | null = null;
    let is_fraternity_member = false;
    let is_seller = false;
    let is_promoter = false;
    let is_steward = false;

    if (user.fraternity_member_id) {
      const memberResult = await pool.query('SELECT name FROM fraternity_members WHERE id = $1', [user.fraternity_member_id]);
      if (memberResult.rows.length === 0) {
        // Orphaned fraternity_member_id detected - clear it
        console.warn(`Orphaned fraternity_member_id detected for user ${user.id}: fraternity_member_id ${user.fraternity_member_id} doesn't exist`);
        await pool.query(
          `UPDATE users 
           SET fraternity_member_id = NULL, 
               onboarding_status = 'ONBOARDING_STARTED',
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [user.id]
        );
        user.fraternity_member_id = null;
        user.onboarding_status = 'ONBOARDING_STARTED';
      } else {
        name = memberResult.rows[0]?.name || null;
        is_fraternity_member = true;
      }
    } else if (user.seller_id) {
      const sellerResult = await pool.query('SELECT name FROM sellers WHERE id = $1', [user.seller_id]);
      name = sellerResult.rows[0]?.name || null;
    } else if (user.promoter_id) {
      const promoterResult = await pool.query('SELECT name FROM promoters WHERE id = $1', [user.promoter_id]);
      name = promoterResult.rows[0]?.name || null;
    }

    // Check for seller role
    if (user.seller_id) {
      const sellerResult = await pool.query('SELECT status FROM sellers WHERE id = $1', [user.seller_id]);
      if (sellerResult.rows.length > 0 && sellerResult.rows[0].status === 'APPROVED') {
        is_seller = true;
      }
    }

    // Check for promoter role
    if (user.promoter_id) {
      const promoterResult = await pool.query('SELECT status FROM promoters WHERE id = $1', [user.promoter_id]);
      if (promoterResult.rows.length > 0 && promoterResult.rows[0].status === 'APPROVED') {
        is_promoter = true;
      }
    }

    // Check for steward role
    if (user.steward_id) {
      const stewardResult = await pool.query('SELECT status FROM stewards WHERE id = $1', [user.steward_id]);
      if (stewardResult.rows.length > 0 && stewardResult.rows[0].status === 'APPROVED') {
        is_steward = true;
      }
    } else if (user.fraternity_member_id) {
      // Also check if there's a steward record for this fraternity_member_id
      const stewardResult = await pool.query(
        'SELECT status FROM stewards WHERE fraternity_member_id = $1 AND status = $2',
        [user.fraternity_member_id, 'APPROVED']
      );
      if (stewardResult.rows.length > 0) {
        is_steward = true;
      }
    }

    res.json({
      id: user.id,
      cognito_sub: user.cognito_sub,
      email: user.email,
      role: user.role,
      onboarding_status: user.onboarding_status,
      fraternity_member_id: user.fraternity_member_id,
      seller_id: user.seller_id,
      promoter_id: user.promoter_id,
      steward_id: user.steward_id,
      features: user.features,
      name: name,
      last_login: user.last_login,
      created_at: user.created_at,
      is_fraternity_member,
      is_seller,
      is_promoter,
      is_steward,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Upsert user on login (insert or update with last_login)
// This endpoint verifies the Cognito token directly (not using authenticate middleware)
// because the user might not exist in the database yet
router.post('/upsert-on-login', async (req: Request, res: Response) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = await verifyCognitoToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Extract user info from token
    const { cognitoSub: tokenCognitoSub, email: tokenEmail } = extractUserInfoFromToken(payload);

    const { cognito_sub, email } = req.body;

    if (!cognito_sub || !email) {
      return res.status(400).json({ error: 'cognito_sub and email are required' });
    }

    // Verify the cognito_sub matches the token
    if (tokenCognitoSub !== cognito_sub) {
      return res.status(403).json({ error: 'Forbidden: cognito_sub mismatch' });
    }

    // Use email from token if provided, otherwise use body email
    const userEmail = tokenEmail || email;

    const user = await upsertUserOnLogin(cognito_sub, userEmail);

    // Get name and role flags based on role
    let name: string | null = null;
    let is_fraternity_member = false;
    let is_seller = false;
    let is_promoter = false;
    let is_steward = false;

    if (user.fraternity_member_id) {
      const memberResult = await pool.query('SELECT name FROM fraternity_members WHERE id = $1', [user.fraternity_member_id]);
      if (memberResult.rows.length === 0) {
        // Orphaned fraternity_member_id detected - clear it
        console.warn(`Orphaned fraternity_member_id detected for user ${user.id}: fraternity_member_id ${user.fraternity_member_id} doesn't exist`);
        await pool.query(
          `UPDATE users 
           SET fraternity_member_id = NULL, 
               onboarding_status = 'ONBOARDING_STARTED',
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [user.id]
        );
        user.fraternity_member_id = null;
        user.onboarding_status = 'ONBOARDING_STARTED';
      } else {
        name = memberResult.rows[0]?.name || null;
        is_fraternity_member = true;
      }
    } else if (user.seller_id) {
      const sellerResult = await pool.query('SELECT name FROM sellers WHERE id = $1', [user.seller_id]);
      name = sellerResult.rows[0]?.name || null;
    } else if (user.promoter_id) {
      const promoterResult = await pool.query('SELECT name FROM promoters WHERE id = $1', [user.promoter_id]);
      name = promoterResult.rows[0]?.name || null;
    }

    // Check for seller role
    if (user.seller_id) {
      const sellerResult = await pool.query('SELECT status FROM sellers WHERE id = $1', [user.seller_id]);
      if (sellerResult.rows.length > 0 && sellerResult.rows[0].status === 'APPROVED') {
        is_seller = true;
      }
    }

    // Check for promoter role
    if (user.promoter_id) {
      const promoterResult = await pool.query('SELECT status FROM promoters WHERE id = $1', [user.promoter_id]);
      if (promoterResult.rows.length > 0 && promoterResult.rows[0].status === 'APPROVED') {
        is_promoter = true;
      }
    }

    // Check for steward role
    if (user.steward_id) {
      const stewardResult = await pool.query('SELECT status FROM stewards WHERE id = $1', [user.steward_id]);
      if (stewardResult.rows.length > 0 && stewardResult.rows[0].status === 'APPROVED') {
        is_steward = true;
      }
    } else if (user.fraternity_member_id) {
      // Also check if there's a steward record for this fraternity_member_id
      const stewardResult = await pool.query(
        'SELECT status FROM stewards WHERE fraternity_member_id = $1 AND status = $2',
        [user.fraternity_member_id, 'APPROVED']
      );
      if (stewardResult.rows.length > 0) {
        is_steward = true;
      }
    }

    res.json({
      id: user.id,
      cognito_sub: user.cognito_sub,
      email: user.email,
      role: user.role,
      onboarding_status: user.onboarding_status,
      fraternity_member_id: user.fraternity_member_id,
      seller_id: user.seller_id,
      promoter_id: user.promoter_id,
      steward_id: user.steward_id,
      features: user.features,
      name: name,
      last_login: user.last_login,
      is_fraternity_member,
      is_seller,
      is_promoter,
      is_steward,
    });
  } catch (error) {
    console.error('Error upserting user on login:', error);
    res.status(500).json({ error: 'Failed to upsert user' });
  }
});

// Delete current user's account
router.delete('/me/delete', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store IDs before deleting
    const memberId = user.fraternity_member_id;
    const sellerId = user.seller_id;
    const promoterId = user.promoter_id;
    const stewardId = user.steward_id;

    // Delete role-specific data first (to handle foreign key constraints)
    
    // Delete seller-related data
    if (sellerId) {
      // Get product IDs first before deleting
      const productIdsResult = await pool.query('SELECT id FROM products WHERE seller_id = $1', [sellerId]);
      const productIds = productIdsResult.rows.map(row => row.id);
      
      // Delete orders for this seller's products (if any products exist)
      if (productIds.length > 0) {
        await pool.query('DELETE FROM orders WHERE product_id = ANY($1::int[])', [productIds]);
      }
      
      // Delete products (they reference seller)
      await pool.query('DELETE FROM products WHERE seller_id = $1', [sellerId]);
      
      // Delete seller record
      await pool.query('DELETE FROM sellers WHERE id = $1', [sellerId]);
    }

    // Delete promoter-related data
    if (promoterId) {
      // Delete events first (they reference promoter)
      await pool.query('DELETE FROM events WHERE promoter_id = $1', [promoterId]);
      
      // Delete promoter record
      await pool.query('DELETE FROM promoters WHERE id = $1', [promoterId]);
    }

    // Delete steward-related data
    if (stewardId) {
      // Delete steward claims first
      await pool.query(
        'DELETE FROM steward_claims WHERE steward_listing_id IN (SELECT id FROM steward_listings WHERE steward_id = $1)',
        [stewardId]
      );
      
      // Delete steward listings
      await pool.query('DELETE FROM steward_listings WHERE steward_id = $1', [stewardId]);
      
      // Delete steward record
      await pool.query('DELETE FROM stewards WHERE id = $1', [stewardId]);
    }

    // Delete notifications
    await pool.query('DELETE FROM notifications WHERE user_email = $1', [user.email]);

    // Delete favorites
    await pool.query('DELETE FROM favorites WHERE user_email = $1', [user.email]);

    // Delete orders where user is buyer
    await pool.query('DELETE FROM orders WHERE buyer_email = $1', [user.email]);

    // Delete member record if exists
    if (memberId) {
      await pool.query('DELETE FROM fraternity_members WHERE id = $1', [memberId]);
    }

    // Finally, delete the user record
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account', details: error.message });
  }
});

export default router;

