-- Add test Stripe account IDs to sellers that don't have them
-- This is for development/test purposes only

UPDATE sellers
SET stripe_account_id = 'acct_test_' || LPAD(id::text, 10, '0')
WHERE stripe_account_id IS NULL
  AND status = 'APPROVED';

-- Verify the update
SELECT id, email, name, stripe_account_id, status
FROM sellers
WHERE status = 'APPROVED'
ORDER BY id;

