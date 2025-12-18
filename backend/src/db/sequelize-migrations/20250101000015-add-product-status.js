module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add status column to products table
    await queryInterface.addColumn('products', 'status', {
      type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'ADMIN_DELETE', 'PENDING', 'SOLD', 'SHIPPED', 'CLOSED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      after: 'is_kappa_branded'
    });

    // Update all existing products to have ACTIVE status
    await queryInterface.sequelize.query(
      `UPDATE products SET status = 'ACTIVE' WHERE status IS NULL`
    );

    // Add index on status column for query performance
    await queryInterface.addIndex('products', ['status'], {
      name: 'products_status_idx'
    });

    console.log('✅ Added status column to products table with index');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    await queryInterface.removeIndex('products', 'products_status_idx');
    
    // Remove status column
    await queryInterface.removeColumn('products', 'status');
    
    console.log('✅ Removed status column from products table');
  }
};
