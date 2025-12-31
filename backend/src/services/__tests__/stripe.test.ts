import Stripe from 'stripe';
import { getPlatformSetting } from '../../db/queries-sequelize';

// Set STRIPE_SECRET_KEY before any imports to ensure stripe service initializes
process.env.STRIPE_SECRET_KEY = 'sk_test_FAKE_KEY_FOR_TESTING_ONLY_NOT_A_REAL_KEY_1234567890';

// Mock dotenv to prevent loading from .env.local during tests
jest.mock('dotenv', () => ({
  config: jest.fn(() => ({})),
}));

// Mock Stripe before importing
const mockStripe = {
  accounts: {
    create: jest.fn(),
  },
  accountLinks: {
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

jest.mock('../../db/queries-sequelize', () => ({
  getPlatformSetting: jest.fn(),
}));

// Import after mocking
import {
  createConnectAccount,
  createAccountLink,
  createCheckoutSession,
  verifyWebhookSignature,
  calculateStewardPlatformFee,
  createChapterConnectAccount,
  createStewardCheckoutSession,
} from '../stripe';

describe('Stripe Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConnectAccount', () => {
    it('should create a Stripe Connect Express account', async () => {
      const email = 'seller@example.com';
      const country = 'US';
      const mockAccount: Stripe.Account = {
        id: 'acct_test123',
        type: 'express',
        country: 'US',
        email: email,
      } as Stripe.Account;

      mockStripe.accounts.create.mockResolvedValue(mockAccount);

      const result = await createConnectAccount(email, country);

      expect(result).toEqual(mockAccount);
      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
    });

    it('should use default country when not provided', async () => {
      const email = 'seller@example.com';
      const mockAccount: Stripe.Account = {
        id: 'acct_test123',
        type: 'express',
        country: 'US',
        email: email,
      } as Stripe.Account;

      mockStripe.accounts.create.mockResolvedValue(mockAccount);

      await createConnectAccount(email);

      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'US',
        })
      );
    });
  });

  describe('createAccountLink', () => {
    it('should create an account link for onboarding', async () => {
      const accountId = 'acct_test123';
      const returnUrl = 'https://example.com/return';
      const refreshUrl = 'https://example.com/refresh';
      const mockAccountLink = {
        url: 'https://connect.stripe.com/setup/test-link',
      };

      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);

      const result = await createAccountLink(accountId, returnUrl, refreshUrl);

      expect(result).toBe(mockAccountLink.url);
      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session with connected account', async () => {
      const params = {
        productId: 1,
        productName: 'Test Product',
        priceCents: 10000,
        connectedAccountId: 'acct_test123',
        buyerEmail: 'buyer@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        chapterId: 5,
      };
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      } as Stripe.Checkout.Session;

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await createCheckoutSession(params);

      expect(result).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: params.buyerEmail,
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: params.productName,
                }),
                unit_amount: params.priceCents,
              }),
            }),
          ]),
          payment_intent_data: expect.objectContaining({
            on_behalf_of: params.connectedAccountId,
            transfer_data: expect.objectContaining({
              destination: params.connectedAccountId,
            }),
          }),
          metadata: expect.objectContaining({
            product_id: '1',
            chapter_id: '5',
          }),
        })
      );
    });

    it('should calculate 8% application fee', async () => {
      const params = {
        productId: 1,
        productName: 'Test Product',
        priceCents: 10000,
        connectedAccountId: 'acct_test123',
        buyerEmail: 'buyer@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test123',
      } as Stripe.Checkout.Session;

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createCheckoutSession(params);

      const callArgs = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(callArgs.payment_intent_data?.application_fee_amount).toBe(800); // 8% of 10000
    });

    it('should handle optional chapterId', async () => {
      const params = {
        productId: 1,
        productName: 'Test Product',
        priceCents: 10000,
        connectedAccountId: 'acct_test123',
        buyerEmail: 'buyer@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test123',
      } as Stripe.Checkout.Session;

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createCheckoutSession(params);

      const callArgs = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(callArgs.metadata?.chapter_id).toBe('');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature', () => {
      const payload = 'test-payload';
      const signature = 'test-signature';
      const secret = 'test-secret';
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        type: 'checkout.session.completed',
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = verifyWebhookSignature(payload, signature, secret);

      expect(result).toEqual(mockEvent);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        secret
      );
    });

    it('should throw error for invalid signature', () => {
      const payload = 'test-payload';
      const signature = 'invalid-signature';
      const secret = 'test-secret';

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() => verifyWebhookSignature(payload, signature, secret)).toThrow('Invalid signature');
    });
  });

  describe('calculateStewardPlatformFee', () => {
    it('should calculate fee using percentage setting', async () => {
      const shippingCents = 1000;
      const donationCents = 2000;
      const total = shippingCents + donationCents;

      (getPlatformSetting as jest.Mock).mockResolvedValueOnce({
        key: 'steward_platform_fee_percentage',
        value: '0.10', // 10%
      });

      const result = await calculateStewardPlatformFee(shippingCents, donationCents);

      expect(result).toBe(300); // 10% of 3000
      expect(getPlatformSetting).toHaveBeenCalledWith('steward_platform_fee_percentage');
    });

    it('should calculate fee using flat fee setting', async () => {
      const shippingCents = 1000;
      const donationCents = 2000;

      (getPlatformSetting as jest.Mock)
        .mockResolvedValueOnce(null) // percentage setting not found
        .mockResolvedValueOnce({
          key: 'steward_platform_fee_flat_cents',
          value: '500',
        });

      const result = await calculateStewardPlatformFee(shippingCents, donationCents);

      expect(result).toBe(500);
      expect(getPlatformSetting).toHaveBeenCalledWith('steward_platform_fee_flat_cents');
    });

    it('should use default 5% when no settings found', async () => {
      const shippingCents = 1000;
      const donationCents = 2000;
      const total = shippingCents + donationCents;

      (getPlatformSetting as jest.Mock)
        .mockResolvedValueOnce(null) // percentage setting not found
        .mockResolvedValueOnce(null); // flat fee setting not found

      const result = await calculateStewardPlatformFee(shippingCents, donationCents);

      expect(result).toBe(150); // 5% of 3000
    });

    it('should handle invalid percentage setting', async () => {
      const shippingCents = 1000;
      const donationCents = 2000;

      (getPlatformSetting as jest.Mock)
        .mockResolvedValueOnce({
          key: 'steward_platform_fee_percentage',
          value: 'invalid',
        })
        .mockResolvedValueOnce({
          key: 'steward_platform_fee_flat_cents',
          value: '500',
        });

      const result = await calculateStewardPlatformFee(shippingCents, donationCents);

      expect(result).toBe(500); // Falls back to flat fee
    });

    it('should handle percentage greater than 1', async () => {
      const shippingCents = 1000;
      const donationCents = 2000;

      (getPlatformSetting as jest.Mock)
        .mockResolvedValueOnce({
          key: 'steward_platform_fee_percentage',
          value: '1.5', // Invalid: > 1
        })
        .mockResolvedValueOnce({
          key: 'steward_platform_fee_flat_cents',
          value: '500',
        });

      const result = await calculateStewardPlatformFee(shippingCents, donationCents);

      expect(result).toBe(500); // Falls back to flat fee
    });
  });

  describe('createChapterConnectAccount', () => {
    it('should create a Connect account for a chapter', async () => {
      const email = 'chapter@example.com';
      const country = 'US';
      const mockAccount: Stripe.Account = {
        id: 'acct_chapter123',
        type: 'express',
        country: 'US',
        email: email,
      } as Stripe.Account;

      mockStripe.accounts.create.mockResolvedValue(mockAccount);

      const result = await createChapterConnectAccount(email, country);

      expect(result).toEqual(mockAccount);
      expect(mockStripe.accounts.create).toHaveBeenCalled();
    });
  });

  describe('createStewardCheckoutSession', () => {
    it('should create checkout session for steward listing claim', async () => {
      const params = {
        listingId: 1,
        listingName: 'Test Listing',
        shippingCents: 1000,
        platformFeeCents: 500,
        chapterDonationCents: 2000,
        chapterStripeAccountId: 'acct_chapter123',
        stewardStripeAccountId: 'acct_steward123',
        buyerEmail: 'buyer@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_steward123',
        url: 'https://checkout.stripe.com/steward',
      } as Stripe.Checkout.Session;

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await createStewardCheckoutSession(params);

      expect(result).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: params.buyerEmail,
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          metadata: {
            listing_id: '1',
            type: 'steward_claim',
            steward_account_id: params.stewardStripeAccountId,
            chapter_account_id: params.chapterStripeAccountId,
            chapter_donation_cents: '2000',
            shipping_cents: '1000',
          },
        })
      );
    });

    it('should include all line items', async () => {
      const params = {
        listingId: 1,
        listingName: 'Test Listing',
        shippingCents: 1000,
        platformFeeCents: 500,
        chapterDonationCents: 2000,
        chapterStripeAccountId: 'acct_chapter123',
        stewardStripeAccountId: 'acct_steward123',
        buyerEmail: 'buyer@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_steward123',
      } as Stripe.Checkout.Session;

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createStewardCheckoutSession(params);

      const callArgs = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(callArgs.line_items).toHaveLength(3);
      expect(callArgs.line_items[0].price_data.product_data.name).toBe('Shipping');
      expect(callArgs.line_items[1].price_data.product_data.name).toBe('Platform Fee');
      expect(callArgs.line_items[2].price_data.product_data.name).toBe('Chapter Donation');
    });

    it('should handle zero amounts', async () => {
      const params = {
        listingId: 1,
        listingName: 'Test Listing',
        shippingCents: 0,
        platformFeeCents: 0,
        chapterDonationCents: 0,
        chapterStripeAccountId: 'acct_chapter123',
        stewardStripeAccountId: 'acct_steward123',
        buyerEmail: 'buyer@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_steward123',
      } as Stripe.Checkout.Session;

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await createStewardCheckoutSession(params);

      const callArgs = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(callArgs.line_items).toHaveLength(0);
    });
  });
});

