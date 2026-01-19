import { device, element, by, expect as detoxExpect, waitFor } from 'detox';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Seller Dashboard Access Control Tests for Mobile App
 * Mirrors the Playwright tests from frontend/tests/e2e/login-seller-dashboard-access.spec.ts
 *
 * Verifies that ONLY SELLER and ADMIN roles can access the seller dashboard
 * All other roles should see appropriate access denied messages
 */

// Test user credentials (these should match your backend test data)
const testUsers = {
  seller: {
    email: 'buddy+seller@ebilly.com',
    password: process.env.TEST_SELLER_PASSWORD || '',
  },
  admin: {
    email: 'buddy@ebilly.com',
    password: process.env.TEST_ADMIN_PASSWORD || '',
  },
  guest: {
    email: 'buddy+guest@ebilly.com',
    password: process.env.TEST_GUEST_PASSWORD || '',
  },
  member: {
    email: 'buddy+member@ebilly.com',
    password: process.env.TEST_MEMBER_PASSWORD || '',
  },
  steward: {
    email: 'buddy+steward@ebilly.com',
    password: process.env.TEST_STEWARD_PASSWORD || '',
  },
  promoter: {
    email: 'buddy+promoter@ebilly.com',
    password: process.env.TEST_PROMOTER_PASSWORD || '',
  },
};

describe('Seller Dashboard Access Control', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });

    // Handle Expo dev screen - tap on localhost:8081 to connect
    try {
      // Wait a bit for the dev screen to fully render
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Tap at coordinates where the localhost URL typically appears
      // On iPhone 17 Pro, the URL button is roughly in the middle-upper area
      await device.tapAtPoint({ x: 380, y: 264 });

      // Wait for the app to load after connecting
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('Tapped dev screen URL at coordinates');
    } catch (e) {
      console.log('Could not tap dev screen, app may already be connected');
    }
  });

  // beforeEach removed - reloading causes Expo dev screen to appear
  // Instead, we'll log out between tests which resets the app state

  afterEach(async () => {
    // Try to log out after each test to reset state
    try {
      await logout();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      // Logout may fail if already logged out or on error screen
      console.log('Logout failed or already logged out');
    }
  });

  /**
   * Helper function to login
   */
  async function login(email: string, password: string) {
    // Wait for the app to fully load and bottom tabs to be visible
    await waitFor(element(by.id('bottom-tab-profile')))
      .toBeVisible()
      .withTimeout(30000);

    // Navigate to profile (login screen)
    await element(by.id('bottom-tab-profile')).tap();

    // Wait for login screen
    await waitFor(element(by.id('login-email-input')))
      .toBeVisible()
      .withTimeout(5000);

    // Enter credentials
    await element(by.id('login-email-input')).typeText(email);
    await element(by.id('login-password-input')).typeText(password);

    // Tap login button
    await element(by.id('login-button')).tap();

    // Wait for login to complete (home screen appears)
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(15000);

    // Small delay to ensure session is established
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Helper function to navigate to seller dashboard
   */
  async function navigateToSellerDashboard() {
    // Go to profile screen
    await element(by.id('bottom-tab-profile')).tap();
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Tap seller dashboard button
    await element(by.id('seller-dashboard-button')).tap();
  }

  /**
   * Helper function to logout
   */
  async function logout() {
    await element(by.id('bottom-tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('logout-button')).tap();
    await element(by.text('Confirm')).tap();
  }

  describe('Authorized Access', () => {
    test('SELLER should be able to access seller dashboard', async () => {
      if (!testUsers.seller.password) {
        console.warn('⚠️  SELLER test credentials not configured, skipping test');
        return;
      }

      await login(testUsers.seller.email, testUsers.seller.password);
      await navigateToSellerDashboard();

      // Should see seller dashboard screen
      await detoxExpect(element(by.id('seller-dashboard-screen'))).toBeVisible();
      await detoxExpect(element(by.text('Seller Dashboard'))).toBeVisible();

      console.log('✅ SELLER can access seller dashboard');
      await logout();
    });

    test('ADMIN should be able to access seller dashboard', async () => {
      if (!testUsers.admin.password) {
        console.warn('⚠️  ADMIN test credentials not configured, skipping test');
        return;
      }

      await login(testUsers.admin.email, testUsers.admin.password);
      await navigateToSellerDashboard();

      // Should see seller dashboard screen
      await detoxExpect(element(by.id('seller-dashboard-screen'))).toBeVisible();
      await detoxExpect(element(by.text('Seller Dashboard'))).toBeVisible();

      console.log('✅ ADMIN can access seller dashboard');
      await logout();
    });
  });

  describe('Unauthorized Access', () => {
    test('GUEST should NOT be able to access seller dashboard', async () => {
      if (!testUsers.guest.password) {
        console.warn('⚠️  GUEST test credentials not configured, skipping test');
        return;
      }

      await login(testUsers.guest.email, testUsers.guest.password);
      await navigateToSellerDashboard();

      // Should see access denied alert
      await waitFor(element(by.text('Access Denied')))
        .toBeVisible()
        .withTimeout(3000);

      await detoxExpect(
        element(by.text('To become a seller, please apply using the \'Become a Seller\' option.'))
      ).toBeVisible();

      // Tap OK to dismiss alert
      await element(by.text('OK')).tap();

      // Should be back on profile screen (not on seller dashboard)
      await detoxExpect(element(by.id('profile-screen'))).toBeVisible();
      await detoxExpect(element(by.id('seller-dashboard-screen'))).not.toBeVisible();

      console.log('🔒 GUEST blocked from seller dashboard');
      await logout();
    });

    test('MEMBER should NOT be able to access seller dashboard', async () => {
      if (!testUsers.member.password) {
        console.warn('⚠️  MEMBER test credentials not configured, skipping test');
        return;
      }

      await login(testUsers.member.email, testUsers.member.password);
      await navigateToSellerDashboard();

      // Should see access denied alert
      await waitFor(element(by.text('Access Denied')))
        .toBeVisible()
        .withTimeout(3000);

      await detoxExpect(
        element(by.text('You don\'t have seller access. Would you like to apply to become a seller?'))
      ).toBeVisible();

      // Tap OK to dismiss alert
      await element(by.text('OK')).tap();

      // Should be back on profile screen
      await detoxExpect(element(by.id('profile-screen'))).toBeVisible();

      console.log('🔒 MEMBER blocked from seller dashboard');
      await logout();
    });

    test('STEWARD should NOT be able to access seller dashboard', async () => {
      if (!testUsers.steward.password) {
        console.warn('⚠️  STEWARD test credentials not configured, skipping test');
        return;
      }

      await login(testUsers.steward.email, testUsers.steward.password);
      await navigateToSellerDashboard();

      // Should see access denied alert
      await waitFor(element(by.text('Access Denied')))
        .toBeVisible()
        .withTimeout(3000);

      // Tap OK to dismiss alert
      await element(by.text('OK')).tap();

      // Should be back on profile screen
      await detoxExpect(element(by.id('profile-screen'))).toBeVisible();

      console.log('🔒 STEWARD blocked from seller dashboard');
      await logout();
    });

    test('PROMOTER should NOT be able to access seller dashboard', async () => {
      if (!testUsers.promoter.password) {
        console.warn('⚠️  PROMOTER test credentials not configured, skipping test');
        return;
      }

      await login(testUsers.promoter.email, testUsers.promoter.password);
      await navigateToSellerDashboard();

      // Should see access denied alert
      await waitFor(element(by.text('Access Denied')))
        .toBeVisible()
        .withTimeout(3000);

      await detoxExpect(
        element(by.text('Sellers and Promoters have separate dashboards. This is the seller dashboard.'))
      ).toBeVisible();

      // Tap OK to dismiss alert
      await element(by.text('OK')).tap();

      // Should be back on profile screen
      await detoxExpect(element(by.id('profile-screen'))).toBeVisible();

      console.log('🔒 PROMOTER blocked from seller dashboard');
      await logout();
    });
  });
});
