'use strict';

/**
 * Migration: Ensure stewards.fraternity_member_id column exists
 * Fix for databases where column might still be named member_id
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Checking stewards table structure...');
    
    // Check if stewards table exists
    const [tablesResult] = await queryInterface.sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'stewards'
    `);

    if (tablesResult.length === 0) {
      console.log('⚠️  stewards table does not exist, skipping');
      return;
    }

    console.log('✓ stewards table exists');

    // Check if fraternity_member_id column exists
    const [columnsResult] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' AND column_name = 'fraternity_member_id'
    `);

    console.log(`  - fraternity_member_id column: ${columnsResult.length > 0 ? 'EXISTS' : 'MISSING'}`);

    if (columnsResult.length > 0) {
      console.log('✓ stewards.fraternity_member_id column already exists, skipping migration');
      return;
    }

    // Check if member_id exists (old column name)
    const [oldColumnsResult] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' AND column_name = 'member_id'
    `);

    console.log(`  - member_id column: ${oldColumnsResult.length > 0 ? 'EXISTS' : 'MISSING'}`);

    if (oldColumnsResult.length > 0) {
      console.log('🔄 Renaming member_id to fraternity_member_id...');
      
      // Drop constraints before renaming
      const [constraintsResult] = await queryInterface.sequelize.query(`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'stewards'::regclass
        AND (contype = 'f' OR contype = 'c')
        AND conname LIKE '%member_id%'
      `);

      console.log(`  - Found ${constraintsResult.length} constraints to drop`);

      for (const constraint of constraintsResult) {
        await queryInterface.sequelize.query(`
          ALTER TABLE stewards DROP CONSTRAINT IF EXISTS ${queryInterface.quoteIdentifier(constraint.conname)}
        `);
      }

      // Drop NOT NULL, rename, then restore NOT NULL
      await queryInterface.sequelize.query(`
        ALTER TABLE stewards ALTER COLUMN member_id DROP NOT NULL
      `);
      await queryInterface.renameColumn('stewards', 'member_id', 'fraternity_member_id');
      await queryInterface.sequelize.query(`
        ALTER TABLE stewards ALTER COLUMN fraternity_member_id SET NOT NULL
      `);

      // Recreate foreign key constraint
      const [fraternityMembersTableResult] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'fraternity_members'
      `);

      if (fraternityMembersTableResult.length > 0) {
        await queryInterface.addConstraint('stewards', {
          fields: ['fraternity_member_id'],
          type: 'foreign key',
          name: 'stewards_fraternity_member_id_fkey',
          references: {
            table: 'fraternity_members',
            field: 'id'
          },
          onDelete: 'RESTRICT'
        });
        console.log('  ✓ Recreated foreign key constraint');
      } else {
        const [membersTableResult] = await queryInterface.sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'members'
        `);

        if (membersTableResult.length > 0) {
          await queryInterface.addConstraint('stewards', {
            fields: ['fraternity_member_id'],
            type: 'foreign key',
            name: 'stewards_fraternity_member_id_fkey',
            references: {
              table: 'members',
              field: 'id'
            },
            onDelete: 'RESTRICT'
          });
        }
      }

      // Recreate index
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS idx_stewards_member_id
      `);
      await queryInterface.addIndex('stewards', ['fraternity_member_id'], {
        name: 'idx_stewards_fraternity_member_id'
      });

      console.log('Renamed stewards.member_id to fraternity_member_id');
    } else {
      // Neither column exists, add fraternity_member_id
      console.log('➕ Adding fraternity_member_id column...');
      
      const [fraternityMembersTableResult2] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'fraternity_members'
      `);

      if (fraternityMembersTableResult2.length > 0) {
        await queryInterface.addColumn('stewards', 'fraternity_member_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'fraternity_members',
            key: 'id'
          },
          onDelete: 'RESTRICT'
        });
        await queryInterface.addIndex('stewards', ['fraternity_member_id'], {
          name: 'idx_stewards_fraternity_member_id'
        });
        console.log('✓ Added stewards.fraternity_member_id column');
      } else {
        const [membersTableResult2] = await queryInterface.sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'members'
        `);

        if (membersTableResult2.length > 0) {
          await queryInterface.addColumn('stewards', 'fraternity_member_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'members',
              key: 'id'
            },
            onDelete: 'RESTRICT'
          });
          await queryInterface.addIndex('stewards', ['fraternity_member_id'], {
            name: 'idx_stewards_fraternity_member_id'
          });
          console.log('Added stewards.fraternity_member_id column (referencing members table)');
        } else {
          console.warn('Cannot add fraternity_member_id to stewards: neither fraternity_members nor members table exists');
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Check if fraternity_member_id exists
    const [columnsResult] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stewards' AND column_name = 'fraternity_member_id'
    `);

    if (columnsResult.length > 0) {
      // Check if member_id exists (to determine if we should rename back)
      const [oldColumnsResult] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'stewards' AND column_name = 'member_id'
      `);

      if (oldColumnsResult.length === 0) {
        // Column was added, not renamed, so remove it
        await queryInterface.removeIndex('stewards', 'idx_stewards_fraternity_member_id');
        await queryInterface.removeColumn('stewards', 'fraternity_member_id');
      } else {
        // Column was renamed, rename it back
        await queryInterface.renameColumn('stewards', 'fraternity_member_id', 'member_id');
      }
    }
  }
};

