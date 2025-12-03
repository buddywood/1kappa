import sequelize from '../../db/sequelize';
import pool from '../../db/connection';
import { initializeDatabase } from '../../db/migrations';
import {
  Chapter,
  FraternityMember,
  Seller,
  Product,
  ProductCategory,
  User,
  Order,
  Promoter,
  Event,
  Steward,
  StewardListing,
  Industry,
  Profession
} from '../../db/models';

/**
 * Test database setup and teardown helpers
 * Uses DATABASE_URL_TEST if available, otherwise falls back to DATABASE_URL
 */

const TEST_DB_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

if (!TEST_DB_URL) {
  throw new Error('DATABASE_URL_TEST or DATABASE_URL must be set for tests');
}

/**
 * Setup test database: run migrations and optionally seed test data
 */
export async function setupTestDatabase(seedData: boolean = true): Promise<void> {
  // Ensure database is initialized
  await initializeDatabase();
  
  // Sync Sequelize models (creates tables if they don't exist)
  // Use force: false to avoid dropping existing tables
  // Use alter: true to update table structure if needed
  try {
    await sequelize.sync({ force: false, alter: true });
  } catch (syncError: any) {
    // If alter fails, try without alter (tables might already be correct)
    console.warn('Alter sync failed, trying without alter:', syncError.message);
    await sequelize.sync({ force: false, alter: false });
  }
  
  if (seedData) {
    await seedTestData();
  }
}

/**
 * Teardown test database: clean all test data
 */
export async function teardownTestDatabase(): Promise<void> {
  // Truncate all tables in reverse dependency order
  // Use CASCADE to handle foreign key constraints
  const tables = [
    'steward_claims',
    'steward_listing_images',
    'steward_listings',
    'favorites',
    'notifications',
    'user_addresses',
    'orders',
    'product_images',
    'product_attribute_values',
    'products',
    'category_attribute_definitions',
    'product_categories',
    'events',
    'users',
    'stewards',
    'promoters',
    'sellers',
    'fraternity_members',
    'chapters',
    'industries',
    'professions',
    'event_types',
    'event_audience_types',
    'roles',
    'platform_settings'
  ];
  
  // Disable foreign key checks temporarily
  await pool.query('SET session_replication_role = replica;');
  
  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE;`);
    } catch (error: any) {
      // Ignore errors for tables that don't exist
      if (!error.message.includes('does not exist')) {
        console.warn(`Warning: Could not truncate ${table}:`, error.message);
      }
    }
  }
  
  // Re-enable foreign key checks
  await pool.query('SET session_replication_role = DEFAULT;');
}

/**
 * Seed test data for integration and parity tests
 */
export async function seedTestData(): Promise<void> {
  // Create test chapters
  const chapter1 = await Chapter.create({
    name: 'Alpha Chapter',
    type: 'Collegiate',
    status: 'Active',
    chartered: 1911,
    city: 'Bloomington',
    state: 'IN'
  });
  
  const chapter2 = await Chapter.create({
    name: 'Beta Chapter',
    type: 'Collegiate',
    status: 'Active',
    chartered: 1912,
    city: 'Chicago',
    state: 'IL'
  });
  
  // Create test industries
  const industry1 = await Industry.create({
    name: 'Technology',
    display_order: 1,
    is_active: true
  });
  
  // Create test professions
  const profession1 = await Profession.create({
    name: 'Software Engineer',
    display_order: 1,
    is_active: true
  });
  
  // Create test fraternity members
  const member1 = await FraternityMember.create({
    email: 'test.member@example.com',
    name: 'Test Member',
    membership_number: 'TEST001',
    cognito_sub: 'test-cognito-sub-1',
    registration_status: 'COMPLETE',
    initiated_chapter_id: chapter1.id,
    initiated_season: 'Fall',
    initiated_year: 2020,
    verification_status: 'VERIFIED',
    profession_id: profession1.id
  });
  
  const member2 = await FraternityMember.create({
    email: 'test.member2@example.com',
    name: 'Test Member 2',
    membership_number: 'TEST002',
    cognito_sub: 'test-cognito-sub-2',
    registration_status: 'COMPLETE',
    initiated_chapter_id: chapter2.id,
    initiated_season: 'Spring',
    initiated_year: 2021,
    verification_status: 'VERIFIED'
  });
  
  // Create test sellers (fraternity_member relationship via email matching)
  const seller1 = await Seller.create({
    email: 'test.seller@example.com',
    name: 'Test Seller',
    sponsoring_chapter_id: chapter1.id,
    business_name: 'Test Business',
    kappa_vendor_id: 'VENDOR001',
    status: 'APPROVED',
    verification_status: 'VERIFIED'
  });
  
  // Create test product category (use findOrCreate to avoid unique constraint errors)
  const [category1] = await ProductCategory.findOrCreate({
    where: { name: 'Apparel' },
    defaults: {
      name: 'Apparel',
      display_order: 1
    }
  });
  
  // Create test products
  const product1 = await Product.create({
    seller_id: seller1.id,
    name: 'Test Product',
    description: 'A test product',
    price_cents: 5000,
    category_id: category1.id,
    is_kappa_branded: true
  });
  
  // Create test users (fraternity_member relationship via email/cognito_sub matching)
  const user1 = await User.create({
    cognito_sub: 'test-cognito-sub-1',
    email: 'test.user@example.com',
    role: 'GUEST',
    onboarding_status: 'ONBOARDING_FINISHED'
  });
  
  const user2 = await User.create({
    cognito_sub: 'test-cognito-sub-seller',
    email: 'test.seller@example.com',
    role: 'SELLER',
    onboarding_status: 'ONBOARDING_FINISHED',
    seller_id: seller1.id
  });
  
  // Create test promoter (fraternity_member relationship via email matching)
  const promoter1 = await Promoter.create({
    email: 'test.promoter@example.com',
    name: 'Test Promoter',
    sponsoring_chapter_id: chapter1.id,
    status: 'APPROVED',
    verification_status: 'VERIFIED'
  });
  
  // Create test steward (fraternity_member relationship via users table -> email/cognito_sub)
  const steward1 = await Steward.create({
    sponsoring_chapter_id: chapter1.id,
    status: 'APPROVED',
    verification_status: 'VERIFIED'
  });
  
  // Create test steward listing
  const listing1 = await StewardListing.create({
    steward_id: steward1.id,
    name: 'Test Listing',
    description: 'A test steward listing',
    shipping_cost_cents: 500,
    chapter_donation_cents: 1000,
    sponsoring_chapter_id: chapter1.id,
    status: 'ACTIVE'
  });
  
  // Create test order
  const order1 = await Order.create({
    product_id: product1.id,
    user_id: user1.id,
    amount_cents: 5000,
    status: 'PAID',
    chapter_id: chapter1.id
  });
  
  // Store test data IDs for use in tests
  (global as any).testData = {
    chapter1: chapter1.toJSON(),
    chapter2: chapter2.toJSON(),
    member1: member1.toJSON(),
    member2: member2.toJSON(),
    seller1: seller1.toJSON(),
    product1: product1.toJSON(),
    category1: category1.toJSON(),
    user1: user1.toJSON(),
    user2: user2.toJSON(),
    promoter1: promoter1.toJSON(),
    steward1: steward1.toJSON(),
    listing1: listing1.toJSON(),
    order1: order1.toJSON(),
    industry1: industry1.toJSON(),
    profession1: profession1.toJSON()
  };
}

/**
 * Get test data that was seeded
 */
export function getTestData(): any {
  return (global as any).testData || {};
}

/**
 * Close database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  await sequelize.close();
  await pool.end();
}

