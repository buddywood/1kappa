'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔍 Ensuring orders table has user_id and shipping address fields...');

    // Check if user_id column exists
    const [userIdResult] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'orders' AND column_name = 'user_id'
    `);

    if (userIdResult.length === 0) {
      console.log('  - Adding user_id column...');
      // Add column without NOT NULL first (will set after data migration if needed)
      await queryInterface.addColumn('orders', 'user_id', {
        type: Sequelize.INTEGER,
        allowNull: true // Will be set to false after migration if no NULL values
      });

      // Migrate existing data from buyer_email if it exists
      const [buyerEmailResult] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'buyer_email'
      `);

      if (buyerEmailResult.length > 0) {
        console.log('  - Migrating existing orders from buyer_email to user_id...');
        await queryInterface.sequelize.query(`
          UPDATE orders o
          SET user_id = u.id
          FROM users u
          WHERE o.buyer_email = u.email
            AND o.user_id IS NULL
        `);

        // Drop buyer_email column
        await queryInterface.removeColumn('orders', 'buyer_email');
        console.log('  - Dropped buyer_email column.');
      }

      // Add foreign key constraint
      await queryInterface.addConstraint('orders', {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'orders_user_id_fkey',
        references: {
          table: 'users',
          field: 'id'
        },
        onDelete: 'SET NULL'
      });
      console.log('  - Added foreign key constraint on orders.user_id.');

      // Check if we can make it NOT NULL
      const nullCountResult = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM orders WHERE user_id IS NULL
      `, { type: Sequelize.QueryTypes.SELECT });

      const nullCount = nullCountResult[0]?.count || '0';
      if (nullCount === '0' || parseInt(nullCount, 10) === 0) {
        await queryInterface.changeColumn('orders', 'user_id', {
          type: Sequelize.INTEGER,
          allowNull: false
        });
        console.log('  - Set user_id to NOT NULL.');
      } else {
        console.log('  ⚠️  Cannot set user_id to NOT NULL - there are orders with NULL user_id.');
      }

      // Add index
      await queryInterface.addIndex('orders', ['user_id'], {
        name: 'idx_orders_user_id'
      });
      console.log('  ✓ Added user_id column, constraint, and index.');
    } else {
      console.log('  - user_id column already exists, skipping.');
    }

    // Add shipping address fields
    const shippingFields = [
      { name: 'shipping_street', type: Sequelize.STRING(255) },
      { name: 'shipping_city', type: Sequelize.STRING(100) },
      { name: 'shipping_state', type: Sequelize.STRING(2) },
      { name: 'shipping_zip', type: Sequelize.STRING(20) },
      { name: 'shipping_country', type: Sequelize.STRING(2), defaultValue: 'US' }
    ];

    for (const field of shippingFields) {
      const [fieldResult] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = '${field.name}'
      `);

      if (fieldResult.length === 0) {
        console.log(`  - Adding ${field.name} column...`);
        await queryInterface.addColumn('orders', field.name, {
          type: field.type,
          allowNull: true,
          defaultValue: field.defaultValue
        });
        console.log(`  ✓ Added ${field.name} column.`);
      } else {
        console.log(`  - ${field.name} column already exists, skipping.`);
      }
    }

    // Add index for shipping_state
    const [shippingStateIndexResult] = await queryInterface.sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'orders' AND indexname = 'idx_orders_shipping_state'
    `);

    if (shippingStateIndexResult.length === 0) {
      console.log('  - Adding shipping_state index...');
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_shipping_state 
        ON orders(shipping_state) 
        WHERE shipping_state IS NOT NULL
      `);
      console.log('  ✓ Added shipping_state index.');
    } else {
      console.log('  - shipping_state index already exists, skipping.');
    }

    console.log('✅ Orders user_id and shipping address fields ensured.');
  },

  async down(queryInterface, Sequelize) {
    console.log('⬇️ Reverting orders user_id and shipping address fields...');

    // Remove shipping address fields
    const shippingFields = ['shipping_country', 'shipping_zip', 'shipping_state', 'shipping_city', 'shipping_street'];
    for (const field of shippingFields) {
      try {
        await queryInterface.removeColumn('orders', field);
        console.log(`  ✓ Removed ${field} column.`);
      } catch (error) {
        console.log(`  - ${field} column does not exist, skipping.`);
      }
    }

    // Remove index
    try {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_orders_shipping_state');
      await queryInterface.removeIndex('orders', 'idx_orders_user_id');
    } catch (error) {
      console.log('  - Some indexes may not exist, continuing...');
    }

    // Remove user_id column (this will also remove the foreign key)
    try {
      await queryInterface.removeConstraint('orders', 'orders_user_id_fkey');
      await queryInterface.removeColumn('orders', 'user_id');
      console.log('  ✓ Removed user_id column and constraint.');
    } catch (error) {
      console.log('  - user_id column does not exist, skipping.');
    }

    console.log('✅ Orders user_id and shipping address fields reverted.');
  }
};

