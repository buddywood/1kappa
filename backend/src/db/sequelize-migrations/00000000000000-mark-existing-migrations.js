'use strict';

/**
 * Migration to ensure SequelizeMeta table exists
 * 
 * This migration only creates the SequelizeMeta table if it doesn't exist.
 * We no longer mark raw SQL migrations as applied since we're using Sequelize migrations exclusively.
 * 
 * Note: If you have existing SQL migration entries in SequelizeMeta, run the cleanup script:
 * npm run cleanup:sql-migrations
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure SequelizeMeta table exists
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    console.log('✓ SequelizeMeta table ensured');
  },

  async down(queryInterface, Sequelize) {
    // Don't drop SequelizeMeta table as it may contain other migration records
    console.log('⚠️  Skipping SequelizeMeta table drop (preserving migration history)');
  }
};



