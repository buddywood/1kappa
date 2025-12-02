'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Ensuring steward_listing_images table exists...');

    const [tableResult] = await queryInterface.sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'steward_listing_images' AND table_schema = 'public'
    `);

    if (tableResult.length === 0) {
      console.log('  - Creating steward_listing_images table...');
      await queryInterface.createTable('steward_listing_images', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        steward_listing_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'steward_listings',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        image_url: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        display_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
      console.log('  ✓ Created steward_listing_images table.');

      // Add indexes
      await queryInterface.addIndex('steward_listing_images', ['steward_listing_id'], {
        name: 'idx_steward_listing_images_listing_id'
      });
      await queryInterface.addIndex('steward_listing_images', ['steward_listing_id', 'display_order'], {
        name: 'idx_steward_listing_images_display_order'
      });
      console.log('  ✓ Added indexes to steward_listing_images table.');

      // Migrate existing image_url from steward_listings to steward_listing_images
      console.log('  - Migrating existing steward listing images...');
      await queryInterface.sequelize.query(`
        INSERT INTO steward_listing_images (steward_listing_id, image_url, display_order, created_at, updated_at)
        SELECT id, image_url, 0, created_at, updated_at
        FROM steward_listings
        WHERE image_url IS NOT NULL AND image_url != ''
      `);
      console.log('  ✓ Migrated existing steward listing images.');

      // Add trigger for updated_at
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_steward_listing_images_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_steward_listing_images_updated_at ON steward_listing_images;
      `);
      await queryInterface.sequelize.query(`
        CREATE TRIGGER update_steward_listing_images_updated_at
          BEFORE UPDATE ON steward_listing_images
          FOR EACH ROW
          EXECUTE FUNCTION update_steward_listing_images_updated_at();
      `);
      console.log('  ✓ Added updated_at trigger for steward_listing_images table.');
    } else {
      console.log('  - steward_listing_images table already exists, skipping creation.');
    }

    console.log('✅ Steward listing images table ensured.');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting steward_listing_images table...');

    try {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_steward_listing_images_updated_at ON steward_listing_images;
      `);
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS update_steward_listing_images_updated_at();
      `);
      await queryInterface.dropTable('steward_listing_images');
      console.log('  ✓ Dropped steward_listing_images table, indexes, and trigger.');
    } catch (error) {
      console.log('  - steward_listing_images table does not exist, skipping.');
    }

    console.log('✅ Steward listing images table reverted.');
  }
};

