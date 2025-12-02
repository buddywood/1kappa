import pool from '../db/connection';
import { runMigrations } from '../db/migrations';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function testFreshMigration() {
  try {
    console.log('🧪 Testing fresh database migration from scratch...\n');

    const databaseUrl = process.env.DATABASE_URL || '';
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not set');
    }

    // Extract database name from URL
    const urlMatch = databaseUrl.match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)(\?|$)/);
    if (!urlMatch) {
      throw new Error('Could not parse DATABASE_URL');
    }
    const dbName = urlMatch[5];

    // Connect to postgres database to drop/create the target database
    const postgresUrl = databaseUrl.replace(`/${dbName}`, '/postgres');
    const adminPool = await import('pg').then(m => new m.Pool({ connectionString: postgresUrl }));

    console.log('1️⃣ Dropping existing database (if exists)...');
    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
      console.log(`   ✅ Dropped database: ${dbName}`);
    } catch (error: any) {
      if (error.code === '3D000') {
        console.log(`   ℹ️  Database ${dbName} does not exist (this is fine)`);
      } else {
        throw error;
      }
    }

    console.log('\n2️⃣ Creating fresh database...');
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`   ✅ Created database: ${dbName}`);
    await adminPool.end();

    // Wait a moment for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n3️⃣ Running migrations on fresh database...');
    await runMigrations();
    console.log('   ✅ Migrations completed');

    console.log('\n4️⃣ Verifying database schema...');
    
    // Check tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
      ORDER BY table_name
    `);
    console.log(`   Found ${tablesResult.rows.length} tables`);
    
    const tableNames = tablesResult.rows.map((r: any) => r.table_name);
    const keyTables = ['chapters', 'fraternity_members', 'sellers', 'promoters', 'stewards', 'users', 'notifications', 'favorites', 'user_addresses'];
    const missingTables = keyTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`   ❌ Missing tables: ${missingTables.join(', ')}`);
      process.exit(1);
    } else {
      console.log('   ✅ All key tables exist');
    }

    // Check column names
    console.log('\n5️⃣ Verifying column names...');
    
    const stewardsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' 
      AND column_name IN ('member_id', 'fraternity_member_id')
    `);
    const stewardsColNames = stewardsColumns.rows.map((r: any) => r.column_name);
    
    if (stewardsColNames.includes('member_id')) {
      console.log('   ❌ ERROR: stewards has member_id (should be fraternity_member_id)');
      process.exit(1);
    } else if (stewardsColNames.includes('fraternity_member_id')) {
      console.log('   ✅ stewards has fraternity_member_id (correct)');
    } else {
      console.log('   ❌ ERROR: stewards missing fraternity_member_id');
      process.exit(1);
    }

    const promotersColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' 
      AND column_name IN ('member_id', 'fraternity_member_id')
    `);
    const promotersColNames = promotersColumns.rows.map((r: any) => r.column_name);
    
    if (promotersColNames.includes('member_id')) {
      console.log('   ❌ ERROR: promoters has member_id (should be fraternity_member_id)');
      process.exit(1);
    } else if (promotersColNames.includes('fraternity_member_id')) {
      console.log('   ✅ promoters has fraternity_member_id (correct)');
    } else {
      console.log('   ❌ ERROR: promoters missing fraternity_member_id');
      process.exit(1);
    }

    // Check notifications table structure
    const notificationsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY column_name
    `);
    const expectedColumns = ['id', 'user_email', 'type', 'title', 'message', 'related_product_id', 'related_order_id', 'is_read', 'created_at', 'read_at'];
    const actualColumns = notificationsColumns.rows.map((r: any) => r.column_name);
    const missingColumns = expectedColumns.filter(c => !actualColumns.includes(c));
    
    if (missingColumns.length > 0) {
      console.log(`   ❌ ERROR: notifications table missing columns: ${missingColumns.join(', ')}`);
      process.exit(1);
    } else {
      console.log('   ✅ notifications table has all required columns');
    }

    console.log('\n✅ Fresh database migration test passed!');
    console.log('\n📝 Summary:');
    console.log(`   - Created ${tablesResult.rows.length} tables`);
    console.log('   - All tables use correct column names (fraternity_member_id)');
    console.log('   - All required tables exist (notifications, favorites, user_addresses)');
    console.log('   - Migration system is working correctly!');

  } catch (error: any) {
    console.error('\n❌ Fresh database migration test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testFreshMigration();

