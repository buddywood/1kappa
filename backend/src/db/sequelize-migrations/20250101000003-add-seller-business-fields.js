'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Ensuring sellers table has all business fields...');

    // Check if merchandise_type column exists (from migration 011)
    const [merchandiseTypeResult] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sellers' AND column_name = 'merchandise_type'
    `);

    if (merchandiseTypeResult.length === 0) {
      console.log('  - Adding merchandise_type column...');
      // Create ENUM type if it doesn't exist
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_sellers_merchandise_type" AS ENUM ('KAPPA', 'NON_KAPPA');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.addColumn('sellers', 'merchandise_type', {
        type: Sequelize.ENUM('KAPPA', 'NON_KAPPA'),
        allowNull: true,
        defaultValue: null
      });
      console.log('  ✓ Added merchandise_type column.');
    } else {
      console.log('  - merchandise_type column already exists, skipping.');
    }

    // Check if stripe_account_type column exists (from migration 023)
    const [stripeAccountTypeResult] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sellers' AND column_name = 'stripe_account_type'
    `);

    if (stripeAccountTypeResult.length === 0) {
      console.log('  - Adding stripe_account_type column...');
      // Create ENUM type if it doesn't exist
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_sellers_stripe_account_type" AS ENUM ('company', 'individual');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.addColumn('sellers', 'stripe_account_type', {
        type: Sequelize.ENUM('company', 'individual'),
        allowNull: true,
        defaultValue: null
      });
      console.log('  ✓ Added stripe_account_type column.');
    } else {
      console.log('  - stripe_account_type column already exists, skipping.');
    }

    // Add tax_id column (from migration 023)
    const [taxIdResult] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sellers' AND column_name = 'tax_id'
    `);

    if (taxIdResult.length === 0) {
      console.log('  - Adding tax_id column...');
      await queryInterface.addColumn('sellers', 'tax_id', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
      // Add partial index for tax_id (only non-null values)
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_sellers_tax_id 
        ON sellers(tax_id) 
        WHERE tax_id IS NOT NULL
      `);
      console.log('  ✓ Added tax_id column and index.');
    } else {
      console.log('  - tax_id column already exists, skipping.');
    }

    // Add business_phone column (from migration 023)
    const [businessPhoneResult] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sellers' AND column_name = 'business_phone'
    `);

    if (businessPhoneResult.length === 0) {
      console.log('  - Adding business_phone column...');
      await queryInterface.addColumn('sellers', 'business_phone', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
      console.log('  ✓ Added business_phone column.');
    } else {
      console.log('  - business_phone column already exists, skipping.');
    }

    // Add business address fields (from migration 023)
    const businessAddressFields = [
      { name: 'business_address_line1', type: Sequelize.STRING(255) },
      { name: 'business_address_line2', type: Sequelize.STRING(255) },
      { name: 'business_city', type: Sequelize.STRING(100) },
      { name: 'business_state', type: Sequelize.STRING(100) },
      { name: 'business_postal_code', type: Sequelize.STRING(20) },
      { name: 'business_country', type: Sequelize.STRING(2) }
    ];

    for (const field of businessAddressFields) {
      const [fieldResult] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'sellers' AND column_name = '${field.name}'
      `);

      if (fieldResult.length === 0) {
        console.log(`  - Adding ${field.name} column...`);
        await queryInterface.addColumn('sellers', field.name, {
          type: field.type,
          allowNull: true
        });
        console.log(`  ✓ Added ${field.name} column.`);
      } else {
        console.log(`  - ${field.name} column already exists, skipping.`);
      }
    }

    // Add indexes for business location queries (from migration 023)
    const [businessStateIndexResult] = await queryInterface.sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'sellers' AND indexname = 'idx_sellers_business_state'
    `);

    if (businessStateIndexResult.length === 0) {
      console.log('  - Adding business_state index...');
      // Add partial index for business_state (only non-null values)
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_sellers_business_state 
        ON sellers(business_state) 
        WHERE business_state IS NOT NULL
      `);
      console.log('  ✓ Added business_state index.');
    } else {
      console.log('  - business_state index already exists, skipping.');
    }

    const [businessCountryIndexResult] = await queryInterface.sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'sellers' AND indexname = 'idx_sellers_business_country'
    `);

    if (businessCountryIndexResult.length === 0) {
      console.log('  - Adding business_country index...');
      // Add partial index for business_country (only non-null values)
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_sellers_business_country 
        ON sellers(business_country) 
        WHERE business_country IS NOT NULL
      `);
      console.log('  ✓ Added business_country index.');
    } else {
      console.log('  - business_country index already exists, skipping.');
    }

    console.log('✅ Sellers business fields ensured.');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting sellers business fields migration...');

    // Remove indexes first (using raw SQL for partial indexes)
    try {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_sellers_business_country');
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_sellers_business_state');
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_sellers_tax_id');
    } catch (error) {
      // Indexes might not exist, continue
      console.log('  - Some indexes may not exist, continuing...');
    }

    // Remove columns
    const columnsToRemove = [
      'business_country',
      'business_postal_code',
      'business_state',
      'business_city',
      'business_address_line2',
      'business_address_line1',
      'business_phone',
      'tax_id',
      'stripe_account_type',
      'merchandise_type'
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn('sellers', column);
        console.log(`  ✓ Removed ${column} column.`);
      } catch (error) {
        console.log(`  - ${column} column does not exist, skipping.`);
      }
    }

    console.log('✅ Sellers business fields reverted.');
  }
};

