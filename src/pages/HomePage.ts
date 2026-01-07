import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Home Page (/)
 * Handles hero section and featured products display
 */
export class HomePage {
  readonly page: Page;
  readonly heroSection: Locator;
  readonly welcomeMessage: Locator;
  readonly shopNowButton: Locator;
  readonly browseProductsButton: Locator;
  readonly featuredProductsGrid: Locator;
  readonly productCards: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;

    // Hero section elements
    this.heroSection = page.getByRole('banner');
    this.welcomeMessage = page.getByRole('heading', { level: 1 });
    this.shopNowButton = page.getByRole('link', { name: /Shop Now/i });
    this.browseProductsButton = page.getByRole('link', { name: /Browse Products/i });
    this.logo = page.getByRole('img', { name: /QA Demo/i });

    // Featured products
    this.featuredProductsGrid = page.getByRole('region', { name: /Featured Products/i });
    this.productCards = page.getByRole('article');
  }

  /**
   * Navigate to the home page
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Click Shop Now button to navigate to catalog
   */
  async clickShopNow(): Promise<void> {
    await this.shopNowButton.click();
  }

  /**
   * Click Browse Products button to navigate to catalog
   */
  async clickBrowseProducts(): Promise<void> {
    await this.browseProductsButton.click();
  }

  /**
   * Click on a featured product by name
   */
  async clickFeaturedProduct(productName: string): Promise<void> {
    await this.page.getByRole('link', { name: productName }).click();
  }

  /**
   * Add a featured product to cart by name
   */
  async addFeaturedProductToCart(productName: string): Promise<void> {
    const productCard = this.page.getByRole('article').filter({ hasText: productName });
    await productCard.getByRole('button', { name: 'Add' }).click();
  }

  /**
   * Get the count of featured products
   */
  async getFeaturedProductCount(): Promise<number> {
    return await this.productCards.count();
  }
}

