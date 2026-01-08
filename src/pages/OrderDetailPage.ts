import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Order Detail/Confirmation Page (/orders/:id)
 * Handles order confirmation and detail display
 */
export class OrderDetailPage {
  readonly page: Page;
  readonly orderConfirmedHeading: Locator;
  readonly orderIdText: Locator;
  readonly orderStatusBadge: Locator;
  readonly shippingAddress: Locator;
  readonly paymentInfo: Locator;
  readonly orderedItems: Locator;
  readonly orderTotal: Locator;
  readonly backToOrdersLink: Locator;
  readonly notFoundMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Order confirmation - look for "Order Confirmed!" heading
    this.orderConfirmedHeading = page.getByRole('heading', { name: /Order Confirmed/i, level: 1 });
    // Order ID is shown as "Order #1" in a paragraph
    this.orderIdText = page.getByText(/Order #\d+/);

    // Order status - displayed as text like "Processing", "Pending", etc.
    this.orderStatusBadge = page.getByText(/^(Processing|Pending|Completed|Shipped|Delivered)$/);

    // Shipping information - look for heading with Shipping
    this.shippingAddress = page.getByRole('heading', { name: /Shipping Information/i }).locator('..');

    // Payment information - text showing card ending info
    this.paymentInfo = page.getByText(/card ending/i);

    // Ordered items - each order item has product name and price
    this.orderedItems = page.getByRole('heading', { name: /Order Items/i }).locator('..').locator('div > div');

    // Order total - find the container that has both "Total" and a price
    // Using a more specific locator to get the total row
    this.orderTotal = page.getByText('Total$').first();

    // Navigation - "Continue Shopping" link on order detail page
    this.backToOrdersLink = page.getByRole('link', { name: /Continue Shopping|Back to Orders|View All Orders/i });

    // Error state - look for "Order Not Found" heading only
    this.notFoundMessage = page.getByRole('heading', { name: /Order Not Found/i });
  }

  /**
   * Navigate to a specific order detail page
   */
  async goto(orderId: string): Promise<void> {
    await this.page.goto(`/orders/${orderId}`);
  }

  /**
   * Get the order ID from the page
   */
  async getOrderId(): Promise<string> {
    const text = await this.orderIdText.textContent() ?? '';
    const match = text.match(/#?(\d+)/);
    return match ? match[1] : '';
  }

  /**
   * Get the order status text
   */
  async getOrderStatusText(): Promise<string> {
    return await this.orderStatusBadge.textContent() ?? '';
  }

  /**
   * Get the shipping address text
   */
  async getShippingAddressText(): Promise<string> {
    return await this.shippingAddress.textContent() ?? '';
  }

  /**
   * Get the payment info text (should show last 4 digits only)
   */
  async getPaymentInfoText(): Promise<string> {
    return await this.paymentInfo.textContent() ?? '';
  }

  /**
   * Get the number of ordered items
   */
  async getOrderedItemCount(): Promise<number> {
    return await this.orderedItems.count();
  }

  /**
   * Get the order total text
   */
  async getOrderTotalText(): Promise<string> {
    return await this.orderTotal.textContent() ?? '';
  }

  /**
   * Get an ordered item by product name
   */
  getOrderedItem(productName: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: productName });
  }

  /**
   * Get the quantity for a specific ordered item
   */
  getItemQuantity(productName: string): Locator {
    return this.getOrderedItem(productName).getByText(/Qty:|Quantity:|x\s*\d+/i);
  }

  /**
   * Get the subtotal for a specific ordered item
   */
  getItemSubtotal(productName: string): Locator {
    return this.getOrderedItem(productName).getByText(/\$\d+\.\d{2}/);
  }

  /**
   * Navigate back to orders list
   */
  async clickBackToOrders(): Promise<void> {
    await this.backToOrdersLink.click();
  }

  /**
   * Check if order was found (no 404)
   */
  async isOrderFound(): Promise<boolean> {
    return !(await this.notFoundMessage.isVisible());
  }
}

