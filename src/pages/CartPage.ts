import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Cart Page (/cart)
 * Handles shopping cart functionality
 */
export class CartPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly emptyCartMessage: Locator;
  readonly continueShoppingButton: Locator;
  readonly clearCartButton: Locator;
  readonly cartItems: Locator;
  readonly orderSummary: Locator;
  readonly subtotalAmount: Locator;
  readonly shippingAmount: Locator;
  readonly totalAmount: Locator;
  readonly proceedToCheckoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page heading - can be either "Shopping Cart" (with items) or "Your cart is empty" (empty cart)
    this.pageHeading = page.getByRole('heading', { name: /Shopping Cart|Your cart is empty/i, level: 1 });

    // Empty cart state - the "Your cart is empty" h1 heading
    this.emptyCartMessage = page.getByRole('heading', { name: /Your cart is empty/i, level: 1 });
    this.continueShoppingButton = page.getByRole('link', { name: /Continue Shopping/i });

    // Cart actions
    this.clearCartButton = page.getByRole('button', { name: /Clear Cart/i });

    // Cart items - each item is a link with product info, in main content area
    this.cartItems = page.getByRole('main').locator('a[href^="/products/"]');

    // Order summary - look for heading instead of region
    this.orderSummary = page.getByRole('heading', { name: /Order Summary/i }).locator('..');
    this.subtotalAmount = page.getByText('Subtotal').locator('..').locator('div').last();
    this.shippingAmount = page.getByText('Shipping').locator('..').locator('div').last();
    this.totalAmount = page.getByText('Total').locator('..').locator('div').last();
    this.proceedToCheckoutButton = page.getByRole('button', { name: /Proceed to Checkout/i });
  }

  /**
   * Navigate to the cart page directly (full page navigation)
   * Use gotoViaNavbar() instead when cart has items added in the current session
   */
  async goto(): Promise<void> {
    await this.page.goto('/cart');
    // Wait for the page heading to be visible, indicating content has loaded
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Navigate to cart by clicking the cart icon in the navbar
   * This preserves client-side state (cart items added in current session)
   */
  async gotoViaNavbar(): Promise<void> {
    // Get current cart count from badge before navigation
    const cartBadge = this.page.locator('nav a[href="/cart"]');
    const badgeText = await cartBadge.textContent() || '0';
    const expectedCount = parseInt(badgeText.match(/\d+/)?.[0] || '0', 10);

    // Click the cart link and wait for URL to be /cart
    await Promise.all([
      this.page.waitForURL(/\/cart/, { timeout: 10000 }),
      cartBadge.click(),
    ]);

    // Wait for the page heading to be visible
    await this.pageHeading.waitFor({ state: 'visible', timeout: 10000 });

    // If we had items in cart, wait for them to render
    if (expectedCount > 0) {
      await this.cartItems.first().waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Wait for cart items to be visible (useful after adding products)
   */
  async waitForCartItems(): Promise<void> {
    // Wait for either empty cart message or cart items to be visible
    await Promise.race([
      this.emptyCartMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.cartItems.first().waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  /**
   * Get a cart item container by product name
   * Cart items have a link (product image/name) and buttons alongside it
   */
  getCartItem(productName: string): Locator {
    // Find the container that has the product link
    return this.page.getByRole('main').locator('a').filter({ hasText: productName }).locator('xpath=../..'); 
  }

  /**
   * Get the quantity display for a cart item
   * Note: This is a text element (generic div), not a spinbutton
   */
  getItemQuantity(productName: string): Locator {
    // Quantity is displayed as text between the - and + buttons
    return this.getCartItem(productName).locator('div').filter({ hasText: /^[0-9]+$/ }).first();
  }

  /**
   * Get the increase quantity button for a cart item
   * Note: This is an icon-only button (second button after quantity display)
   */
  getIncreaseQuantityButton(productName: string): Locator {
    // The + button is the button after the quantity display (not disabled)
    return this.getCartItem(productName).getByRole('button').nth(1);
  }

  /**
   * Get the decrease quantity button for a cart item
   * Note: This is an icon-only button (first button before quantity display)
   */
  getDecreaseQuantityButton(productName: string): Locator {
    // The - button is the first button
    return this.getCartItem(productName).getByRole('button').first();
  }

  /**
   * Get the remove (trash) button for a cart item
   * This is the last button in the item row
   */
  getRemoveItemButton(productName: string): Locator {
    return this.getCartItem(productName).getByRole('button').last();
  }

  /**
   * Get the subtotal for a specific cart item
   */
  getItemSubtotal(productName: string): Locator {
    return this.getCartItem(productName).getByText(/\$\d+\.\d{2}/).last();
  }

  /**
   * Increase quantity for a cart item
   */
  async increaseQuantity(productName: string): Promise<void> {
    await this.getIncreaseQuantityButton(productName).click();
  }

  /**
   * Decrease quantity for a cart item
   */
  async decreaseQuantity(productName: string): Promise<void> {
    await this.getDecreaseQuantityButton(productName).click();
  }

  /**
   * Remove a single item from cart
   */
  async removeItem(productName: string): Promise<void> {
    await this.getRemoveItemButton(productName).click();
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    await this.clearCartButton.click();
  }

  /**
   * Click Continue Shopping
   */
  async clickContinueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  /**
   * Click Proceed to Checkout
   */
  async clickProceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.waitFor({ state: 'visible', timeout: 10000 });
    // Use force click to handle React re-render stability issues
    await this.proceedToCheckoutButton.click({ force: true });
    // Wait for navigation to checkout page
    await this.page.waitForURL(/\/checkout/, { timeout: 10000 });
  }

  /**
   * Get the number of items in cart
   */
  async getCartItemCount(): Promise<number> {
    // If empty cart message is visible, return 0
    if (await this.emptyCartMessage.isVisible()) {
      return 0;
    }
    return await this.cartItems.count();
  }

  /**
   * Get the total amount text
   */
  async getTotalAmountText(): Promise<string> {
    return await this.totalAmount.textContent() ?? '';
  }

  /**
   * Check if cart is empty
   */
  async isCartEmpty(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  /**
   * Get quantity value for a specific item
   */
  async getQuantityValue(productName: string): Promise<string> {
    return await this.getItemQuantity(productName).textContent() ?? '0';
  }
}

