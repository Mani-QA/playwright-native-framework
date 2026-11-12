import { type Page, type Locator } from '@playwright/test';

type CatalogProduct = {
  name?: string;
  stock?: number;
  isActive?: boolean;
};

/**
 * Active products the store can still sell, highest stock first.
 * Daily runs share one catalog, so the first card is often sold out.
 */
async function inStockProducts(page: Page): Promise<Array<{ name: string; stock: number }>> {
  const response = await page.request.get('/api/products');
  if (!response.ok()) {
    throw new Error(`Could not load products (${response.status()})`);
  }

  const body = (await response.json()) as { data?: CatalogProduct[] };
  return (body.data ?? [])
    .filter((product): product is { name: string; stock: number; isActive?: boolean } => {
      return typeof product.name === 'string'
        && product.name.trim().length > 0
        && typeof product.stock === 'number'
        && product.stock > 0
        && product.isActive !== false;
    })
    .sort((left, right) => right.stock - left.stock || left.name.localeCompare(right.name));
}

function enabledAddButton(page: Page, productName: string): Locator {
  return page.getByRole('button', {
    name: `Add ${productName} to cart`,
    exact: true,
    disabled: false,
  });
}

/**
 * Name of an active product whose Add button is enabled.
 * Highest remaining stock is preferred so a nearly empty product is not the default target.
 */
async function firstPurchasableProductName(page: Page): Promise<string> {
  await page.getByRole('heading', { name: /Product Catalog/i, level: 1 }).waitFor({
    state: 'visible',
    timeout: 10000,
  });
  await page.getByRole('main').locator('a[href^="/products/"]').first().waitFor({
    state: 'visible',
    timeout: 10000,
  });

  const products = await inStockProducts(page);
  for (const product of products) {
    if ((await enabledAddButton(page, product.name).count()) === 1) {
      return product.name;
    }
  }

  throw new Error(
    'No enabled Add to cart button matched an in-stock product. Out-of-stock products stay disabled.',
  );
}

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
   * Navigate to the catalog page via full page load
   * WARNING: This resets client-side cart state! Use gotoViaNavbar() when cart has items
   */
  async goto(): Promise<void> {
    await this.page.goto('/catalog');
    // Wait for the page heading to be visible, indicating content has loaded
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for at least one product card to be visible
    await this.productCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Navigate to catalog by clicking the Products link in the navbar
   * This preserves client-side state (cart items added in current session)
   */
  async gotoViaNavbar(): Promise<void> {
    await this.page.getByRole('navigation').getByRole('link', { name: 'Products' }).click();
    // Wait for the page heading to be visible
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
    // Visible label is "In Cart". The accessible name is "Go to cart".
    return this.getProductCard(productName).getByRole('button', { name: /^Go to cart$/i });
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
   * Add a product to cart and wait for confirmation
   * Waits for the "In Cart" button to appear, indicating the cart was updated
   */
  async addToCart(productName: string): Promise<void> {
    await this.getAddButton(productName).click();
    // Wait for the button to change to "In Cart" indicating the cart was updated
    await this.getInCartButton(productName).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Add one product that still has stock.
   * The first catalog card is often out of stock on the shared store, and its Add button stays disabled.
   * Returns the product name that was added.
   */
  async addFirstAvailableProductToCart(): Promise<string> {
    const productName = await firstPurchasableProductName(this.page);
    const cartLink = this.page.getByRole('navigation').locator('a[href="/cart"]');
    const beforeText = (await cartLink.textContent()) ?? '';
    const beforeCount = Number(beforeText.match(/\d+/)?.[0] ?? '0');
    await enabledAddButton(this.page, productName).click();
    await this.page.waitForFunction(
      (expectedCount) => {
        const link = document.querySelector('nav a[href="/cart"]');
        const match = link?.textContent?.match(/\d+/);
        return match !== null && match !== undefined && Number(match[0]) >= expectedCount;
      },
      beforeCount + 1,
      { timeout: 10000 },
    );
    return productName;
  }

  /**
   * Open the detail page for one product that still has stock.
   */
  async openInStockProduct(): Promise<void> {
    const productName = await firstPurchasableProductName(this.page);
    await this.page.getByRole('main').getByRole('heading', {
      name: productName,
      exact: true,
    }).click();
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

