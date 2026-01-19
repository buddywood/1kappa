import { test, expect } from './fixtures/auth.fixture';
import { testUsers, hasTestCredentials } from './utils/test-helpers';

/**
 * Seller Dashboard Access Control Tests
 * Verifies that ONLY SELLER and ADMIN roles can access /seller-dashboard
 * All other roles (GUEST, MEMBER, STEWARD, PROMOTER) should be redirected away
 */

test.describe('Seller Dashboard Access Control', () => {

  test('SELLER should be able to access seller dashboard', async ({ loginPage, page }) => {
    if (!hasTestCredentials('SELLER')) {
      test.skip(true, 'SELLER test credentials not configured');
    }

    const user = testUsers.seller;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    // Wait for redirect to homepage (where SELLER users go after login)
    await page.waitForURL(/^https?:\/\/.*\/$/, { timeout: 15000 });

    // Wait for session to be fully established
    await page.waitForTimeout(1000);

    // Navigate to seller dashboard
    await page.goto('/seller-dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`✅ SELLER can access seller dashboard: ${currentUrl}`);

    // Should be able to access seller dashboard (not redirected away)
    await expect(page).toHaveURL(/\/seller-dashboard/);
  });

  test('ADMIN should be able to access seller dashboard', async ({ loginPage, page }) => {
    if (!hasTestCredentials('ADMIN')) {
      test.skip(true, 'ADMIN test credentials not configured');
    }

    const user = testUsers.admin;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    // Admin redirects to /admin after login
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // Wait for session to be fully established
    await page.waitForTimeout(1000);

    // Navigate to seller dashboard
    await page.goto('/seller-dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`✅ ADMIN can access seller dashboard: ${currentUrl}`);

    // Should be able to access seller dashboard (not redirected away)
    await expect(page).toHaveURL(/\/seller-dashboard/);
  });

  test('GUEST should NOT be able to access seller dashboard', async ({ loginPage, page }) => {
    if (!hasTestCredentials('GUEST')) {
      test.skip(true, 'GUEST test credentials not configured');
    }

    const user = testUsers.guest;

    // Login first
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*\/?$/, { timeout: 15000 });

    // Wait for session API to return authenticated session
    await page.waitForResponse(
      response => response.url().includes('/api/auth/session') && response.status() === 200,
      { timeout: 5000 }
    );

    // Give session time to be stored
    await page.waitForTimeout(500);

    // Try to navigate to seller dashboard
    await page.goto('/seller-dashboard');
    await page.waitForLoadState('networkidle');

    // Check current URL - GUEST with incomplete onboarding should go to /register
    const currentUrl = page.url();
    console.log(`🔒 GUEST blocked from seller dashboard, redirected to: ${currentUrl}`);

    // Verify we were redirected to /register (complete onboarding first) or /apply (if onboarding done)
    // Not staying on seller-dashboard
    await expect(page).toHaveURL(/\/(register|apply)/);
  });

  test('MEMBER should NOT be able to access seller dashboard', async ({ loginPage, page }) => {
    if (!hasTestCredentials('MEMBER')) {
      test.skip(true, 'MEMBER test credentials not configured');
    }

    const user = testUsers.member;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });

    // Wait for session to be fully established after login
    await page.waitForTimeout(2000);

    await page.goto('/seller-dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`🔒 MEMBER blocked from seller dashboard, redirected to: ${currentUrl}`);

    // Should be redirected to their own member dashboard
    await expect(page).toHaveURL(/\/member-dashboard/);
  });

  test('STEWARD should NOT be able to access seller dashboard', async ({ loginPage, page }) => {
    if (!hasTestCredentials('STEWARD')) {
      test.skip(true, 'STEWARD test credentials not configured');
    }

    const user = testUsers.steward;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });

    // Wait for session to be fully established after login
    await page.waitForTimeout(2000);

    await page.goto('/seller-dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`🔒 STEWARD blocked from seller dashboard, redirected to: ${currentUrl}`);

    // Stewards should be redirected to member dashboard
    await expect(page).toHaveURL(/\/member-dashboard/);
  });

  test('PROMOTER should NOT be able to access seller dashboard', async ({ loginPage, page }) => {
    if (!hasTestCredentials('PROMOTER')) {
      test.skip(true, 'PROMOTER test credentials not configured');
    }

    const user = testUsers.promoter;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });

    // Wait for session to be fully established after login
    await page.waitForTimeout(2000);

    await page.goto('/seller-dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`🔒 PROMOTER blocked from seller dashboard, redirected to: ${currentUrl}`);

    // Promoters should be redirected to promoter dashboard/page
    await expect(page).toHaveURL(/\/promote/);
  });
});
