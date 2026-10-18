import { type Page, type Locator } from '@playwright/test';

/**
 * Details entered on the signup form.
 * Username is optional; the app derives one from the email when it is left blank.
 */
export interface SignupFormInput {
  email: string;
  phone: string;
  username?: string;
  password: string;
  confirmPassword: string;
}

/**
 * Page Object Model for the Signup Page (/signup)
 * Creates a standard customer account and signs the visitor in
 */
export class SignupPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly googleButton: Locator;
  readonly emailDivider: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly showPasswordButton: Locator;
  readonly showConfirmPasswordButton: Locator;
  readonly lengthRule: Locator;
  readonly uppercaseRule: Locator;
  readonly numberRule: Locator;
  readonly createAccountButton: Locator;
  readonly signInLink: Locator;
  readonly backToHomeLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', { name: 'Create an Account' });
    this.googleButton = page.getByRole('button', { name: /Sign up with Google/i });
    this.emailDivider = page.getByText(/or register with email/i);

    this.emailInput = page.getByRole('textbox', { name: 'Email address' });
    this.phoneInput = page.getByRole('textbox', { name: 'Phone number' });
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    // Exact name so this does not also match "Confirm password"
    this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
    this.confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm password' });
    this.showPasswordButton = page.getByRole('button', { name: 'Show password', exact: true });
    this.showConfirmPasswordButton = page.getByRole('button', { name: 'Show confirmed password' });

    this.lengthRule = page.getByText('At least 8 characters', { exact: true });
    this.uppercaseRule = page.getByText('At least one uppercase letter (A-Z)', { exact: true });
    this.numberRule = page.getByText('At least one number (0-9)', { exact: true });

    this.createAccountButton = page.getByRole('button', { name: /^Create account$/i });
    this.signInLink = page.getByRole('main').getByRole('link', { name: 'Sign In' });
    this.backToHomeLink = page.getByRole('link', { name: /Back to Home/i });
    this.errorMessage = page.getByRole('alert');
  }

  /**
   * Navigate to the signup page
   */
  async goto(): Promise<void> {
    await this.page.goto('/signup');
  }

  /**
   * Fill the registration form. A blank username is left empty so the app can derive one.
   */
  async fillForm(input: SignupFormInput): Promise<void> {
    await this.emailInput.fill(input.email);
    await this.phoneInput.fill(input.phone);
    if (input.username) {
      await this.usernameInput.fill(input.username);
    }
    await this.passwordInput.fill(input.password);
    await this.confirmPasswordInput.fill(input.confirmPassword);
  }

  /**
   * Click Create Account without waiting for the result.
   * Use this when the form is expected to stay on the page with a field error.
   */
  async clickCreateAccount(): Promise<void> {
    await this.createAccountButton.click();
  }

  /**
   * Submit a complete signup and wait until the visitor leaves the page or an alert appears.
   */
  async signup(input: SignupFormInput): Promise<void> {
    await this.fillForm(input);
    await this.clickCreateAccount();
    await Promise.race([
      this.page.waitForURL((url) => !url.pathname.includes('/signup'), { timeout: 15000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 15000 }),
    ]);
  }

  /**
   * Open the login page from the signup form
   */
  async clickSignIn(): Promise<void> {
    await this.signInLink.click();
  }

  /**
   * Navigate back to the home page
   */
  async clickBackToHome(): Promise<void> {
    await this.backToHomeLink.click();
  }
}
