import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER, VALID_CHECKOUT_DATA } from '../src/test-data';

/**
 * Helper function to add a product to cart and wait for cart state to sync
 */
async function addProductToCart(
  page: import('@playwright/test').Page,
  expect: typeof import('@playwright/test').expect
): Promise<void> {
  // Wait for catalog to be fully loaded - wait for product cards to appear
  await page.locator('[data-testid^="product-card-"]').first().waitFor({ state: 'visible', timeout: 10000 });
  
  // Find an enabled "Add" button (product not already in cart)
  const addButtons = page.getByRole('button', { name: /Add .+ to cart/i });
  const firstEnabledButton = addButtons.first();
  
  // Wait for the button to be visible and enabled
  await firstEnabledButton.waitFor({ state: 'visible', timeout: 10000 });
  await expect(firstEnabledButton).toBeEnabled({ timeout: 15000 });
  await firstEnabledButton.click();
  
  // Wait for the cart badge in navbar to show a number (indicating cart has items)
  await page.locator('nav a[href="/cart"]').filter({ hasText: /\d+/ }).waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Order Management Module', () => {
  test.describe('@p1 FR-ORD-001: Orders Page Access', () => {
    test('Only authenticated users can view orders', async ({ ordersPage, page }) => {
      await test.step('Navigate to orders page without authentication', async () => {
        await ordersPage.goto();
      });

      await test.step('Verify redirected to login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });
  });

  test.describe('@p2 FR-ORD-002: Orders List Display', () => {
    test('Login with Standard User - orders page displays order history after placing order', async ({
      loginPage,
      catalogPage,
      cartPage,
      checkoutPage,
      ordersPage,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Add a product to cart', async () => {
        await catalogPage.goto();
        await addProductToCart(page, expect);
      });

      await test.step('Complete checkout', async () => {
        await cartPage.gotoViaNavbar();
        await cartPage.waitForCartItems();
        await cartPage.clickProceedToCheckout();
        await checkoutPage.completeCheckout(
          VALID_CHECKOUT_DATA.shipping,
          VALID_CHECKOUT_DATA.payment
        );
      });

      await test.step('Navigate to orders page', async () => {
        await ordersPage.goto();
      });

      await test.step('Verify orders page heading is displayed', async () => {
        await expect(ordersPage.pageHeading).toBeVisible();
      });

      await test.step('Verify at least one order is displayed', async () => {
        const orderCount = await ordersPage.getOrderCount();
        expect(orderCount).toBeGreaterThanOrEqual(1);
      });
    });
  });

  test.describe('@p3 FR-ORD-003: Empty Orders State', () => {
    test('Login with Standard User - orders page displays correctly', async ({
      loginPage,
      ordersPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to orders page', async () => {
        await ordersPage.goto();
      });

      await test.step('Verify page heading is displayed', async () => {
        await expect(ordersPage.pageHeading).toBeVisible();
      });

      // Note: Depending on previous test runs, there may or may not be orders
      // This test checks for either state
      await test.step('Verify either orders or empty state is shown', async () => {
        const hasNoOrders = await ordersPage.hasNoOrders();
        if (hasNoOrders) {
          await expect(ordersPage.emptyOrdersMessage).toBeVisible();
        } else {
          const orderCount = await ordersPage.getOrderCount();
          expect(orderCount).toBeGreaterThan(0);
        }
      });
    });
  });

  test.describe('@p3 FR-ORD-004: Navigate to Order Detail', () => {
    test('Login with Standard User - clicking order navigates to detail page', async ({
      loginPage,
      catalogPage,
      cartPage,
      checkoutPage,
      ordersPage,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Add a product and complete checkout', async () => {
        await catalogPage.goto();
        await addProductToCart(page, expect);
        await cartPage.gotoViaNavbar();
        await cartPage.waitForCartItems();
        await cartPage.clickProceedToCheckout();
        await checkoutPage.completeCheckout(
          VALID_CHECKOUT_DATA.shipping,
          VALID_CHECKOUT_DATA.payment
        );
      });

      await test.step('Navigate to orders page', async () => {
        await ordersPage.goto();
      });

      await test.step('Click on the first order', async () => {
        await ordersPage.orderItems.first().click();
      });

      await test.step('Verify navigated to order detail page', async () => {
        await expect(page).toHaveURL(/orders\/\d+/);
      });
    });
  });

  test.describe('@p4 FR-ORD-005: Username Navigation to Orders', () => {
    test('Login with Standard User - clicking username navigates to orders', async ({
      loginPage,
      navBar,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Click on username in navbar', async () => {
        await navBar.clickUsername();
      });

      await test.step('Verify navigated to orders page', async () => {
        await expect(page).toHaveURL(/orders/);
      });
    });
  });

  test.describe('@p2 FR-ORD-006: Order Confirmation Display', () => {
    test('Login with Standard User - order confirmation shows order details', async ({
      loginPage,
      catalogPage,
      cartPage,
      checkoutPage,
      orderDetailPage,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Add a product and complete checkout', async () => {
        await catalogPage.goto();
        await addProductToCart(page, expect);
        await cartPage.gotoViaNavbar();
        await cartPage.waitForCartItems();
        await cartPage.clickProceedToCheckout();
        await checkoutPage.completeCheckout(
          VALID_CHECKOUT_DATA.shipping,
          VALID_CHECKOUT_DATA.payment
        );
      });

      await test.step('Verify Order Confirmed heading is displayed', async () => {
        await expect(orderDetailPage.orderConfirmedHeading).toBeVisible();
      });

      await test.step('Verify order ID is displayed', async () => {
        await expect(orderDetailPage.orderIdText).toBeVisible();
      });

      await test.step('Verify order status is displayed', async () => {
        await expect(orderDetailPage.orderStatusBadge).toBeVisible();
      });

      await test.step('Verify order total is displayed', async () => {
        await expect(orderDetailPage.orderTotal).toBeVisible();
      });
    });
  });

  test.describe('@p4 FR-ORD-008: Order Access Control', () => {
    test('Login with Standard User - accessing non-existent order shows 404', async ({
      loginPage,
      orderDetailPage,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to non-existent order', async () => {
        await orderDetailPage.goto('99999999');
      });

      await test.step('Verify 404 Not Found is displayed', async () => {
        await expect(orderDetailPage.notFoundMessage).toBeVisible();
      });
    });
  });
});
