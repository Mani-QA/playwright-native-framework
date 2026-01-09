/**
 * Seed Test for Playwright Test Agents
 *
 * This file provides the base environment for AI agents to:
 * 1. Explore the application
 * 2. Generate new tests
 * 3. Heal failing tests
 *
 * The seed test demonstrates:
 * - Custom fixtures from pomFixtures.ts
 * - Page Object Model pattern
 * - Common interaction patterns
 */

import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER } from '../src/test-data';

test.describe('@agent Seed Tests for Agent Exploration', () => {
  test('seed - unauthenticated exploration', async ({
    page,
    homePage,
    catalogPage,
    navBar,
  }) => {
    // Navigate to home page
    await test.step('Navigate to home page', async () => {
      await page.goto('/');
      await expect(page).toHaveURL('/');
    });

    // Explore catalog page
    await test.step('Navigate to catalog', async () => {
      await catalogPage.goto();
      await expect(catalogPage.pageHeading).toBeVisible();
      await expect(catalogPage.productCards.first()).toBeVisible();
    });

    // Verify navbar elements
    await test.step('Verify navigation elements', async () => {
      await expect(navBar.logo).toBeVisible();
      await expect(navBar.productsLink).toBeVisible();
      await expect(navBar.cartIcon).toBeVisible();
      await expect(navBar.signInButton).toBeVisible();
    });
  });

  test('seed - authenticated exploration', async ({
    page,
    loginPage,
    catalogPage,
    cartPage,
    checkoutPage,
    navBar,
  }) => {
    // Login with standard user
    await test.step('Login with standard user', async () => {
      await loginPage.goto();
      await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      await expect(page).toHaveURL(/catalog/);
      await expect(navBar.logoutButton).toBeVisible();
    });

    // Explore catalog with authentication
    await test.step('Explore catalog page', async () => {
      // Wait for products to load
      await catalogPage.productCards.first().waitFor({ state: 'visible' });
      const productCount = await catalogPage.productCards.count();
      expect(productCount).toBeGreaterThan(0);
    });

    // Add product to cart (demonstrates cart interaction)
    await test.step('Add product to cart', async () => {
      const addButton = page.getByRole('button', { name: /Add .+ to cart/i }).first();
      await addButton.waitFor({ state: 'visible' });
      await expect(addButton).toBeEnabled({ timeout: 10000 });
      await addButton.click();

      // Wait for cart to update
      await page.locator('nav a[href="/cart"]').filter({ hasText: /\d+/ }).waitFor({
        state: 'visible',
        timeout: 10000,
      });
    });

    // Navigate to cart
    await test.step('Navigate to cart', async () => {
      await cartPage.gotoViaNavbar();
      await cartPage.waitForCartItems();
      await expect(cartPage.cartItems.first()).toBeVisible();
    });

    // Navigate to checkout
    await test.step('Navigate to checkout', async () => {
      await cartPage.clickProceedToCheckout();
      await expect(checkoutPage.pageHeading).toBeVisible();
    });
  });

  test('seed - admin exploration', async ({
    page,
    loginPage,
    adminPage,
    navBar,
  }) => {
    // Login with admin user
    await test.step('Login with admin user', async () => {
      await loginPage.goto();
      await loginPage.login('admin_user', 'admin123');
      await expect(page).toHaveURL(/catalog/);
    });

    // Verify admin access
    await test.step('Verify admin link visible', async () => {
      await expect(navBar.adminButton).toBeVisible();
    });

    // Navigate to admin dashboard
    await test.step('Navigate to admin dashboard', async () => {
      await navBar.clickAdmin();
      await expect(adminPage.pageHeading).toBeVisible();
    });

    // Explore admin tabs
    await test.step('Explore admin tabs', async () => {
      await expect(adminPage.overviewTab).toBeVisible();
      await expect(adminPage.productsTab).toBeVisible();
      await expect(adminPage.ordersTab).toBeVisible();
    });
  });
});
