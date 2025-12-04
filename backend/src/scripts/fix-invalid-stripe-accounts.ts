/**
 * Script to find sellers with invalid Stripe account IDs and create real test accounts for them
 * 
 * This script:
 * 1. Finds sellers with Stripe account IDs that don't exist in Stripe
 * 2. Creates real test Stripe Connect accounts for them
 * 3. Updates the database with the real account IDs
 * 
 * Usage: tsx src/scripts/fix-invalid-stripe-accounts.ts
 */

import pool from '../db/connection';
import { createConnectAccount, getStripeAccountBusinessDetails, enableTransfersCapability } from '../services/stripe';

async function fixInvalidStripeAccounts() {
  console.log('🔍 Finding sellers with Stripe account IDs...\n');

  // Get all sellers with Stripe account IDs
  const sellersResult = await pool.query(
    `SELECT id, email, name, stripe_account_id, status 
     FROM sellers 
     WHERE stripe_account_id IS NOT NULL 
     ORDER BY id`
  );

  const sellers = sellersResult.rows;
  console.log(`Found ${sellers.length} sellers with Stripe account IDs\n`);

  const invalidAccounts: Array<{ id: number; email: string; name: string; stripe_account_id: string }> = [];
  const validAccounts: Array<{ id: number; email: string; name: string; stripe_account_id: string }> = [];

  // Check each account
  for (const seller of sellers) {
    try {
      await getStripeAccountBusinessDetails(seller.stripe_account_id);
      validAccounts.push(seller);
      console.log(`✅ Valid: Seller ${seller.id} (${seller.name}) - ${seller.stripe_account_id}`);
    } catch (error: any) {
      // Check for various error types that indicate account doesn't exist or isn't accessible
      const isInvalidAccount = 
        error?.code === 'resource_missing' || 
        error?.statusCode === 404 || 
        error?.type === 'StripeInvalidRequestError' ||
        error?.message?.includes('does not have access to account') ||
        error?.message?.includes('does not exist') ||
        error?.message?.includes('Application access may have been revoked');
      
      if (isInvalidAccount) {
        invalidAccounts.push(seller);
        console.log(`❌ Invalid: Seller ${seller.id} (${seller.name}) - ${seller.stripe_account_id}`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.error(`⚠️  Error checking seller ${seller.id}:`, error.message);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Valid accounts: ${validAccounts.length}`);
  console.log(`   Invalid accounts: ${invalidAccounts.length}\n`);

  if (invalidAccounts.length === 0) {
    console.log('✅ All Stripe accounts are valid!');
    process.exit(0);
  }

  console.log(`\n🔧 Creating real test Stripe accounts for ${invalidAccounts.length} sellers...\n`);

  // Create real test accounts for invalid ones
  for (const seller of invalidAccounts) {
    try {
      console.log(`Creating Stripe account for seller ${seller.id} (${seller.email})...`);
      const account = await createConnectAccount(seller.email, 'US');
      
      // Update database with real account ID
      await pool.query(
        'UPDATE sellers SET stripe_account_id = $1 WHERE id = $2',
        [account.id, seller.id]
      );

      console.log(`  ✅ Created and updated: ${account.id}`);
      
      // Enable transfers capability for test accounts
      try {
        await enableTransfersCapability(account.id);
        console.log(`  ✅ Enabled transfers capability`);
      } catch (capError: any) {
        console.warn(`  ⚠️  Could not enable transfers capability: ${capError.message}`);
        console.warn(`     This may need to be done manually or through onboarding`);
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to create account for seller ${seller.id}:`, error.message);
      
      // Clear invalid account ID if we can't create a new one
      try {
        await pool.query(
          'UPDATE sellers SET stripe_account_id = NULL WHERE id = $1',
          [seller.id]
        );
        console.log(`  🧹 Cleared invalid account ID from database`);
      } catch (dbError) {
        console.error(`  ❌ Failed to clear account ID from database:`, dbError);
      }
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

// Run the script
fixInvalidStripeAccounts().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

