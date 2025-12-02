import pool from '../db/connection';
import { runMigrations } from '../db/migrations';

async function testMigrationFlow() {
  try {
    console.log('🧪 Testing migration flow...\n');

    // 1. Check current state
    console.log('1️⃣ Checking current database state...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
      ORDER BY table_name
    `);
    console.log(`   Found ${tablesResult.rows.length} tables`);
    
    // Check for key tables
    const tableNames = tablesResult.rows.map((r: any) => r.table_name);
    const keyTables = ['chapters', 'fraternity_members', 'sellers', 'promoters', 'stewards', 'users', 'notifications', 'favorites', 'user_addresses'];
    const missingKeyTables = keyTables.filter(t => !tableNames.includes(t));
    
    if (missingKeyTables.length > 0) {
      console.log(`   ⚠️  Missing key tables: ${missingKeyTables.join(', ')}`);
    } else {
      console.log('   ✅ All key tables exist');
    }

    // 2. Check column names in stewards and promoters
    console.log('\n2️⃣ Checking column names...');
    
    const stewardsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' 
      AND column_name IN ('member_id', 'fraternity_member_id')
      ORDER BY column_name
    `);
    const stewardsColNames = stewardsColumns.rows.map((r: any) => r.column_name);
    console.log(`   stewards columns: ${stewardsColNames.join(', ') || 'none'}`);
    if (stewardsColNames.includes('member_id')) {
      console.log('   ⚠️  stewards still has member_id (should be fraternity_member_id)');
    } else if (stewardsColNames.includes('fraternity_member_id')) {
      console.log('   ✅ stewards has fraternity_member_id');
    }

    const promotersColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' 
      AND column_name IN ('member_id', 'fraternity_member_id')
      ORDER BY column_name
    `);
    const promotersColNames = promotersColumns.rows.map((r: any) => r.column_name);
    console.log(`   promoters columns: ${promotersColNames.join(', ') || 'none'}`);
    if (promotersColNames.includes('member_id')) {
      console.log('   ⚠️  promoters still has member_id (should be fraternity_member_id)');
    } else if (promotersColNames.includes('fraternity_member_id')) {
      console.log('   ✅ promoters has fraternity_member_id');
    }

    // 3. Run migrations
    console.log('\n3️⃣ Running migrations...');
    await runMigrations();
    console.log('   ✅ Migrations completed');

    // 4. Verify final state
    console.log('\n4️⃣ Verifying final state...');
    
    const finalStewardsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' 
      AND column_name IN ('member_id', 'fraternity_member_id')
      ORDER BY column_name
    `);
    const finalStewardsColNames = finalStewardsColumns.rows.map((r: any) => r.column_name);
    
    if (finalStewardsColNames.includes('member_id')) {
      console.log('   ❌ ERROR: stewards still has member_id');
      process.exit(1);
    } else if (finalStewardsColNames.includes('fraternity_member_id')) {
      console.log('   ✅ stewards has fraternity_member_id (correct)');
    } else {
      console.log('   ⚠️  stewards has neither column');
    }

    const finalPromotersColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' 
      AND column_name IN ('member_id', 'fraternity_member_id')
      ORDER BY column_name
    `);
    const finalPromotersColNames = finalPromotersColumns.rows.map((r: any) => r.column_name);
    
    if (finalPromotersColNames.includes('member_id')) {
      console.log('   ❌ ERROR: promoters still has member_id');
      process.exit(1);
    } else if (finalPromotersColNames.includes('fraternity_member_id')) {
      console.log('   ✅ promoters has fraternity_member_id (correct)');
    } else {
      console.log('   ⚠️  promoters has neither column');
    }

    // 5. Check notifications table
    const notificationsCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'notifications'
    `);
    if (parseInt(notificationsCheck.rows[0].count) > 0) {
      console.log('   ✅ notifications table exists');
    } else {
      console.log('   ❌ ERROR: notifications table does not exist');
      process.exit(1);
    }

    console.log('\n✅ Migration flow test passed!');

  } catch (error: any) {
    console.error('\n❌ Migration flow test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testMigrationFlow();

