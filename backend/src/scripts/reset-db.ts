import pool from '../db/connection';
import { runMigrations } from '../db/migrations';
import dotenv from 'dotenv';
import path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

function showUsage() {
  console.log(`
🔄 Database Reset Tool

Usage:
  npm run reset:db -- [flags]

Flags:
  --dev        Development: Drop all tables + sequences, then re-run migrations
  --prod       Production: Clear all data only (DELETE FROM, preserve schema)
  --preview    Preview/Staging: Run migrations only, preserve all data
  --clear-test Optional: Combine with --preview to also clear test data (buddy+ users)

Examples:
  npm run reset:db -- --dev              # Reset dev database (drop + migrate)
  npm run reset:db -- --prod              # Reset prod database (clear data only)
  npm run reset:db -- --preview           # Preview: run migrations, preserve all data
  npm run reset:db -- --preview --clear-test  # Preview: run migrations, clear test data only
`);
}

async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function dropAllTables(): Promise<void> {
  console.log('🗑️  Dropping all tables and sequences...\n');

  // Get all table names
  const tablesResult = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  const tables = tablesResult.rows.map((row: any) => row.tablename);

  if (tables.length === 0) {
    console.log('✅ Database is already empty\n');
    return;
  }

  console.log(`📋 Found ${tables.length} tables to drop:`);
  tables.forEach((table: string) => {
    console.log(`   - ${table}`);
  });
  console.log('');

  // Drop all tables (CASCADE will handle foreign key constraints)
  for (const table of tables) {
    try {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✓ Dropped table: ${table}`);
    } catch (error: any) {
      console.error(`⚠️  Error dropping table ${table}:`, error.message);
    }
  }

  // Drop all sequences
  const sequencesResult = await pool.query(`
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  `);

  for (const seq of sequencesResult.rows) {
    try {
      await pool.query(`DROP SEQUENCE IF EXISTS ${seq.sequence_name} CASCADE`);
      console.log(`✓ Dropped sequence: ${seq.sequence_name}`);
    } catch (error: any) {
      // Ignore errors for sequences that don't exist
    }
  }

  console.log('\n✅ All tables and sequences dropped\n');
}

async function clearAllData(): Promise<void> {
  console.log('🧹 Clearing all data from tables (preserving schema)...\n');

  // Get all table names in dependency order (child tables first)
  const tablesResult = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  const tables = tablesResult.rows.map((row: any) => row.tablename);

  if (tables.length === 0) {
    console.log('✅ No tables found\n');
    return;
  }

  // Delete from all tables (CASCADE will handle foreign key constraints via ON DELETE)
  // We'll delete in reverse order to handle dependencies
  const tablesToDelete = [...tables].reverse();

  for (const table of tablesToDelete) {
    try {
      const result = await pool.query(`DELETE FROM ${table}`);
      const count = result.rowCount || 0;
      if (count > 0) {
        console.log(`✓ Cleared ${count} rows from: ${table}`);
      }
    } catch (error: any) {
      // Some tables might have constraints that prevent deletion, skip them
      if (error.message.includes('violates foreign key constraint')) {
        console.log(`⚠️  Skipped ${table} (has foreign key constraints)`);
      } else {
        console.error(`⚠️  Error clearing ${table}:`, error.message);
      }
    }
  }

  console.log('\n✅ All data cleared\n');
}

async function clearTestData(): Promise<void> {
  console.log('🧹 Clearing test data (buddy+ users only)...\n');

  // Delete in reverse order of dependencies
  await pool.query(
    "DELETE FROM events WHERE promoter_id IN (SELECT id FROM promoters WHERE email LIKE 'buddy+%@ebilly.com')"
  );
  await pool.query(
    "DELETE FROM promoters WHERE email LIKE 'buddy+%@ebilly.com'"
  );
  await pool.query(
    `DELETE FROM orders 
     WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'buddy+%@ebilly.com') 
     OR stripe_session_id LIKE 'test_session_%'`
  );
  await pool.query(
    "DELETE FROM products WHERE seller_id IN (SELECT id FROM sellers WHERE email LIKE 'buddy+%@ebilly.com')"
  );
  await pool.query(
    "DELETE FROM sellers WHERE email LIKE 'buddy+%@ebilly.com'"
  );
  await pool.query(
    "DELETE FROM users WHERE email LIKE 'buddy+%@ebilly.com'"
  );
  await pool.query(
    "DELETE FROM fraternity_members WHERE email LIKE 'buddy+%@ebilly.com'"
  );
  await pool.query(
    "DELETE FROM stewards WHERE fraternity_member_id IN (SELECT id FROM fraternity_members WHERE email LIKE 'buddy+%@ebilly.com')"
  );

  console.log('✓ Test data cleared\n');
}

async function resetDev(): Promise<void> {
  console.log('🔄 Development Reset: Dropping all tables and re-running migrations...\n');
  
  await dropAllTables();
  await runMigrations();
  
  console.log('✅ Development reset completed!\n');
}

async function resetProd(): Promise<void> {
  console.log('🔄 Production Reset: Clearing all data (preserving schema)...\n');
  
  const confirmed = await askConfirmation('⚠️  WARNING: This will delete ALL data. Are you sure?');
  
  if (!confirmed) {
    console.log('❌ Reset cancelled by user\n');
    return;
  }
  
  await clearAllData();
  
  console.log('✅ Production reset completed!\n');
}

async function resetPreview(clearTest: boolean): Promise<void> {
  console.log('🔄 Preview/Staging Reset: Running migrations only...\n');
  
  if (clearTest) {
    console.log('🧹 Also clearing test data...\n');
    await clearTestData();
  }
  
  await runMigrations();
  
  console.log('✅ Preview reset completed!\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  // Determine mode
  const isDev = args.includes('--dev');
  const isProd = args.includes('--prod');
  const isPreview = args.includes('--preview');
  const clearTest = args.includes('--clear-test');

  // Require explicit flag
  if (!isDev && !isProd && !isPreview) {
    console.log('❌ Please specify a reset mode: --dev, --prod, or --preview\n');
    showUsage();
    process.exit(1);
  }

  // Only allow one mode at a time
  const modeCount = [isDev, isProd, isPreview].filter(Boolean).length;
  if (modeCount > 1) {
    console.log('❌ Please specify only one mode: --dev, --prod, or --preview\n');
    showUsage();
    process.exit(1);
  }

  // --clear-test only works with --preview
  if (clearTest && !isPreview) {
    console.log('❌ --clear-test can only be used with --preview\n');
    showUsage();
    process.exit(1);
  }

  try {
    if (isDev) {
      await resetDev();
    } else if (isProd) {
      await resetProd();
    } else if (isPreview) {
      await resetPreview(clearTest);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { resetDev, resetProd, resetPreview, clearTestData, dropAllTables, clearAllData };
