-- Migration: Update fraternity_members table structure (formerly members)
-- Date: Initial migration
-- Adds cognito_sub, registration_status, makes fields nullable for drafts, adds verification fields
-- Updated to work with both 'members' (before migration 016) and 'fraternity_members' (after migration 016)
DO $$
BEGIN
  -- Check if fraternity_members table exists (after migration 016)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='fraternity_members') THEN
    -- Add cognito_sub to fraternity_members table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='fraternity_members' AND column_name='cognito_sub') THEN
      ALTER TABLE fraternity_members ADD COLUMN cognito_sub VARCHAR(255) UNIQUE;
    END IF;

    -- Add registration_status to fraternity_members table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='fraternity_members' AND column_name='registration_status') THEN
      ALTER TABLE fraternity_members ADD COLUMN registration_status VARCHAR(20) DEFAULT 'DRAFT' CHECK (registration_status IN ('DRAFT', 'COMPLETE'));
    END IF;

    -- Make initiated_chapter_id nullable if it's currently NOT NULL (for drafts)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='fraternity_members' AND column_name='initiated_chapter_id' AND is_nullable='NO') THEN
      ALTER TABLE fraternity_members ALTER COLUMN initiated_chapter_id DROP NOT NULL;
    END IF;

    -- Make name nullable if it's currently NOT NULL (for drafts)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='fraternity_members' AND column_name='name' AND is_nullable='NO') THEN
      ALTER TABLE fraternity_members ALTER COLUMN name DROP NOT NULL;
    END IF;

    -- Make membership_number nullable if it's currently NOT NULL (for drafts)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='fraternity_members' AND column_name='membership_number' AND is_nullable='NO') THEN
      ALTER TABLE fraternity_members ALTER COLUMN membership_number DROP NOT NULL;
    END IF;

    -- Add verification fields to fraternity_members table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='fraternity_members' AND column_name='verification_status') THEN
      ALTER TABLE fraternity_members ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='fraternity_members' AND column_name='verification_date') THEN
      ALTER TABLE fraternity_members ADD COLUMN verification_date TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='fraternity_members' AND column_name='verification_notes') THEN
      ALTER TABLE fraternity_members ADD COLUMN verification_notes TEXT;
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='members') THEN
    -- Fallback: work with members table (before migration 016)
    -- Add cognito_sub to members table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='members' AND column_name='cognito_sub') THEN
      ALTER TABLE members ADD COLUMN cognito_sub VARCHAR(255) UNIQUE;
    END IF;

    -- Add registration_status to members table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='members' AND column_name='registration_status') THEN
      ALTER TABLE members ADD COLUMN registration_status VARCHAR(20) DEFAULT 'DRAFT' CHECK (registration_status IN ('DRAFT', 'COMPLETE'));
    END IF;

    -- Make initiated_chapter_id nullable if it's currently NOT NULL (for drafts)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='members' AND column_name='initiated_chapter_id' AND is_nullable='NO') THEN
      ALTER TABLE members ALTER COLUMN initiated_chapter_id DROP NOT NULL;
    END IF;

    -- Make name nullable if it's currently NOT NULL (for drafts)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='members' AND column_name='name' AND is_nullable='NO') THEN
      ALTER TABLE members ALTER COLUMN name DROP NOT NULL;
    END IF;

    -- Make membership_number nullable if it's currently NOT NULL (for drafts)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='members' AND column_name='membership_number' AND is_nullable='NO') THEN
      ALTER TABLE members ALTER COLUMN membership_number DROP NOT NULL;
    END IF;

    -- Add verification fields to members table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='members' AND column_name='verification_status') THEN
      ALTER TABLE members ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='members' AND column_name='verification_date') THEN
      ALTER TABLE members ADD COLUMN verification_date TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='members' AND column_name='verification_notes') THEN
      ALTER TABLE members ADD COLUMN verification_notes TEXT;
    END IF;
  END IF;
END $$;

