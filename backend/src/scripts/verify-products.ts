import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function verifyProducts() {
  const result = await pool.query(
    'SELECT id, name, price_cents, description FROM products ORDER BY id LIMIT 8'
  );
  
  console.log('\n📦 Product Details Verification:\n');
  result.rows.forEach((p: any) => {
    console.log(`ID ${p.id}: ${p.name}`);
    console.log(`  Price: $${(p.price_cents / 100).toFixed(2)}`);
    console.log(`  Description: ${p.description.substring(0, 100)}...`);
    console.log('');
  });
  
  await pool.end();
}

verifyProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

