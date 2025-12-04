import pool from './connection';
import dotenv from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

/**
 * Foundational database seeder
 * 
 * Seeds all foundational reference data that should exist in all environments.
 * All seed functions are idempotent and will skip existing data.
 * 
 * Includes:
 * - Roles (6 total: ADMIN, SELLER, MEMBER, PROMOTER, GUEST, STEWARD)
 * - Event Types (9 total)
 * - Event Audience Types (3 total)
 * - Industries (50 total) - FOUNDATIONAL
 * - Professions (32 total) - FOUNDATIONAL
 * - Chapters (Collegiate + Alumni)
 * - Provinces (updated based on state)
 */

async function runScript(scriptPath: string, args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = spawn('tsx', [scriptPath, ...args], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '../..'),
    });

    script.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    script.on('error', (error) => {
      reject(error);
    });
  });
}

async function seedEventTypes(): Promise<void> {
  console.log('📅 Seeding event types...\n');

  const eventTypes = [
    { enum: 'SOCIAL', description: 'Social', display_order: 1 },
    { enum: 'NETWORKING', description: 'Networking / Professional', display_order: 2 },
    { enum: 'EDUCATIONAL', description: 'Educational', display_order: 3 },
    { enum: 'FUNDRAISING', description: 'Fundraising / Charity', display_order: 4 },
    { enum: 'COMMUNITY_SERVICE', description: 'Community Service', display_order: 5 },
    { enum: 'WELLNESS_SPORTS', description: 'Wellness & Sports', display_order: 6 },
    { enum: 'VIRTUAL', description: 'Virtual Events', display_order: 7 },
    { enum: 'CREATIVE_WORKSHOP', description: 'Creative Workshops', display_order: 8 },
    { enum: 'EXCLUSIVE_VIP', description: 'Exclusive / VIP', display_order: 9 },
  ];

  let inserted = 0;
  let skipped = 0;

  for (const eventType of eventTypes) {
    try {
      const result = await pool.query(
        `INSERT INTO event_types (enum, description, display_order, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (enum) DO NOTHING
         RETURNING id`,
        [eventType.enum, eventType.description, eventType.display_order]
      );

      if (result.rows.length > 0) {
        inserted++;
        console.log(`  ✓ Added: ${eventType.description}`);
      } else {
        skipped++;
      }
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  ✗ Error adding ${eventType.description}:`, error.message);
      } else {
        skipped++;
      }
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}\n`);
}

async function seedEventAudienceTypes(): Promise<void> {
  console.log('👥 Seeding event audience types...\n');

  const audienceTypes = [
    { enum: 'CHAPTER', description: 'Chapter', display_order: 1 },
    { enum: 'ONE_KAPPA', description: 'One Kappa (All Members)', display_order: 2 },
    { enum: 'GENERAL_PUBLIC', description: 'General Public', display_order: 3 },
  ];

  let inserted = 0;
  let skipped = 0;

  for (const audienceType of audienceTypes) {
    try {
      const result = await pool.query(
        `INSERT INTO event_audience_types (enum, description, display_order, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (enum) DO NOTHING
         RETURNING id`,
        [audienceType.enum, audienceType.description, audienceType.display_order]
      );

      if (result.rows.length > 0) {
        inserted++;
        console.log(`  ✓ Added: ${audienceType.description}`);
      } else {
        skipped++;
      }
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  ✗ Error adding ${audienceType.description}:`, error.message);
      } else {
        skipped++;
      }
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}\n`);
}

async function seedRoles(): Promise<void> {
  console.log('🔐 Seeding roles...\n');

  const roles = [
    { name: 'ADMIN', description: 'System administrator with full access', display_order: 1 },
    { name: 'SELLER', description: 'User who can sell products on the platform', display_order: 2 },
    { name: 'MEMBER', description: 'Verified fraternity member', display_order: 2.5 },
    { name: 'PROMOTER', description: 'User who can promote events', display_order: 3 },
    { name: 'GUEST', description: 'Regular user who can browse and purchase', display_order: 4 },
    { name: 'STEWARD', description: 'User who can manage steward listings', display_order: 5 },
  ];

  let inserted = 0;
  let skipped = 0;

  for (const role of roles) {
    try {
      const result = await pool.query(
        `INSERT INTO roles (name, description, display_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [role.name, role.description, role.display_order]
      );

      if (result.rows.length > 0) {
        inserted++;
        console.log(`  ✓ Added: ${role.name}`);
      } else {
        skipped++;
      }
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  ✗ Error adding ${role.name}:`, error.message);
      } else {
        skipped++;
      }
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}\n`);
}

/**
 * Seed industries - FOUNDATIONAL DATA
 * This is essential reference data that should exist in all environments.
 * Called as part of foundational seeding.
 */
async function seedIndustriesData(): Promise<void> {
  console.log('🏭 Seeding industries...\n');
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

  let inserted = 0;
  let skipped = 0;
  let order = 0;

  for (const industryName of PROFESSIONAL_INDUSTRIES) {
    try {
      const result = await pool.query(
        `INSERT INTO industries (name, display_order, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [industryName, order]
      );

      if (result.rows.length > 0) {
        inserted++;
        console.log(`  ✓ Added: ${industryName}`);
      } else {
        skipped++;
      }
      order++;
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  ✗ Error adding ${industryName}:`, error.message);
      } else {
        skipped++;
      }
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}\n`);
}

/**
 * Seed professions - FOUNDATIONAL DATA
 * This is essential reference data that should exist in all environments.
 * Called as part of foundational seeding.
 */
async function seedProfessionsData(): Promise<void> {
  console.log('💼 Seeding professions...\n');

  const PROFESSIONS = [
    'Accountant',
    'Actuary',
    'Architect',
    'Attorney',
    'Business Analyst',
    'Business Owner',
    'CEO/Executive',
    'Civil Engineer',
    'Consultant',
    'Data Analyst',
    'Data Scientist',
    'Dentist',
    'Designer',
    'Developer/Software Engineer',
    'Doctor/Physician',
    'Educator/Teacher',
    'Engineer',
    'Entrepreneur',
    'Financial Advisor',
    'Healthcare Professional',
    'Human Resources',
    'Investment Banker',
    'Marketing Professional',
    'Nurse',
    'Pharmacist',
    'Project Manager',
    'Real Estate Agent',
    'Sales Professional',
    'Social Worker',
    'Therapist',
    'Veterinarian',
    'Other',
  ];

  let inserted = 0;
  let skipped = 0;
  let order = 0;

  for (const professionName of PROFESSIONS) {
    try {
      const result = await pool.query(
        `INSERT INTO professions (name, display_order, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [professionName, order]
      );

      if (result.rows.length > 0) {
        inserted++;
        console.log(`  ✓ Added: ${professionName}`);
      } else {
        skipped++;
      }
      order++;
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  ✗ Error adding ${professionName}:`, error.message);
      } else {
        skipped++;
      }
    }
  }

  console.log(`  Inserted: ${inserted}, Skipped: ${skipped}\n`);
}

async function seedChapters(): Promise<void> {
  console.log('📚 Seeding chapters...\n');
  
  // Seed collegiate chapters (from Wikipedia)
  console.log('📖 Seeding collegiate chapters...');
  await runScript(path.join(__dirname, '../scripts/seed-chapters.ts'));
  
  // Seed alumni chapters
  console.log('\n📖 Seeding alumni chapters...');
  await runScript(path.join(__dirname, '../scripts/seed-alumni-chapters.ts'));
  
  console.log('\n✅ Chapters seeded successfully!\n');
}

async function updateProvinces(): Promise<void> {
  console.log('🗺️  Updating provinces for chapters...\n');
  
  // TODO: Add mapping for international chapters
  await runScript(path.join(__dirname, '../scripts/update-provinces.ts'));
  
  console.log('✅ Province updates completed!\n');
}

async function main() {
  try {
    console.log('🌱 Starting foundational database seeding...\n');
    console.log('This will seed all foundational reference data (idempotent - skips existing data)\n');

    // Seed reference tables first (no dependencies)
    // These are all foundational data required for the application to function
    await seedEventTypes();
    await seedEventAudienceTypes();
    await seedRoles();
    await seedIndustriesData(); // FOUNDATIONAL - Required for member profiles
    await seedProfessionsData(); // FOUNDATIONAL - Required for member profiles

    // Seed chapters (collegiate + alumni)
    await seedChapters();

    // Update provinces after chapters are seeded
    await updateProvinces();

    console.log('🎉 Foundational seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during foundational seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;

