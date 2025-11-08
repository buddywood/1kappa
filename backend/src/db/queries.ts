import pool from './connection';
import { Chapter, Seller, Product, Order } from '../types';

// Chapter queries
export async function getAllChapters(): Promise<Chapter[]> {
  const result = await pool.query('SELECT * FROM chapters ORDER BY name');
  return result.rows;
}

export async function getChapterById(id: number): Promise<Chapter | null> {
  const result = await pool.query('SELECT * FROM chapters WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Seller queries
export async function createSeller(seller: {
  email: string;
  name: string;
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id?: number;
  headshot_url?: string;
  social_links?: Record<string, string>;
}): Promise<Seller> {
  const result = await pool.query(
    `INSERT INTO sellers (email, name, membership_number, initiated_chapter_id, sponsoring_chapter_id, headshot_url, social_links, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
     RETURNING *`,
    [
      seller.email,
      seller.name,
      seller.membership_number,
      seller.initiated_chapter_id,
      seller.sponsoring_chapter_id || null,
      seller.headshot_url || null,
      JSON.stringify(seller.social_links || {}),
    ]
  );
  return result.rows[0];
}

export async function getSellerById(id: number): Promise<Seller | null> {
  const result = await pool.query('SELECT * FROM sellers WHERE id = $1', [id]);
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0] || null;
}

export async function getSellerByEmail(email: string): Promise<Seller | null> {
  const result = await pool.query('SELECT * FROM sellers WHERE email = $1', [email]);
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0] || null;
}

export async function getPendingSellers(): Promise<Seller[]> {
  const result = await pool.query(
    'SELECT * FROM sellers WHERE status = $1 ORDER BY created_at DESC',
    ['PENDING']
  );
  return result.rows.map(row => ({
    ...row,
    social_links: typeof row.social_links === 'string' ? JSON.parse(row.social_links) : row.social_links,
  }));
}

export async function updateSellerStatus(
  id: number,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  stripe_account_id?: string
): Promise<Seller> {
  const updates: string[] = ['status = $2'];
  const values: any[] = [id, status];
  
  if (stripe_account_id) {
    updates.push('stripe_account_id = $3');
    values.push(stripe_account_id);
  }
  
  const result = await pool.query(
    `UPDATE sellers SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  if (result.rows[0]) {
    result.rows[0].social_links = typeof result.rows[0].social_links === 'string' 
      ? JSON.parse(result.rows[0].social_links) 
      : result.rows[0].social_links;
  }
  return result.rows[0];
}

// Product queries
export async function createProduct(product: {
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  sponsored_chapter_id?: number;
}): Promise<Product> {
  const result = await pool.query(
    `INSERT INTO products (seller_id, name, description, price_cents, image_url, sponsored_chapter_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      product.seller_id,
      product.name,
      product.description,
      product.price_cents,
      product.image_url || null,
      product.sponsored_chapter_id || null,
    ]
  );
  return result.rows[0];
}

export async function getProductById(id: number): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getActiveProducts(): Promise<Product[]> {
  const result = await pool.query(
    `SELECT p.*, s.name as seller_name, s.status as seller_status
     FROM products p
     JOIN sellers s ON p.seller_id = s.id
     WHERE s.status = 'APPROVED'
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

export async function getProductsBySeller(sellerId: number): Promise<Product[]> {
  const result = await pool.query(
    'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
    [sellerId]
  );
  return result.rows;
}

// Order queries
export async function createOrder(order: {
  product_id: number;
  buyer_email: string;
  amount_cents: number;
  stripe_session_id: string;
  chapter_id?: number;
}): Promise<Order> {
  const result = await pool.query(
    `INSERT INTO orders (product_id, buyer_email, amount_cents, stripe_session_id, chapter_id, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING *`,
    [
      order.product_id,
      order.buyer_email,
      order.amount_cents,
      order.stripe_session_id,
      order.chapter_id || null,
    ]
  );
  return result.rows[0];
}

export async function getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | null> {
  const result = await pool.query(
    'SELECT * FROM orders WHERE stripe_session_id = $1',
    [stripeSessionId]
  );
  return result.rows[0] || null;
}

export async function updateOrderStatus(
  id: number,
  status: 'PENDING' | 'PAID' | 'FAILED'
): Promise<Order> {
  const result = await pool.query(
    'UPDATE orders SET status = $2 WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0];
}

export async function getAllOrders(): Promise<Order[]> {
  const result = await pool.query(
    `SELECT o.*, p.name as product_name, s.name as seller_name, c.name as chapter_name
     FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN chapters c ON o.chapter_id = c.id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

export async function getChapterDonations(): Promise<Array<{ chapter_id: number; chapter_name: string; total_donations_cents: number }>> {
  const result = await pool.query(
    `SELECT 
       o.chapter_id,
       c.name as chapter_name,
       SUM(o.amount_cents * 0.03) as total_donations_cents
     FROM orders o
     LEFT JOIN chapters c ON o.chapter_id = c.id
     WHERE o.status = 'PAID' AND o.chapter_id IS NOT NULL
     GROUP BY o.chapter_id, c.name
     ORDER BY total_donations_cents DESC`
  );
  return result.rows;
}

