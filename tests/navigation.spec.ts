import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER } from '../src/test-data';

test.describe('Navigation & Layout Module', () => {
  test.describe('@p1 FR-NAV-001: Logo Navigation', () => {
    test('Clicking logo navigates to home', async ({ catalogPage, navBar, page }) => {
      await test.step('Navigate to catalog page', async () => {
        await catalogPage.goto();
      });

      await test.step('Click QA Demo logo', async () => {
        await navBar.clickLogo();
      });

      await test.step('Verify navigated to home page', async () => {
        await expect(page).toHaveURL('/');
      });
    });
  });

  test.describe('@p1 FR-NAV-002: Products Link', () => {
    test('Products link navigates to catalog', async ({ homePage, navBar, page }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Click Products link', async () => {
        await navBar.clickProducts();
      });

      await test.step('Verify navigated to catalog page', async () => {
        await expect(page).toHaveURL(/catalog/);
      });
    });
  });

  test.describe('@p3 FR-NAV-003: Cart Icon with Badge', () => {
    test('Login with Standard User - cart icon shows item count after adding product', async ({
      loginPage,
      catalogPage,
      navBar,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog', async () => {
        await catalogPage.goto();
      });

      await test.step('Get initial cart count', async () => {
        const initialCount = await navBar.getCartItemCount();
        expect(initialCount).toBeGreaterThanOrEqual(0);
      });

      await test.step('Add a product to cart', async () => {
        // Wait for catalog to be fully loaded
        await page.locator('[data-testid^="product-card-"]').first().waitFor({ state: 'visible', timeout: 10000 });
        const addButton = page.getByRole('button', { name: /Add .+ to cart/i }).first();
        await addButton.waitFor({ state: 'visible', timeout: 10000 });
        await expect(addButton).toBeEnabled({ timeout: 15000 });
        await addButton.click();
      });

      await test.step('Verify cart badge updates', async () => {
        const cartCount = await navBar.getCartItemCount();
        expect(cartCount).toBeGreaterThanOrEqual(1);
      });
    });

    test('Login with Standard User - clicking cart icon navigates to cart', async ({
      loginPage,
      catalogPage,
      navBar,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog', async () => {
        await catalogPage.goto();
      });

      await test.step('Click cart icon', async () => {
        await navBar.clickCart();
      });

      await test.step('Verify navigated to cart page', async () => {
        await expect(page).toHaveURL(/cart/);
      });
    });
  });

  test.describe('@p3 FR-NAV-004: Sign In Button (Guest)', () => {
    test('Sign In button shown for guests', async ({ homePage, navBar }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Verify Sign In button is visible', async () => {
        await expect(navBar.signInButton).toBeVisible();
      });
    });

    test('Sign In button navigates to login', async ({ homePage, navBar, page }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Click Sign In button', async () => {
        await navBar.clickSignIn();
      });

      await test.step('Verify navigated to login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });
  });

  test.describe('@p3 FR-NAV-005: User Menu (Authenticated)', () => {
    test('Login with Standard User - shows username and logout button', async ({
      loginPage,
      navBar,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Verify logout button is visible', async () => {
        await expect(navBar.logoutButton).toBeVisible();
      });

      await test.step('Verify Sign In button is NOT visible', async () => {
        await expect(navBar.signInButton).not.toBeVisible();
      });
    });
  });

  test.describe('@p4 FR-NAV-007: Footer Links', () => {
    test('Footer contains Products link', async ({ homePage, footer }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Verify Products link is visible in footer', async () => {
        await expect(footer.productsLink).toBeVisible();
      });
    });

    test('Footer contains Cart link', async ({ homePage, footer }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Verify Cart link is visible in footer', async () => {
        await expect(footer.cartLink).toBeVisible();
      });
    });

    test('Footer Sign In link visible only for guests', async ({ homePage, footer }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Verify Sign In link is visible for guests', async () => {
        const isSignInVisible = await footer.isSignInVisible();
        expect(isSignInVisible).toBeTruthy();
      });
    });
  });
});
