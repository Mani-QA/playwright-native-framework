import { test, expect } from '../src/fixtures/pomFixtures';
import {
  STANDARD_USER,
  VALID_CHECKOUT_DATA,
  INVALID_CARD_NUMBER,
  EMPTY_SHIPPING,
  EMPTY_PAYMENT,
  ERROR_MESSAGES,
} from '../src/test-data';

test.describe('Checkout Module', () => {
  test.describe('FR-CHK-001: Checkout Page Access', () => {
    test('Only authenticated users can access checkout', async ({ checkoutPage, page }) => {
      await test.step('Navigate to checkout page without authentication', async () => {
        await checkoutPage.goto();
      });

      await test.step('Verify redirected to login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });
  });

  test.describe('FR-CHK-002: Empty Cart Redirect', () => {
    test('Login with Standard User - checkout with empty cart shows message', async ({
      loginPage,
      checkoutPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to checkout with empty cart', async () => {
        await checkoutPage.goto();
      });

      await test.step('Verify empty cart message is displayed', async () => {
        await expect(checkoutPage.emptyCartMessage).toBeVisible();
      });

      await test.step('Verify Continue Shopping button is present', async () => {
        await expect(checkoutPage.continueShoppingButton).toBeVisible();
      });
    });
  });

  test.describe('FR-CHK-003: Checkout Form Display', () => {
    test('Login with Standard User - checkout page displays shipping and payment forms', async ({
      loginPage,
      catalogPage,
      cartPage,
      checkoutPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Add a product to cart', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to checkout via cart', async () => {
        await cartPage.goto();
        await cartPage.clickProceedToCheckout();
      });

      await test.step('Verify Shipping Information fields are displayed', async () => {
        await expect(checkoutPage.firstNameInput).toBeVisible();
        await expect(checkoutPage.lastNameInput).toBeVisible();
        await expect(checkoutPage.addressInput).toBeVisible();
      });

      await test.step('Verify Payment Information fields are displayed', async () => {
        await expect(checkoutPage.cardNumberInput).toBeVisible();
        await expect(checkoutPage.expiryDateInput).toBeVisible();
        await expect(checkoutPage.cvvInput).toBeVisible();
        await expect(checkoutPage.cardholderNameInput).toBeVisible();
      });

      await test.step('Verify Place Order button is displayed', async () => {
        await expect(checkoutPage.placeOrderButton).toBeVisible();
      });
    });
  });

  test.describe('FR-CHK-007: Required Field Validation', () => {
    test('Login with Standard User - submitting empty form shows validation errors', async ({
      loginPage,
      catalogPage,
      cartPage,
      checkoutPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Add a product to cart', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to checkout via cart', async () => {
        await cartPage.goto();
        await cartPage.clickProceedToCheckout();
      });

      await test.step('Submit form with empty fields', async () => {
        await checkoutPage.clickPlaceOrder();
      });

      await test.step('Verify validation errors are displayed', async () => {
        // Form should show validation errors - at least one alert should be visible
        await expect(checkoutPage.validationErrors.first()).toBeVisible();
      });
    });
  });

  test.describe('FR-CHK-008: Valid Card Number Validation (Luhn)', () => {
    test('Login with Standard User - invalid card number shows error', async ({
      loginPage,
      catalogPage,
      cartPage,
      checkoutPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Add a product to cart', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to checkout via cart', async () => {
        await cartPage.goto();
        await cartPage.clickProceedToCheckout();
      });

      await test.step('Fill shipping information', async () => {
        await checkoutPage.fillShippingInfo(
          VALID_CHECKOUT_DATA.shipping.firstName,
          VALID_CHECKOUT_DATA.shipping.lastName,
          VALID_CHECKOUT_DATA.shipping.address
        );
      });

      await test.step('Fill payment with invalid card number', async () => {
        await checkoutPage.fillPaymentInfo(
          INVALID_CARD_NUMBER.cardNumber,
          INVALID_CARD_NUMBER.expiryDate,
          INVALID_CARD_NUMBER.cvv,
          INVALID_CARD_NUMBER.cardholderName
        );
      });

      await test.step('Submit the form', async () => {
        await checkoutPage.clickPlaceOrder();
      });

      await test.step('Verify card number validation error', async () => {
        await expect(checkoutPage.validationErrors).toContainText(/Invalid card number/i);
      });
    });
  });

  test.describe('FR-CHK-009: Successful Order Placement', () => {
    test('Login with Standard User - valid checkout creates order', async ({
      loginPage,
      catalogPage,
      cartPage,
      checkoutPage,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Add a product to cart', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to checkout via cart', async () => {
        await cartPage.goto();
        await cartPage.clickProceedToCheckout();
      });

      await test.step('Fill complete checkout form', async () => {
        await checkoutPage.fillCheckoutForm(
          VALID_CHECKOUT_DATA.shipping,
          VALID_CHECKOUT_DATA.payment
        );
      });

      await test.step('Click Place Order', async () => {
        await checkoutPage.clickPlaceOrder();
      });

      await test.step('Verify redirected to order confirmation page', async () => {
        await expect(page).toHaveURL(/orders\/\d+/);
      });
    });
  });

  test.describe('FR-CHK-010: Test Card Number', () => {
    test('Login with Standard User - test card number 4242424242424242 works', async ({
      loginPage,
      catalogPage,
      cartPage,
      checkoutPage,
      orderDetailPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Add a product to cart', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to checkout via cart', async () => {
        await cartPage.goto();
        await cartPage.clickProceedToCheckout();
      });

      await test.step('Fill checkout with test card number', async () => {
        await checkoutPage.completeCheckout(
          VALID_CHECKOUT_DATA.shipping,
          VALID_CHECKOUT_DATA.payment
        );
      });

      await test.step('Verify order confirmation is displayed', async () => {
        await expect(orderDetailPage.orderConfirmedHeading).toBeVisible();
      });
    });
  });
});

