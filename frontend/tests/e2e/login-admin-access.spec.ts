import { test, expect } from './fixtures/auth.fixture';
import { testUsers, hasTestCredentials } from './utils/test-helpers';

/**
 * Admin Page Access Control Tests
 * Verifies that ONLY ADMIN role can access /admin
 * All other roles should be redirected away
 */

test.describe('Admin Page Access Control', () => {

  test('ADMIN should be able to access admin page', async ({ loginPage, page }) => {
    if (!hasTestCredentials('ADMIN')) {
      test.skip(true, 'ADMIN test credentials not configured');
    }

    const user = testUsers.admin;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    // Admin redirects directly to /admin after login
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    const currentUrl = page.url();
    console.log(`✅ ADMIN can access admin page: ${currentUrl}`);

    await expect(page).toHaveURL(/\/admin/);
  });

  test('GUEST should NOT be able to access admin page', async ({ loginPage, page }) => {
    if (!hasTestCredentials('GUEST')) {
      test.skip(true, 'GUEST test credentials not configured');
    }

    const user = testUsers.guest;

    // Login first
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*\/?$/, { timeout: 15000 });

    // Try to navigate to admin page
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check current URL - should be redirected away from /admin
    const currentUrl = page.url();
    console.log(`🔒 GUEST blocked from admin, redirected to: ${currentUrl}`);

    // Verify we were redirected away from admin (security working)
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('MEMBER should NOT be able to access admin page', async ({ loginPage, page }) => {
    if (!hasTestCredentials('MEMBER')) {
      test.skip(true, 'MEMBER test credentials not configured');
    }

    const user = testUsers.member;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`🔒 MEMBER blocked from admin, redirected to: ${currentUrl}`);

    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('STEWARD should NOT be able to access admin page', async ({ loginPage, page }) => {
    if (!hasTestCredentials('STEWARD')) {
      test.skip(true, 'STEWARD test credentials not configured');
    }

    const user = testUsers.steward;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`🔒 STEWARD blocked from admin, redirected to: ${currentUrl}`);

    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('SELLER should NOT be able to access admin page', async ({ loginPage, page }) => {
    if (!hasTestCredentials('SELLER')) {
      test.skip(true, 'SELLER test credentials not configured');
    }

    const user = testUsers.seller;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`🔒 SELLER blocked from admin, redirected to: ${currentUrl}`);

    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('PROMOTER should NOT be able to access admin page', async ({ loginPage, page }) => {
    if (!hasTestCredentials('PROMOTER')) {
      test.skip(true, 'PROMOTER test credentials not configured');
    }

    const user = testUsers.promoter;

    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`🔒 PROMOTER blocked from admin, redirected to: ${currentUrl}`);

    await expect(page).not.toHaveURL(/\/admin/);
  });
});
