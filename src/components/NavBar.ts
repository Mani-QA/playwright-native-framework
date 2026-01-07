import { type Page, type Locator } from '@playwright/test';

/**
 * Component Object for the Navigation Bar
 * Reusable across all pages that have navigation
 */
export class NavBar {
  readonly page: Page;
  readonly logo: Locator;
  readonly productsLink: Locator;
  readonly cartIcon: Locator;
  readonly cartBadge: Locator;
  readonly signInButton: Locator;
  readonly usernameLink: Locator;
  readonly adminButton: Locator;
  readonly logoutButton: Locator;
  readonly mobileMenuButton: Locator;
  readonly mobileMenu: Locator;
  readonly myOrdersLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Logo and main navigation - scoped to navigation to avoid footer
    this.logo = page.getByRole('navigation').getByRole('link', { name: /QA Demo/i });
    this.productsLink = page.getByRole('navigation').getByRole('link', { name: 'Products' });

    // Cart - the cart link goes to /cart and may contain a badge number
    this.cartIcon = page.getByRole('navigation').locator('a[href="/cart"]');
    this.cartBadge = page.getByRole('navigation').locator('a[href="/cart"]').locator('div').last();

    // Authentication - Guest state (scope to navigation to avoid footer link)
    this.signInButton = page.getByRole('navigation').getByRole('link', { name: /Sign In/i });

    // Authentication - Logged in state
    // Username link goes to /orders - find it in the navigation
    this.usernameLink = page.getByRole('navigation').locator('a[href="/orders"]');
    // Use exact: true to avoid matching "admin_user" username
    this.adminButton = page.getByRole('link', { name: 'Admin', exact: true });
    // Logout button is an icon-only button in the navigation (the one that's not the Admin button)
    this.logoutButton = page.getByRole('navigation').getByRole('button').last();

    // Mobile menu
    this.mobileMenuButton = page.getByRole('button', { name: /Menu|Toggle navigation/i });
    this.mobileMenu = page.getByRole('navigation').getByRole('menu');
    this.myOrdersLink = page.getByRole('link', { name: /My Orders/i });
  }

  /**
   * Click on logo to navigate to home
   */
  async clickLogo(): Promise<void> {
    await this.logo.click();
  }

  /**
   * Navigate to products/catalog page
   */
  async clickProducts(): Promise<void> {
    await this.productsLink.click();
  }

  /**
   * Navigate to cart page
   */
  async clickCart(): Promise<void> {
    await this.cartIcon.click();
  }

  /**
   * Navigate to login page
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  /**
   * Navigate to orders page by clicking username
   */
  async clickUsername(): Promise<void> {
    await this.usernameLink.click();
  }

  /**
   * Navigate to admin dashboard
   */
  async clickAdmin(): Promise<void> {
    await this.adminButton.click();
  }

  /**
   * Perform logout
   */
  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu(): Promise<void> {
    await this.mobileMenuButton.click();
  }

  /**
   * Navigate to My Orders from mobile menu
   */
  async clickMyOrders(): Promise<void> {
    await this.myOrdersLink.click();
  }

  /**
   * Get the cart item count from badge
   */
  async getCartItemCount(): Promise<number> {
    // Cart badge displays a number like "1" or "2" - look for any number in the cart link
    const cartLink = this.cartIcon;
    const cartText = await cartLink.textContent() ?? '';
    const match = cartText.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    return 0;
  }

  /**
   * Get the displayed username
   */
  async getUsername(): Promise<string> {
    return await this.usernameLink.textContent() ?? '';
  }

  /**
   * Check if user is logged in (username visible instead of Sign In)
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.logoutButton.isVisible();
  }

  /**
   * Check if admin button is visible
   */
  async isAdminVisible(): Promise<boolean> {
    return await this.adminButton.isVisible();
  }

  /**
   * Check if Sign In button is visible (guest state)
   */
  async isSignInVisible(): Promise<boolean> {
    return await this.signInButton.isVisible();
  }
}

