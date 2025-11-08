import pool from './connection';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    await runMigrations();
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

