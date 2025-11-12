import pool from '../db/connection';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Professional industries list
const PROFESSIONAL_INDUSTRIES = [
  'Accounting',
  'Advertising',
  'Aerospace',
  'Agriculture',
  'Architecture',
  'Automotive',
  'Banking',
  'Biotechnology',
  'Broadcasting',
  'Chemical',
  'Civil Engineering',
  'Communications',
  'Computer Hardware',
  'Computer Software',
  'Consulting',
  'Construction',
  'Consumer Goods',
  'Cybersecurity',
  'Data Science',
  'Education',
  'Energy',
  'Engineering',
  'Entertainment',
  'Environmental',
  'Fashion',
  'Finance',
  'Food & Beverage',
  'Government',
  'Healthcare',
  'Hospitality',
  'Human Resources',
  'Insurance',
  'Investment Banking',
  'Legal',
  'Logistics',
  'Manufacturing',
  'Marketing',
  'Media',
  'Medical Devices',
  'Nonprofit',
  'Pharmaceuticals',
  'Philanthropy',
  'Public Relations',
  'Real Estate',
  'Retail',
  'Sales',
  'Social Services',
  'Sports',
  'Telecommunications',
  'Transportation',
  'Travel',
  'Utilities',
  'Venture Capital',
  'Other',
];

async function seedIndustries() {
  try {
    console.log('🌱 Seeding industries...\n');

    let order = 0;
    for (const industryName of PROFESSIONAL_INDUSTRIES) {
      try {
        await pool.query(
          `INSERT INTO industries (name, display_order, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT (name) DO NOTHING`,
          [industryName, order]
        );
        console.log(`✓ Added: ${industryName}`);
        order++;
      } catch (error: any) {
        // Skip if already exists (handled by ON CONFLICT)
        if (error.code !== '23505') {
          console.error(`✗ Error adding ${industryName}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${PROFESSIONAL_INDUSTRIES.length} industries`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding industries:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedIndustries();
}

export default seedIndustries;

