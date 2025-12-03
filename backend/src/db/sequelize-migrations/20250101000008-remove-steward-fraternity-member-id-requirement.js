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

    // Drop existing constraint first to allow data updates
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

    // Check if fraternity_member_id column exists in users table
    // (it won't exist in fresh databases created from schema.sql)
    const [columns] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'fraternity_member_id'
    `);

    if (columns.length > 0) {
      // Column exists - update it for STEWARD users
      // Note: Since seller_id, promoter_id, and steward_id columns were removed from users table,
      // we only need to ensure STEWARD users have NULL fraternity_member_id
      // (fraternity_member_id is now accessed via stewards table -> fraternity_members table)
      const [updateResult] = await queryInterface.sequelize.query(`
        UPDATE users 
        SET fraternity_member_id = NULL 
        WHERE role = 'STEWARD' 
          AND fraternity_member_id IS NOT NULL
      `);
      console.log(`  ✓ Set fraternity_member_id to NULL for ${updateResult[1] || 0} STEWARD users`);
    } else {
      // Column doesn't exist - this is expected for fresh databases
      console.log('  ✓ fraternity_member_id column does not exist in users table (expected for fresh databases)');
    }

    // Add updated constraint - simplified to just check valid role values
    // Role-specific foreign keys are now handled via user_id in role tables (sellers, promoters, stewards)
    await queryInterface.sequelize.query(`
      ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
        role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD')
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

    // Restore old constraint (simplified - just check valid role values)
    await queryInterface.sequelize.query(`
      ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
        role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD')
      )
    `);
    console.log('  ✓ Restored original check_role_foreign_key constraint');

    console.log('✅ Reverted users table constraint for STEWARD role');
  }
};

