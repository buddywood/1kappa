import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

/**
 * Cleanup script to remove raw SQL migration entries from SequelizeMeta
 * 
 * Since we're now using Sequelize migrations exclusively, we should remove
 * any entries for raw SQL migrations (.sql files) from the SequelizeMeta table.
 * 
 * Run with: npm run cleanup:sql-migrations
 */

async function cleanupSqlMigrations() {
  console.log('🧹 Cleaning up raw SQL migration entries from SequelizeMeta...\n');

  try {
    // Get all SQL migration entries
    const result = await pool.query(`
      SELECT name 
      FROM "SequelizeMeta" 
      WHERE name LIKE '%.sql'
      ORDER BY name
    `);

    const sqlMigrations = result.rows.map((row: any) => row.name);

    if (sqlMigrations.length === 0) {
      console.log('✅ No SQL migration entries found in SequelizeMeta');
      return;
    }

    console.log(`Found ${sqlMigrations.length} SQL migration entries:`);
    sqlMigrations.forEach((migration: string) => {
      console.log(`  - ${migration}`);
    });

    // Remove them
    await pool.query(`
      DELETE FROM "SequelizeMeta" 
      WHERE name LIKE '%.sql'
    `);

    console.log(`\n✅ Removed ${sqlMigrations.length} SQL migration entries from SequelizeMeta`);
    console.log('\n💡 Note: The actual database schema is unchanged.');
    console.log('   Only the migration tracking entries were removed.');
    console.log('   Run migrations again to ensure all Sequelize migrations are applied.\n');
  } catch (error: any) {
    console.error('❌ Error cleaning up SQL migrations:', error.message);
    throw error;
  }
}

if (require.main === module) {
  cleanupSqlMigrations()
    .then(() => {
      console.log('Cleanup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

