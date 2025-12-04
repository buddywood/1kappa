/**
 * Quick script to list all sellers with Stripe account IDs
 */

import pool from '../db/connection';

async function listAccounts() {
  const result = await pool.query(
    `SELECT id, email, name, stripe_account_id 
     FROM sellers 
     WHERE stripe_account_id IS NOT NULL 
     ORDER BY id`
  );

  console.log('\n📋 Current Stripe Account IDs:\n');
  result.rows.forEach(seller => {
    console.log(`  Seller ${seller.id} (${seller.name})`);
    console.log(`    Email: ${seller.email}`);
    console.log(`    Account ID: ${seller.stripe_account_id}\n`);
  });

  process.exit(0);
}

listAccounts().catch(console.error);

