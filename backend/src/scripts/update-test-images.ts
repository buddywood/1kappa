/**
 * Script to update test products and events to use real S3 images
 * instead of Unsplash placeholder URLs
 */

import pool from "../db/connection";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "1kappa-uploads";

// Real product images available in S3
const PRODUCT_IMAGES = [
  "products/415f672f-be3e-49c3-9bae-1213f1e2a7ab-sample_merch1.png",
  "products/2adf45a0-1908-4558-b1a9-876859099084-sample_merch2.png",
  "products/364752d7-3cf6-413c-a1c3-83c3feb960c2-sample_merch3.png",
  "products/21fc876b-3112-4053-b797-c25b1be0ed0b-sample_merch4.png",
  "products/778772a1-9394-442c-b699-743b171a2341-sample_merch5.png",
  "products/4df62c41-fb96-45f1-bd10-58bfc2993d1a-kappashirt1a.png",
  "products/bc23755b-3c89-43a8-a679-299d6f2cb17f-kappashirt1b.png",
  "products/8d9c7579-f998-416c-b843-1c3b3b3a211d-kappa-cigar1b.png",
  "products/d1c87439-5397-46bd-bf6a-b26916d91fc1-kappa-cigar1a.png",
];

// Real event images available in S3
const EVENT_IMAGES = [
  "events/108e9cbe-981d-479e-a917-bd47a9749dcc-kevDaBarber.png",
];

function getS3Url(key: string): string {
  return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

async function updateProductImages() {
  console.log("\n📦 Updating product images...");
  
  // Get all products with Unsplash URLs
  const result = await pool.query(
    `SELECT id, name, image_url 
     FROM products 
     WHERE image_url LIKE '%unsplash.com%' 
     ORDER BY id`
  );

  console.log(`Found ${result.rows.length} products with Unsplash images`);

  let updated = 0;
  for (let i = 0; i < result.rows.length; i++) {
    const product = result.rows[i];
    const imageKey = PRODUCT_IMAGES[i % PRODUCT_IMAGES.length];
    const newImageUrl = getS3Url(imageKey);

    await pool.query(
      `UPDATE products 
       SET image_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [newImageUrl, product.id]
    );

    console.log(`  ✅ Updated "${product.name}" (ID: ${product.id})`);
    console.log(`     Old: ${product.image_url.substring(0, 60)}...`);
    console.log(`     New: ${newImageUrl}`);
    updated++;
  }

  console.log(`\n✅ Updated ${updated} product images\n`);
  return updated;
}

async function updateEventImages() {
  console.log("\n📅 Updating event images...");
  
  // Get all events with Unsplash URLs
  const result = await pool.query(
    `SELECT id, title, image_url 
     FROM events 
     WHERE image_url LIKE '%unsplash.com%' 
     ORDER BY id`
  );

  console.log(`Found ${result.rows.length} events with Unsplash images`);

  let updated = 0;
  for (let i = 0; i < result.rows.length; i++) {
    const event = result.rows[i];
    // Cycle through available event images, or use the first one if only one exists
    const imageKey = EVENT_IMAGES[i % EVENT_IMAGES.length];
    const newImageUrl = getS3Url(imageKey);

    await pool.query(
      `UPDATE events 
       SET image_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [newImageUrl, event.id]
    );

    console.log(`  ✅ Updated "${event.title}" (ID: ${event.id})`);
    console.log(`     Old: ${event.image_url.substring(0, 60)}...`);
    console.log(`     New: ${newImageUrl}`);
    updated++;
  }

  console.log(`\n✅ Updated ${updated} event images\n`);
  return updated;
}

async function main() {
  try {
    console.log("🔄 Updating test data to use real S3 images...\n");
    console.log(`Using bucket: ${BUCKET_NAME}`);
    console.log(`Using region: ${AWS_REGION}\n`);

    const productsUpdated = await updateProductImages();
    const eventsUpdated = await updateEventImages();

    console.log("\n" + "=".repeat(60));
    console.log("✨ Summary:");
    console.log(`   Products updated: ${productsUpdated}`);
    console.log(`   Events updated: ${eventsUpdated}`);
    console.log("=".repeat(60) + "\n");

    console.log("💡 Note: If you need more event images, upload them to S3:");
    console.log(`   aws s3 cp <image-file> s3://${BUCKET_NAME}/events/ --profile buddy@ebilly.com\n`);
  } catch (error) {
    console.error("❌ Error updating images:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

