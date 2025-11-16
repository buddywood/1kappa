-- Migration: Add steward_listing_images table for multiple listing photos
-- Created: 2024

-- Create steward_listing_images table
CREATE TABLE IF NOT EXISTS steward_listing_images (
  id SERIAL PRIMARY KEY,
  steward_listing_id INTEGER NOT NULL REFERENCES steward_listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_steward_listing_images_listing_id ON steward_listing_images(steward_listing_id);
CREATE INDEX IF NOT EXISTS idx_steward_listing_images_display_order ON steward_listing_images(steward_listing_id, display_order);

-- Migrate existing image_url from steward_listings to steward_listing_images
-- This preserves existing single images
INSERT INTO steward_listing_images (steward_listing_id, image_url, display_order)
SELECT id, image_url, 0
FROM steward_listings
WHERE image_url IS NOT NULL AND image_url != '';

-- Note: We keep image_url in steward_listings table for backward compatibility
-- but new code should use steward_listing_images table

