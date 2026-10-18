import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Login Page (/login)
 * Signs in with a username or email and a password
 */
export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly googleButton: Locator;
  readonly passwordDivider: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly createAccountLink: Locator;
  readonly errorMessage: Locator;
  readonly backToHomeLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', { name: 'Welcome Back' });
    this.googleButton = page.getByRole('button', { name: /Sign in with Google/i });
    this.passwordDivider = page.getByText(/or sign in with password/i);

    this.usernameInput = page.getByRole('textbox', { name: 'Username or email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
    // Scope to main content to avoid the navbar Sign In link
    // Full-string match so this does not also match "Sign in with Google"
    this.signInButton = page.getByRole('main').getByRole('button', { name: /^Sign in$/i });
    this.createAccountLink = page.getByRole('main').getByRole('link', { name: 'Create Account' });

    this.errorMessage = page.getByRole('alert');
    this.backToHomeLink = page.getByRole('link', { name: /Back to Home/i });
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * Fill the username or email field
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
   * Perform complete login action and wait for navigation or an error alert
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSignIn();
    await Promise.race([
      this.page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 15000 }),
    ]);
  }

  /**
   * Open the signup page from the login form
   */
  async clickCreateAccount(): Promise<void> {
    await this.createAccountLink.click();
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
    return (await this.errorMessage.textContent()) ?? '';
  }
}
