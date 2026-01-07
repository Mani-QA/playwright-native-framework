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

    // Order confirmation
    this.orderConfirmedHeading = page.getByRole('heading', { name: /Order Confirmed|Order Details/i });
    this.orderIdText = page.getByText(/Order #|Order ID/i);

    // Order status
    this.orderStatusBadge = page.getByRole('status');

    // Shipping information
    this.shippingAddress = page.getByRole('region', { name: /Shipping/i });

    // Payment information
    this.paymentInfo = page.getByRole('region', { name: /Payment/i });

    // Ordered items
    this.orderedItems = page.getByRole('list').getByRole('listitem');

    // Order total
    this.orderTotal = page.getByText(/Total/i).locator('..').getByText(/\$\d+\.\d{2}/);

    // Navigation
    this.backToOrdersLink = page.getByRole('link', { name: /Back to Orders|View All Orders/i });

    // Error state
    this.notFoundMessage = page.getByText(/404|Not Found|Order not found/i);
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

