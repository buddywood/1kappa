'use strict';

/**
 * Ensure professions table exists
 * This migration handles cases where migration 022 was marked as applied
 * but the table was never actually created
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Checking professions table...');
    
    const [tablesResult] = await queryInterface.sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'professions' AND table_schema = 'public'
    `);

    if (tablesResult.length > 0) {
      console.log('✓ professions table already exists');
      return;
    }

    console.log('📦 Creating professions table...');

    // Create professions table
    await queryInterface.createTable('professions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('professions', ['is_active'], {
      name: 'idx_professions_active'
    });
    await queryInterface.addIndex('professions', ['display_order'], {
      name: 'idx_professions_display_order'
    });

    // Create trigger function for updated_at
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_professions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_professions_updated_at ON professions;
      CREATE TRIGGER update_professions_updated_at 
        BEFORE UPDATE ON professions
        FOR EACH ROW
        EXECUTE FUNCTION update_professions_updated_at();
    `);

    // Check if fraternity_members table exists and add profession_id if missing
    const [fraternityMembersTableResult] = await queryInterface.sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'fraternity_members' AND table_schema = 'public'
    `);

    if (fraternityMembersTableResult.length > 0) {
      const [columnsResult] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'fraternity_members' AND column_name = 'profession_id'
      `);

      if (columnsResult.length === 0) {
        console.log('📦 Adding profession_id to fraternity_members...');
        await queryInterface.addColumn('fraternity_members', 'profession_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'professions',
            key: 'id'
          }
        });
        await queryInterface.addIndex('fraternity_members', ['profession_id'], {
          name: 'idx_fraternity_members_profession_id'
        });
        console.log('✓ Added profession_id to fraternity_members');
      } else {
        console.log('✓ fraternity_members.profession_id already exists');
      }
    }

    console.log('✅ professions table created successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting professions migration...');
    
    // Remove profession_id from fraternity_members if it exists
    const [columnsResult] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fraternity_members' AND column_name = 'profession_id'
    `);

    if (columnsResult.length > 0) {
      await queryInterface.removeIndex('fraternity_members', 'idx_fraternity_members_profession_id');
      await queryInterface.removeColumn('fraternity_members', 'profession_id');
      console.log('✓ Removed profession_id from fraternity_members');
    }

    // Drop trigger and function
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_professions_updated_at ON professions;
      DROP FUNCTION IF EXISTS update_professions_updated_at();
    `);

    // Drop table
    await queryInterface.dropTable('professions');
    console.log('✓ Dropped professions table');
  }
};

