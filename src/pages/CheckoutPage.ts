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

    // Payment Information section
    this.paymentSection = page.getByRole('group', { name: /Payment Information/i });
    this.cardNumberInput = page.getByLabel(/Card Number/i);
    this.expiryDateInput = page.getByLabel(/Expiry Date|Expiration/i);
    this.cvvInput = page.getByLabel(/CVV|CVC|Security Code/i);
    this.cardholderNameInput = page.getByLabel(/Name on Card|Cardholder Name/i);

    // Order Summary section
    this.orderSummarySection = page.getByRole('region', { name: /Order Summary/i });
    this.orderItems = page.getByRole('listitem');
    this.subtotalAmount = page.getByText(/Subtotal/i).locator('..').getByText(/\$\d+\.\d{2}/);
    this.shippingAmount = page.getByText(/Shipping/i).locator('..').getByText(/Free|\$\d+\.\d{2}/i);
    this.totalAmount = page.getByText(/^Total$/i).locator('..').getByText(/\$\d+\.\d{2}/);

    // Place Order button (includes price, e.g., "Place Order - $129.99")
    this.placeOrderButton = page.getByRole('button', { name: /Place Order/i });

    // Validation errors
    this.validationErrors = page.getByRole('alert');
  }

  /**
   * Navigate to the checkout page
   */
  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  /**
   * Fill shipping information
   */
  async fillShippingInfo(firstName: string, lastName: string, address: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.addressInput.fill(address);
  }

  /**
   * Fill payment information
   */
  async fillPaymentInfo(
    cardNumber: string,
    expiryDate: string,
    cvv: string,
    cardholderName: string
  ): Promise<void> {
    await this.cardNumberInput.fill(cardNumber);
    await this.expiryDateInput.fill(expiryDate);
    await this.cvvInput.fill(cvv);
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
   * Complete checkout with all information
   */
  async completeCheckout(
    shippingInfo: { firstName: string; lastName: string; address: string },
    paymentInfo: { cardNumber: string; expiryDate: string; cvv: string; cardholderName: string }
  ): Promise<void> {
    await this.fillCheckoutForm(shippingInfo, paymentInfo);
    await this.clickPlaceOrder();
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

