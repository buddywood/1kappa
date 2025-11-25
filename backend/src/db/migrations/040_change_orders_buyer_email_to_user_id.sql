-- Migration: Change orders.buyer_email to orders.user_id
-- Date: All purchasers must have user accounts, so reference user_id instead of email
--
-- This migration:
-- 1. Adds user_id column to orders table
-- 2. Migrates existing data by matching buyer_email to users.email
-- 3. Drops buyer_email column
-- 4. Adds foreign key constraint to users table

DO $$
BEGIN
  -- Ensure users table exists before proceeding
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'users table does not exist. Please ensure schema.sql has been run first.';
  END IF;

  -- Step 1: Add user_id column (without constraint first, add constraint after)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    -- Add column without foreign key constraint first
    ALTER TABLE orders ADD COLUMN user_id INTEGER;
    RAISE NOTICE 'Added user_id column to orders table';
  END IF;

  -- Step 2: Migrate existing data - match buyer_email to users.email
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'buyer_email'
  ) THEN
    UPDATE orders o
    SET user_id = u.id
    FROM users u
    WHERE o.buyer_email = u.email
      AND o.user_id IS NULL;
    
    RAISE NOTICE 'Migrated existing orders from buyer_email to user_id';
    
    -- Step 3: Drop buyer_email column
    ALTER TABLE orders DROP COLUMN buyer_email;
    RAISE NOTICE 'Dropped buyer_email column from orders table';
  END IF;

  -- Step 4: Add foreign key constraint to users table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders' AND constraint_name = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint on orders.user_id';
  END IF;

  -- Step 5: Make user_id NOT NULL (after migration is complete)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    -- Only make NOT NULL if there are no NULL values
    IF NOT EXISTS (SELECT 1 FROM orders WHERE user_id IS NULL) THEN
      ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;
      RAISE NOTICE 'Set user_id to NOT NULL';
    ELSE
      RAISE WARNING 'Cannot set user_id to NOT NULL - there are orders with NULL user_id. Please review and update manually.';
    END IF;
  END IF;

  -- Step 6: Create index for performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_orders_user_id'
  ) THEN
    CREATE INDEX idx_orders_user_id ON orders(user_id);
    RAISE NOTICE 'Created index on orders.user_id';
  END IF;
END $$;

