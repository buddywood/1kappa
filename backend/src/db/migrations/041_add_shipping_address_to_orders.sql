-- Migration: Add shipping address fields to orders table
-- Date: Store shipping address for order fulfillment

-- Add shipping address fields
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_street VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(2),
ADD COLUMN IF NOT EXISTS shipping_zip VARCHAR(20),
ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(2) DEFAULT 'US';

-- Add index for shipping state queries (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_orders_shipping_state ON orders(shipping_state) WHERE shipping_state IS NOT NULL;

-- Add comment to document the fields
COMMENT ON COLUMN orders.shipping_street IS 'Shipping address street for order fulfillment';
COMMENT ON COLUMN orders.shipping_city IS 'Shipping address city for order fulfillment';
COMMENT ON COLUMN orders.shipping_state IS 'Shipping address state (2-letter code) for order fulfillment';
COMMENT ON COLUMN orders.shipping_zip IS 'Shipping address ZIP code for order fulfillment';
COMMENT ON COLUMN orders.shipping_country IS 'Shipping address country (2-letter code) for order fulfillment';

