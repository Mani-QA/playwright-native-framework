import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER } from '../src/test-data';

/**
 * Helper function to add a product to cart and wait for cart state to sync
 * This ensures the cart state is fully synced before proceeding
 */
async function addProductToCart(
  page: import('@playwright/test').Page
): Promise<void> {
  const firstAddButton = page.getByRole('button', { name: 'Add' }).first();
  await firstAddButton.click();
  // Wait for the "In Cart" button to appear - this confirms the UI updated
  await page.getByRole('button', { name: /In Cart/i }).first().waitFor({ state: 'visible', timeout: 10000 });
  // Wait for the cart badge in navbar to show a number (indicating cart has items)
  // The cart badge is in the nav link to /cart
  await page.locator('nav a[href="/cart"]').filter({ hasText: /\d+/ }).waitFor({ state: 'visible', timeout: 10000 });
}

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
        await addProductToCart(page);
      });

      await test.step('Navigate to cart page via navbar', async () => {
        // Use navbar to navigate (preserves client-side cart state)
        await cartPage.gotoViaNavbar();
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
        await addProductToCart(page);
      });

      await test.step('Navigate to cart page via navbar', async () => {
        await cartPage.gotoViaNavbar();
        await cartPage.waitForCartItems();
        // Wait for the product link to be visible in main (confirms cart items rendered)
        await page.getByRole('main').locator('a[href^="/products/"]').first().waitFor({ state: 'visible', timeout: 10000 });
      });

      await test.step('Verify initial quantity is 1', async () => {
        // Verify cart badge shows 1
        await expect(page.getByRole('navigation').locator('a[href="/cart"]')).toContainText('1', { timeout: 5000 });
      });

      await test.step('Click increase quantity button', async () => {
        // Wait for buttons to render (minus, plus, trash)
        await page.getByRole('main').locator('button:has(svg)').nth(1).waitFor({ state: 'visible', timeout: 5000 });
        const mainButtons = page.getByRole('main').locator('button:has(svg)');
        const plusButton = mainButtons.nth(1); // 0=minus (disabled), 1=plus, 2=trash
        await plusButton.click();
        // Wait for UI update
        await page.waitForTimeout(500);
        // Verify the quantity text in the cart item updated
        await expect(page.getByRole('main').getByText('2', { exact: true })).toBeVisible({ timeout: 5000 });
      });

      await test.step('Verify quantity increased', async () => {
        // Verify cart badge shows 2
        await expect(page.getByRole('navigation').locator('a[href="/cart"]')).toContainText('2', { timeout: 5000 });
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
        await addProductToCart(page);
      });

      await test.step('Navigate to cart page via navbar', async () => {
        await cartPage.gotoViaNavbar();
        await cartPage.waitForCartItems();
        // Wait for the product link to be visible in main (confirms cart items rendered)
        await page.getByRole('main').locator('a[href^="/products/"]').first().waitFor({ state: 'visible', timeout: 10000 });
      });

      await test.step('Increase quantity to 2 first', async () => {
        // The plus button is in the cart item area with SVG icon
        // Wait for buttons to be rendered (minus, plus, trash)
        await page.getByRole('main').locator('button:has(svg)').nth(1).waitFor({ state: 'visible', timeout: 5000 });
        const mainButtons = page.getByRole('main').locator('button:has(svg)');
        const plusButton = mainButtons.nth(1); // 0=minus (disabled), 1=plus, 2=trash
        
        // Click and wait for response - retry if needed
        await plusButton.click();
        // Wait a moment for the click to register and update state
        await page.waitForTimeout(500);
        
        // Verify the quantity text in the cart item updated
        await expect(page.getByRole('main').getByText('2', { exact: true })).toBeVisible({ timeout: 5000 });
        
        // Also verify the cart badge
        await expect(page.getByRole('navigation').locator('a[href="/cart"]')).toContainText('2', { timeout: 5000 });
      });

      await test.step('Click decrease quantity button', async () => {
        // Now the - button should be enabled (qty is 2)
        const mainButtons = page.getByRole('main').locator('button:has(svg)');
        const minusButton = mainButtons.first();
        await minusButton.click();
      });

      await test.step('Verify quantity decreased', async () => {
        // Verify cart badge shows 1 again
        await expect(page.getByRole('navigation').locator('a[href="/cart"]')).toContainText('1', { timeout: 5000 });
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
        await addProductToCart(page);
      });

      await test.step('Navigate to cart page via navbar', async () => {
        await cartPage.gotoViaNavbar();
        await cartPage.waitForCartItems();
      });

      await test.step('Verify quantity is 1', async () => {
        const cartItem = cartPage.cartItems.first().locator('..');
        await expect(cartItem.getByText('1', { exact: true })).toBeVisible();
      });

      await test.step('Verify decrease button is disabled', async () => {
        // The - button should be disabled at qty 1
        const cartItem = cartPage.cartItems.first().locator('..');
        const minusButton = cartItem.locator('button').filter({ hasText: '-' }).or(cartItem.locator('button:has(svg)').first());
        await expect(minusButton).toBeDisabled();
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
        await addProductToCart(page);
      });

      await test.step('Navigate to cart page via navbar', async () => {
        await cartPage.gotoViaNavbar();
        await cartPage.waitForCartItems();
      });

      await test.step('Click remove button', async () => {
        // The trash button is a button with SVG icon after the +/- buttons
        // Button order in main area with SVG: 0=minus, 1=plus, 2=trash
        const mainButtons = page.getByRole('main').locator('button:has(svg)');
        const trashButton = mainButtons.nth(2);
        await trashButton.click();
      });

      await test.step('Verify cart is empty', async () => {
        // Wait for the empty cart message to appear
        await cartPage.emptyCartMessage.waitFor({ state: 'visible', timeout: 10000 });
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
        // Add first product
        await addProductToCart(page);
        // Add second product (if available)
        const secondAddButton = page.getByRole('button', { name: 'Add' }).first();
        if (await secondAddButton.isVisible()) {
          await secondAddButton.click();
          await page.getByRole('button', { name: /In Cart/i }).nth(1).waitFor({ state: 'visible', timeout: 10000 });
        }
      });

      await test.step('Navigate to cart page via navbar', async () => {
        await cartPage.gotoViaNavbar();
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
        await addProductToCart(page);
      });

      await test.step('Navigate to cart page via navbar', async () => {
        await cartPage.gotoViaNavbar();
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
        await addProductToCart(page);
      });

      await test.step('Navigate to cart page via navbar', async () => {
        await cartPage.gotoViaNavbar();
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
