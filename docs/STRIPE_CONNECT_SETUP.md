# Stripe Connect Account Setup Guide

This guide explains how to enable the **transfers** capability on Stripe Connect accounts via the Stripe Dashboard.

## Why This Is Needed

When creating Stripe Connect accounts, the `transfers` capability must be enabled for the account to receive payments. Without this capability, you'll see the error:

> "The account referenced in the 'destination' parameter is missing the required capabilities: transfers or legacy_payments are required on the 'destination' account."

## Step-by-Step Instructions

### 1. Access Stripe Dashboard

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in the top right)
3. Navigate to **Connect** → **Accounts** in the left sidebar

### 2. Find Your Connected Account

1. In the Connect Accounts list, find the account you want to configure
2. You can search by account ID (e.g., `acct_1SaUOOCkruqeafPd`) or email
3. Click on the account to open its details

### 3. Enable Transfers Capability

1. In the account details page, scroll down to the **Capabilities** section
2. Find **Transfers** in the capabilities list
3. Click **Enable** or **Request** next to Transfers
4. For test accounts, the capability should be enabled immediately
5. You should see the status change to **Active** (green checkmark)

### 4. Verify Capability Status

After enabling, verify the capability is active:
- Status should show: **Active** ✅
- If it shows **Pending**, the account may need additional onboarding information

## Quick Setup for Test Accounts

For test accounts, you can also enable capabilities via the Stripe API in test mode. However, using the dashboard is often easier.

### Alternative: Using Stripe CLI

You can also enable capabilities using the Stripe CLI:

```bash
# Enable transfers capability for a specific account
stripe accounts update acct_XXXXX --capabilities[transfers][requested]=true

# Or update the capability directly
stripe accounts update_capability acct_XXXXX transfers --requested=true
```

## Current Test Account IDs

Based on the fix script output, your current test accounts are:

1. **Seller 1** (Buddy Seller)
   - Account ID: `acct_1SaUOOCkruqeafPd`
   - Email: `buddy+seller@ebilly.com`

2. **Seller 2** (Buddy Seller Non-Member)
   - Account ID: `acct_1SaUOQEMQacRCtnv`
   - Email: `buddy+seller2@ebilly.com`

3. **Seller 3** (Buddy Steward)
   - Account ID: `acct_1SaUOTE2vDe8KE8y`
   - Email: `buddy+steward@ebilly.com`

## Verification

After enabling the capability, test a checkout:

1. Create a test checkout session
2. Complete a payment with test card: `4242 4242 4242 4242`
3. The payment should process successfully without the capability error

## Troubleshooting

### Capability Shows as "Pending"

If the capability shows as "Pending" instead of "Active":
- The account may need additional information (business details, tax info, etc.)
- For test accounts, you can often skip this by using test data
- Try completing the onboarding flow or adding minimal test data

### Capability Not Available

If you don't see the option to enable transfers:
- Make sure you're in **Test mode** (not Live mode)
- Verify you have the correct permissions on the Stripe account
- Check that the account type is **Express** (not Standard or Custom)

### Still Getting Errors

If you still get capability errors after enabling:
1. Wait a few seconds for Stripe to process the change
2. Verify the capability status in the dashboard
3. Check that you're using the correct account ID in your code
4. Try creating a new checkout session (don't reuse old sessions)

## Production Notes

In production:
- Capabilities are typically enabled through the onboarding flow
- Users complete Stripe's onboarding to provide required information
- The capability becomes active after onboarding is complete
- You don't need to manually enable capabilities in production

