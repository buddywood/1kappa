import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Login page
 * Encapsulates all interactions with the login page
 */
export class LoginPage {
  readonly page: Page;

  // Locators for login form
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  // Locators for verification form
  readonly verificationCodeInputs: Locator;
  readonly verifyEmailButton: Locator;
  readonly resendCodeButton: Locator;
  readonly backToLoginButton: Locator;

  // Locators for password change form
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly changePasswordButton: Locator;

  // Locators for navigation
  readonly returnToHomepageButton: Locator;
  readonly joinNowLink: Locator;
  readonly becomeSellerLink: Locator;
  readonly becomePromoterLink: Locator;

  // Locators for page elements
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;

    // Login form locators
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.locator('button[type="submit"]:has-text("Login")');
    this.rememberMeCheckbox = page.locator('input#rememberMe');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    this.errorMessage = page.locator('div.text-red-600');

    // Verification form locators
    this.verificationCodeInputs = page.locator('input[inputmode="numeric"]');
    this.verifyEmailButton = page.locator('button[type="submit"]:has-text("Verify Email")');
    this.resendCodeButton = page.locator('button:has-text("Resend code")');
    this.backToLoginButton = page.locator('button:has-text("Back to Login")');

    // Password change form locators
    this.newPasswordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').last();
    this.changePasswordButton = page.locator('button[type="submit"]:has-text("Change Password")');

    // Navigation locators
    this.returnToHomepageButton = page.locator('a[href="/"]:has-text("Return to Homepage")');
    this.joinNowLink = page.locator('a[href="/register"]:has-text("Join Now")');
    this.becomeSellerLink = page.locator('a[href="/apply"]:has-text("Become a Seller")');
    this.becomePromoterLink = page.locator('a[href="/promote"]:has-text("Become a Promoter")');

    // Page elements
    this.pageTitle = page.locator('text=Welcome to 1KAPPA');
    this.pageSubtitle = page.locator('text=One Family. One Step. One Kappa.');
    this.logo = page.locator('img[src="/header-icon.png"]');
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.loginButton.click();
  }

  /**
   * Wait for the login button to be in loading state
   */
  async waitForLoginLoading() {
    await this.page.waitForSelector('button:has-text("Logging in...")');
  }

  /**
   * Wait for navigation after successful login
   */
  async waitForSuccessfulLogin() {
    await this.page.waitForURL(/\/(admin|register)?/, { timeout: 10000 });
  }

  /**
   * Check if an error message is displayed
   */
  async hasError() {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the error message text
   */
  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  /**
   * Verify email with verification code
   */
  async verifyEmail(code: string) {
    // Fill each digit of the verification code
    const inputs = await this.verificationCodeInputs.all();
    const digits = code.split('');

    for (let i = 0; i < Math.min(digits.length, inputs.length); i++) {
      await inputs[i].fill(digits[i]);
    }

    await this.verifyEmailButton.click();
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode() {
    await this.resendCodeButton.click();
  }

  /**
   * Go back to login from verification screen
   */
  async backToLogin() {
    await this.backToLoginButton.click();
  }

  /**
   * Change password
   */
  async changePassword(newPassword: string, confirmPassword: string) {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.changePasswordButton.click();
  }

  /**
   * Check if the verification form is displayed
   */
  async isVerificationFormVisible() {
    return await this.verifyEmailButton.isVisible();
  }

  /**
   * Check if the password change form is displayed
   */
  async isPasswordChangeFormVisible() {
    return await this.changePasswordButton.isVisible();
  }

  /**
   * Check if the login form is displayed
   */
  async isLoginFormVisible() {
    return await this.loginButton.isVisible();
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Navigate to register page
   */
  async goToRegister() {
    await this.joinNowLink.click();
  }

  /**
   * Navigate to homepage
   */
  async goToHomepage() {
    await this.returnToHomepageButton.click();
  }

  /**
   * Assert that the page is loaded correctly
   */
  async assertPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.logo).toBeVisible();
  }
}
