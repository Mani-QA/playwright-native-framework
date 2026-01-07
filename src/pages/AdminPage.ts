import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Admin Dashboard Page (/admin)
 * Handles admin functionality for products, orders, and statistics
 */
export class AdminPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly accessDeniedMessage: Locator;

  // Tabs
  readonly overviewTab: Locator;
  readonly productsTab: Locator;
  readonly ordersTab: Locator;

  // Overview Tab - Statistics
  readonly productsCount: Locator;
  readonly ordersCount: Locator;
  readonly usersCount: Locator;
  readonly pendingOrdersCount: Locator;

  // Overview Tab - Low Stock Alerts
  readonly lowStockSection: Locator;
  readonly lowStockItems: Locator;

  // Overview Tab - Recent Orders
  readonly recentOrdersSection: Locator;
  readonly recentOrderItems: Locator;

  // Products Tab
  readonly productsTable: Locator;
  readonly productRows: Locator;
  readonly addProductButton: Locator;

  // Product Modal
  readonly productModal: Locator;
  readonly productNameInput: Locator;
  readonly productDescriptionInput: Locator;
  readonly productPriceInput: Locator;
  readonly productStockInput: Locator;
  readonly productActiveToggle: Locator;
  readonly productImageUpload: Locator;
  readonly saveProductButton: Locator;
  readonly cancelProductButton: Locator;

  // Orders Tab
  readonly ordersTable: Locator;
  readonly orderRows: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page heading
    this.pageHeading = page.getByRole('heading', { name: /Admin Dashboard/i, level: 1 });
    this.accessDeniedMessage = page.getByText(/Access Denied|Forbidden|Unauthorized/i);

    // Tabs (implemented as buttons, not tab role)
    this.overviewTab = page.getByRole('button', { name: /Overview/i });
    this.productsTab = page.getByRole('button', { name: /Products/i });
    this.ordersTab = page.getByRole('button', { name: /Orders/i });

    // Overview Statistics - each stat card has a label paragraph and a value paragraph
    this.productsCount = page.locator('p').filter({ hasText: 'Products' }).locator('..').locator('p').nth(1);
    this.ordersCount = page.locator('p').filter({ hasText: /^Orders$/ }).locator('..').locator('p').nth(1);
    this.usersCount = page.locator('p').filter({ hasText: 'Users' }).locator('..').locator('p').nth(1);
    this.pendingOrdersCount = page.locator('p').filter({ hasText: 'Pending' }).locator('..').locator('p').nth(1);

    // Low Stock Section - no explicit low stock section in current design
    this.lowStockSection = page.getByRole('heading', { name: /Low Stock/i }).locator('..');
    this.lowStockItems = this.lowStockSection.locator('a');

    // Recent Orders Section
    this.recentOrdersSection = page.getByRole('heading', { name: /Recent Orders/i }).locator('..');
    this.recentOrderItems = this.recentOrdersSection.locator('div').filter({ hasText: /Order #/ });

    // Products Tab
    this.productsTable = page.getByRole('table');
    this.productRows = page.getByRole('row');
    this.addProductButton = page.getByRole('button', { name: /Add Product/i });

    // Product Modal
    this.productModal = page.getByRole('dialog');
    this.productNameInput = page.getByLabel('Name');
    this.productDescriptionInput = page.getByLabel('Description');
    this.productPriceInput = page.getByLabel('Price');
    this.productStockInput = page.getByLabel('Stock');
    this.productActiveToggle = page.getByLabel(/Active/i);
    this.productImageUpload = page.getByLabel(/Image|Upload/i);
    this.saveProductButton = page.getByRole('button', { name: /Save|Submit/i });
    this.cancelProductButton = page.getByRole('button', { name: /Cancel/i });

    // Orders Tab
    this.ordersTable = page.getByRole('table');
    this.orderRows = page.getByRole('row');
  }

  /**
   * Navigate to the admin dashboard and wait for it to load
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin');
    // Wait for either the admin dashboard heading or an access denied redirect
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click Overview tab
   */
  async clickOverviewTab(): Promise<void> {
    await this.overviewTab.click();
  }

  /**
   * Click Products tab
   */
  async clickProductsTab(): Promise<void> {
    await this.productsTab.click();
  }

  /**
   * Click Orders tab
   */
  async clickOrdersTab(): Promise<void> {
    await this.ordersTab.click();
  }

  /**
   * Get product row by name
   */
  getProductRow(productName: string): Locator {
    return this.page.getByRole('row').filter({ hasText: productName });
  }

  /**
   * Get stock input for a specific product
   */
  getProductStockInput(productName: string): Locator {
    return this.getProductRow(productName).getByRole('spinbutton');
  }

  /**
   * Get edit button for a specific product
   */
  getProductEditButton(productName: string): Locator {
    return this.getProductRow(productName).getByRole('button', { name: /Edit/i });
  }

  /**
   * Get status badge for a specific product
   */
  getProductStatus(productName: string): Locator {
    return this.getProductRow(productName).getByRole('status');
  }

  /**
   * Update stock for a product inline
   */
  async updateProductStock(productName: string, newStock: number): Promise<void> {
    const stockInput = this.getProductStockInput(productName);
    await stockInput.fill(newStock.toString());
    await stockInput.blur();
  }

  /**
   * Click Add Product button
   */
  async clickAddProduct(): Promise<void> {
    await this.addProductButton.click();
  }

  /**
   * Click Edit button for a product
   */
  async clickEditProduct(productName: string): Promise<void> {
    await this.getProductEditButton(productName).click();
  }

  /**
   * Fill product form in modal
   */
  async fillProductForm(
    name: string,
    description: string,
    price: number,
    stock: number,
    isActive: boolean = true
  ): Promise<void> {
    await this.productNameInput.fill(name);
    await this.productDescriptionInput.fill(description);
    await this.productPriceInput.fill(price.toString());
    await this.productStockInput.fill(stock.toString());

    const isChecked = await this.productActiveToggle.isChecked();
    if (isActive !== isChecked) {
      await this.productActiveToggle.click();
    }
  }

  /**
   * Save product from modal
   */
  async saveProduct(): Promise<void> {
    await this.saveProductButton.click();
  }

  /**
   * Cancel product modal
   */
  async cancelProductModal(): Promise<void> {
    await this.cancelProductButton.click();
  }

  /**
   * Get order row by order ID
   */
  getOrderRow(orderId: string): Locator {
    return this.page.getByRole('row').filter({ hasText: orderId });
  }

  /**
   * Get status dropdown for a specific order
   */
  getOrderStatusDropdown(orderId: string): Locator {
    return this.getOrderRow(orderId).getByRole('combobox');
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
    const dropdown = this.getOrderStatusDropdown(orderId);
    await dropdown.selectOption({ label: newStatus });
  }

  /**
   * Get low stock item by product name
   */
  getLowStockItem(productName: string): Locator {
    return this.lowStockSection.getByRole('listitem').filter({ hasText: productName });
  }

  /**
   * Get recent order item by order ID
   */
  getRecentOrderItem(orderId: string): Locator {
    return this.recentOrdersSection.getByRole('listitem').filter({ hasText: orderId });
  }

  /**
   * Check if user has admin access by verifying the admin dashboard is visible
   */
  async hasAdminAccess(): Promise<boolean> {
    // Check if the admin dashboard heading is visible
    // If redirected to login or access denied, this will be false
    return await this.pageHeading.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Upload product image
   */
  async uploadProductImage(filePath: string): Promise<void> {
    await this.productImageUpload.setInputFiles(filePath);
  }
}

