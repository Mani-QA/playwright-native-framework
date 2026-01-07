import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Orders Page (/orders)
 * Handles order history display
 */
export class OrdersPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly emptyOrdersMessage: Locator;
  readonly startShoppingButton: Locator;
  readonly ordersList: Locator;
  readonly orderItems: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page heading
    this.pageHeading = page.getByRole('heading', { name: /My Orders/i, level: 1 });

    // Empty state
    this.emptyOrdersMessage = page.getByText(/No orders yet/i);
    this.startShoppingButton = page.getByRole('link', { name: /Start Shopping/i });

    // Orders list
    this.ordersList = page.getByRole('list');
    this.orderItems = page.getByRole('listitem');
  }

  /**
   * Navigate to the orders page
   */
  async goto(): Promise<void> {
    await this.page.goto('/orders');
  }

  /**
   * Get an order row by order ID
   */
  getOrderById(orderId: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: orderId });
  }

  /**
   * Get the order status badge for a specific order
   */
  getOrderStatus(orderId: string): Locator {
    return this.getOrderById(orderId).getByRole('status');
  }

  /**
   * Get the order date for a specific order
   */
  getOrderDate(orderId: string): Locator {
    return this.getOrderById(orderId).getByText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
  }

  /**
   * Get the order total for a specific order
   */
  getOrderTotal(orderId: string): Locator {
    return this.getOrderById(orderId).getByText(/\$\d+\.\d{2}/);
  }

  /**
   * Click on an order to view details
   */
  async clickOrder(orderId: string): Promise<void> {
    await this.getOrderById(orderId).click();
  }

  /**
   * Get the count of orders
   */
  async getOrderCount(): Promise<number> {
    if (await this.emptyOrdersMessage.isVisible()) {
      return 0;
    }
    return await this.orderItems.count();
  }

  /**
   * Check if orders page is empty
   */
  async hasNoOrders(): Promise<boolean> {
    return await this.emptyOrdersMessage.isVisible();
  }

  /**
   * Click Start Shopping button (when no orders)
   */
  async clickStartShopping(): Promise<void> {
    await this.startShoppingButton.click();
  }
}

