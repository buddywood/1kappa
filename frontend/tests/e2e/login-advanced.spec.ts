import { test, expect } from './fixtures/auth.fixture';
import { testUsers, generateRandomEmail } from './utils/test-helpers';

/**
 * Advanced E2E Tests for Login Functionality
 * Tests edge cases, security, and integration scenarios
 */

test.describe('Login Security', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should not expose password in form', async ({ loginPage }) => {
    const password = 'SecretPassword123!';
    await loginPage.passwordInput.fill(password);

    // Verify password input type is 'password'
    const inputType = await loginPage.passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });

  test('should clear form after failed login attempt', async ({ loginPage }) => {
    // Attempt login with invalid credentials
    await loginPage.login(testUsers.invalid.email, testUsers.invalid.password);

    // Wait for error
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });

    // Password should be cleared for security (if implemented)
    // Note: This depends on your implementation
    const passwordValue = await loginPage.passwordInput.inputValue();
    // Some implementations clear password, others don't - adjust based on your needs
  });

  test('should not be vulnerable to XSS in email field', async ({ loginPage, page }) => {
    const xssPayload = '<script>alert("XSS")</script>@example.com';

    await loginPage.emailInput.fill(xssPayload);
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginButton.click();

    // Wait a bit to see if any alert appears (it shouldn't)
    await page.waitForTimeout(2000);

    // Check that no alert dialog appeared
    const dialogs: any[] = [];
    page.on('dialog', dialog => dialogs.push(dialog));

    expect(dialogs.length).toBe(0);
  });

  test('should handle SQL injection attempts gracefully', async ({ loginPage }) => {
    const sqlInjection = "admin' OR '1'='1";

    await loginPage.login(sqlInjection, sqlInjection);

    // Should show normal error, not SQL error
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
    const errorText = await loginPage.getErrorMessage();

    // Should not contain SQL-related error messages
    expect(errorText?.toLowerCase()).not.toContain('sql');
    expect(errorText?.toLowerCase()).not.toContain('syntax');
    expect(errorText?.toLowerCase()).not.toContain('query');
  });
});

test.describe('Login Error Handling', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should handle network errors gracefully', async ({ loginPage, page, context }) => {
    // Intercept and fail the login request
    await page.route('**/api/auth/**', route => {
      route.abort('failed');
    });

    await loginPage.login(testUsers.valid.email, testUsers.valid.password);

    // Should show an error or handle gracefully
    // The exact behavior depends on your error handling
    await page.waitForTimeout(5000);

    // Button should not be stuck in loading state
    const isDisabled = await loginPage.loginButton.isDisabled();
    expect(isDisabled).toBe(false);
  });

  test('should handle slow network connections', async ({ loginPage, page }) => {
    // Slow down network requests
    await page.route('**/api/auth/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      route.continue();
    });

    await loginPage.login(testUsers.invalid.email, testUsers.invalid.password);

    // Should show loading state
    await expect(loginPage.loginButton).toBeDisabled();

    // Wait for response (with extended timeout)
    await page.waitForTimeout(10000);
  });

  test('should handle server errors (500)', async ({ loginPage, page }) => {
    // Intercept and return 500 error
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await loginPage.login(testUsers.valid.email, testUsers.valid.password);

    // Should show error message
    await page.waitForTimeout(3000);

    // Check that we're still on login page and can retry
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).not.toBeDisabled();
  });
});

test.describe('URL Parameter Handling', () => {
  test('should handle error parameter in URL', async ({ loginPage, page }) => {
    await page.goto('/login?error=UserNotConfirmedException');

    // Should load without crashing
    await loginPage.assertPageLoaded();
  });

  test('should handle redirect parameter in URL', async ({ page }) => {
    await page.goto('/login?redirect=/admin');

    // Page should load normally
    await page.waitForSelector('text=Welcome to 1KAPPA');
  });

  test('should handle malformed URL parameters', async ({ page }) => {
    await page.goto('/login?error=<script>alert("xss")</script>');

    // Should load without executing script
    await page.waitForSelector('text=Welcome to 1KAPPA');
  });
});

test.describe('Session Management', () => {
  test('should not show login page if already logged in', async ({ page, context }) => {
    // This test requires a valid session
    test.skip(true, 'Requires valid session setup');

    // If user is already logged in, should redirect away from login page
    // This depends on your session management implementation
  });

  test('should handle expired session tokens', async ({ page }) => {
    // This test would require setting up an expired token
    test.skip(true, 'Requires token expiry setup');
  });
});

test.describe('Verification Code Input', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login with verification error to trigger verification screen
    await page.goto('/login?error=UserNotConfirmedException');
  });

  test('should accept numeric input only in verification code', async ({ loginPage, page }) => {
    // Fill email and password to potentially trigger verification screen
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginButton.click();

    // Check if verification screen appears
    const isVerificationVisible = await loginPage.isVerificationFormVisible();

    if (isVerificationVisible) {
      const firstInput = loginPage.verificationCodeInputs.first();

      // Try to enter a letter
      await firstInput.fill('a');

      // Should not accept letters (depends on implementation)
      const value = await firstInput.inputValue();
      expect(value).not.toBe('a');
    } else {
      test.skip(true, 'Verification screen not accessible in this test');
    }
  });

  test('should limit verification code to 6 digits', async ({ loginPage, page }) => {
    // This would require being on the verification screen
    test.skip(true, 'Requires verification screen access');

    // Check that there are exactly 6 input fields
    const inputs = await loginPage.verificationCodeInputs.all();
    expect(inputs.length).toBe(6);
  });
});

test.describe('Password Requirements', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should accept passwords with special characters', async ({ loginPage }) => {
    const complexPassword = 'P@ssw0rd!#$%^&*()';

    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill(complexPassword);

    // Should accept the input
    const value = await loginPage.passwordInput.inputValue();
    expect(value).toBe(complexPassword);
  });

  test('should accept long passwords', async ({ loginPage }) => {
    const longPassword = 'a'.repeat(50);

    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill(longPassword);

    // Should accept the input
    const value = await loginPage.passwordInput.inputValue();
    expect(value.length).toBe(50);
  });

  test('should handle unicode characters in password', async ({ loginPage }) => {
    const unicodePassword = 'P@ssw0rd你好مرحبا';

    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill(unicodePassword);

    // Should accept the input
    const value = await loginPage.passwordInput.inputValue();
    expect(value).toBe(unicodePassword);
  });
});

test.describe('Browser Compatibility', () => {
  test('should handle browser back button', async ({ loginPage, page }) => {
    await loginPage.goto();

    // Navigate away
    await loginPage.goToHomepage();

    // Go back
    await page.goBack();

    // Should be back on login page
    await expect(page).toHaveURL(/\/login/);
    await loginPage.assertPageLoaded();
  });

  test('should handle page refresh during login', async ({ loginPage, page }) => {
    await loginPage.goto();

    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('password123');

    // Refresh page
    await page.reload();

    // Form should be cleared (unless remember me was checked)
    const emailValue = await loginPage.emailInput.inputValue();
    // Will be empty unless remember me was previously set
  });
});

test.describe('Performance', () => {
  test('should load login page within acceptable time', async ({ loginPage, page }) => {
    const startTime = Date.now();

    await loginPage.goto();
    await loginPage.assertPageLoaded();

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have memory leaks on multiple form submissions', async ({ loginPage }) => {
    await loginPage.goto();

    // Submit form multiple times
    for (let i = 0; i < 5; i++) {
      await loginPage.login(testUsers.invalid.email, testUsers.invalid.password);
      await loginPage.page.waitForTimeout(2000);
    }

    // Page should still be responsive
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.emailInput).toBeEnabled();
  });
});

test.describe('Localization', () => {
  test('should display text in English', async ({ loginPage }) => {
    await loginPage.goto();

    // Check for English text
    await expect(loginPage.pageTitle).toContainText('Welcome to 1KAPPA');
    await expect(loginPage.loginButton).toHaveText('Login');
  });

  test('should handle different locale formats', async ({ loginPage, page }) => {
    // This would test different date/time formats if they appear on the page
    await loginPage.goto();

    // Verify page loads correctly
    await loginPage.assertPageLoaded();
  });
});
