'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Ensuring product_images table exists...');

    const [tableResult] = await queryInterface.sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'product_images' AND table_schema = 'public'
    `);

    if (tableResult.length === 0) {
      console.log('  - Creating product_images table...');
      await queryInterface.createTable('product_images', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        product_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'products',
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
      console.log('  ✓ Created product_images table.');

      // Add indexes
      await queryInterface.addIndex('product_images', ['product_id'], {
        name: 'idx_product_images_product_id'
      });
      await queryInterface.addIndex('product_images', ['product_id', 'display_order'], {
        name: 'idx_product_images_display_order'
      });
      console.log('  ✓ Added indexes to product_images table.');

      // Migrate existing image_url from products to product_images
      console.log('  - Migrating existing product images...');
      await queryInterface.sequelize.query(`
        INSERT INTO product_images (product_id, image_url, display_order, created_at, updated_at)
        SELECT id, image_url, 0, created_at, updated_at
        FROM products
        WHERE image_url IS NOT NULL AND image_url != ''
      `);
      console.log('  ✓ Migrated existing product images.');

      // Add trigger for updated_at
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_product_images_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
      `);
      await queryInterface.sequelize.query(`
        CREATE TRIGGER update_product_images_updated_at
          BEFORE UPDATE ON product_images
          FOR EACH ROW
          EXECUTE FUNCTION update_product_images_updated_at();
      `);
      console.log('  ✓ Added updated_at trigger for product_images table.');
    } else {
      console.log('  - product_images table already exists, skipping creation.');
    }

    console.log('✅ Product images table ensured.');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting product_images table...');

    try {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
      `);
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS update_product_images_updated_at();
      `);
      await queryInterface.dropTable('product_images');
      console.log('  ✓ Dropped product_images table, indexes, and trigger.');
    } catch (error) {
      console.log('  - product_images table does not exist, skipping.');
    }

    console.log('✅ Product images table reverted.');
  }
};

