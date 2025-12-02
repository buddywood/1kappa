import pool from '../db/connection';
import fs from 'fs';
import path from 'path';

async function testMigration028() {
  console.log('🧪 Testing migration 028_add_fraternity_member_id_to_users.sql\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '028_add_fraternity_member_id_to_users.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded\n');

    // Check if constraint already exists
    const constraintCheck = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('⚠️  Constraint check_role_foreign_key already exists');
      console.log('   Dropping it to test migration...\n');
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role_foreign_key');
    }

    // Check current data state
    console.log('📊 Checking current data state...\n');
    const dataCheck = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN fraternity_member_id IS NOT NULL THEN 1 END) as with_member_id,
        COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as with_seller_id,
        COUNT(CASE WHEN promoter_id IS NOT NULL THEN 1 END) as with_promoter_id,
        COUNT(CASE WHEN steward_id IS NOT NULL THEN 1 END) as with_steward_id
      FROM users
      GROUP BY role
      ORDER BY role
    `);
    
    console.log('Current user data by role:');
    dataCheck.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count} users (member_id: ${row.with_member_id}, seller: ${row.with_seller_id}, promoter: ${row.with_promoter_id}, steward: ${row.with_steward_id})`);
    });
    console.log('');

    // Check for problematic rows
    const problematicCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM users WHERE NOT (
        (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
          (fraternity_member_id IS NOT NULL) OR 
          (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
        )) OR
        (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
        (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
        (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
          (seller_id IS NULL AND promoter_id IS NULL) OR
          (seller_id IS NOT NULL AND promoter_id IS NULL) OR
          (seller_id IS NULL AND promoter_id IS NOT NULL) OR
          (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
        )) OR
        (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
      )
    `);

    const problematicCount = parseInt(problematicCheck.rows[0].count);
    if (problematicCount > 0) {
      console.log(`⚠️  Found ${problematicCount} rows that would violate the constraint\n`);
      
      const problematicRows = await pool.query(`
        SELECT id, email, role, fraternity_member_id, seller_id, promoter_id, steward_id, onboarding_status
        FROM users WHERE NOT (
          (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
            (fraternity_member_id IS NOT NULL) OR 
            (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
          )) OR
          (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
          (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
          (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
            (seller_id IS NULL AND promoter_id IS NULL) OR
            (seller_id IS NOT NULL AND promoter_id IS NULL) OR
            (seller_id IS NULL AND promoter_id IS NOT NULL) OR
            (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
          )) OR
          (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
        )
        LIMIT 10
      `);
      
      console.log('Problematic rows (showing first 10):');
      problematicRows.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Email: ${row.email}, Role: ${row.role}`);
        console.log(`    fraternity_member_id: ${row.fraternity_member_id}, seller_id: ${row.seller_id}, promoter_id: ${row.promoter_id}, steward_id: ${row.steward_id}`);
        console.log(`    onboarding_status: ${row.onboarding_status}`);
      });
      console.log('');
    } else {
      console.log('✅ No problematic rows found\n');
    }

    // Run the migration
    console.log('🚀 Running migration 028...\n');
    await pool.query(migration);
    console.log('✅ Migration 028 completed successfully!\n');

    // Verify constraint was added
    const constraintVerify = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key'
    `);

    if (constraintVerify.rows.length > 0) {
      console.log('✅ Constraint check_role_foreign_key was successfully added\n');
    } else {
      console.log('⚠️  Constraint check_role_foreign_key was NOT added (likely due to data violations)\n');
    }

    console.log('✅ Migration test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Migration test failed:');
    console.error(`Error: ${error.message}`);
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }
    if (error.position) {
      console.error(`Position: ${error.position}`);
    }
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
testMigration028()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });

