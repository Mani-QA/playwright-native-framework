import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Catalog Page (/catalog)
 * Handles product listing and cart interactions from catalog
 */
export class CatalogPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly productGrid: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page heading - "Product Catalog" is the actual heading text
    this.pageHeading = page.getByRole('heading', { name: /Product Catalog/i, level: 1 });

    // Product grid and cards - products are links with nested content
    this.productGrid = page.getByRole('main');
    // Each product card is a link element containing heading, description, price and buttons
    this.productCards = page.getByRole('main').locator('a[href^="/products/"]');
  }

  /**
   * Navigate to the catalog page and wait for products to load
   */
  async goto(): Promise<void> {
    await this.page.goto('/catalog');
    // Wait for the page heading to be visible, indicating content has loaded
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for at least one product card to be visible
    await this.productCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get a product card by product name
   */
  getProductCard(productName: string): Locator {
    return this.page.getByRole('main').locator('a[href^="/products/"]').filter({ hasText: productName });
  }

  /**
   * Get the product name locator within a product card
   */
  getProductName(productName: string): Locator {
    return this.getProductCard(productName).getByRole('heading');
  }

  /**
   * Get the product price locator within a product card
   */
  getProductPrice(productName: string): Locator {
    return this.getProductCard(productName).getByText(/\$\d+\.\d{2}/);
  }

  /**
   * Get the Add button for a product
   */
  getAddButton(productName: string): Locator {
    return this.getProductCard(productName).getByRole('button', { name: 'Add' });
  }

  /**
   * Get the In Cart button for a product
   */
  getInCartButton(productName: string): Locator {
    return this.getProductCard(productName).getByRole('button', { name: /In Cart/i });
  }

  /**
   * Get the Remove (X) button for a product that's in cart
   */
  getRemoveButton(productName: string): Locator {
    return this.getProductCard(productName).getByRole('button', { name: /Remove from cart/i });
  }

  /**
   * Get the Low Stock badge for a product
   */
  getLowStockBadge(productName: string): Locator {
    return this.getProductCard(productName).getByText('Low Stock');
  }

  /**
   * Get the Out of Stock badge for a product
   */
  getOutOfStockBadge(productName: string): Locator {
    return this.getProductCard(productName).getByText('Out of Stock');
  }

  /**
   * Click on a product to navigate to its detail page
   */
  async clickProduct(productName: string): Promise<void> {
    await this.getProductName(productName).click();
  }

  /**
   * Add a product to cart
   */
  async addToCart(productName: string): Promise<void> {
    await this.getAddButton(productName).click();
  }

  /**
   * Click In Cart button to navigate to cart
   */
  async clickInCartButton(productName: string): Promise<void> {
    await this.getInCartButton(productName).click();
  }

  /**
   * Remove a product from cart using X button
   */
  async removeFromCart(productName: string): Promise<void> {
    await this.getRemoveButton(productName).click();
  }

  /**
   * Get the total count of products displayed
   */
  async getProductCount(): Promise<number> {
    return await this.productCards.count();
  }

  /**
   * Check if a product is in stock
   */
  async isProductInStock(productName: string): Promise<boolean> {
    const outOfStockBadge = this.getOutOfStockBadge(productName);
    return !(await outOfStockBadge.isVisible());
  }

  /**
   * Check if a product has low stock
   */
  async hasLowStock(productName: string): Promise<boolean> {
    const lowStockBadge = this.getLowStockBadge(productName);
    return await lowStockBadge.isVisible();
  }
}

