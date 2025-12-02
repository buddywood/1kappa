-- Migration: Create user_addresses table
-- Date: Allow users to save multiple shipping addresses

-- Create user_addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100), -- e.g., "Home", "Work", "Mom's House"
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'US',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_default ON user_addresses(user_id, is_default) WHERE is_default = true;

-- Ensure only one default address per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_addresses_one_default 
ON user_addresses(user_id, is_default) 
WHERE is_default = true;

-- Add comment to document the table
COMMENT ON TABLE user_addresses IS 'Stores multiple shipping addresses per user for convenience';
COMMENT ON COLUMN user_addresses.label IS 'User-friendly label for the address (e.g., "Home", "Work")';
COMMENT ON COLUMN user_addresses.is_default IS 'Whether this is the default shipping address for the user';

