import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Checkout Page (/checkout)
 * Handles shipping and payment form functionality
 */
export class CheckoutPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly emptyCartMessage: Locator;
  readonly continueShoppingButton: Locator;

  // Shipping Information
  readonly shippingSection: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;

  // Payment Information
  readonly paymentSection: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryDateInput: Locator;
  readonly cvvInput: Locator;
  readonly cardholderNameInput: Locator;

  // Order Summary
  readonly orderSummarySection: Locator;
  readonly orderItems: Locator;
  readonly subtotalAmount: Locator;
  readonly shippingAmount: Locator;
  readonly totalAmount: Locator;

  // Actions
  readonly placeOrderButton: Locator;

  // Validation errors
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page heading
    this.pageHeading = page.getByRole('heading', { name: /Checkout/i, level: 1 });

    // Empty cart state
    this.emptyCartMessage = page.getByText(/Your cart is empty/i);
    this.continueShoppingButton = page.getByRole('link', { name: /Continue Shopping/i });

    // Shipping Information section
    this.shippingSection = page.getByRole('heading', { name: /Shipping Information/i }).locator('..');
    this.firstNameInput = page.getByLabel('First Name');
    this.lastNameInput = page.getByLabel('Last Name');
    // Address field uses placeholder text, not label
    this.addressInput = page.getByPlaceholder('Enter your full address');

    // Payment Information section - use multiple strategies for robustness
    this.paymentSection = page.getByRole('group', { name: /Payment Information/i });
    this.cardNumberInput = page.getByLabel(/Card Number/i).or(page.getByPlaceholder(/card number/i));
    this.expiryDateInput = page.getByLabel(/Expiry|Expiration/i).or(page.getByPlaceholder(/MM\/YY/i));
    this.cvvInput = page.getByLabel(/CVV|CVC|Security/i).or(page.getByPlaceholder(/CVV|CVC|123/i));
    this.cardholderNameInput = page.getByLabel(/Name on Card|Cardholder/i).or(page.getByPlaceholder(/name on card/i));

    // Order Summary section
    this.orderSummarySection = page.getByRole('region', { name: /Order Summary/i });
    this.orderItems = page.getByRole('listitem');
    this.subtotalAmount = page.getByText(/Subtotal/i).locator('..').getByText(/\$\d+\.\d{2}/);
    this.shippingAmount = page.getByText(/Shipping/i).locator('..').getByText(/Free|\$\d+\.\d{2}/i);
    this.totalAmount = page.getByText(/^Total$/i).locator('..').getByText(/\$\d+\.\d{2}/);

    // Place Order button (includes price, e.g., "Place Order - $129.99")
    this.placeOrderButton = page.getByRole('button', { name: /Place Order/i });

    // Validation errors - these are styled red text elements with "is required" or "invalid" messages
    this.validationErrors = page.locator('text=/is required|invalid/i');
  }

  /**
   * Navigate to the checkout page and wait for content to load
   */
  async goto(): Promise<void> {
    await this.page.goto('/checkout');
    // Wait for the page to fully load
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for either checkout heading or empty cart message
    await this.pageHeading.or(this.emptyCartMessage).waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Fill shipping information
   * Uses explicit waits to handle React re-renders that may detach elements
   */
  async fillShippingInfo(firstName: string, lastName: string, address: string): Promise<void> {
    // Wait for each field to be stable before filling to handle React re-renders
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.firstNameInput.fill(firstName);
    
    await this.lastNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.lastNameInput.fill(lastName);
    
    // Address field may be detached during re-renders, wait for it specifically
    await this.addressInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.addressInput.fill(address);
  }

  /**
   * Fill payment information
   * Uses explicit waits to handle React re-renders that may detach elements
   */
  async fillPaymentInfo(
    cardNumber: string,
    expiryDate: string,
    cvv: string,
    cardholderName: string
  ): Promise<void> {
    // Wait for each field to be stable before filling to handle React re-renders
    await this.cardNumberInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.cardNumberInput.fill(cardNumber);

    await this.expiryDateInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.expiryDateInput.fill(expiryDate);

    await this.cvvInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.cvvInput.fill(cvv);

    await this.cardholderNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.cardholderNameInput.fill(cardholderName);
  }

  /**
   * Fill complete checkout form
   */
  async fillCheckoutForm(
    shippingInfo: { firstName: string; lastName: string; address: string },
    paymentInfo: { cardNumber: string; expiryDate: string; cvv: string; cardholderName: string }
  ): Promise<void> {
    await this.fillShippingInfo(
      shippingInfo.firstName,
      shippingInfo.lastName,
      shippingInfo.address
    );
    await this.fillPaymentInfo(
      paymentInfo.cardNumber,
      paymentInfo.expiryDate,
      paymentInfo.cvv,
      paymentInfo.cardholderName
    );
  }

  /**
   * Click Place Order button
   */
  async clickPlaceOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }

  /**
   * Complete checkout with all information and wait for order confirmation
   */
  async completeCheckout(
    shippingInfo: { firstName: string; lastName: string; address: string },
    paymentInfo: { cardNumber: string; expiryDate: string; cvv: string; cardholderName: string }
  ): Promise<void> {
    await this.fillCheckoutForm(shippingInfo, paymentInfo);
    await this.clickPlaceOrder();
    // Wait for navigation to order confirmation page
    await this.page.waitForURL(/\/orders\/\d+/, { timeout: 15000 });
  }

  /**
   * Get validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errorMessages: string[] = [];
    const count = await this.validationErrors.count();
    for (let i = 0; i < count; i++) {
      const text = await this.validationErrors.nth(i).textContent();
      if (text) {
        errorMessages.push(text);
      }
    }
    return errorMessages;
  }

  /**
   * Check if checkout form is displayed (not empty cart)
   */
  async isCheckoutFormVisible(): Promise<boolean> {
    return await this.firstNameInput.isVisible();
  }

  /**
   * Get the total amount text
   */
  async getTotalAmountText(): Promise<string> {
    return await this.totalAmount.textContent() ?? '';
  }

  /**
   * Get error message for a specific field
   */
  getFieldError(fieldLabel: string): Locator {
    return this.page.getByLabel(fieldLabel).locator('..').getByRole('alert');
  }
}

