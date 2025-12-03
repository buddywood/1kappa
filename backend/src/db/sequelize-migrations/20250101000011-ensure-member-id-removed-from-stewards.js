'use strict';

/**
 * Migration: Ensure member_id is removed from stewards table
 * Date: 2025-01-XX
 * 
 * This migration ensures that both 'member_id' and 'fraternity_member_id' columns
 * are removed from the stewards table, regardless of whether previous migrations ran.
 * This is a safety migration to handle cases where the column might still exist.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Ensuring member_id and fraternity_member_id are removed from stewards table...');

    // Check for member_id column
    const [memberIdCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' AND column_name = 'member_id'
    `);

    if (memberIdCols.length > 0) {
      console.log('  Found member_id column, removing...');
      
      // Drop foreign key constraints first
      const [fks] = await queryInterface.sequelize.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'stewards' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%member_id%'
      `);
      for (const fk of fks) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE stewards DROP CONSTRAINT IF EXISTS ${queryInterface.quoteIdentifier(fk.constraint_name)}
          `);
          console.log(`    ✓ Dropped FK constraint ${fk.constraint_name}`);
        } catch (error) {
          console.log(`    ⚠️  Could not drop FK constraint ${fk.constraint_name}: ${error.message}`);
        }
      }
      
      // Drop NOT NULL constraint
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE stewards ALTER COLUMN member_id DROP NOT NULL
        `);
        console.log('    ✓ Dropped NOT NULL constraint from member_id');
      } catch (error) {
        console.log(`    ⚠️  Could not drop NOT NULL: ${error.message}`);
      }
      
      // Drop the column
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE stewards DROP COLUMN IF EXISTS member_id
        `);
        console.log('    ✓ Dropped member_id column from stewards');
      } catch (error) {
        console.log(`    ❌ Error dropping member_id: ${error.message}`);
        throw error;
      }
    } else {
      console.log('  ✓ member_id column does not exist');
    }

    // Check for fraternity_member_id column
    const [fraternityMemberIdCols] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' AND column_name = 'fraternity_member_id'
    `);

    if (fraternityMemberIdCols.length > 0) {
      console.log('  Found fraternity_member_id column, removing...');
      
      // Drop foreign key constraints first
      const [fks2] = await queryInterface.sequelize.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'stewards' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%fraternity_member%'
      `);
      for (const fk of fks2) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE stewards DROP CONSTRAINT IF EXISTS ${queryInterface.quoteIdentifier(fk.constraint_name)}
          `);
          console.log(`    ✓ Dropped FK constraint ${fk.constraint_name}`);
        } catch (error) {
          console.log(`    ⚠️  Could not drop FK constraint ${fk.constraint_name}: ${error.message}`);
        }
      }
      
      // Drop NOT NULL constraint
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE stewards ALTER COLUMN fraternity_member_id DROP NOT NULL
        `);
        console.log('    ✓ Dropped NOT NULL constraint from fraternity_member_id');
      } catch (error) {
        console.log(`    ⚠️  Could not drop NOT NULL: ${error.message}`);
      }
      
      // Drop the column
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE stewards DROP COLUMN IF EXISTS fraternity_member_id
        `);
        console.log('    ✓ Dropped fraternity_member_id column from stewards');
      } catch (error) {
        console.log(`    ❌ Error dropping fraternity_member_id: ${error.message}`);
        throw error;
      }
    } else {
      console.log('  ✓ fraternity_member_id column does not exist');
    }

    console.log('✅ Ensured member_id and fraternity_member_id are removed from stewards');
  },

  async down(queryInterface, Sequelize) {
    // This migration is not reversible - we don't want to add these columns back
    console.log('⬇️  This migration cannot be reversed');
  }
};

