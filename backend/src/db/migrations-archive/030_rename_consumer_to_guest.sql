-- Rename CONSUMER role to GUEST
-- This migration updates both the roles reference table and all user records

DO $$
DECLARE
  problematic_count INTEGER;
  rec RECORD;
BEGIN
  -- Step 1: Drop constraints temporarily to allow updates
  ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role_foreign_key;
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

  -- Step 2: Update all users with CONSUMER role to GUEST first
  UPDATE users 
  SET role = 'GUEST',
      updated_at = CURRENT_TIMESTAMP
  WHERE role = 'CONSUMER';

  -- Step 3: Update roles table - delete CONSUMER and ensure GUEST exists
  DELETE FROM roles WHERE name = 'CONSUMER';
  
  -- Insert GUEST if it doesn't exist
  INSERT INTO roles (name, description, display_order) 
  VALUES ('GUEST', 'Regular user who can browse and purchase', 4)
  ON CONFLICT (name) DO UPDATE 
    SET description = 'Regular user who can browse and purchase',
        updated_at = CURRENT_TIMESTAMP;

  -- Step 4: Fix data to ensure all rows comply with constraint
  -- Fix any GUEST users that might have invalid foreign keys
  UPDATE users 
  SET seller_id = NULL, promoter_id = NULL, steward_id = NULL 
  WHERE role = 'GUEST' AND (seller_id IS NOT NULL OR promoter_id IS NOT NULL OR steward_id IS NOT NULL);
  
  -- Fix any SELLER users that might have invalid foreign keys
  UPDATE users 
  SET promoter_id = NULL, steward_id = NULL 
  WHERE role = 'SELLER' AND (promoter_id IS NOT NULL OR steward_id IS NOT NULL);
  
  -- Fix any PROMOTER users missing fraternity_member_id or having invalid foreign keys
  UPDATE users 
  SET seller_id = NULL, steward_id = NULL 
  WHERE role = 'PROMOTER' AND (seller_id IS NOT NULL OR steward_id IS NOT NULL);
  
  -- Ensure ADMIN users have proper nulls set
  UPDATE users 
  SET fraternity_member_id = NULL, seller_id = NULL, promoter_id = NULL, steward_id = NULL 
  WHERE role = 'ADMIN' AND (fraternity_member_id IS NOT NULL OR seller_id IS NOT NULL OR promoter_id IS NOT NULL OR steward_id IS NOT NULL);

  -- Step 5: Re-add constraints with GUEST instead of CONSUMER
  -- Add new role check constraint with GUEST
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('ADMIN', 'SELLER', 'PROMOTER', 'GUEST', 'STEWARD'));

  -- Check for problematic rows before adding constraint
  SELECT COUNT(*) INTO problematic_count
  FROM users WHERE NOT (
    (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
      (fraternity_member_id IS NOT NULL) OR 
      (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
    )) OR
    (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
    (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
    (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
      (seller_id IS NULL AND promoter_id IS NULL) OR
      (seller_id IS NOT NULL AND promoter_id IS NULL) OR
      (seller_id IS NULL AND promoter_id IS NOT NULL) OR
      (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
    )) OR
    (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
  );
  
  IF problematic_count > 0 THEN
    RAISE WARNING 'Found % rows that would violate check_role_foreign_key constraint', problematic_count;
    -- Log the problematic rows for debugging
    RAISE NOTICE 'Problematic rows:';
    FOR rec IN 
      SELECT id, email, role, fraternity_member_id, seller_id, promoter_id, steward_id, onboarding_status
      FROM users WHERE NOT (
        (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
          (fraternity_member_id IS NOT NULL) OR 
          (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
        )) OR
        (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
        (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
        (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
          (seller_id IS NULL AND promoter_id IS NULL) OR
          (seller_id IS NOT NULL AND promoter_id IS NULL) OR
          (seller_id IS NULL AND promoter_id IS NOT NULL) OR
          (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
        )) OR
        (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
      )
      LIMIT 10
    LOOP
      RAISE NOTICE '  User ID: %, Email: %, Role: %, fraternity_member_id: %, seller_id: %, promoter_id: %, steward_id: %, onboarding_status: %', 
        rec.id, rec.email, rec.role, rec.fraternity_member_id, rec.seller_id, rec.promoter_id, rec.steward_id, rec.onboarding_status;
    END LOOP;
  END IF;

  -- Only add constraint if no data violates it
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE NOT (
      (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
        (fraternity_member_id IS NOT NULL) OR 
        (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
      )) OR
      (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
      (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
      (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
        (seller_id IS NULL AND promoter_id IS NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NULL) OR
        (seller_id IS NULL AND promoter_id IS NOT NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
      )) OR
      (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
    )
  ) THEN
    -- Re-add check_role_foreign_key constraint with GUEST
    -- Note: SELLER users can have fraternity_member_id (sellers can be fraternity members)
    -- Note: PROMOTER users must have fraternity_member_id (promoters must be fraternity members)
    ALTER TABLE users ADD CONSTRAINT check_role_foreign_key CHECK (
      (role = 'GUEST' AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL AND (
        (fraternity_member_id IS NOT NULL) OR 
        (fraternity_member_id IS NULL AND onboarding_status != 'ONBOARDING_FINISHED')
      )) OR
      (role = 'SELLER' AND seller_id IS NOT NULL AND promoter_id IS NULL AND steward_id IS NULL) OR
      (role = 'PROMOTER' AND promoter_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND seller_id IS NULL AND steward_id IS NULL) OR
      (role = 'STEWARD' AND steward_id IS NOT NULL AND fraternity_member_id IS NOT NULL AND (
        (seller_id IS NULL AND promoter_id IS NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NULL) OR
        (seller_id IS NULL AND promoter_id IS NOT NULL) OR
        (seller_id IS NOT NULL AND promoter_id IS NOT NULL)
      )) OR
      (role = 'ADMIN' AND fraternity_member_id IS NULL AND seller_id IS NULL AND promoter_id IS NULL AND steward_id IS NULL)
    );
    RAISE NOTICE 'Successfully renamed CONSUMER role to GUEST and re-added constraints';
  ELSE
    RAISE WARNING 'Cannot add check_role_foreign_key constraint - existing data would violate it. Please review and fix data manually.';
    RAISE NOTICE 'Migration completed but constraint was not added due to data violations';
  END IF;
END $$;

