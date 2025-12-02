'use strict';

/**
 * Migration: Ensure promoters.fraternity_member_id column exists
 * Fix for databases where column might be missing
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if promoters table exists
    const [tablesResult] = await queryInterface.sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'promoters'
    `);

    if (tablesResult.length === 0) {
      console.log('promoters table does not exist, skipping');
      return;
    }

    // Check if fraternity_member_id column exists
    const [columnsResult] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' AND column_name = 'fraternity_member_id'
    `);

    if (columnsResult.length > 0) {
      console.log('promoters.fraternity_member_id column already exists');
      return;
    }

    // Check if member_id exists (old column name)
    const [oldColumnsResult] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' AND column_name = 'member_id'
    `);

    if (oldColumnsResult.length > 0) {
      // Rename member_id to fraternity_member_id
      await queryInterface.renameColumn('promoters', 'member_id', 'fraternity_member_id');
      console.log('Renamed promoters.member_id to fraternity_member_id');
    } else {
      // Neither column exists, add fraternity_member_id
      // Check if fraternity_members table exists
      const [fraternityMembersTableResult] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'fraternity_members'
      `);

      if (fraternityMembersTableResult.length > 0) {
        await queryInterface.addColumn('promoters', 'fraternity_member_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'fraternity_members',
            key: 'id'
          },
          onDelete: 'SET NULL'
        });
        await queryInterface.addIndex('promoters', ['fraternity_member_id'], {
          name: 'idx_promoters_fraternity_member_id'
        });
        console.log('Added promoters.fraternity_member_id column');
      } else {
        // Fallback to members table if fraternity_members doesn't exist yet
        const [membersTableResult] = await queryInterface.sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'members'
        `);

        if (membersTableResult.length > 0) {
          await queryInterface.addColumn('promoters', 'fraternity_member_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'members',
              key: 'id'
            },
            onDelete: 'SET NULL'
          });
          await queryInterface.addIndex('promoters', ['fraternity_member_id'], {
            name: 'idx_promoters_fraternity_member_id'
          });
          console.log('Added promoters.fraternity_member_id column (referencing members table)');
        } else {
          console.warn('Cannot add fraternity_member_id to promoters: neither fraternity_members nor members table exists');
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Check if fraternity_member_id exists
    const [columnsResult] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promoters' AND column_name = 'fraternity_member_id'
    `);

    if (columnsResult.length > 0) {
      // Check if member_id exists (to determine if we should rename back)
      const [oldColumnsResult] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'promoters' AND column_name = 'member_id'
      `);

      if (oldColumnsResult.length === 0) {
        // Column was added, not renamed, so remove it
        await queryInterface.removeIndex('promoters', 'idx_promoters_fraternity_member_id');
        await queryInterface.removeColumn('promoters', 'fraternity_member_id');
      } else {
        // Column was renamed, rename it back
        await queryInterface.renameColumn('promoters', 'fraternity_member_id', 'member_id');
      }
    }
  }
};

