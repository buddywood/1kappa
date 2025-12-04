'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    
    // Add MEMBER role to roles table
    await queryInterface.sequelize.query(`
      INSERT INTO roles (name, description, display_order)
      VALUES ('MEMBER', 'Verified fraternity member', 2.5)
      ON CONFLICT (name) DO NOTHING;
    `);

    // Update users table CHECK constraint to include MEMBER
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD', 'MEMBER'));
    `);

    // Update check_role_foreign_key constraint if it exists
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS check_role_foreign_key;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT check_role_foreign_key 
      CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD', 'MEMBER'));
    `);

    // Update any existing GUEST users with verified fraternity membership to MEMBER
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET role = 'MEMBER'
      WHERE u.role = 'GUEST'
      AND EXISTS (
        SELECT 1 
        FROM fraternity_members fm
        WHERE (fm.email = u.email OR fm.cognito_sub = u.cognito_sub)
        AND fm.verification_status = 'VERIFIED'
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert MEMBER users back to GUEST
    await queryInterface.sequelize.query(`
      UPDATE users
      SET role = 'GUEST'
      WHERE role = 'MEMBER';
    `);

    // Remove MEMBER from constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD'));
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS check_role_foreign_key;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT check_role_foreign_key 
      CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD'));
    `);

    // Remove MEMBER role from roles table
    await queryInterface.sequelize.query(`
      DELETE FROM roles WHERE name = 'MEMBER';
    `);
  }
};

