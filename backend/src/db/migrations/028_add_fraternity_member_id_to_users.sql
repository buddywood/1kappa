-- Migration: Add fraternity_member_id column back to users table
-- Date: Users table should have fraternity_member_id populated during member registration
-- 
-- This migration:
-- 1. Adds fraternity_member_id column to users table if it doesn't exist
-- 2. Creates foreign key constraint to fraternity_members table
-- 3. Creates index for performance
-- 4. Updates check_role_foreign_key constraint to allow GUEST users to have fraternity_member_id

DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Add fraternity_member_id column to users table if it doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'fraternity_member_id') THEN
      -- Check if fraternity_members table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
        ALTER TABLE users ADD COLUMN fraternity_member_id INTEGER REFERENCES fraternity_members(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_users_fraternity_member_id ON users(fraternity_member_id);
        RAISE NOTICE 'Added users.fraternity_member_id column';
      ELSE
        RAISE EXCEPTION 'fraternity_members table does not exist. Migration 016 must be run first.';
      END IF;
    ELSE
      RAISE NOTICE 'users.fraternity_member_id column already exists';
    END IF;

    -- Update check_role_foreign_key constraint to allow GUEST users to have fraternity_member_id
    -- First, fix any existing data that might violate the constraint
    -- Ensure GUEST users have proper nulls set
    UPDATE users 
    SET seller_id = NULL, promoter_id = NULL, steward_id = NULL 
    WHERE role = 'GUEST' AND (seller_id IS NOT NULL OR promoter_id IS NOT NULL OR steward_id IS NOT NULL);
    
    -- Ensure SELLER users have proper nulls set (sellers can have fraternity_member_id)
    UPDATE users 
    SET promoter_id = NULL, steward_id = NULL 
    WHERE role = 'SELLER' AND (promoter_id IS NOT NULL OR steward_id IS NOT NULL);
    
    -- Ensure PROMOTER users have proper nulls set and fraternity_member_id
    -- If PROMOTER doesn't have fraternity_member_id, try to find it from promoters table
    -- Check which column exists in promoters table (member_id or fraternity_member_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'promoters' AND column_name = 'fraternity_member_id') THEN
      -- Use fraternity_member_id column
      UPDATE users u
      SET fraternity_member_id = p.fraternity_member_id,
          seller_id = NULL,
          steward_id = NULL
      FROM promoters p
      WHERE u.role = 'PROMOTER' 
        AND u.promoter_id = p.id
        AND u.fraternity_member_id IS NULL
        AND p.fraternity_member_id IS NOT NULL;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'promoters' AND column_name = 'member_id') THEN
      -- Use member_id column (before migration 016)
      UPDATE users u
      SET fraternity_member_id = p.member_id,
          seller_id = NULL,
          steward_id = NULL
      FROM promoters p
      WHERE u.role = 'PROMOTER' 
        AND u.promoter_id = p.id
        AND u.fraternity_member_id IS NULL
        AND p.member_id IS NOT NULL;
    END IF;
    
    -- If PROMOTER still doesn't have fraternity_member_id, we can't fix it automatically
    -- Set onboarding_status to prevent constraint violation
    UPDATE users
    SET onboarding_status = 'COGNITO_CONFIRMED'
    WHERE role = 'PROMOTER' 
      AND fraternity_member_id IS NULL
      AND onboarding_status = 'ONBOARDING_FINISHED';
    
    -- Ensure STEWARD users have fraternity_member_id
    -- If STEWARD doesn't have fraternity_member_id, try to find it from stewards table
    -- Check which column exists in stewards table (member_id or fraternity_member_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stewards' AND column_name = 'fraternity_member_id') THEN
      -- Use fraternity_member_id column
      UPDATE users u
      SET fraternity_member_id = s.fraternity_member_id
      FROM stewards s
      WHERE u.role = 'STEWARD' 
        AND u.steward_id = s.id
        AND u.fraternity_member_id IS NULL
        AND s.fraternity_member_id IS NOT NULL;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stewards' AND column_name = 'member_id') THEN
      -- Use member_id column (before migration 016)
      UPDATE users u
      SET fraternity_member_id = s.member_id
      FROM stewards s
      WHERE u.role = 'STEWARD' 
        AND u.steward_id = s.id
        AND u.fraternity_member_id IS NULL
        AND s.member_id IS NOT NULL;
    END IF;
    
    -- Ensure ADMIN users have proper nulls set
    UPDATE users 
    SET fraternity_member_id = NULL, seller_id = NULL, promoter_id = NULL, steward_id = NULL 
    WHERE role = 'ADMIN' AND (fraternity_member_id IS NOT NULL OR seller_id IS NOT NULL OR promoter_id IS NOT NULL OR steward_id IS NOT NULL);

    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
              WHERE table_name = 'users' AND constraint_name = 'check_role_foreign_key') THEN
      ALTER TABLE users DROP CONSTRAINT check_role_foreign_key;
      RAISE NOTICE 'Dropped check_role_foreign_key constraint';
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
      -- Recreate constraint allowing GUEST users to have fraternity_member_id
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
      RAISE NOTICE 'Recreated check_role_foreign_key constraint allowing GUEST users to have fraternity_member_id';
    ELSE
      RAISE WARNING 'Cannot add check_role_foreign_key constraint - existing data would violate it. Please review and fix data manually.';
    END IF;
  END IF;
END $$;

