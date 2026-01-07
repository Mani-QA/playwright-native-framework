import { type Page, type Locator } from '@playwright/test';

/**
 * Component Object for the Footer
 * Reusable across all pages that have a footer
 */
export class Footer {
  readonly page: Page;
  readonly footer: Locator;
  readonly productsLink: Locator;
  readonly signInLink: Locator;
  readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Footer container
    this.footer = page.getByRole('contentinfo');

    // Footer links
    this.productsLink = this.footer.getByRole('link', { name: 'Products' });
    this.signInLink = this.footer.getByRole('link', { name: /Sign In/i });
    this.cartLink = this.footer.getByRole('link', { name: /Cart/i });
  }

  /**
   * Navigate to products page from footer
   */
  async clickProducts(): Promise<void> {
    await this.productsLink.click();
  }

  /**
   * Navigate to sign in page from footer
   */
  async clickSignIn(): Promise<void> {
    await this.signInLink.click();
  }

  /**
   * Navigate to cart page from footer
   */
  async clickCart(): Promise<void> {
    await this.cartLink.click();
  }

  /**
   * Check if Sign In link is visible (guest state only)
   */
  async isSignInVisible(): Promise<boolean> {
    return await this.signInLink.isVisible();
  }
}

