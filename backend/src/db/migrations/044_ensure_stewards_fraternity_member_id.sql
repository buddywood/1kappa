-- Migration: Ensure stewards.fraternity_member_id column exists
-- Date: Fix for databases where column might still be named member_id
-- 
-- This migration ensures that the stewards table has fraternity_member_id column
-- regardless of how the table was created (schema.sql or migrations)

DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Only proceed if stewards table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stewards') THEN
    -- Check if fraternity_member_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stewards' AND column_name = 'fraternity_member_id') THEN
      -- Check if member_id exists (old column name)
      IF EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stewards' AND column_name = 'member_id') THEN
        -- Drop NOT NULL constraint if it exists before renaming
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'stewards' 
                   AND constraint_type = 'CHECK'
                   AND constraint_name LIKE '%member_id%') THEN
          -- Try to find and drop the constraint
          SELECT conname INTO constraint_name_var
          FROM pg_constraint
          WHERE conrelid = 'stewards'::regclass
          AND contype = 'c'
          AND conname LIKE '%member_id%';
          
          IF constraint_name_var IS NOT NULL THEN
            EXECUTE format('ALTER TABLE stewards DROP CONSTRAINT %I', constraint_name_var);
            RAISE NOTICE 'Dropped check constraint on stewards.member_id';
          END IF;
        END IF;
        
        -- Drop foreign key constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'stewards' 
                   AND constraint_type = 'FOREIGN KEY'
                   AND constraint_name LIKE '%member_id%') THEN
          SELECT conname INTO constraint_name_var
          FROM pg_constraint
          WHERE conrelid = 'stewards'::regclass
          AND contype = 'f'
          AND conname LIKE '%member_id%';
          
          IF constraint_name_var IS NOT NULL THEN
            EXECUTE format('ALTER TABLE stewards DROP CONSTRAINT %I', constraint_name_var);
            RAISE NOTICE 'Dropped foreign key constraint on stewards.member_id';
          END IF;
        END IF;
        
        -- Check if column has NOT NULL constraint and drop it temporarily
        -- We'll need to alter the column to allow NULL, rename, then add NOT NULL back
        ALTER TABLE stewards ALTER COLUMN member_id DROP NOT NULL;
        ALTER TABLE stewards RENAME COLUMN member_id TO fraternity_member_id;
        ALTER TABLE stewards ALTER COLUMN fraternity_member_id SET NOT NULL;
        
        -- Recreate foreign key constraint
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
          ALTER TABLE stewards ADD CONSTRAINT stewards_fraternity_member_id_fkey 
            FOREIGN KEY (fraternity_member_id) REFERENCES fraternity_members(id) ON DELETE RESTRICT;
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
          ALTER TABLE stewards ADD CONSTRAINT stewards_fraternity_member_id_fkey 
            FOREIGN KEY (fraternity_member_id) REFERENCES members(id) ON DELETE RESTRICT;
        END IF;
        
        -- Recreate index
        DROP INDEX IF EXISTS idx_stewards_member_id;
        CREATE INDEX IF NOT EXISTS idx_stewards_fraternity_member_id ON stewards(fraternity_member_id);
        
        RAISE NOTICE 'Renamed stewards.member_id to fraternity_member_id';
      ELSE
        -- Neither column exists, add fraternity_member_id
        -- Check if fraternity_members table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
          ALTER TABLE stewards ADD COLUMN fraternity_member_id INTEGER NOT NULL REFERENCES fraternity_members(id) ON DELETE RESTRICT;
          CREATE INDEX IF NOT EXISTS idx_stewards_fraternity_member_id ON stewards(fraternity_member_id);
          RAISE NOTICE 'Added stewards.fraternity_member_id column';
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
          -- Fallback to members table if fraternity_members doesn't exist yet
          ALTER TABLE stewards ADD COLUMN fraternity_member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT;
          CREATE INDEX IF NOT EXISTS idx_stewards_fraternity_member_id ON stewards(fraternity_member_id);
          RAISE NOTICE 'Added stewards.fraternity_member_id column (referencing members table)';
        ELSE
          RAISE WARNING 'Cannot add fraternity_member_id to stewards: neither fraternity_members nor members table exists';
        END IF;
      END IF;
    ELSE
      RAISE NOTICE 'stewards.fraternity_member_id column already exists';
    END IF;
  ELSE
    RAISE NOTICE 'stewards table does not exist, skipping';
  END IF;
END $$;

