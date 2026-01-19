import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  getStewardListingById,
  createStewardClaim,
  getStewardClaimByStripeSessionId,
  updateStewardClaimStatus,
  getPlatformSetting,
  getChapterById,
  getStewardById
} from '../db/queries-sequelize';
import { createStewardCheckoutSession, calculateStewardPlatformFee } from '../services/stripe';
import { authenticate, requireVerifiedMember } from '../middleware/auth';
import { getFraternityMemberIdFromRequest } from '../utils/getFraternityMemberId';
import { z } from 'zod';
import pool from '../db/connection';

const router: ExpressRouter = Router();

// Create checkout session for claiming a steward listing
router.post('/:listingId', authenticate, requireVerifiedMember, async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    if (!req.user) {
      client.release();
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fraternityMemberId = await getFraternityMemberIdFromRequest(req);
    if (!fraternityMemberId) {
      client.release();
      return res.status(403).json({ error: 'Member profile required' });
    }

    const listingId = parseInt(req.params.listingId);
    if (isNaN(listingId)) {
      client.release();
      return res.status(400).json({ error: 'Invalid listing ID' });
    }

    // Start transaction with row-level lock to prevent race conditions
    await client.query('BEGIN');

    // Lock the listing row to prevent concurrent claims
    const listingResult = await client.query(
      'SELECT * FROM steward_listings WHERE id = $1 FOR UPDATE',
      [listingId]
    );

    const listing = listingResult.rows[0];

    if (!listing) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'ACTIVE' && listing.status !== 'CLAIMED') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'Listing is not available for claiming' });
    }

    // Get chapter to check for Stripe account
    const chapter = await getChapterById(listing.sponsoring_chapter_id);
    if (!chapter) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Chapter not found' });
    }

    if (!chapter.stripe_account_id) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'Chapter Stripe account not set up. Please contact admin.' });
    }

    // Get steward to check for Stripe account
    const steward = await getStewardById(listing.steward_id);
    if (!steward) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Steward not found' });
    }

    if (!steward.stripe_account_id) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'Steward Stripe account not set up. Please contact admin.' });
    }

    // Calculate platform fee
    const platformFeeCents = await calculateStewardPlatformFee(
      listing.shipping_cost_cents,
      listing.chapter_donation_cents
    );

    const totalAmountCents = listing.shipping_cost_cents + platformFeeCents + listing.chapter_donation_cents;

    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await createStewardCheckoutSession({
      listingId: listing.id,
      listingName: listing.name,
      shippingCents: listing.shipping_cost_cents,
      platformFeeCents,
      chapterDonationCents: listing.chapter_donation_cents,
      chapterStripeAccountId: chapter.stripe_account_id,
      stewardStripeAccountId: steward.stripe_account_id,
      buyerEmail: req.user.email,
      successUrl: `${frontendUrl}/steward-checkout/${listingId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/steward-listing/${listingId}`,
    });

    // Create claim record within the transaction
    await client.query(
      `INSERT INTO steward_claims (listing_id, claimant_fraternity_member_id, stripe_session_id, total_amount_cents, shipping_cents, platform_fee_cents, chapter_donation_cents, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
      [listing.id, fraternityMemberId, session.id, totalAmountCents, listing.shipping_cost_cents, platformFeeCents, listing.chapter_donation_cents]
    );

    // Update listing status to CLAIMED within the transaction
    await client.query(
      'UPDATE steward_listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['CLAIMED', listingId]
    );

    // Commit the transaction
    await client.query('COMMIT');
    client.release();

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error creating steward checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Handle Stripe webhook for steward claims (similar to regular checkout)
// This would be added to the existing webhook handler

export default router;

