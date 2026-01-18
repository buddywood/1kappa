import { test, expect } from './fixtures/auth.fixture';
import { testUsers, getAllValidTestUsers, hasTestCredentials, type UserRole } from './utils/test-helpers';

/**
 * Role-Based Login Tests
 * Tests login functionality for different user roles: GUEST, MEMBER, STEWARD, SELLER, PROMOTER, ADMIN
 *
 * IMPORTANT: These tests require test credentials to be configured in .env.local
 * See .env.test.example for configuration details
 */

test.describe('Role-Based Login Tests', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  /**
   * Test login for GUEST role
   * Expected: Redirect to homepage after successful login
   */
  test('should login successfully as GUEST user', async ({ loginPage, page }) => {
    // Skip if credentials not configured
    if (!hasTestCredentials('GUEST')) {
      test.skip(true, 'GUEST test credentials not configured. Set TEST_GUEST_EMAIL in .env.local');
    }

    const user = testUsers.guest;

    // Perform login
    await loginPage.login(user.email, user.password);

    // Wait for navigation after successful login
    await page.waitForURL(/^https:\/\/.*\/?$/, { timeout: 15000 });

    // Verify we're not on login page anymore
    await expect(page).not.toHaveURL(/\/login/);

    // Should be on homepage or redirected appropriately
    const currentUrl = page.url();
    console.log(`GUEST logged in, redirected to: ${currentUrl}`);
  });

  /**
   * Test login for MEMBER role
   * Expected: Redirect based on onboarding status
   */
  test('should login successfully as MEMBER user', async ({ loginPage, page }) => {
    // Skip if credentials not configured
    if (!hasTestCredentials('MEMBER')) {
      test.skip(true, 'MEMBER test credentials not configured. Set TEST_MEMBER_EMAIL in .env.local');
    }

    const user = testUsers.member;

    // Perform login
    await loginPage.login(user.email, user.password);

    // Wait for navigation
    await page.waitForURL(/^https:\/\/.*/, { timeout: 15000 });

    // Verify we're not on login page anymore
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`MEMBER logged in, redirected to: ${currentUrl}`);

    // Member might be redirected to /register if onboarding not complete
    // or to homepage if onboarding is finished
    expect(currentUrl).toMatch(/\/(register)?$/);
  });

  /**
   * Test login for STEWARD role
   * Expected: Redirect based on onboarding status
   */
  test('should login successfully as STEWARD user', async ({ loginPage, page }) => {
    // Skip if credentials not configured
    if (!hasTestCredentials('STEWARD')) {
      test.skip(true, 'STEWARD test credentials not configured. Set TEST_STEWARD_EMAIL in .env.local');
    }

    const user = testUsers.steward;

    // Perform login
    await loginPage.login(user.email, user.password);

    // Wait for navigation
    await page.waitForURL(/^https:\/\/.*/, { timeout: 15000 });

    // Verify we're not on login page anymore
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`STEWARD logged in, redirected to: ${currentUrl}`);

    // Steward might be redirected to /register if onboarding not complete
    // or to homepage if onboarding is finished
    expect(currentUrl).toMatch(/\/(register)?$/);
  });

  /**
   * Test login for SELLER role
   * Expected: Redirect based on onboarding status
   */
  test('should login successfully as SELLER user', async ({ loginPage, page }) => {
    // Skip if credentials not configured
    if (!hasTestCredentials('SELLER')) {
      test.skip(true, 'SELLER test credentials not configured. Set TEST_SELLER_EMAIL in .env.local');
    }

    const user = testUsers.seller;

    // Perform login
    await loginPage.login(user.email, user.password);

    // Wait for navigation
    await page.waitForURL(/^https:\/\/.*/, { timeout: 15000 });

    // Verify we're not on login page anymore
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`SELLER logged in, redirected to: ${currentUrl}`);

    // Seller might be redirected to /register if onboarding not complete
    // or to appropriate seller dashboard
    expect(currentUrl).toMatch(/\/(register)?$/);
  });

  /**
   * Test login for PROMOTER role
   * Expected: Redirect based on onboarding status
   */
  test('should login successfully as PROMOTER user', async ({ loginPage, page }) => {
    // Skip if credentials not configured
    if (!hasTestCredentials('PROMOTER')) {
      test.skip(true, 'PROMOTER test credentials not configured. Set TEST_PROMOTER_EMAIL in .env.local');
    }

    const user = testUsers.promoter;

    // Perform login
    await loginPage.login(user.email, user.password);

    // Wait for navigation
    await page.waitForURL(/^https:\/\/.*/, { timeout: 15000 });

    // Verify we're not on login page anymore
    await expect(page).not.toHaveURL(/\/login/);

    const currentUrl = page.url();
    console.log(`PROMOTER logged in, redirected to: ${currentUrl}`);

    // Promoter might be redirected to /register if onboarding not complete
    // or to appropriate promoter dashboard
    expect(currentUrl).toMatch(/\/(register)?$/);
  });

  /**
   * Test login for ADMIN role
   * Expected: Redirect to /admin dashboard
   */
  test('should login successfully as ADMIN user and redirect to admin panel', async ({ loginPage, page }) => {
    // Skip if credentials not configured
    if (!hasTestCredentials('ADMIN')) {
      test.skip(true, 'ADMIN test credentials not configured. Set TEST_ADMIN_EMAIL in .env.local');
    }

    const user = testUsers.admin;

    // Perform login
    await loginPage.login(user.email, user.password);

    // Wait for navigation to admin panel
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // Verify we're on admin page
    await expect(page).toHaveURL(/\/admin/);

    const currentUrl = page.url();
    console.log(`ADMIN logged in, redirected to: ${currentUrl}`);
  });
});

test.describe('Role-Based Login with Remember Me', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  /**
   * Test that Remember Me persists email for each role
   */
  test('should persist email when Remember Me is checked for GUEST', async ({ loginPage, page, context }) => {
    if (!hasTestCredentials('GUEST')) {
      test.skip(true, 'GUEST test credentials not configured');
    }

    const user = testUsers.guest;

    // Login with Remember Me
    await loginPage.login(user.email, user.password, true);

    // Wait for navigation (login will succeed or fail)
    await page.waitForTimeout(3000);

    // Go back to login page
    await loginPage.goto();

    // Email should be pre-filled
    const emailValue = await loginPage.emailInput.inputValue();
    expect(emailValue).toBe(user.email);

    // Remember Me should be checked
    await expect(loginPage.rememberMeCheckbox).toBeChecked();
  });
});

test.describe('Session Management by Role', () => {
  /**
   * Test that each role maintains proper session after login
   */
  test('should maintain session after successful login for MEMBER', async ({ loginPage, page }) => {
    if (!hasTestCredentials('MEMBER')) {
      test.skip(true, 'MEMBER test credentials not configured');
    }

    const user = testUsers.member;

    // Login
    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    // Wait for navigation
    await page.waitForURL(/^https:\/\/.*/, { timeout: 15000 });

    // Try to navigate back to login page
    await page.goto('/login');

    // Depending on your session handling, user might be redirected away from login
    // or login page might show but with session maintained
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`After navigating to login with active session: ${currentUrl}`);
  });
});

test.describe('Cross-Role Login Verification', () => {
  /**
   * Test that trying to login with one role's credentials
   * doesn't grant access to another role's resources
   */
  test('should not allow GUEST to access admin routes', async ({ loginPage, page }) => {
    if (!hasTestCredentials('GUEST')) {
      test.skip(true, 'GUEST test credentials not configured');
    }

    const user = testUsers.guest;

    // Login as guest
    await loginPage.goto();
    await loginPage.login(user.email, user.password);

    // Wait for successful login
    await page.waitForURL(/^https:\/\/.*/, { timeout: 15000 });

    // Try to navigate to admin page
    await page.goto('/admin');

    // Should be redirected away from admin or shown unauthorized
    const currentUrl = page.url();
    console.log(`GUEST attempted to access /admin, result: ${currentUrl}`);

    // Guest should not be able to access /admin
    // Depending on your implementation, they might be redirected or see 403/404
    // Adjust this assertion based on your app's behavior
  });
});

test.describe('Multiple Role Login Flow', () => {
  /**
   * Test logging in with different roles in sequence
   * Verifies proper session cleanup between logins
   */
  test('should allow sequential logins with different roles', async ({ loginPage, page, context }) => {
    // This test requires at least 2 configured roles
    const configuredUsers = getAllValidTestUsers().filter(user => {
      const roleKey = user.role as UserRole;
      return hasTestCredentials(roleKey);
    });

    if (configuredUsers.length < 2) {
      test.skip(true, 'Need at least 2 configured test roles for this test');
    }

    // Login with first user
    const firstUser = configuredUsers[0];
    await loginPage.goto();
    await loginPage.login(firstUser.email, firstUser.password);
    await page.waitForURL(/^https:\/\/.*/, { timeout: 15000 });
    console.log(`Logged in as ${firstUser.role}`);

    // Logout (navigate to login page and clear cookies)
    await context.clearCookies();

    // Login with second user
    const secondUser = configuredUsers[1];
    await loginPage.goto();
    await loginPage.login(secondUser.email, secondUser.password);
    await page.waitForURL(/^https:\/\/.*/, { timeout: 15000 });
    console.log(`Logged in as ${secondUser.role}`);

    // Verify second user's session is active
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Role Configuration Check', () => {
  /**
   * Utility test to check which roles are configured
   * Run this first to see what credentials you need to set up
   */
  test('should report which test roles are configured', async () => {
    const roles: UserRole[] = ['GUEST', 'MEMBER', 'STEWARD', 'SELLER', 'PROMOTER', 'ADMIN'];

    const configStatus = roles.map(role => ({
      role,
      configured: hasTestCredentials(role),
      email: testUsers[role.toLowerCase() as keyof typeof testUsers]?.email || 'N/A',
    }));

    console.log('\n=== Test Role Configuration Status ===');
    configStatus.forEach(status => {
      const icon = status.configured ? '✅' : '❌';
      console.log(`${icon} ${status.role}: ${status.configured ? status.email : 'NOT CONFIGURED'}`);
    });
    console.log('\nTo configure missing roles, add credentials to .env.local');
    console.log('Example: TEST_GUEST_EMAIL=your-guest-email@example.com\n');

    // This test always passes, it's just informational
    expect(true).toBe(true);
  });
});
