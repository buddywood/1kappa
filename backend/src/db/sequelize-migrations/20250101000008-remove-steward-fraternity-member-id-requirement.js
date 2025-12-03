'use strict';

/**
 * Migration: Remove fraternity_member_id requirement for STEWARD users
 * Date: 2025-01-XX
 * 
 * This migration updates the users table constraint to remove the requirement
 * for fraternity_member_id on STEWARD users. Since stewards table already has
 * fraternity_member_id, users can access it via steward_id -> stewards.fraternity_member_id.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Updating users table constraint for STEWARD role...');

    // First, update any existing STEWARD users to have NULL fraternity_member_id
    // (it will be accessed via steward_id -> stewards.fraternity_member_id)
    const [updateResult] = await queryInterface.sequelize.query(`
      UPDATE users 
      SET fraternity_member_id = NULL 
      WHERE role = 'STEWARD' AND fraternity_member_id IS NOT NULL
    `);
    console.log(`  ✓ Set fraternity_member_id to NULL for ${updateResult[1] || 0} STEWARD users`);

    // Drop existing constraint if it exists
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key'
    `);

    if (constraints.length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT check_role_foreign_key
      `);
      console.log('  ✓ Dropped existing check_role_foreign_key constraint');
    }

    // Add updated constraint
    // STEWARD users: steward_id IS NOT NULL, fraternity_member_id IS NULL
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
    console.log('  ✓ Added updated check_role_foreign_key constraint');

    console.log('✅ Updated users table constraint for STEWARD role');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting users table constraint for STEWARD role...');

    // Drop the updated constraint
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key'
    `);

    if (constraints.length > 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT check_role_foreign_key
      `);
      console.log('  ✓ Dropped check_role_foreign_key constraint');
    }

    // Restore old constraint (STEWARD requires fraternity_member_id)
    await queryInterface.sequelize.query(`
      ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
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
    console.log('  ✓ Restored original check_role_foreign_key constraint');

    // Update STEWARD users to have fraternity_member_id from stewards table
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET fraternity_member_id = s.fraternity_member_id
      FROM stewards s
      WHERE u.role = 'STEWARD' 
        AND u.steward_id = s.id
        AND u.fraternity_member_id IS NULL
        AND s.fraternity_member_id IS NOT NULL
    `);
    console.log('  ✓ Updated STEWARD users with fraternity_member_id from stewards table');

    console.log('✅ Reverted users table constraint for STEWARD role');
  }
};

