import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Use DATABASE_URL_TEST in test environment, otherwise use DATABASE_URL
const databaseUrl = process.env.NODE_ENV === 'test'
  ? (process.env.DATABASE_URL_TEST || process.env.DATABASE_URL)
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in environment variables (or DATABASE_URL_TEST for tests)');
  throw new Error('DATABASE_URL is required (or DATABASE_URL_TEST for tests)');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' && (databaseUrl.includes('neon') || databaseUrl.includes('heroku')) 
    ? { rejectUnauthorized: false } 
    : false,
});

export default pool;

