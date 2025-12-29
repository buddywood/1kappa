'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Adding slug column to sellers table...');

    // Check if slug column exists
    const [slugResult] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sellers' AND column_name = 'slug'
    `);

    if (slugResult.length === 0) {
      console.log('  - Adding slug column...');
      await queryInterface.addColumn('sellers', 'slug', {
        type: Sequelize.STRING(255),
        allowNull: true, // Allow null for existing sellers
        unique: true
      });
      console.log('  ✓ Added slug column.');

      // Add unique index for slug
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_slug 
        ON sellers(slug) 
        WHERE slug IS NOT NULL
      `);
      console.log('  ✓ Added unique index for slug.');
    } else {
      console.log('  - slug column already exists, skipping.');
    }

    console.log('✅ Seller slug migration completed.');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting seller slug migration...');

    try {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_sellers_slug');
      console.log('  ✓ Removed slug index.');
    } catch (error) {
      console.log('  - Slug index may not exist, continuing...');
    }

    try {
      await queryInterface.removeColumn('sellers', 'slug');
      console.log('  ✓ Removed slug column.');
    } catch (error) {
      console.log('  - slug column does not exist, skipping.');
    }

    console.log('✅ Seller slug migration reverted.');
  }
};
