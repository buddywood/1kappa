-- Migration: Make vendor_license_number optional and add merchandise_type
-- Date: Allow NULL vendor_license_number for non-kappa merchandise sellers
-- Add merchandise_type field to track what type of merchandise sellers are selling

DO $$
BEGIN
  -- Make vendor_license_number nullable (currently NOT NULL in schema)
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sellers' 
             AND column_name='vendor_license_number' 
             AND is_nullable='NO') THEN
    ALTER TABLE sellers ALTER COLUMN vendor_license_number DROP NOT NULL;
  END IF;

  -- Add merchandise_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='sellers' AND column_name='merchandise_type') THEN
    ALTER TABLE sellers ADD COLUMN merchandise_type VARCHAR(20) 
      CHECK (merchandise_type IN ('KAPPA', 'NON_KAPPA', NULL))
      DEFAULT NULL;
  END IF;

END $$;

