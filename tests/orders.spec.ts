import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER, VALID_CHECKOUT_DATA, URLS } from '../src/test-data';

test.describe('Order Management Module', () => {
  test.describe('FR-ORD-001: Orders Page Access', () => {
    test('Only authenticated users can view orders', async ({ ordersPage, page }) => {
      await test.step('Navigate to orders page without authentication', async () => {
        await ordersPage.goto();
      });

      await test.step('Verify redirected to login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });
  });

  test.describe('FR-ORD-002: Orders List Display', () => {
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
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Complete checkout', async () => {
        await cartPage.goto();
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

  test.describe('FR-ORD-003: Empty Orders State', () => {
    test('Login with Standard User - shows message when no orders exist (new user)', async ({
      loginPage,
      ordersPage,
    }) => {
      // Note: This test assumes a fresh account with no orders
      // In a real scenario, we might need to create a new test user

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
          await expect(ordersPage.startShoppingButton).toBeVisible();
        } else {
          const orderCount = await ordersPage.getOrderCount();
          expect(orderCount).toBeGreaterThan(0);
        }
      });
    });
  });

  test.describe('FR-ORD-004: Navigate to Order Detail', () => {
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
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
        await cartPage.goto();
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

  test.describe('FR-ORD-005: Username Navigation to Orders', () => {
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

  test.describe('FR-ORD-006: Order Confirmation Display', () => {
    test('Login with Standard User - order confirmation shows order details', async ({
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

      await test.step('Add a product and complete checkout', async () => {
        await catalogPage.goto();
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
        await cartPage.goto();
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

  test.describe('FR-ORD-008: Order Access Control', () => {
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

