import pool from '../db/connection';
import fs from 'fs';
import path from 'path';

async function fixMissingTables() {
  try {
    console.log('🔍 Checking for missing tables...\n');

    // Check which tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('notifications', 'favorites', 'user_addresses')
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map((r: any) => r.table_name);
    console.log('Existing tables:', existingTables);

    const requiredTables = ['notifications', 'favorites', 'user_addresses'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✅ All required tables exist!');
      return;
    }

    console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}\n`);

    // Create missing tables
    for (const table of missingTables) {
      console.log(`📦 Creating ${table} table...`);
      
      let migrationFile: string;
      if (table === 'notifications') {
        migrationFile = path.join(__dirname, '..', 'db', 'migrations', '020_add_notifications_table.sql');
      } else if (table === 'favorites') {
        migrationFile = path.join(__dirname, '..', 'db', 'migrations', '019_add_favorites_table.sql');
      } else if (table === 'user_addresses') {
        migrationFile = path.join(__dirname, '..', 'db', 'migrations', '042_create_user_addresses_table.sql');
      } else {
        console.log(`  ⚠️  No migration file found for ${table}`);
        continue;
      }

      if (!fs.existsSync(migrationFile)) {
        console.log(`  ❌ Migration file not found: ${migrationFile}`);
        continue;
      }

      const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
      await pool.query(migrationSQL);
      console.log(`  ✅ Created ${table} table`);
    }

    console.log('\n✅ All missing tables have been created!');

  } catch (error: any) {
    console.error('❌ Error fixing missing tables:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixMissingTables();

