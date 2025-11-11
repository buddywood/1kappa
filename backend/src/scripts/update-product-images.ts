import pool from '../db/connection';
import { uploadToS3 } from '../services/s3';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

/**
 * Update product images
 * 
 * Usage:
 * 1. Update with local files:
 *    npx tsx src/scripts/update-product-images.ts --file <product-id> <path-to-image>
 * 
 * 2. Update with URL:
 *    npx tsx src/scripts/update-product-images.ts --url <product-id> <image-url>
 * 
 * 3. List all products:
 *    npx tsx src/scripts/update-product-images.ts --list
 * 
 * 4. Update multiple products from a mapping file:
 *    npx tsx src/scripts/update-product-images.ts --batch <path-to-json>
 * 
 * Example batch JSON format:
 * [
 *   { "id": 1, "image_url": "https://example.com/image1.jpg" },
 *   { "id": 2, "image_path": "./images/product2.jpg" }
 * ]
 */

interface Product {
  id: number;
  name: string;
  image_url: string | null;
  seller_id: number;
}

async function listProducts(): Promise<void> {
  const result = await pool.query(
    `SELECT p.id, p.name, p.image_url, s.name as seller_name
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     ORDER BY p.id`
  );

  console.log('\n📦 Products in database:\n');
  console.log('ID | Name | Current Image URL');
  console.log('---|------|------------------');
  
  result.rows.forEach((product: any) => {
    const imagePreview = product.image_url 
      ? (product.image_url.length > 50 ? product.image_url.substring(0, 50) + '...' : product.image_url)
      : '(no image)';
    console.log(`${product.id} | ${product.name} | ${imagePreview}`);
  });
  
  console.log(`\nTotal: ${result.rows.length} products\n`);
}

async function updateProductWithFile(productId: number, imagePath: string): Promise<void> {
  try {
    console.log(`\n📤 Uploading image for product ${productId}...`);
    
    // Read the file
    const fullPath = join(process.cwd(), imagePath);
    const fileBuffer = readFileSync(fullPath);
    
    // Determine content type from file extension
    const ext = imagePath.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    const contentType = contentTypeMap[ext || ''] || 'image/jpeg';
    
    // Get original filename
    const filename = imagePath.split('/').pop() || `product-${productId}.${ext}`;
    
    // Upload to S3
    const uploadResult = await uploadToS3(
      fileBuffer,
      filename,
      contentType,
      'products'
    );
    
    console.log(`✅ Image uploaded to S3: ${uploadResult.url}`);
    
    // Update database
    await pool.query(
      'UPDATE products SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [uploadResult.url, productId]
    );
    
    console.log(`✅ Product ${productId} image updated successfully!`);
  } catch (error: any) {
    console.error(`❌ Error updating product ${productId}:`, error.message);
    throw error;
  }
}

async function updateProductWithUrl(productId: number, imageUrl: string): Promise<void> {
  try {
    console.log(`\n🔄 Updating product ${productId} with URL...`);
    
    // Update database
    const result = await pool.query(
      'UPDATE products SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING name',
      [imageUrl, productId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Product with id ${productId} not found`);
    }
    
    console.log(`✅ Product "${result.rows[0].name}" (ID: ${productId}) image updated to: ${imageUrl}`);
  } catch (error: any) {
    console.error(`❌ Error updating product ${productId}:`, error.message);
    throw error;
  }
}

async function batchUpdate(mappingFile: string): Promise<void> {
  try {
    const fullPath = join(process.cwd(), mappingFile);
    const fileContent = readFileSync(fullPath, 'utf-8');
    const mappings = JSON.parse(fileContent);
    
    if (!Array.isArray(mappings)) {
      throw new Error('Mapping file must contain an array of objects');
    }
    
    console.log(`\n📦 Processing ${mappings.length} product updates...\n`);
    
    for (const mapping of mappings) {
      if (!mapping.id) {
        console.warn('⚠️  Skipping entry without id:', mapping);
        continue;
      }
      
      if (mapping.image_url) {
        await updateProductWithUrl(mapping.id, mapping.image_url);
      } else if (mapping.image_path) {
        await updateProductWithFile(mapping.id, mapping.image_path);
      } else {
        console.warn(`⚠️  Skipping product ${mapping.id}: no image_url or image_path provided`);
      }
    }
    
    console.log('\n✅ Batch update completed!');
  } catch (error: any) {
    console.error('❌ Error in batch update:', error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--list' || args[0] === '-l') {
    await listProducts();
    await pool.end();
    return;
  }
  
  if (args[0] === '--batch' || args[0] === '-b') {
    if (args.length < 2) {
      console.error('❌ Error: Please provide a path to the mapping JSON file');
      console.error('Usage: npx tsx src/scripts/update-product-images.ts --batch <path-to-json>');
      process.exit(1);
    }
    await batchUpdate(args[1]);
    await pool.end();
    return;
  }
  
  if (args[0] === '--file' || args[0] === '-f') {
    if (args.length < 3) {
      console.error('❌ Error: Please provide product ID and image path');
      console.error('Usage: npx tsx src/scripts/update-product-images.ts --file <product-id> <path-to-image>');
      process.exit(1);
    }
    const productId = parseInt(args[1]);
    const imagePath = args[2];
    await updateProductWithFile(productId, imagePath);
    await pool.end();
    return;
  }
  
  if (args[0] === '--url' || args[0] === '-u') {
    if (args.length < 3) {
      console.error('❌ Error: Please provide product ID and image URL');
      console.error('Usage: npx tsx src/scripts/update-product-images.ts --url <product-id> <image-url>');
      process.exit(1);
    }
    const productId = parseInt(args[1]);
    const imageUrl = args[2];
    await updateProductWithUrl(productId, imageUrl);
    await pool.end();
    return;
  }
  
  console.error('❌ Invalid command. Available options:');
  console.error('  --list, -l              List all products');
  console.error('  --file, -f <id> <path>  Update product with local image file');
  console.error('  --url, -u <id> <url>    Update product with image URL');
  console.error('  --batch, -b <json>      Batch update from JSON file');
  process.exit(1);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


