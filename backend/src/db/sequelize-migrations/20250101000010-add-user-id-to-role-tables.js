'use strict';

/**
 * Migration: Add user_id foreign keys to sellers, fraternity_members, promoters, and stewards
 * Remove seller_id, promoter_id, steward_id from users table
 * Date: 2025-01-XX
 * 
 * This migration reverses the relationship direction - instead of users pointing to role-specific tables,
 * role-specific tables now point to users.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Adding user_id to sellers, fraternity_members, promoters, and stewards...');
    console.log('🔍 Removing seller_id, promoter_id, steward_id from users...');

    // Step 1: Add user_id columns to role-specific tables
    console.log('  Step 1: Adding user_id columns...');
    
    // Add to sellers
    const [sellersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sellers' AND column_name = 'user_id'
    `);
    if (sellersCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE sellers ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('    ✓ Added user_id to sellers');
    }

    // Add to promoters
    const [promotersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' AND column_name = 'user_id'
    `);
    if (promotersCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE promoters ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('    ✓ Added user_id to promoters');
    }

    // Add to stewards
    const [stewardsCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' AND column_name = 'user_id'
    `);
    if (stewardsCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE stewards ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('    ✓ Added user_id to stewards');
    }

    // Add to fraternity_members
    const [membersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fraternity_members' AND column_name = 'user_id'
    `);
    if (membersCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE fraternity_members ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('    ✓ Added user_id to fraternity_members');
    }

    // Step 2: Populate user_id columns from existing users table relationships
    console.log('  Step 2: Populating user_id columns from existing relationships...');
    
    // Check if seller_id, promoter_id, and steward_id columns exist in users table
    // (they won't exist in fresh databases created from schema.sql)
    const [userColumns] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('seller_id', 'promoter_id', 'steward_id')
    `);
    const hasSellerId = userColumns.some(col => col.column_name === 'seller_id');
    const hasPromoterId = userColumns.some(col => col.column_name === 'promoter_id');
    const hasStewardId = userColumns.some(col => col.column_name === 'steward_id');
    
    if (hasSellerId || hasPromoterId || hasStewardId) {
      // Existing database - migrate data from old structure
      
      // Populate sellers.user_id from users.seller_id
      if (hasSellerId) {
        await queryInterface.sequelize.query(`
          UPDATE sellers s
          SET user_id = u.id
          FROM users u
          WHERE u.seller_id = s.id
            AND s.user_id IS NULL
        `);
        console.log('    ✓ Populated user_id for sellers');
      }

      // Populate promoters.user_id from users.promoter_id
      if (hasPromoterId) {
        await queryInterface.sequelize.query(`
          UPDATE promoters p
          SET user_id = u.id
          FROM users u
          WHERE u.promoter_id = p.id
            AND p.user_id IS NULL
        `);
        console.log('    ✓ Populated user_id for promoters');
      }

      // Populate stewards.user_id from users.steward_id
      if (hasStewardId) {
        await queryInterface.sequelize.query(`
          UPDATE stewards st
          SET user_id = u.id
          FROM users u
          WHERE u.steward_id = st.id
            AND st.user_id IS NULL
        `);
        console.log('    ✓ Populated user_id for stewards');
      }

      // Populate fraternity_members.user_id from users (GUEST role or via email/cognito_sub matching)
      await queryInterface.sequelize.query(`
        UPDATE fraternity_members fm
        SET user_id = u.id
        FROM users u
        WHERE (u.email = fm.email OR u.cognito_sub = fm.cognito_sub)
          AND fm.user_id IS NULL
          AND u.role = 'GUEST'
      `);
      console.log('    ✓ Populated user_id for fraternity_members (GUEST users)');

      // Also populate for role-specific users via their role tables
      // Update sellers' fraternity_members
      if (hasSellerId) {
        await queryInterface.sequelize.query(`
          UPDATE fraternity_members fm
          SET user_id = u.id
          FROM users u
          JOIN sellers s ON u.seller_id = s.id
          WHERE s.email = fm.email
            AND fm.user_id IS NULL
            AND (u.email = fm.email OR u.cognito_sub = fm.cognito_sub)
        `);
      }
      
      // Update promoters' fraternity_members
      if (hasPromoterId) {
        await queryInterface.sequelize.query(`
          UPDATE fraternity_members fm
          SET user_id = u.id
          FROM users u
          JOIN promoters p ON u.promoter_id = p.id
          WHERE p.email = fm.email
            AND fm.user_id IS NULL
            AND (u.email = fm.email OR u.cognito_sub = fm.cognito_sub)
        `);
      }
      
      // Update stewards' fraternity_members (via user email/cognito_sub matching)
      if (hasStewardId) {
        await queryInterface.sequelize.query(`
          UPDATE fraternity_members fm
          SET user_id = u.id
          FROM users u
          JOIN stewards st ON u.steward_id = st.id
          WHERE fm.user_id IS NULL
            AND (u.email = fm.email OR u.cognito_sub = fm.cognito_sub)
        `);
      }
      console.log('    ✓ Populated user_id for fraternity_members (role-specific users)');
    } else {
      // Fresh database - no existing data to migrate
      // Just populate fraternity_members.user_id from users via email/cognito_sub matching
      await queryInterface.sequelize.query(`
        UPDATE fraternity_members fm
        SET user_id = u.id
        FROM users u
        WHERE (u.email = fm.email OR u.cognito_sub = fm.cognito_sub)
          AND fm.user_id IS NULL
      `);
      console.log('    ✓ Populated user_id for fraternity_members (fresh database - email/cognito matching)');
    }

    // Step 3: Add indexes on user_id columns
    console.log('  Step 3: Adding indexes on user_id columns...');
    
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id)
    `);
    console.log('    ✓ Added index on sellers.user_id');

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_promoters_user_id ON promoters(user_id)
    `);
    console.log('    ✓ Added index on promoters.user_id');

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_stewards_user_id ON stewards(user_id)
    `);
    console.log('    ✓ Added index on stewards.user_id');

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_fraternity_members_user_id ON fraternity_members(user_id)
    `);
    console.log('    ✓ Added index on fraternity_members.user_id');

    // Step 4: Update users table constraint to remove seller_id/promoter_id/steward_id requirements
    console.log('  Step 4: Updating users table constraint...');
    
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

      // Add updated constraint without seller_id/promoter_id/steward_id requirements
      await queryInterface.sequelize.query(`
        ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
          role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD')
        )
      `);
      console.log('    ✓ Added updated check_role_foreign_key constraint');
    }

    // Step 5: Drop foreign key constraints and columns from users table
    console.log('  Step 5: Dropping seller_id, promoter_id, steward_id from users...');
    
    // Drop indexes first
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_users_seller_id
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_users_promoter_id
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_users_steward_id
    `);
    console.log('    ✓ Dropped indexes');

    // Drop foreign key constraints
    const [usersFks] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
        AND constraint_type = 'FOREIGN KEY'
        AND (constraint_name LIKE '%seller%' OR constraint_name LIKE '%promoter%' OR constraint_name LIKE '%steward%')
    `);
    for (const fk of usersFks) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS ${fk.constraint_name}
      `);
      console.log(`    ✓ Dropped FK constraint ${fk.constraint_name}`);
    }

    // Drop columns
    await queryInterface.sequelize.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS seller_id
    `);
    console.log('    ✓ Dropped seller_id from users');

    await queryInterface.sequelize.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS promoter_id
    `);
    console.log('    ✓ Dropped promoter_id from users');

    await queryInterface.sequelize.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS steward_id
    `);
    console.log('    ✓ Dropped steward_id from users');

    console.log('✅ Successfully added user_id to role tables and removed reverse references from users');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting user_id changes...');

    // Step 1: Add columns back to users
    console.log('  Step 1: Adding seller_id, promoter_id, steward_id back to users...');
    
    const [sellersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'seller_id'
    `);
    if (sellersCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users ADD COLUMN seller_id INTEGER REFERENCES sellers(id)
      `);
      console.log('    ✓ Added seller_id to users');
    }

    const [promotersCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'promoter_id'
    `);
    if (promotersCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users ADD COLUMN promoter_id INTEGER REFERENCES promoters(id)
      `);
      console.log('    ✓ Added promoter_id to users');
    }

    const [stewardsCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'steward_id'
    `);
    if (stewardsCols.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users ADD COLUMN steward_id INTEGER REFERENCES stewards(id)
      `);
      console.log('    ✓ Added steward_id to users');
    }

    // Step 2: Restore data from user_id columns
    console.log('  Step 2: Restoring seller_id, promoter_id, steward_id from user_id...');
    
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET seller_id = s.id
      FROM sellers s
      WHERE s.user_id = u.id
        AND u.seller_id IS NULL
    `);
    console.log('    ✓ Restored seller_id for users');

    await queryInterface.sequelize.query(`
      UPDATE users u
      SET promoter_id = p.id
      FROM promoters p
      WHERE p.user_id = u.id
        AND u.promoter_id IS NULL
    `);
    console.log('    ✓ Restored promoter_id for users');

    await queryInterface.sequelize.query(`
      UPDATE users u
      SET steward_id = st.id
      FROM stewards st
      WHERE st.user_id = u.id
        AND u.steward_id IS NULL
    `);
    console.log('    ✓ Restored steward_id for users');

    // Step 3: Add indexes back
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_seller_id ON users(seller_id)
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_promoter_id ON users(promoter_id)
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_steward_id ON users(steward_id)
    `);
    console.log('    ✓ Added indexes back');

    // Step 4: Restore constraint
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key'
    `);

    if (constraints.length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT check_role_foreign_key
      `);
    }

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
    console.log('    ✓ Restored check_role_foreign_key constraint');

    // Step 5: Drop user_id columns and indexes
    console.log('  Step 5: Dropping user_id columns...');
    
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_sellers_user_id
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE sellers DROP COLUMN IF EXISTS user_id
    `);
    console.log('    ✓ Dropped user_id from sellers');

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_promoters_user_id
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE promoters DROP COLUMN IF EXISTS user_id
    `);
    console.log('    ✓ Dropped user_id from promoters');

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_stewards_user_id
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE stewards DROP COLUMN IF EXISTS user_id
    `);
    console.log('    ✓ Dropped user_id from stewards');

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_fraternity_members_user_id
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE fraternity_members DROP COLUMN IF EXISTS user_id
    `);
    console.log('    ✓ Dropped user_id from fraternity_members');

    console.log('✅ Successfully reverted user_id changes');
  }
};

