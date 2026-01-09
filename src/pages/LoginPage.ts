import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Login Page (/login)
 * Handles user authentication functionality
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly backToHomeLink: Locator;
  readonly testCredentialsSection: Locator;
  readonly standardUserCredential: Locator;
  readonly lockedUserCredential: Locator;
  readonly adminUserCredential: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form elements using user-facing locators (Priority 1)
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    // Scope to main content to avoid navbar's Sign In button
    this.signInButton = page.getByRole('main').getByRole('button', { name: 'Sign In' });

    // Error message - use the alert role (contains the error message paragraph)
    this.errorMessage = page.getByRole('alert');

    // Navigation
    this.backToHomeLink = page.getByRole('link', { name: 'Back to Home' });

    // Test credentials section
    this.testCredentialsSection = page.getByText('Test Credentials');
    this.standardUserCredential = page.getByRole('button', { name: /Standard User/i });
    this.lockedUserCredential = page.getByRole('button', { name: /Locked User/i });
    this.adminUserCredential = page.getByRole('button', { name: /Admin User/i });
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * Fill the username field
   */
  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  /**
   * Fill the password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the Sign In button
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  /**
   * Perform complete login action and wait for navigation
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSignIn();
    // Wait for successful login navigation (redirect away from login page)
    // or for an error message to appear
    await this.page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 }).catch(() => {
      // If we didn't navigate, an error message should be displayed
    });
  }

  /**
   * Click on Standard User test credential to auto-fill form
   */
  async clickStandardUserCredential(): Promise<void> {
    await this.standardUserCredential.click();
  }

  /**
   * Click on Locked User test credential to auto-fill form
   */
  async clickLockedUserCredential(): Promise<void> {
    await this.lockedUserCredential.click();
  }

  /**
   * Click on Admin User test credential to auto-fill form
   */
  async clickAdminUserCredential(): Promise<void> {
    await this.adminUserCredential.click();
  }

  /**
   * Navigate back to home page
   */
  async clickBackToHome(): Promise<void> {
    await this.backToHomeLink.click();
  }

  /**
   * Get the error message text
   */
  async getErrorMessageText(): Promise<string> {
    return await this.errorMessage.textContent() ?? '';
  }
}

