/**
 * Integration tests for Stripe service
 * These tests make actual API calls to Stripe to validate credentials and functionality
 * 
 * WARNING: These tests make real API calls and may create test data in Stripe
 * Only run these tests when explicitly enabled with STRIPE_INTEGRATION_TEST=true
 * 
 * Usage:
 *   STRIPE_INTEGRATION_TEST=true npm test -- stripe-integration.test.ts
 */

import { stripe, createConnectAccount, createAccountLink } from '../stripe';

// Skip all tests unless explicitly enabled
const RUN_INTEGRATION_TESTS = process.env.STRIPE_INTEGRATION_TEST === 'true';

describe('Stripe Integration Tests', () => {
  // Store test account IDs for cleanup
  const testAccountIds: string[] = [];

  beforeAll(() => {
    if (!RUN_INTEGRATION_TESTS) {
      console.log('⚠️  Skipping Stripe integration tests. Set STRIPE_INTEGRATION_TEST=true to enable.');
      return;
    }

    // Validate that we have a secret key
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      throw new Error('STRIPE_SECRET_KEY must be set and be a valid secret key (starts with sk_)');
    }

    // Warn if using live key
    if (stripeKey.startsWith('sk_live_')) {
      console.warn('⚠️  WARNING: Using LIVE Stripe key! Tests will make real API calls to production.');
    } else {
      console.log('✅ Using test Stripe key. Safe to run integration tests.');
    }
  });

  afterAll(async () => {
    if (!RUN_INTEGRATION_TESTS) {
      return;
    }

    // Clean up test accounts
    for (const accountId of testAccountIds) {
      try {
        await stripe.accounts.del(accountId);
        console.log(`✅ Cleaned up test account: ${accountId}`);
      } catch (error: any) {
        console.warn(`⚠️  Failed to clean up account ${accountId}:`, error.message);
      }
    }
  });

  describe('Credential Validation', () => {
    it('should successfully authenticate with Stripe API', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        console.log('  ⏭️  Skipped (set STRIPE_INTEGRATION_TEST=true to run)');
        return;
      }

      // Make a simple API call to verify credentials
      // Retrieve our own platform account - this validates authentication
      const account = await stripe.accounts.retrieve();

      // If we get here, authentication succeeded
      expect(account).toBeDefined();
      expect(account.id).toBeDefined();
      console.log(`  ✅ Successfully authenticated. Platform account ID: ${account.id}`);
    });

    it('should retrieve account information (validates API access)', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      // Retrieve our own platform account to verify API access
      const account = await stripe.accounts.retrieve();

      expect(account).toBeDefined();
      expect(account.id).toBeDefined();
      expect(account.type).toBe('standard'); // Platform accounts are typically 'standard'
    });

    it('should have required permissions for Connect operations', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      // Try to list accounts to verify Connect permissions
      const accounts = await stripe.accounts.list({ limit: 1 });

      expect(accounts).toBeDefined();
      expect(accounts.data).toBeDefined();
      // If we can list accounts, we have Connect permissions
    });
  });

  describe('Connect Account Creation', () => {
    it('should create a test Connect Express account', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      const testEmail = `test-${Date.now()}@example.com`;
      
      const account = await createConnectAccount(testEmail, 'US');

      expect(account).toBeDefined();
      expect(account.id).toBeDefined();
      expect(account.id).toMatch(/^acct_/);
      expect(account.type).toBe('express');
      expect(account.email).toBe(testEmail);
      expect(account.country).toBe('US');

      // Store for cleanup
      testAccountIds.push(account.id);
    });

    it('should create account with requested capabilities', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      const testEmail = `test-${Date.now()}@example.com`;
      
      const account = await createConnectAccount(testEmail, 'US');

      expect(account.capabilities).toBeDefined();
      if (account.capabilities) {
        expect(account.capabilities.card_payments).toBeDefined();
        expect(account.capabilities.transfers).toBeDefined();
      }

      // Store for cleanup
      testAccountIds.push(account.id);
    });

    it('should create account link for onboarding', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      const testEmail = `test-${Date.now()}@example.com`;
      const account = await createConnectAccount(testEmail, 'US');
      testAccountIds.push(account.id);

      const returnUrl = 'https://example.com/return';
      const refreshUrl = 'https://example.com/refresh';
      
      const accountLinkUrl = await createAccountLink(account.id, returnUrl, refreshUrl);

      expect(accountLinkUrl).toBeDefined();
      expect(typeof accountLinkUrl).toBe('string');
      expect(accountLinkUrl).toMatch(/^https:\/\/connect\.stripe\.com\//);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid account operations gracefully', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      // Try to retrieve a non-existent account
      await expect(
        stripe.accounts.retrieve('acct_invalid1234567890')
      ).rejects.toThrow();
    });

    it('should validate email format when creating accounts', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      // Stripe should reject invalid email formats
      await expect(
        createConnectAccount('invalid-email', 'US')
      ).rejects.toThrow();
    });
  });

  describe('API Rate Limits and Quotas', () => {
    it('should handle API rate limits appropriately', async () => {
      if (!RUN_INTEGRATION_TESTS) {
        return;
      }

      // Make a few rapid requests to test rate limit handling
      const requests = Array(5).fill(null).map(() => 
        stripe.accounts.retrieve().catch((error: any) => {
          // Rate limit errors have specific codes
          if (error.code === 'rate_limit') {
            throw new Error('Rate limit exceeded');
          }
          return null;
        })
      );

      const results = await Promise.all(requests);
      
      // All requests should complete (or fail gracefully)
      expect(results.length).toBe(5);
    });
  });
});

