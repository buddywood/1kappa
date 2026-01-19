import { createSeller, getSellerById, updateSeller, updateSellerStatus, getMemberByEmail } from '../db/queries-sequelize';
import { stripe } from './stripe';
import { Seller as SellerType } from '../types';

export interface SellerApplicationData {
  email: string;
  name: string;
  sponsoring_chapter_id: number;
  business_name?: string | null;
  business_email?: string | null;
  kappa_vendor_id?: string | null;
  merchandise_type?: string | null;
  website?: string | null;
  slug?: string | null;
  headshot_url?: string;
  store_logo_url?: string;
  social_links?: Record<string, string>;
}

/**
 * Submit a new seller application
 */
export async function submitApplication(
  data: SellerApplicationData,
  userId?: number | null
): Promise<SellerType> {
  const seller = await createSeller({
    user_id: userId || null,
    email: data.email,
    name: data.name,
    sponsoring_chapter_id: data.sponsoring_chapter_id,
    business_name: data.business_name || null,
    business_email: data.business_email || null,
    kappa_vendor_id: data.kappa_vendor_id || null,
    merchandise_type: data.merchandise_type || null,
    website: data.website || null,
    slug: data.slug || null,
    headshot_url: data.headshot_url,
    store_logo_url: data.store_logo_url,
    social_links: data.social_links || {},
  });

  return seller;
}

/**
 * Process auto-approval for a seller if they meet the criteria
 * Returns true if auto-approved, false otherwise
 */
export async function processAutoApproval(
  seller: SellerType,
  memberId: number | null
): Promise<{ approved: boolean; reason?: string }> {
  // Check if seller has a valid Kappa vendor ID
  if (!seller.kappa_vendor_id) {
    return { approved: false, reason: 'No Kappa vendor ID provided' };
  }

  // Check if seller is a verified fraternity member
  if (!memberId) {
    return { approved: false, reason: 'Not a verified fraternity member' };
  }

  // Auto-approve the seller
  await updateSellerStatus(seller.id, 'APPROVED');

  return { approved: true };
}

/**
 * Get seller metrics for dashboard
 */
export async function getSellerDashboardMetrics(sellerId: number): Promise<{
  total_sales_cents: number;
  total_orders: number;
  active_products: number;
  pending_orders: number;
}> {
  const { getSellerMetrics } = await import('../db/queries-sequelize');
  const metrics = await getSellerMetrics(sellerId);

  return {
    ...metrics,
    pending_orders: 0, // TODO: Add pending orders count
  };
}

/**
 * Validate Stripe account setup for a seller
 */
export async function validateStripeSetup(
  stripeAccountId: string | null
): Promise<{
  valid: boolean;
  chargesEnabled: boolean;
  transfersEnabled: boolean;
  detailsSubmitted: boolean;
  error?: string;
}> {
  if (!stripeAccountId) {
    return {
      valid: false,
      chargesEnabled: false,
      transfersEnabled: false,
      detailsSubmitted: false,
      error: 'No Stripe account ID',
    };
  }

  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);

    const transfersCapability = account.capabilities?.transfers as any;
    const transfersEnabled = transfersCapability?.status === 'active';
    const chargesEnabled = account.charges_enabled === true;
    const detailsSubmitted = account.details_submitted === true;

    return {
      valid: chargesEnabled && transfersEnabled,
      chargesEnabled,
      transfersEnabled,
      detailsSubmitted,
    };
  } catch (error: any) {
    if (
      error?.code === 'resource_missing' ||
      error?.statusCode === 404 ||
      error?.type === 'StripeInvalidRequestError'
    ) {
      return {
        valid: false,
        chargesEnabled: false,
        transfersEnabled: false,
        detailsSubmitted: false,
        error: 'Stripe account not found',
      };
    }
    throw error;
  }
}

/**
 * Check if seller can accept payments
 */
export async function canAcceptPayments(sellerId: number): Promise<{
  canAccept: boolean;
  reason?: string;
}> {
  const seller = await getSellerById(sellerId);

  if (!seller) {
    return { canAccept: false, reason: 'Seller not found' };
  }

  if (seller.status !== 'APPROVED') {
    return { canAccept: false, reason: 'Seller not approved' };
  }

  if (!seller.stripe_account_id) {
    return { canAccept: false, reason: 'Stripe account not connected' };
  }

  const stripeStatus = await validateStripeSetup(seller.stripe_account_id);

  if (!stripeStatus.valid) {
    return {
      canAccept: false,
      reason: stripeStatus.error || 'Stripe account not ready',
    };
  }

  return { canAccept: true };
}

/**
 * Get seller profile with enriched data
 */
export async function getSellerProfile(sellerId: number): Promise<
  | (SellerType & {
      member?: any;
      stripeStatus?: {
        valid: boolean;
        chargesEnabled: boolean;
        transfersEnabled: boolean;
      };
    })
  | null
> {
  const seller = await getSellerById(sellerId);

  if (!seller) {
    return null;
  }

  // Get associated fraternity member
  const member = await getMemberByEmail(seller.email);

  // Get Stripe status
  let stripeStatus;
  if (seller.stripe_account_id) {
    stripeStatus = await validateStripeSetup(seller.stripe_account_id);
  }

  return {
    ...seller,
    member: member || undefined,
    stripeStatus,
  };
}
