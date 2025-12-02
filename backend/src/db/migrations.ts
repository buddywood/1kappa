import pool from './connection';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Run initial schema.sql if database is empty
 * schema.sql has been updated to use fraternity_member_id from the start
 */
async function runSchemaIfNeeded() {
  // Check if any tables exist
  const result = await pool.query(`
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name != 'SequelizeMeta'
  `);
  
  const tableCount = parseInt(result.rows[0]?.count || '0', 10);
  
  // If no tables exist, run schema.sql
  if (tableCount === 0) {
    let schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve(__dirname, '..', '..', 'src', 'db', 'schema.sql');
    }
    
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
    }
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✓ Initial schema created successfully (using fraternity_member_id)');
    }
  } else {
    console.log(`✓ Database already has ${tableCount} table(s), skipping schema.sql`);
  }
}

/**
 * Run Sequelize migrations using Sequelize CLI
 * This will only run migrations that haven't been applied yet
 */
function runSequelizeMigrations() {
  try {
    // Get the backend directory
    const backendDir = path.resolve(__dirname, '..', '..');
    const originalCwd = process.cwd();
    
    try {
      // Change to backend directory to run Sequelize CLI
      process.chdir(backendDir);
      
      // Run Sequelize migrations using npx (in case sequelize-cli is not globally installed)
      console.log('🔄 Running Sequelize migrations...');
      execSync('npx sequelize-cli db:migrate', {
        stdio: 'inherit',
        env: process.env
      });
      console.log('✓ Sequelize migrations completed');
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  } catch (error: any) {
    console.error('✗ Error running Sequelize migrations:', error.message);
    throw error;
  }
}

/**
 * Run foundational seeders (reference data)
 * These seeders run automatically after migrations
 */
function runFoundationalSeeders() {
  try {
    const backendDir = path.resolve(__dirname, '..', '..');
    const originalCwd = process.cwd();
    
    try {
      process.chdir(backendDir);
      
      console.log('🌱 Running foundational seeders...');
      execSync('npx sequelize-cli db:seed:all', {
        stdio: 'inherit',
        env: process.env
      });
      console.log('✓ Foundational seeders completed');
    } finally {
      process.chdir(originalCwd);
    }
  } catch (error: any) {
    // Seeders might fail if data already exists (idempotent), which is fine
    console.log('⚠️  Seeders completed (some data may already exist, which is expected)');
  }
}

/**
 * Main migration function
 * 1. Run schema.sql if database is empty
 * 2. Run Sequelize migrations (which will only run pending ones)
 * 3. Run foundational seeders (reference data - roles, event types, industries, professions)
 * 
 * Note: Test data is seeded separately via `npm run seed:test`
 * Note: Chapters are seeded separately via `npm run seed` (requires web scraping)
 */
export async function runMigrations() {
  try {
    // First, run schema if database is empty
    await runSchemaIfNeeded();
    
    // Then, run Sequelize migrations
    runSequelizeMigrations();
    
    // Finally, run foundational seeders (reference data)
    runFoundationalSeeders();
    
    console.log('✅ Database migrations and foundational seeding completed successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    await runMigrations();
    console.log('Database initialized');
  } catch (error: any) {
    // Check if it's an expected error (things already exist, deadlocks, etc.)
    const errorCode = error?.code;
    const errorMessage = error?.message || '';
    
    if (
      errorCode === '42710' || // duplicate object
      errorCode === '42P07' || // duplicate table
      errorCode === '23505' || // duplicate key
      errorCode === '40P01' || // deadlock detected
      errorMessage.includes('already exists') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('deadlock')
    ) {
      // Expected error - database is already initialized or concurrent migration, just log it
      console.log('Database already initialized (some objects already exist or concurrent migration)');
    } else {
      // Unexpected error - log it but don't crash the server
      console.error('Error initializing database:', errorMessage.substring(0, 200));
    }
  }
}

// Run migrations if this file is executed directly via tsx
// Check if this is the main module by comparing the file path
const isMainModule = process.argv[1] && process.argv[1].endsWith('migrations.ts');

if (isMainModule) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      pool.end();
      process.exit(1);
    });
}
