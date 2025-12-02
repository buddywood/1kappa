-- Migration: Rename vendor_license_number to kappa_vendor_id
-- Date: Better reflect that this is the Kappa Alpha Psi vendor ID
-- 
-- This field represents the Kappa Alpha Psi vendor ID/license number
-- required for sellers who sell Kappa branded merchandise

DO $$
BEGIN
  -- If both columns exist, copy data from vendor_license_number to kappa_vendor_id where kappa_vendor_id is null
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' 
             AND column_name='vendor_license_number')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' 
                 AND column_name='kappa_vendor_id') THEN
    -- Copy data from old column to new column where new column is null
    UPDATE sellers 
    SET kappa_vendor_id = vendor_license_number 
    WHERE kappa_vendor_id IS NULL AND vendor_license_number IS NOT NULL;
    
    -- Drop the old column
    ALTER TABLE sellers DROP COLUMN vendor_license_number;
    
    -- Update the comment to reflect the new name and purpose
    COMMENT ON COLUMN sellers.kappa_vendor_id IS 
      'Kappa Alpha Psi vendor ID/license number. Required for sellers who sell Kappa Alpha Psi branded merchandise.';
  -- If only vendor_license_number exists, rename it
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name='sellers' 
                AND column_name='vendor_license_number')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name='sellers' 
                       AND column_name='kappa_vendor_id') THEN
    ALTER TABLE sellers RENAME COLUMN vendor_license_number TO kappa_vendor_id;
    
    -- Update the comment to reflect the new name and purpose
    COMMENT ON COLUMN sellers.kappa_vendor_id IS 
      'Kappa Alpha Psi vendor ID/license number. Required for sellers who sell Kappa Alpha Psi branded merchandise.';
  END IF;

END $$;

