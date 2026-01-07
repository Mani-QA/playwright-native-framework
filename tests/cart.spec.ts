import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER } from '../src/test-data';

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
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        // Find the first Add button in the catalog
        const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
        await firstAddButton.click();
        // Wait for the "In Cart" button to appear, confirming product was added
        await expect(page.getByRole('button', { name: /In Cart/i }).first()).toBeVisible();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
        await cartPage.waitForCartItems();
      });

      await test.step('Verify cart items are displayed', async () => {
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
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add a product', async () => {
        await catalogPage.goto();
        const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
        await firstAddButton.click();
        // Wait for the "In Cart" button to appear
        await expect(page.getByRole('button', { name: /In Cart/i }).first()).toBeVisible();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
        await cartPage.waitForCartItems();
      });

      await test.step('Verify initial quantity is 1', async () => {
        // Quantity is displayed as text between - and + buttons
        await expect(page.getByRole('main').getByText('1', { exact: true }).first()).toBeVisible();
      });

      await test.step('Click increase quantity button', async () => {
        // The increase button is the second button in the quantity controls
        const increaseButton = page.getByRole('main').getByRole('button').nth(1);
        await increaseButton.click();
      });

      await test.step('Verify quantity increased', async () => {
        await expect(page.getByRole('main').getByText('2', { exact: true }).first()).toBeVisible();
      });
    });
  });

  test.describe('FR-CART-004: Decrease Quantity', () => {
    test('Login with Standard User - can decrease item quantity', async ({
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
        const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
        await firstAddButton.click();
        await expect(page.getByRole('button', { name: /In Cart/i }).first()).toBeVisible();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
        await cartPage.waitForCartItems();
      });

      await test.step('Increase quantity to 2 first', async () => {
        const increaseButton = page.getByRole('main').getByRole('button').nth(1);
        await increaseButton.click();
        await expect(page.getByRole('main').getByText('2', { exact: true }).first()).toBeVisible();
      });

      await test.step('Click decrease quantity button', async () => {
        // First button is the decrease button (now enabled since qty > 1)
        const decreaseButton = page.getByRole('main').getByRole('button').first();
        await decreaseButton.click();
      });

      await test.step('Verify quantity decreased', async () => {
        await expect(page.getByRole('main').getByText('1', { exact: true }).first()).toBeVisible();
      });
    });
  });

  test.describe('FR-CART-005: Minimum Quantity Constraint', () => {
    test('Login with Standard User - minus button disabled at quantity 1', async ({
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
        const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
        await firstAddButton.click();
        await expect(page.getByRole('button', { name: /In Cart/i }).first()).toBeVisible();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
        await cartPage.waitForCartItems();
      });

      await test.step('Verify quantity is 1', async () => {
        await expect(page.getByRole('main').getByText('1', { exact: true }).first()).toBeVisible();
      });

      await test.step('Verify decrease button is disabled', async () => {
        // First button is the decrease button - should be disabled at qty 1
        const decreaseButton = page.getByRole('main').getByRole('button').first();
        await expect(decreaseButton).toBeDisabled();
      });
    });
  });

  test.describe('FR-CART-007: Remove Single Item', () => {
    test('Login with Standard User - can remove single item from cart', async ({
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
        const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
        await firstAddButton.click();
        await expect(page.getByRole('button', { name: /In Cart/i }).first()).toBeVisible();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
        await cartPage.waitForCartItems();
      });

      await test.step('Click remove button', async () => {
        // The remove/trash button is the button after increase quantity button (3rd button in sequence)
        // Buttons order: decrease (disabled), increase, remove
        const removeButton = page.getByRole('main').getByRole('button').nth(2);
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
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and add multiple products', async () => {
        await catalogPage.goto();
        const addButtons = page.getByRole('button', { name: 'Add' });
        const buttonCount = await addButtons.count();
        // Add up to 2 products
        for (let i = 0; i < Math.min(2, buttonCount); i++) {
          await addButtons.nth(i).click();
          // Wait a moment for the cart to update
          await page.waitForTimeout(200);
        }
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
        await cartPage.waitForCartItems();
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
        const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
        await firstAddButton.click();
        await expect(page.getByRole('button', { name: /In Cart/i }).first()).toBeVisible();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
        await cartPage.waitForCartItems();
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
        const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
        await firstAddButton.click();
        await expect(page.getByRole('button', { name: /In Cart/i }).first()).toBeVisible();
      });

      await test.step('Navigate to cart page', async () => {
        await cartPage.goto();
        await cartPage.waitForCartItems();
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
