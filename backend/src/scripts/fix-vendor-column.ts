import pool from '../db/connection';

/**
 * This script manually fixes the vendor_license_number -> kappa_vendor_id rename
 * Run this if the migration didn't apply to your local database
 */
async function fixVendorColumn() {
  try {
    console.log('🔍 Checking current state of sellers table...\n');
    
    // Check what columns exist
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sellers'
      AND column_name IN ('vendor_license_number', 'kappa_vendor_id')
      ORDER BY column_name;
    `);
    
    console.log('Current columns:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    const hasOldColumn = columns.rows.some(r => r.column_name === 'vendor_license_number');
    const hasNewColumn = columns.rows.some(r => r.column_name === 'kappa_vendor_id');
    
    if (!hasOldColumn && hasNewColumn) {
      console.log('\n✅ Column already renamed! kappa_vendor_id exists, vendor_license_number does not.');
      return;
    }
    
    if (hasOldColumn && hasNewColumn) {
      console.log('\n🔄 Both columns exist. Copying data and dropping old column...');
      
      // Copy data from old to new where new is null
      const updateResult = await pool.query(`
        UPDATE sellers 
        SET kappa_vendor_id = vendor_license_number 
        WHERE kappa_vendor_id IS NULL AND vendor_license_number IS NOT NULL;
      `);
      console.log(`  ✓ Copied ${updateResult.rowCount} rows`);
      
      // Drop old column
      await pool.query(`ALTER TABLE sellers DROP COLUMN vendor_license_number;`);
      console.log('  ✓ Dropped vendor_license_number column');
      
      // Add comment
      await pool.query(`
        COMMENT ON COLUMN sellers.kappa_vendor_id IS 
          'Kappa Alpha Psi vendor ID/license number. Required for sellers who sell Kappa Alpha Psi branded merchandise.';
      `);
      console.log('  ✓ Added column comment');
      
    } else if (hasOldColumn && !hasNewColumn) {
      console.log('\n🔄 Renaming vendor_license_number to kappa_vendor_id...');
      
      // Rename the column
      await pool.query(`ALTER TABLE sellers RENAME COLUMN vendor_license_number TO kappa_vendor_id;`);
      console.log('  ✓ Renamed column');
      
      // Add comment
      await pool.query(`
        COMMENT ON COLUMN sellers.kappa_vendor_id IS 
          'Kappa Alpha Psi vendor ID/license number. Required for sellers who sell Kappa Alpha Psi branded merchandise.';
      `);
      console.log('  ✓ Added column comment');
      
    } else {
      console.log('\n❌ Neither column exists. This is unexpected.');
      return;
    }
    
    // Verify final state
    const finalCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sellers'
      AND column_name IN ('vendor_license_number', 'kappa_vendor_id');
    `);
    
    console.log('\n✅ Final state:');
    if (finalCheck.rows.length === 0) {
      console.log('  ❌ Neither column found (unexpected)');
    } else {
      finalCheck.rows.forEach(row => {
        console.log(`  ✓ ${row.column_name} exists`);
      });
    }
    
    console.log('\n✅ Migration complete!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixVendorColumn();

