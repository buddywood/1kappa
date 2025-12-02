import pool from '../db/connection';
import { execSync } from 'child_process';
import path from 'path';

async function testMigrations() {
  try {
    console.log('🧪 Testing Sequelize migrations...\n');

    // 1. Check current state of stewards table
    console.log('1️⃣ Checking stewards table structure...');
    const stewardsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'stewards'
      AND column_name IN ('member_id', 'fraternity_member_id')
      ORDER BY column_name
    `);
    
    console.log('Current columns:', stewardsCheck.rows);
    
    const hasMemberId = stewardsCheck.rows.some((r: any) => r.column_name === 'member_id');
    const hasFraternityMemberId = stewardsCheck.rows.some((r: any) => r.column_name === 'fraternity_member_id');
    
    console.log(`  - member_id exists: ${hasMemberId}`);
    console.log(`  - fraternity_member_id exists: ${hasFraternityMemberId}\n`);

    // 2. Check migration status
    console.log('2️⃣ Checking migration status...');
    const migrationStatus = execSync('npx sequelize-cli db:migrate:status', {
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '..', '..')
    });
    
    const hasPromotersMigration = migrationStatus.includes('20250101000000-ensure-promoters-fraternity-member-id.js');
    const hasStewardsMigration = migrationStatus.includes('20250101000001-ensure-stewards-fraternity-member-id.js');
    
    console.log(`  - Promoters migration applied: ${hasPromotersMigration}`);
    console.log(`  - Stewards migration applied: ${hasStewardsMigration}\n`);

    // 3. If migrations are applied, undo them to test
    if (hasStewardsMigration && hasFraternityMemberId) {
      console.log('3️⃣ Undoing migrations to test them...');
      try {
        execSync('npx sequelize-cli db:migrate:undo', {
          encoding: 'utf-8',
          stdio: 'inherit',
          cwd: path.resolve(__dirname, '..', '..')
        });
        execSync('npx sequelize-cli db:migrate:undo', {
          encoding: 'utf-8',
          stdio: 'inherit',
          cwd: path.resolve(__dirname, '..', '..')
        });
        console.log('  ✓ Migrations undone\n');
      } catch (error) {
        console.log('  ⚠️  Could not undo migrations (might not have down methods)\n');
      }
    }

    // 4. After undoing migrations, add member_id column back to simulate the issue
    if (!hasFraternityMemberId && !hasMemberId) {
      console.log('4️⃣ Simulating issue: Adding member_id column (as it would exist in old schema)...');
      // Check if fraternity_members table exists to create foreign key
      const fmTableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'fraternity_members'
      `);
      
      if (fmTableCheck.rows.length > 0) {
        await pool.query(`
          ALTER TABLE stewards 
          ADD COLUMN member_id INTEGER NOT NULL REFERENCES fraternity_members(id) ON DELETE RESTRICT
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_stewards_member_id ON stewards(member_id)
        `);
        console.log('  ✓ Added member_id column\n');
      }
    } else if (hasFraternityMemberId && !hasMemberId) {
      console.log('4️⃣ Simulating issue: Renaming fraternity_member_id back to member_id...');
      await pool.query(`
        ALTER TABLE stewards RENAME COLUMN fraternity_member_id TO member_id
      `);
      console.log('  ✓ Renamed fraternity_member_id to member_id\n');
    }

    // 5. Check promoters table too
    console.log('5️⃣ Checking promoters table structure...');
    const promotersCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'promoters'
      AND column_name IN ('member_id', 'fraternity_member_id')
      ORDER BY column_name
    `);
    
    console.log('Current columns:', promotersCheck.rows);
    
    const promotersHasMemberId = promotersCheck.rows.some((r: any) => r.column_name === 'member_id');
    const promotersHasFraternityMemberId = promotersCheck.rows.some((r: any) => r.column_name === 'fraternity_member_id');
    
    console.log(`  - member_id exists: ${promotersHasMemberId}`);
    console.log(`  - fraternity_member_id exists: ${promotersHasFraternityMemberId}\n`);

    if (!promotersHasFraternityMemberId && !promotersHasMemberId) {
      console.log('6️⃣ Simulating issue: Adding promoters member_id column (as it would exist in old schema)...');
      const fmTableCheck2 = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'fraternity_members'
      `);
      
      if (fmTableCheck2.rows.length > 0) {
        await pool.query(`
          ALTER TABLE promoters 
          ADD COLUMN member_id INTEGER REFERENCES fraternity_members(id) ON DELETE SET NULL
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_promoters_member_id ON promoters(member_id)
        `);
        console.log('  ✓ Added member_id column\n');
      }
    } else if (promotersHasFraternityMemberId && !promotersHasMemberId) {
      console.log('6️⃣ Simulating issue: Renaming promoters fraternity_member_id back to member_id...');
      await pool.query(`
        ALTER TABLE promoters RENAME COLUMN fraternity_member_id TO member_id
      `);
      console.log('  ✓ Renamed fraternity_member_id to member_id\n');
    }

    // 6. Remove migrations from SequelizeMeta to force re-run
    console.log('7️⃣ Removing migrations from SequelizeMeta to force re-run...');
    await pool.query(`
      DELETE FROM "SequelizeMeta" 
      WHERE name IN (
        '20250101000000-ensure-promoters-fraternity-member-id.js',
        '20250101000001-ensure-stewards-fraternity-member-id.js'
      )
    `);
    console.log('  ✓ Removed from SequelizeMeta\n');

    // 7. Run migrations
    console.log('8️⃣ Running migrations...');
    execSync('npm run migrate', {
      encoding: 'utf-8',
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..', '..')
    });
    console.log('  ✓ Migrations completed\n');

    // 8. Verify the fix
    console.log('9️⃣ Verifying fix...');
    const finalCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name IN ('stewards', 'promoters')
      AND column_name IN ('member_id', 'fraternity_member_id')
      ORDER BY table_name, column_name
    `);
    
    console.log('Final columns:', finalCheck.rows);
    
    const finalHasMemberId = finalCheck.rows.some((r: any) => r.column_name === 'member_id');
    const finalHasFraternityMemberId = finalCheck.rows.some((r: any) => r.column_name === 'fraternity_member_id');
    
    if (finalHasMemberId) {
      console.log('  ❌ ERROR: member_id still exists!');
      process.exit(1);
    }
    
    if (!finalHasFraternityMemberId) {
      console.log('  ❌ ERROR: fraternity_member_id does not exist!');
      process.exit(1);
    }
    
    console.log('  ✅ SUCCESS: All columns correctly renamed to fraternity_member_id\n');
    console.log('✅ Migration test passed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testMigrations();

