-- Migration: Ensure promoters.fraternity_member_id column exists
-- Date: Fix for databases where column might be missing
-- 
-- This migration ensures that the promoters table has fraternity_member_id column
-- regardless of how the table was created (schema.sql or migrations)

DO $$
BEGIN
  -- Only proceed if promoters table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promoters') THEN
    -- Check if fraternity_member_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promoters' AND column_name = 'fraternity_member_id') THEN
      -- Check if member_id exists (old column name)
      IF EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'promoters' AND column_name = 'member_id') THEN
        -- Rename member_id to fraternity_member_id
        ALTER TABLE promoters RENAME COLUMN member_id TO fraternity_member_id;
        RAISE NOTICE 'Renamed promoters.member_id to fraternity_member_id';
      ELSE
        -- Neither column exists, add fraternity_member_id
        -- Check if fraternity_members table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fraternity_members') THEN
          ALTER TABLE promoters ADD COLUMN fraternity_member_id INTEGER REFERENCES fraternity_members(id) ON DELETE SET NULL;
          CREATE INDEX IF NOT EXISTS idx_promoters_fraternity_member_id ON promoters(fraternity_member_id);
          RAISE NOTICE 'Added promoters.fraternity_member_id column';
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
          -- Fallback to members table if fraternity_members doesn't exist yet
          ALTER TABLE promoters ADD COLUMN fraternity_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL;
          CREATE INDEX IF NOT EXISTS idx_promoters_fraternity_member_id ON promoters(fraternity_member_id);
          RAISE NOTICE 'Added promoters.fraternity_member_id column (referencing members table)';
        ELSE
          RAISE WARNING 'Cannot add fraternity_member_id to promoters: neither fraternity_members nor members table exists';
        END IF;
      END IF;
    ELSE
      RAISE NOTICE 'promoters.fraternity_member_id column already exists';
    END IF;
  ELSE
    RAISE NOTICE 'promoters table does not exist, skipping';
  END IF;
END $$;

