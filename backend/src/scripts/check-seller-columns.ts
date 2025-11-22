import pool from '../db/connection';

async function checkSellerColumns() {
  try {
    // Check what columns exist
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sellers'
      AND column_name IN ('vendor_license_number', 'kappa_vendor_id')
      ORDER BY column_name;
    `);
    
    console.log('\n📋 Seller table columns (vendor_license_number / kappa_vendor_id):\n');
    
    if (result.rows.length === 0) {
      console.log('❌ Neither vendor_license_number nor kappa_vendor_id found in sellers table');
    } else {
      result.rows.forEach(row => {
        console.log(`  ✓ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
    }
    
    // Check all columns
    const allColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sellers'
      ORDER BY column_name;
    `);
    
    console.log('\n📋 All columns in sellers table:\n');
    allColumns.rows.forEach(row => {
      const isTarget = row.column_name === 'vendor_license_number' || row.column_name === 'kappa_vendor_id';
      const marker = isTarget ? ' ⭐' : '';
      console.log(`  - ${row.column_name}${marker}`);
    });
    
    // Try to manually run the migration SQL
    console.log('\n🔄 Attempting to manually apply migration...\n');
    
    try {
      await pool.query(`
        DO $$
        BEGIN
          -- If both columns exist, copy data and drop old column
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='sellers' 
                     AND column_name='vendor_license_number')
             AND EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name='sellers' 
                         AND column_name='kappa_vendor_id') THEN
            UPDATE sellers 
            SET kappa_vendor_id = vendor_license_number 
            WHERE kappa_vendor_id IS NULL AND vendor_license_number IS NOT NULL;
            
            ALTER TABLE sellers DROP COLUMN vendor_license_number;
            RAISE NOTICE 'Copied data and dropped vendor_license_number';
          -- If only vendor_license_number exists, rename it
          ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='sellers' 
                        AND column_name='vendor_license_number')
                AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                               WHERE table_name='sellers' 
                               AND column_name='kappa_vendor_id') THEN
            ALTER TABLE sellers RENAME COLUMN vendor_license_number TO kappa_vendor_id;
            RAISE NOTICE 'Renamed vendor_license_number to kappa_vendor_id';
          ELSE
            RAISE NOTICE 'No action needed - kappa_vendor_id already exists or vendor_license_number does not exist';
          END IF;
        END $$;
      `);
      console.log('✅ Migration SQL executed successfully');
      
      // Check again
      const afterResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'sellers'
        AND column_name IN ('vendor_license_number', 'kappa_vendor_id')
        ORDER BY column_name;
      `);
      
      console.log('\n📋 After migration:\n');
      if (afterResult.rows.length === 0) {
        console.log('❌ Neither column found');
      } else {
        afterResult.rows.forEach(row => {
          console.log(`  ✓ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
        });
      }
    } catch (error: any) {
      console.error('❌ Error running migration SQL:', error.message);
    }
    
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await pool.end();
  }
}

checkSellerColumns();

