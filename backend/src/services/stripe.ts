import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-01-15.acacia',
});

/**
 * Create a Stripe Connect Express account
 */
export async function createConnectAccount(email: string, country: string = 'US'): Promise<Stripe.Account> {
  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}

/**
 * Create an account link for onboarding
 */
export async function createAccountLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

/**
 * Create a checkout session with connected account
 */
export async function createCheckoutSession(params: {
  productId: number;
  productName: string;
  priceCents: number;
  connectedAccountId: string;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
  chapterId?: number;
}): Promise<Stripe.Checkout.Session> {
  const applicationFeeAmount = Math.round(params.priceCents * 0.08); // 8% total fee

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: params.productName,
          },
          unit_amount: params.priceCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      on_behalf_of: params.connectedAccountId,
      transfer_data: {
        destination: params.connectedAccountId,
      },
    },
    customer_email: params.buyerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      product_id: params.productId.toString(),
      chapter_id: params.chapterId?.toString() || '',
    },
  }, {
    stripeAccount: params.connectedAccountId,
  });

  return session;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    secret
  );
}

