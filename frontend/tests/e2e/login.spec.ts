import { test, expect } from './fixtures/auth.fixture';
import { testUsers } from './utils/test-helpers';

/**
 * E2E Tests for Login Functionality
 * Tests the login flow at https://preview.one-kappa.com/login
 */

test.describe('Login Page', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should load the login page correctly', async ({ loginPage }) => {
    // Verify page elements are visible
    await loginPage.assertPageLoaded();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.rememberMeCheckbox).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('should have correct page title and branding', async ({ loginPage, page }) => {
    // Check page title
    await expect(page).toHaveTitle(/1KAPPA|Login/);

    // Check branding elements
    await expect(loginPage.pageTitle).toContainText('Welcome to 1KAPPA');
    await expect(loginPage.logo).toBeVisible();
  });

  test('should display all navigation links', async ({ loginPage }) => {
    await expect(loginPage.returnToHomepageButton).toBeVisible();
    await expect(loginPage.joinNowLink).toBeVisible();
    await expect(loginPage.becomeSellerLink).toBeVisible();
    await expect(loginPage.becomePromoterLink).toBeVisible();
  });

  test('should show social login buttons (disabled)', async ({ page }) => {
    // Check that social login buttons exist
    const socialButtons = page.locator('button[aria-label*="Login with"]');
    await expect(socialButtons).toHaveCount(4); // Facebook, Google, Apple, X

    // Verify they are disabled
    const facebookButton = page.locator('button[aria-label="Login with Facebook (Coming Soon)"]');
    await expect(facebookButton).toBeDisabled();
  });
});

test.describe('Login Form Validation', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should require email field', async ({ loginPage, page }) => {
    // Try to submit without email
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginButton.click();

    // Check HTML5 validation
    const isValid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should require password field', async ({ loginPage, page }) => {
    // Try to submit without password
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.loginButton.click();

    // Check HTML5 validation
    const isValid = await loginPage.passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should validate email format', async ({ loginPage }) => {
    // Enter invalid email
    await loginPage.emailInput.fill('invalid-email');

    // Check HTML5 validation
    const isValid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should allow valid email format', async ({ loginPage }) => {
    // Enter valid email
    await loginPage.emailInput.fill('test@example.com');

    // Check HTML5 validation
    const isValid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(true);
  });
});

test.describe('Login Functionality', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should show error message with invalid credentials', async ({ loginPage }) => {
    // Attempt login with invalid credentials
    await loginPage.login(testUsers.invalid.email, testUsers.invalid.password);

    // Wait for error message
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });

    // Verify error message content
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Invalid email or password');
  });

  test('should show loading state during login', async ({ loginPage }) => {
    // Start login
    await loginPage.emailInput.fill(testUsers.invalid.email);
    await loginPage.passwordInput.fill(testUsers.invalid.password);
    await loginPage.loginButton.click();

    // Check for loading state
    const loadingButton = loginPage.page.locator('button:has-text("Logging in...")');
    await expect(loadingButton).toBeVisible({ timeout: 1000 });
  });

  test('should disable login button while loading', async ({ loginPage }) => {
    // Start login
    await loginPage.emailInput.fill(testUsers.invalid.email);
    await loginPage.passwordInput.fill(testUsers.invalid.password);
    await loginPage.loginButton.click();

    // Button should be disabled during loading
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('should persist email when Remember Me is checked', async ({ loginPage, page, context }) => {
    const testEmail = 'remember@example.com';

    // Login with Remember Me checked
    await loginPage.emailInput.fill(testEmail);
    await loginPage.passwordInput.fill('password123');
    await loginPage.rememberMeCheckbox.check();

    // Submit (will fail but that's ok for this test)
    await loginPage.loginButton.click();

    // Wait a bit for localStorage to be set
    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload();

    // Check if email is pre-filled
    const emailValue = await loginPage.emailInput.inputValue();
    expect(emailValue).toBe(testEmail);

    // Check if Remember Me is still checked
    await expect(loginPage.rememberMeCheckbox).toBeChecked();
  });

  test.skip('should successfully login with valid credentials', async ({ loginPage }) => {
    // Note: This test is skipped by default as it requires valid test credentials
    // Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables to enable

    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
      test.skip(true, 'Test credentials not provided');
    }

    // Perform login
    await loginPage.login(testUsers.valid.email, testUsers.valid.password);

    // Wait for successful navigation
    await loginPage.waitForSuccessfulLogin();

    // Verify we're on a different page (dashboard, admin, or registration completion)
    await expect(loginPage.page).not.toHaveURL(/\/login/);
  });
});

test.describe('Verification Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test.skip('should show verification form for unverified users', async ({ loginPage }) => {
    // Note: This test requires an unverified test account
    // Set TEST_UNVERIFIED_EMAIL and TEST_UNVERIFIED_PASSWORD to enable

    if (!process.env.TEST_UNVERIFIED_EMAIL) {
      test.skip(true, 'Unverified test account not configured');
    }

    // Try to login with unverified account
    await loginPage.login(testUsers.unverified.email, testUsers.unverified.password);

    // Should show verification form
    await expect(loginPage.verifyEmailButton).toBeVisible({ timeout: 10000 });
    await expect(loginPage.verificationCodeInputs.first()).toBeVisible();
  });

  test('should allow going back to login from verification screen', async ({ loginPage, page }) => {
    // Navigate to verification screen by adding error parameter
    await page.goto('/login?error=UserNotConfirmedException');

    // Fill in email to show verification context
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginButton.click();

    // Wait for verification screen (if it appears)
    const isVerificationVisible = await loginPage.isVerificationFormVisible();

    if (isVerificationVisible) {
      // Go back to login
      await loginPage.backToLogin();

      // Should show login form again
      await expect(loginPage.loginButton).toBeVisible();
    }
  });
});

test.describe('Password Change Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test.skip('should show password change form when required', async ({ loginPage }) => {
    // Note: This test requires a test account that needs password change
    // Set TEST_TEMP_PASSWORD_EMAIL and TEST_TEMP_PASSWORD to enable

    if (!process.env.TEST_TEMP_PASSWORD_EMAIL) {
      test.skip(true, 'Temporary password test account not configured');
    }

    // Try to login with account that needs password change
    await loginPage.login(
      testUsers.needsPasswordChange.email,
      testUsers.needsPasswordChange.password
    );

    // Should show password change form
    await expect(loginPage.changePasswordButton).toBeVisible({ timeout: 10000 });
    await expect(loginPage.newPasswordInput).toBeVisible();
    await expect(loginPage.confirmPasswordInput).toBeVisible();
  });

  test('should allow going back to login from password change screen', async ({ loginPage, page }) => {
    // We can't easily trigger the password change screen without valid credentials
    // but we can test the back button if we can get to that screen

    // This is a placeholder test - would need a test account with NEW_PASSWORD_REQUIRED status
    test.skip(true, 'Requires test account with password change requirement');
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should navigate to forgot password page', async ({ loginPage, page }) => {
    await loginPage.goToForgotPassword();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('should navigate to register page', async ({ loginPage, page }) => {
    await loginPage.goToRegister();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should navigate to homepage', async ({ loginPage, page }) => {
    await loginPage.goToHomepage();
    await expect(page).toHaveURL(/^https:\/\/preview\.one-kappa\.com\/?$/);
  });

  test('should navigate to seller application page', async ({ loginPage, page }) => {
    await loginPage.becomeSellerLink.click();
    await expect(page).toHaveURL(/\/apply/);
  });

  test('should navigate to promoter application page', async ({ loginPage, page }) => {
    await loginPage.becomePromoterLink.click();
    await expect(page).toHaveURL(/\/promote/);
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should have proper form labels', async ({ loginPage, page }) => {
    // Check for label elements
    const emailLabel = page.locator('label:has-text("Email")');
    const passwordLabel = page.locator('label:has-text("Password")');

    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test('should be keyboard navigable', async ({ loginPage, page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(loginPage.emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    // Should focus on remember me checkbox
    await expect(loginPage.rememberMeCheckbox).toBeFocused();
  });

  test('should submit form with Enter key', async ({ loginPage, page }) => {
    await loginPage.emailInput.fill(testUsers.invalid.email);
    await loginPage.passwordInput.fill(testUsers.invalid.password);

    // Press Enter to submit
    await page.keyboard.press('Enter');

    // Should show error (since credentials are invalid)
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should display correctly on mobile', async ({ loginPage, page }) => {
    await loginPage.goto();

    // Check that main elements are visible
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should be scrollable on mobile', async ({ loginPage, page }) => {
    await loginPage.goto();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check that bottom elements are now in view
    await expect(loginPage.joinNowLink).toBeVisible();
  });
});
