'use strict';

/**
 * Migration: Remove fraternity_member_id columns from stewards, sellers, promoters, and users tables
 * Date: 2025-01-XX
 * 
 * This migration removes the fraternity_member_id columns from these tables since
 * the fraternity_members table is the source of truth. All references should go
 * through the fraternity_members table associations.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Removing fraternity_member_id columns from stewards, sellers, promoters, and users tables...');

    // Step 1: Drop foreign key constraints
    console.log('  Step 1: Dropping foreign key constraints...');
    
    // Drop FK from stewards table
    const [stewardsFks] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'stewards' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%fraternity_member%'
    `);
    for (const fk of stewardsFks) {
      await queryInterface.sequelize.query(`
        ALTER TABLE stewards DROP CONSTRAINT IF EXISTS ${fk.constraint_name}
      `);
      console.log(`    ✓ Dropped FK constraint ${fk.constraint_name} from stewards`);
    }

    // Drop FK from sellers table
    const [sellersFks] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'sellers' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%fraternity_member%'
    `);
    for (const fk of sellersFks) {
      await queryInterface.sequelize.query(`
        ALTER TABLE sellers DROP CONSTRAINT IF EXISTS ${fk.constraint_name}
      `);
      console.log(`    ✓ Dropped FK constraint ${fk.constraint_name} from sellers`);
    }

    // Drop FK from promoters table
    const [promotersFks] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'promoters' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%fraternity_member%'
    `);
    for (const fk of promotersFks) {
      await queryInterface.sequelize.query(`
        ALTER TABLE promoters DROP CONSTRAINT IF EXISTS ${fk.constraint_name}
      `);
      console.log(`    ✓ Dropped FK constraint ${fk.constraint_name} from promoters`);
    }

    // Drop FK from users table
    const [usersFks] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%fraternity_member%'
    `);
    for (const fk of usersFks) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS ${fk.constraint_name}
      `);
      console.log(`    ✓ Dropped FK constraint ${fk.constraint_name} from users`);
    }

    // Step 2: Drop indexes
    console.log('  Step 2: Dropping indexes...');
    
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_stewards_fraternity_member_id
    `);
    console.log('    ✓ Dropped idx_stewards_fraternity_member_id');

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_sellers_fraternity_member_id
    `);
    console.log('    ✓ Dropped idx_sellers_fraternity_member_id');

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_promoters_fraternity_member_id
    `);
    console.log('    ✓ Dropped idx_promoters_fraternity_member_id');

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_users_fraternity_member_id
    `);
    console.log('    ✓ Dropped idx_users_fraternity_member_id');

    // Step 3: Update users table constraint to remove fraternity_member_id requirements
    console.log('  Step 3: Updating users table constraint...');
    
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key'
    `);

    if (constraints.length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT check_role_foreign_key
      `);
      console.log('    ✓ Dropped existing check_role_foreign_key constraint');
    }

    // Fix any GUEST users with ONBOARDING_FINISHED (they should be ONBOARDING_STARTED or COGNITO_CONFIRMED)
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET onboarding_status = 'COGNITO_CONFIRMED'
      WHERE role = 'GUEST' 
        AND onboarding_status = 'ONBOARDING_FINISHED'
        AND seller_id IS NULL 
        AND promoter_id IS NULL 
        AND steward_id IS NULL
    `);
    console.log('    ✓ Fixed GUEST users with invalid onboarding_status');

    // Add updated constraint without fraternity_member_id requirements
    // Note: GUEST users can have any onboarding_status now (removed the restriction)
    await queryInterface.sequelize.query(`
      ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
        (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
        (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
        (role = 'PROMOTER' AND promoter_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
        (role = 'STEWARD' AND steward_id IS NOT NULL AND (
          (seller_id IS NULL AND promoter_id IS NULL) OR
          (seller_id IS NOT NULL AND promoter_id IS NULL) OR
          (seller_id IS NULL AND promoter_id IS NOT NULL) OR
          (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
        )) OR
        (role = 'ADMIN' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
      )
    `);
    console.log('    ✓ Added updated check_role_foreign_key constraint');

    // Step 4: Drop columns
    console.log('  Step 4: Dropping columns...');
    
    // Drop from stewards (handle both old 'member_id' and new 'fraternity_member_id' column names)
    const [stewardsCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' 
        AND (column_name = 'fraternity_member_id' OR column_name = 'member_id')
    `);
    for (const col of stewardsCols) {
      const columnName = col.column_name;
      
      // First, drop any foreign key constraints
      const [fks] = await queryInterface.sequelize.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'stewards' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%${columnName}%'
      `);
      for (const fk of fks) {
        await queryInterface.sequelize.query(`
          ALTER TABLE stewards DROP CONSTRAINT IF EXISTS ${queryInterface.quoteIdentifier(fk.constraint_name)}
        `);
      }
      
      // Drop NOT NULL constraint if it exists
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE stewards ALTER COLUMN ${queryInterface.quoteIdentifier(columnName)} DROP NOT NULL
        `);
      } catch (error) {
        // Ignore if NOT NULL doesn't exist or column doesn't have NOT NULL
      }
      
      // Now drop the column
      await queryInterface.sequelize.query(`
        ALTER TABLE stewards DROP COLUMN IF EXISTS ${queryInterface.quoteIdentifier(columnName)}
      `);
      console.log(`    ✓ Dropped ${columnName} from stewards`);
    }

    // Drop from sellers
    const [sellersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sellers' AND column_name = 'fraternity_member_id'
    `);
    if (sellersCols.length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE sellers DROP COLUMN IF EXISTS fraternity_member_id
      `);
      console.log('    ✓ Dropped fraternity_member_id from sellers');
    }

    // Drop from promoters
    const [promotersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' AND column_name = 'fraternity_member_id'
    `);
    if (promotersCols.length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE promoters DROP COLUMN IF EXISTS fraternity_member_id
      `);
      console.log('    ✓ Dropped fraternity_member_id from promoters');
    }

    // Drop from users
    const [usersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'fraternity_member_id'
    `);
    if (usersCols.length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP COLUMN IF EXISTS fraternity_member_id
      `);
      console.log('    ✓ Dropped fraternity_member_id from users');
    }

    console.log('✅ Successfully removed fraternity_member_id columns');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting removal of fraternity_member_id columns...');

    // Step 1: Add columns back
    console.log('  Step 1: Adding columns back...');
    
    // Add to stewards (NOT NULL)
    const [stewardsCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' AND column_name = 'fraternity_member_id'
    `);
    if (stewardsCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE stewards ADD COLUMN fraternity_member_id INTEGER
      `);
      console.log('    ✓ Added fraternity_member_id to stewards');
    }

    // Add to sellers (nullable)
    const [sellersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sellers' AND column_name = 'fraternity_member_id'
    `);
    if (sellersCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE sellers ADD COLUMN fraternity_member_id INTEGER
      `);
      console.log('    ✓ Added fraternity_member_id to sellers');
    }

    // Add to promoters (nullable)
    const [promotersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' AND column_name = 'fraternity_member_id'
    `);
    if (promotersCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE promoters ADD COLUMN fraternity_member_id INTEGER
      `);
      console.log('    ✓ Added fraternity_member_id to promoters');
    }

    // Add to users (nullable)
    const [usersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'fraternity_member_id'
    `);
    if (usersCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users ADD COLUMN fraternity_member_id INTEGER
      `);
      console.log('    ✓ Added fraternity_member_id to users');
    }

    // Step 2: Restore data from fraternity_members table via email matching
    console.log('  Step 2: Restoring data via email matching...');
    
    // Restore sellers
    await queryInterface.sequelize.query(`
      UPDATE sellers s
      SET fraternity_member_id = m.id
      FROM fraternity_members m
      WHERE s.email = m.email
        AND s.fraternity_member_id IS NULL
    `);
    console.log('    ✓ Restored fraternity_member_id for sellers');

    // Restore promoters
    await queryInterface.sequelize.query(`
      UPDATE promoters p
      SET fraternity_member_id = m.id
      FROM fraternity_members m
      WHERE p.email = m.email
        AND p.fraternity_member_id IS NULL
    `);
    console.log('    ✓ Restored fraternity_member_id for promoters');

    // Restore stewards (via users -> cognito_sub -> fraternity_members)
    await queryInterface.sequelize.query(`
      UPDATE stewards st
      SET fraternity_member_id = m.id
      FROM users u
      JOIN fraternity_members m ON u.cognito_sub = m.cognito_sub OR u.email = m.email
      WHERE u.steward_id = st.id
        AND st.fraternity_member_id IS NULL
    `);
    console.log('    ✓ Restored fraternity_member_id for stewards');

    // Restore users (GUEST role)
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET fraternity_member_id = m.id
      FROM fraternity_members m
      WHERE (u.email = m.email OR u.cognito_sub = m.cognito_sub)
        AND u.role = 'GUEST'
        AND u.fraternity_member_id IS NULL
    `);
    console.log('    ✓ Restored fraternity_member_id for GUEST users');

    // Step 3: Add foreign key constraints back
    console.log('  Step 3: Adding foreign key constraints back...');
    
    await queryInterface.sequelize.query(`
      ALTER TABLE stewards 
      ADD CONSTRAINT stewards_fraternity_member_id_fkey 
      FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id)
    `);
    console.log('    ✓ Added FK constraint to stewards');

    await queryInterface.sequelize.query(`
      ALTER TABLE sellers 
      ADD CONSTRAINT sellers_fraternity_member_id_fkey 
      FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id)
    `);
    console.log('    ✓ Added FK constraint to sellers');

    await queryInterface.sequelize.query(`
      ALTER TABLE promoters 
      ADD CONSTRAINT promoters_fraternity_member_id_fkey 
      FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id)
    `);
    console.log('    ✓ Added FK constraint to promoters');

    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_fraternity_member_id_fkey 
      FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id) ON DELETE SET NULL
    `);
    console.log('    ✓ Added FK constraint to users');

    // Step 4: Add indexes back
    console.log('  Step 4: Adding indexes back...');
    
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_stewards_fraternity_member_id ON stewards(fraternity_member_id)
    `);
    console.log('    ✓ Added index on stewards.fraternity_member_id');

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_sellers_fraternity_member_id ON sellers(fraternity_member_id)
    `);
    console.log('    ✓ Added index on sellers.fraternity_member_id');

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_promoters_fraternity_member_id ON promoters(fraternity_member_id)
    `);
    console.log('    ✓ Added index on promoters.fraternity_member_id');

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_fraternity_member_id ON users(fraternity_member_id)
    `);
    console.log('    ✓ Added index on users.fraternity_member_id');

    // Step 5: Restore users table constraint
    console.log('  Step 5: Restoring users table constraint...');
    
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key'
    `);

    if (constraints.length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT check_role_foreign_key
      `);
      console.log('    ✓ Dropped check_role_foreign_key constraint');
    }

    // Restore original constraint with fraternity_member_id requirements
    await queryInterface.sequelize.query(`
      ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
        (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
          (fraternity_member_id IS NOT NULL) OR 
          (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
        )) OR
        (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
        (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
        (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NULL AND (
          (seller_id IS NULL AND promoter_id IS NULL) OR
          (seller_id IS NOT NULL AND promoter_id IS NULL) OR
          (seller_id IS NULL AND promoter_id IS NOT NULL) OR
          (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
        )) OR
        (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
      )
    `);
    console.log('    ✓ Restored check_role_foreign_key constraint');

    console.log('✅ Successfully reverted removal of fraternity_member_id columns');
  }
};

