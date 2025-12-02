import pool from '../db/connection';
import { updateProduct } from '../db/queries-sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Product details based on images
const productDetails: Record<string, { name: string; description: string; price_cents: number }> = {
  'sample_merch1': {
    name: "Kappa Alpha Psi Satin Bomber Jacket",
    description: "Premium red satin bomber jacket with white snap buttons and white stripes on the cuffs and collar. Features large white embroidered Greek letters 'K A Ψ' on the left chest and a detailed circular fraternity crest on the right chest. Perfect for chapter events and formal occasions.",
    price_cents: 8500, // $85.00
  },
  'sample_merch2': {
    name: "Kappa Alpha Psi Knitted Cardigan",
    description: "Comfortable maroon knitted cardigan with cream-colored buttons and cream stripes on the cuffs and bottom hem. Features large cream Greek letters 'K A Ψ' knitted vertically on the left side and a detailed fraternity crest embroidered on the right chest. Perfect for casual chapter meetings and everyday wear.",
    price_cents: 6500, // $65.00
  },
  'sample_merch3': {
    name: "Kappa Alpha Psi Varsity Jacket",
    description: "Classic red and white varsity-style jacket with white snap buttons and white stripes on the cuffs and collar. Features large white embroidered Greek letters 'K A Ψ' on the left chest and a circular fraternity crest with 'Kappa Alpha Psi 1911 Fraternity, Inc.' on the right chest. A timeless piece for any brother.",
    price_cents: 9500, // $95.00
  },
  'sample_merch4': {
    name: "Kappa Alpha Psi Phone Case",
    description: "Stylish white and maroon striped phone case featuring the Greek letters 'K A Ψ' vertically in maroon. Compatible with most smartphone models. Durable protection with fraternity pride.",
    price_cents: 2500, // $25.00
  },
  'sample_merch5': {
    name: "Kappa Alpha Psi Sling Bag",
    description: "Practical maroon sling bag or crossbody bag with a single adjustable strap. Features a main zippered compartment and a smaller front zippered pocket. The fraternity crest is embroidered on the front pocket in gold, red, and white with 'KAPPA ALPHA PSI FRATERNITY INC.' text. Perfect for carrying essentials to chapter events.",
    price_cents: 4500, // $45.00
  },
};

// Mapping of product IDs to their images (based on the mappings we created)
const productImageMapping: Record<number, string> = {
  1: 'sample_merch1',
  2: 'sample_merch2',
  3: 'sample_merch3',
  4: 'sample_merch4',
  5: 'sample_merch5',
  6: 'sample_merch3',
  7: 'sample_merch1',
  8: 'sample_merch5',
  9: 'sample_merch2',
  10: 'sample_merch4',
  11: 'sample_merch1',
  12: 'sample_merch3',
  13: 'sample_merch5',
  14: 'sample_merch2',
  15: 'sample_merch4',
  16: 'sample_merch1',
};

async function updateAllProducts(): Promise<void> {
  console.log('🔄 Updating product details to match images...\n');

  let updated = 0;
  let skipped = 0;

  for (const [productIdStr, imageKey] of Object.entries(productImageMapping)) {
    const productId = parseInt(productIdStr);
    const details = productDetails[imageKey];

    if (!details) {
      console.warn(`⚠️  No details found for image key: ${imageKey} (Product ${productId})`);
      skipped++;
      continue;
    }

    try {
      const updatedProduct = await updateProduct(productId, {
        name: details.name,
        description: details.description,
        price_cents: details.price_cents,
      });

      if (updatedProduct) {
        console.log(`✅ Updated Product ${productId}: ${details.name}`);
        updated++;
      } else {
        console.warn(`⚠️  Product ${productId} not found`);
        skipped++;
      }
    } catch (error: any) {
      console.error(`❌ Error updating product ${productId}:`, error.message);
      skipped++;
    }
  }

  console.log('\n=== Update Summary ===');
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`📦 Total: ${updated + skipped}`);
}

updateAllProducts()
  .then(() => {
    pool.end();
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    pool.end();
    process.exit(1);
  });


