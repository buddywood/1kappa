'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Making kappa_vendor_id nullable in sellers table...');

    // Check if kappa_vendor_id column exists and is NOT NULL
    const [columnResult] = await queryInterface.sequelize.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sellers' AND column_name = 'kappa_vendor_id'
    `);

    if (columnResult.length === 0) {
      console.log('  - kappa_vendor_id column does not exist, skipping.');
      return;
    }

    if (columnResult[0].is_nullable === 'NO') {
      console.log('  - Making kappa_vendor_id nullable...');
      await queryInterface.changeColumn('sellers', 'kappa_vendor_id', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
      console.log('  ✓ Made kappa_vendor_id nullable.');
    } else {
      console.log('  - kappa_vendor_id is already nullable, skipping.');
    }

    console.log('✅ kappa_vendor_id nullable migration completed.');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting kappa_vendor_id to NOT NULL...');

    // First, set any NULL values to a default value
    await queryInterface.sequelize.query(`
      UPDATE sellers 
      SET kappa_vendor_id = 'N/A' 
      WHERE kappa_vendor_id IS NULL
    `);

    // Then make it NOT NULL
    await queryInterface.changeColumn('sellers', 'kappa_vendor_id', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
    console.log('  ✓ Reverted kappa_vendor_id to NOT NULL.');

    console.log('✅ kappa_vendor_id NOT NULL reverted.');
  }
};

