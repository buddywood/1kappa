'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Ensuring products table has is_kappa_branded column...');

    // Check if is_kappa_branded column exists
    const [columnResult] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'is_kappa_branded'
    `);

    if (columnResult.length === 0) {
      console.log('  - Adding is_kappa_branded column...');
      await queryInterface.addColumn('products', 'is_kappa_branded', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('  ✓ Added is_kappa_branded column.');

      // Add index for is_kappa_branded (from migration 008)
      const [indexResult] = await queryInterface.sequelize.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'products' AND indexname = 'idx_products_is_kappa_branded'
      `);

      if (indexResult.length === 0) {
        console.log('  - Adding is_kappa_branded index...');
        await queryInterface.addIndex('products', ['is_kappa_branded'], {
          name: 'idx_products_is_kappa_branded'
        });
        console.log('  ✓ Added is_kappa_branded index.');
      } else {
        console.log('  - is_kappa_branded index already exists, skipping.');
      }
    } else {
      console.log('  - is_kappa_branded column already exists, skipping.');
    }

    console.log('✅ Products is_kappa_branded column ensured.');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting products is_kappa_branded column...');

    // Remove index first
    try {
      await queryInterface.removeIndex('products', 'idx_products_is_kappa_branded');
      console.log('  ✓ Removed is_kappa_branded index.');
    } catch (error) {
      console.log('  - is_kappa_branded index does not exist, skipping.');
    }

    // Remove column
    try {
      await queryInterface.removeColumn('products', 'is_kappa_branded');
      console.log('  ✓ Removed is_kappa_branded column.');
    } catch (error) {
      console.log('  - is_kappa_branded column does not exist, skipping.');
    }

    console.log('✅ Products is_kappa_branded column reverted.');
  }
};

