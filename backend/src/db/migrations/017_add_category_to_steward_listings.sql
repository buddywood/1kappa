-- Add category_id to steward_listings table
-- This allows steward listings to be categorized like products

ALTER TABLE steward_listings
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES product_categories(id);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_steward_listings_category ON steward_listings(category_id);

