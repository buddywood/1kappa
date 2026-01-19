import { test, expect } from './fixtures/auth.fixture';
import { testUsers, hasTestCredentials } from './utils/test-helpers';

/**
 * Role-Based Login Tests for https://one-kappa.com
 */

test.describe('Role-Based Login Tests', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should login successfully as GUEST user', async ({ loginPage, page }) => {
    if (!hasTestCredentials('GUEST')) {
      test.skip(true, 'GUEST test credentials not configured');
    }

    const user = testUsers.guest;
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*\/?$/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`GUEST logged in, redirected to: ${currentUrl}`);
  });

  test('should login successfully as MEMBER user', async ({ loginPage, page }) => {
    if (!hasTestCredentials('MEMBER')) {
      test.skip(true, 'MEMBER test credentials not configured');
    }

    const user = testUsers.member;
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`MEMBER logged in, redirected to: ${currentUrl}`);
  });

  test('should login successfully as STEWARD user', async ({ loginPage, page }) => {
    if (!hasTestCredentials('STEWARD')) {
      test.skip(true, 'STEWARD test credentials not configured');
    }

    const user = testUsers.steward;
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`STEWARD logged in, redirected to: ${currentUrl}`);
  });

  test('should login successfully as SELLER user', async ({ loginPage, page }) => {
    if (!hasTestCredentials('SELLER')) {
      test.skip(true, 'SELLER test credentials not configured');
    }

    const user = testUsers.seller;
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`SELLER logged in, redirected to: ${currentUrl}`);
  });

  test('should login successfully as PROMOTER user', async ({ loginPage, page }) => {
    if (!hasTestCredentials('PROMOTER')) {
      test.skip(true, 'PROMOTER test credentials not configured');
    }

    const user = testUsers.promoter;
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`PROMOTER logged in, redirected to: ${currentUrl}`);
  });

  test('should login successfully as ADMIN user', async ({ loginPage, page }) => {
    if (!hasTestCredentials('ADMIN')) {
      test.skip(true, 'ADMIN test credentials not configured');
    }

    const user = testUsers.admin;
    await loginPage.login(user.email, user.password);
    await page.waitForURL(/^https?:\/\/.*/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`ADMIN logged in, redirected to: ${currentUrl}`);
  });
});

test.describe('Configuration Check', () => {
  test('should report configured test roles', async () => {
    const roles = ['GUEST', 'MEMBER', 'STEWARD', 'SELLER', 'PROMOTER', 'ADMIN'];

    console.log('\n=== Test Configuration Status ===');
    roles.forEach(role => {
      const configured = hasTestCredentials(role as any);
      const user = testUsers[role.toLowerCase() as keyof typeof testUsers];
      const icon = configured ? '✅' : '❌';
      console.log(`${icon} ${role}: ${configured ? user.email : 'NOT CONFIGURED'}`);
    });

    expect(true).toBe(true);
  });
});
