/**
 * Script to enable transfers capability on existing Stripe Connect accounts
 * 
 * This script finds all sellers with Stripe account IDs and ensures
 * they have the transfers capability enabled (required for receiving payments).
 * 
 * Usage: tsx src/scripts/enable-stripe-capabilities.ts
 */

import pool from '../db/connection';
import { enableTransfersCapability, stripe } from '../services/stripe';

async function enableCapabilities() {
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

  let successCount = 0;
  let errorCount = 0;

  // Enable capabilities for each account
  for (const seller of sellers) {
    try {
      console.log(`Checking seller ${seller.id} (${seller.name}) - ${seller.stripe_account_id}...`);
      
      // Check current account status
      const account = await stripe.accounts.retrieve(seller.stripe_account_id);
      const transfersStatus = account.capabilities?.transfers?.status;
      
      if (transfersStatus === 'active') {
        console.log(`  ✅ Transfers capability already active`);
        successCount++;
        continue;
      }
      
      if (transfersStatus === 'pending') {
        console.log(`  ⏳ Transfers capability is pending (needs onboarding)`);
        continue;
      }
      
      // Try to enable the capability
      console.log(`  🔧 Enabling transfers capability...`);
      await enableTransfersCapability(seller.stripe_account_id);
      console.log(`  ✅ Successfully enabled transfers capability`);
      successCount++;
    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${sellers.length}\n`);

  if (errorCount === 0) {
    console.log('✅ All capabilities enabled successfully!');
  } else {
    console.log('⚠️  Some accounts may need manual onboarding to enable capabilities.');
  }

  process.exit(0);
}

// Run the script
enableCapabilities().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

