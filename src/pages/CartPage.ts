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

    // Page heading
    this.pageHeading = page.getByRole('heading', { name: /Cart|Shopping Cart/i, level: 1 });

    // Empty cart state
    this.emptyCartMessage = page.getByText(/Your cart is empty/i);
    this.continueShoppingButton = page.getByRole('link', { name: /Continue Shopping/i });

    // Cart actions
    this.clearCartButton = page.getByRole('button', { name: /Clear Cart/i });

    // Cart items
    this.cartItems = page.getByRole('listitem');

    // Order summary
    this.orderSummary = page.getByRole('region', { name: /Order Summary/i });
    this.subtotalAmount = page.getByText(/Subtotal/i).locator('..').getByText(/\$\d+\.\d{2}/);
    this.shippingAmount = page.getByText(/Shipping/i).locator('..').getByText(/Free|\$\d+\.\d{2}/i);
    this.totalAmount = page.getByText(/^Total$/i).locator('..').getByText(/\$\d+\.\d{2}/);
    this.proceedToCheckoutButton = page.getByRole('button', { name: /Proceed to Checkout/i });
  }

  /**
   * Navigate to the cart page
   */
  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  /**
   * Get a cart item row by product name
   */
  getCartItem(productName: string): Locator {
    // Cart items are in the main content area, filter by product name
    return this.page.getByRole('main').locator('a').filter({ hasText: productName }).locator('..');
  }

  /**
   * Get the quantity display for a cart item
   * Note: This is a text element, not a spinbutton
   */
  getItemQuantity(productName: string): Locator {
    // Quantity is displayed between the - and + buttons
    return this.getCartItem(productName).locator('button').first().locator('..').getByText(/^\d+$/);
  }

  /**
   * Get the increase quantity button for a cart item
   * Note: This is an icon-only button (second button in quantity controls)
   */
  getIncreaseQuantityButton(productName: string): Locator {
    // The + button is the second button (after the - button)
    return this.getCartItem(productName).getByRole('button').nth(1);
  }

  /**
   * Get the decrease quantity button for a cart item
   * Note: This is an icon-only button (first button in quantity controls)
   */
  getDecreaseQuantityButton(productName: string): Locator {
    // The - button is the first button
    return this.getCartItem(productName).getByRole('button').first();
  }

  /**
   * Get the remove (trash) button for a cart item
   */
  getRemoveItemButton(productName: string): Locator {
    return this.getCartItem(productName).getByRole('button', { name: /Remove|Delete/i });
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
    await this.proceedToCheckoutButton.click();
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
    return await this.getItemQuantity(productName).inputValue();
  }
}

