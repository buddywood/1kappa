import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.locator('button[type="submit"]:has-text("Login")');
    this.rememberMeCheckbox = page.locator('input#rememberMe');
    this.errorMessage = page.locator('div.text-red-600');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    await this.loginButton.click();
  }

  async waitForSuccessfulLogin() {
    await this.page.waitForURL(/\/(admin|register)?/, { timeout: 10000 });
  }

  async assertPageLoaded() {
    await expect(this.page.locator('text=Welcome to 1KAPPA')).toBeVisible();
  }
}
