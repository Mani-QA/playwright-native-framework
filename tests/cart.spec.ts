import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER, ERROR_MESSAGES } from '../src/test-data';

test.describe('Shopping Cart Module', () => {
  test.describe('FR-CART-001: Empty Cart Display', () => {
    test('Empty cart shows appropriate message', async ({ cartPage }) => {
      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Verify empty cart message is displayed', async () => {
        await expect(cartPage.emptyCartMessage).toBeVisible();
      });

      await test.step('Verify Continue Shopping button is present', async () => {
        await expect(cartPage.continueShoppingButton).toBeVisible();
      });
    });
  });

  test.describe('FR-CART-002: Cart Items Display', () => {
    test('Login with Standard User - cart displays added items', async ({
      loginPage,
      catalogPage,
      cartPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Verify cart items are displayed', async () => {
        await expect(cartPage.emptyCartMessage).not.toBeVisible();
        const itemCount = await cartPage.getCartItemCount();
        expect(itemCount).toBeGreaterThanOrEqual(1);
      });

      await test.step('Verify order summary is displayed', async () => {
        await expect(cartPage.proceedToCheckoutButton).toBeVisible();
      });
    });
  });

  test.describe('FR-CART-003: Increase Quantity', () => {
    test('Login with Standard User - can increase item quantity', async ({
      loginPage,
      catalogPage,
      cartPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Get initial quantity', async () => {
        const quantityInput = cartPage.cartItems.first().getByRole('spinbutton');
        await expect(quantityInput).toHaveValue('1');
      });

      await test.step('Click increase quantity button', async () => {
        const increaseButton = cartPage.cartItems.first().getByRole('button', { name: '+' });
        await increaseButton.click();
      });

      await test.step('Verify quantity increased', async () => {
        const quantityInput = cartPage.cartItems.first().getByRole('spinbutton');
        await expect(quantityInput).toHaveValue('2');
      });
    });
  });

  test.describe('FR-CART-004: Decrease Quantity', () => {
    test('Login with Standard User - can decrease item quantity', async ({
      loginPage,
      catalogPage,
      cartPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Increase quantity to 2 first', async () => {
        const increaseButton = cartPage.cartItems.first().getByRole('button', { name: '+' });
        await increaseButton.click();
        const quantityInput = cartPage.cartItems.first().getByRole('spinbutton');
        await expect(quantityInput).toHaveValue('2');
      });

      await test.step('Click decrease quantity button', async () => {
        const decreaseButton = cartPage.cartItems.first().getByRole('button', { name: '-' });
        await decreaseButton.click();
      });

      await test.step('Verify quantity decreased', async () => {
        const quantityInput = cartPage.cartItems.first().getByRole('spinbutton');
        await expect(quantityInput).toHaveValue('1');
      });
    });
  });

  test.describe('FR-CART-005: Minimum Quantity Constraint', () => {
    test('Login with Standard User - minus button disabled at quantity 1', async ({
      loginPage,
      catalogPage,
      cartPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Verify quantity is 1', async () => {
        const quantityInput = cartPage.cartItems.first().getByRole('spinbutton');
        await expect(quantityInput).toHaveValue('1');
      });

      await test.step('Verify decrease button is disabled', async () => {
        const decreaseButton = cartPage.cartItems.first().getByRole('button', { name: '-' });
        await expect(decreaseButton).toBeDisabled();
      });
    });
  });

  test.describe('FR-CART-007: Remove Single Item', () => {
    test('Login with Standard User - can remove single item from cart', async ({
      loginPage,
      catalogPage,
      cartPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Click remove button', async () => {
        const removeButton = cartPage.cartItems.first().getByRole('button', { name: /Remove|Delete/i });
        await removeButton.click();
      });

      await test.step('Verify cart is empty', async () => {
        await expect(cartPage.emptyCartMessage).toBeVisible();
      });
    });
  });

  test.describe('FR-CART-008: Clear Entire Cart', () => {
    test('Login with Standard User - can clear all items from cart', async ({
      loginPage,
      catalogPage,
      cartPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add multiple products', async () => {
        await catalogPage.goto();
        const addButtons = catalogPage.productCards.getByRole('button', { name: 'Add' });
        const buttonCount = await addButtons.count();
        // Add up to 2 products
        for (let i = 0; i < Math.min(2, buttonCount); i++) {
          await addButtons.nth(i).click();
        }
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Click Clear Cart button', async () => {
        await cartPage.clearCart();
      });

      await test.step('Verify cart is empty', async () => {
        await expect(cartPage.emptyCartMessage).toBeVisible();
      });
    });
  });

  test.describe('FR-CART-010: Proceed to Checkout (Authenticated)', () => {
    test('Login with Standard User - can proceed to checkout', async ({
      loginPage,
      catalogPage,
      cartPage,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Click Proceed to Checkout', async () => {
        await cartPage.clickProceedToCheckout();
      });

      await test.step('Verify navigated to checkout page', async () => {
        await expect(page).toHaveURL(/checkout/);
      });
    });
  });

  test.describe('FR-CART-011: Proceed to Checkout (Unauthenticated)', () => {
    test('Unauthenticated user redirected to login when proceeding to checkout', async ({
      catalogPage,
      cartPage,
      page,
    }) => {
      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
      });

      await test.step('Click Proceed to Checkout', async () => {
        await cartPage.clickProceedToCheckout();
      });

      await test.step('Verify redirected to login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });
  });
});

