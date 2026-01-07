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

    // Logo and main navigation
    this.logo = page.getByRole('link', { name: /QA Demo|Logo/i });
    this.productsLink = page.getByRole('link', { name: 'Products' });

    // Cart
    this.cartIcon = page.getByRole('link', { name: /Cart/i });
    this.cartBadge = page.getByRole('link', { name: /Cart/i }).getByText(/\d+/);

    // Authentication - Guest state
    this.signInButton = page.getByRole('link', { name: /Sign In/i });

    // Authentication - Logged in state
    this.usernameLink = page.getByRole('navigation').getByRole('link').filter({ hasText: /^(?!Products|Cart|Sign In|Admin).*$/ });
    this.adminButton = page.getByRole('link', { name: 'Admin' });
    this.logoutButton = page.getByRole('button', { name: /Logout|Sign Out/i });

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
    const isVisible = await this.cartBadge.isVisible();
    if (!isVisible) {
      return 0;
    }
    const text = await this.cartBadge.textContent() ?? '0';
    return parseInt(text, 10);
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

