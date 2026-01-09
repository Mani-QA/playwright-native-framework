import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Product Detail Page (/products/:slug)
 * Handles individual product information display and cart interactions
 */
export class ProductDetailPage {
  readonly page: Page;
  readonly productImage: Locator;
  readonly productName: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly stockAvailability: Locator;
  readonly addToCartButton: Locator;
  readonly inCartButton: Locator;
  readonly backToProductsLink: Locator;
  readonly notFoundMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Product details
    this.productImage = page.getByRole('main').getByRole('img').first();
    this.productName = page.getByRole('heading', { level: 1 });
    this.productDescription = page.getByRole('main').locator('p');
    this.productPrice = page.getByRole('main').getByText(/\$\d+\.\d{2}/).first();
    this.stockAvailability = page.getByText(/\d+ in stock/i);

    // Cart actions - button name may be "Add to Cart" or "Add"
    this.addToCartButton = page.getByRole('button', { name: /Add to Cart|^Add$/i });
    this.inCartButton = page.getByRole('button', { name: /In Cart/i });

    // Navigation - "Back to Catalog" instead of "Back to Products"
    this.backToProductsLink = page.getByRole('link', { name: /Back to Catalog|Back to Products/i });

    // Error state
    this.notFoundMessage = page.getByText(/404|Not Found/i);
  }

  /**
   * Navigate to a product detail page by slug
   */
  async goto(productSlug: string): Promise<void> {
    await this.page.goto(`/products/${productSlug}`);
  }

  /**
   * Add the product to cart
   */
  async addToCart(): Promise<void> {
    await this.addToCartButton.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for button to be enabled (not in loading state)
    await this.page.waitForFunction(
      (selector) => {
        const btn = document.querySelector(selector);
        return btn && !btn.hasAttribute('disabled');
      },
      'button[aria-label*="Add"][aria-label*="to cart"]',
      { timeout: 15000 }
    );
    await this.addToCartButton.click();
  }

  /**
   * Click In Cart button to navigate to cart
   */
  async clickInCartButton(): Promise<void> {
    await this.inCartButton.click();
  }

  /**
   * Navigate back to products catalog
   */
  async clickBackToProducts(): Promise<void> {
    await this.backToProductsLink.click();
  }

  /**
   * Get the product name text
   */
  async getProductNameText(): Promise<string> {
    return await this.productName.textContent() ?? '';
  }

  /**
   * Get the product description text
   */
  async getProductDescriptionText(): Promise<string> {
    return await this.productDescription.textContent() ?? '';
  }

  /**
   * Get the product price text
   */
  async getProductPriceText(): Promise<string> {
    return await this.productPrice.textContent() ?? '';
  }

  /**
   * Check if product is available for purchase
   */
  async isAddToCartEnabled(): Promise<boolean> {
    return await this.addToCartButton.isEnabled();
  }
}

