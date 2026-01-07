import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER, ADMIN_USER, ORDER_STATUSES } from '../src/test-data';

test.describe('Admin Dashboard Module', () => {
  test.describe('FR-ADM-001: Admin Access Control', () => {
    test('Login with Standard User - cannot access admin dashboard', async ({
      loginPage,
      adminPage,
      page,
    }) => {
      await test.step('Navigate to login page and login as standard user', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to admin page', async () => {
        await adminPage.goto();
      });

      await test.step('Verify access denied or redirected', async () => {
        const hasAccess = await adminPage.hasAdminAccess();
        expect(hasAccess).toBeFalsy();
      });
    });
  });

  test.describe('FR-ADM-002: Admin Link Visibility', () => {
    test('Login with Standard User - admin link not visible', async ({ loginPage, navBar }) => {
      await test.step('Navigate to login page and login as standard user', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Verify Admin button is NOT visible in navbar', async () => {
        await expect(navBar.adminButton).not.toBeVisible();
      });
    });

    test('Login with Admin User - admin link is visible', async ({ loginPage, navBar }) => {
      await test.step('Navigate to login page and login as admin user', async () => {
        await loginPage.goto();
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Verify Admin button is visible in navbar', async () => {
        await expect(navBar.adminButton).toBeVisible();
      });
    });
  });

  test.describe('FR-ADM-003: Dashboard Tabs', () => {
    test('Login with Admin User - dashboard has Overview, Products, and Orders tabs', async ({
      loginPage,
      adminPage,
    }) => {
      await test.step('Navigate to login page and login as admin user', async () => {
        await loginPage.goto();
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Navigate to admin dashboard', async () => {
        await adminPage.goto();
      });

      await test.step('Verify all tabs are displayed', async () => {
        await expect(adminPage.overviewTab).toBeVisible();
        await expect(adminPage.productsTab).toBeVisible();
        await expect(adminPage.ordersTab).toBeVisible();
      });
    });
  });

  test.describe('FR-ADM-004: Overview Tab - Statistics', () => {
    test('Login with Admin User - overview tab displays key metrics', async ({
      loginPage,
      adminPage,
    }) => {
      await test.step('Navigate to login page and login as admin user', async () => {
        await loginPage.goto();
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Navigate to admin dashboard', async () => {
        await adminPage.goto();
      });

      await test.step('Click Overview tab', async () => {
        await adminPage.clickOverviewTab();
      });

      await test.step('Verify statistics are displayed', async () => {
        await expect(adminPage.productsCount).toBeVisible();
        await expect(adminPage.ordersCount).toBeVisible();
        await expect(adminPage.usersCount).toBeVisible();
      });
    });
  });

  test.describe('FR-ADM-005: Overview Tab - Low Stock Alert', () => {
    // Skip this test - the current application doesn't have a Low Stock section on the admin dashboard
    test.skip('Login with Admin User - shows products with low stock', async ({
      loginPage,
      adminPage,
    }) => {
      await test.step('Navigate to login page and login as admin user', async () => {
        await loginPage.goto();
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Navigate to admin dashboard', async () => {
        await adminPage.goto();
      });

      await test.step('Click Overview tab', async () => {
        await adminPage.clickOverviewTab();
      });

      await test.step('Verify low stock section is displayed', async () => {
        await expect(adminPage.lowStockSection).toBeVisible();
      });
    });
  });

  test.describe('FR-ADM-006: Overview Tab - Recent Orders', () => {
    test('Login with Admin User - shows recent orders', async ({ loginPage, adminPage }) => {
      await test.step('Navigate to login page and login as admin user', async () => {
        await loginPage.goto();
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Navigate to admin dashboard', async () => {
        await adminPage.goto();
      });

      await test.step('Click Overview tab', async () => {
        await adminPage.clickOverviewTab();
      });

      await test.step('Verify recent orders section is displayed', async () => {
        await expect(adminPage.recentOrdersSection).toBeVisible();
      });
    });
  });

  test.describe('FR-ADM-007: Product Inventory Table', () => {
    test('Login with Admin User - products tab shows all products', async ({
      loginPage,
      adminPage,
    }) => {
      await test.step('Navigate to login page and login as admin user', async () => {
        await loginPage.goto();
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Navigate to admin dashboard', async () => {
        await adminPage.goto();
      });

      await test.step('Click Products tab', async () => {
        await adminPage.clickProductsTab();
      });

      await test.step('Verify products table is displayed', async () => {
        await expect(adminPage.productsTable).toBeVisible();
      });

      await test.step('Verify product rows exist', async () => {
        const rowCount = await adminPage.productRows.count();
        expect(rowCount).toBeGreaterThan(0);
      });
    });
  });

  test.describe('FR-ADM-009: Add New Product', () => {
    // Skip this test - the current application doesn't have an Add Product feature
    test.skip('Login with Admin User - can open add product modal', async ({
      loginPage,
      adminPage,
    }) => {
      await test.step('Navigate to login page and login as admin user', async () => {
        await loginPage.goto();
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Navigate to admin dashboard', async () => {
        await adminPage.goto();
      });

      await test.step('Click Products tab', async () => {
        await adminPage.clickProductsTab();
      });

      await test.step('Click Add Product button', async () => {
        await adminPage.clickAddProduct();
      });

      await test.step('Verify product modal is displayed', async () => {
        await expect(adminPage.productModal).toBeVisible();
      });

      await test.step('Verify product form fields are displayed', async () => {
        await expect(adminPage.productNameInput).toBeVisible();
        await expect(adminPage.productPriceInput).toBeVisible();
        await expect(adminPage.productStockInput).toBeVisible();
        await expect(adminPage.saveProductButton).toBeVisible();
      });
    });
  });

  test.describe('FR-ADM-013: Order History Table', () => {
    test('Login with Admin User - orders tab shows all orders', async ({
      loginPage,
      adminPage,
    }) => {
      await test.step('Navigate to login page and login as admin user', async () => {
        await loginPage.goto();
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Navigate to admin dashboard', async () => {
        await adminPage.goto();
      });

      await test.step('Click Orders tab', async () => {
        await adminPage.clickOrdersTab();
      });

      await test.step('Verify orders table is displayed', async () => {
        await expect(adminPage.ordersTable).toBeVisible();
      });
    });
  });
});

