import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER } from '../src/test-data';

test.describe('Product Catalog Module', () => {
  test.describe('FR-PROD-001: Home Page Hero Section', () => {
    test('Home page displays hero section with call-to-action', async ({ homePage }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Verify hero section is displayed', async () => {
        await expect(homePage.welcomeMessage).toBeVisible();
      });

      await test.step('Verify Shop Now or Browse Products button is present', async () => {
        const shopNowVisible = await homePage.shopNowButton.isVisible();
        const browseProductsVisible = await homePage.browseProductsButton.isVisible();
        expect(shopNowVisible || browseProductsVisible).toBeTruthy();
      });
    });

    test('Shop Now button navigates to catalog', async ({ homePage, page }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Click Shop Now button', async () => {
        const shopNowVisible = await homePage.shopNowButton.isVisible();
        if (shopNowVisible) {
          await homePage.clickShopNow();
        } else {
          await homePage.clickBrowseProducts();
        }
      });

      await test.step('Verify navigated to catalog page', async () => {
        await expect(page).toHaveURL(/catalog/);
      });
    });
  });

  test.describe('FR-PROD-002: Featured Products Display', () => {
    test('Home page displays featured products grid', async ({ homePage }) => {
      await test.step('Navigate to home page', async () => {
        await homePage.goto();
      });

      await test.step('Verify featured products are displayed', async () => {
        const productCount = await homePage.getFeaturedProductCount();
        expect(productCount).toBeGreaterThan(0);
      });
    });
  });

  test.describe('FR-PROD-003: Product Listing', () => {
    test('Catalog page displays all active products in grid', async ({ catalogPage }) => {
      await test.step('Navigate to catalog page', async () => {
        await catalogPage.goto();
      });

      await test.step('Verify page heading is displayed', async () => {
        await expect(catalogPage.pageHeading).toBeVisible();
      });

      await test.step('Verify products are displayed in grid', async () => {
        const productCount = await catalogPage.getProductCount();
        expect(productCount).toBeGreaterThan(0);
      });
    });
  });

  test.describe('FR-PROD-006: Add to Cart from Catalog', () => {
    test('Login with Standard User - can add product to cart from catalog', async ({
      loginPage,
      catalogPage,
      navBar,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog page', async () => {
        await catalogPage.goto();
      });

      await test.step('Get the first product name', async () => {
        await expect(catalogPage.productCards.first()).toBeVisible();
      });

      await test.step('Add first available product to cart', async () => {
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Verify cart badge updates to show item count', async () => {
        const cartCount = await navBar.getCartItemCount();
        expect(cartCount).toBeGreaterThanOrEqual(1);
      });
    });
  });

  test.describe('FR-PROD-007: In Cart Button Navigation', () => {
    test('Login with Standard User - In Cart button navigates to cart', async ({
      loginPage,
      catalogPage,
      page,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog page', async () => {
        await catalogPage.goto();
      });

      await test.step('Add a product to cart', async () => {
        const firstAddButton = catalogPage.productCards.first().getByRole('button', { name: 'Add' });
        await firstAddButton.click();
      });

      await test.step('Click In Cart button', async () => {
        const inCartButton = catalogPage.productCards.first().getByRole('button', { name: /In Cart/i });
        await inCartButton.click();
      });

      await test.step('Verify navigated to cart page', async () => {
        await expect(page).toHaveURL(/cart/);
      });
    });
  });

  test.describe('FR-PROD-009: Product Detail Display', () => {
    test('Product detail page shows complete product information', async ({
      catalogPage,
      productDetailPage,
    }) => {
      await test.step('Navigate to catalog page', async () => {
        await catalogPage.goto();
      });

      await test.step('Click on first product', async () => {
        await catalogPage.productCards.first().getByRole('heading').click();
      });

      await test.step('Verify product details are displayed', async () => {
        await expect(productDetailPage.productName).toBeVisible();
        await expect(productDetailPage.productPrice).toBeVisible();
        await expect(productDetailPage.addToCartButton).toBeVisible();
        await expect(productDetailPage.backToProductsLink).toBeVisible();
      });
    });
  });

  test.describe('FR-PROD-010: Add to Cart from Detail Page', () => {
    test('Login with Standard User - can add product from detail page', async ({
      loginPage,
      catalogPage,
      productDetailPage,
      navBar,
    }) => {
      await test.step('Navigate to login page and login', async () => {
        await loginPage.goto();
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Navigate to catalog and click first product', async () => {
        await catalogPage.goto();
        await catalogPage.productCards.first().getByRole('heading').click();
      });

      await test.step('Add product to cart', async () => {
        await productDetailPage.addToCart();
      });

      await test.step('Verify cart badge updates', async () => {
        const cartCount = await navBar.getCartItemCount();
        expect(cartCount).toBeGreaterThanOrEqual(1);
      });
    });
  });

  test.describe('FR-PROD-011: Product Not Found', () => {
    test('Invalid product slug shows 404 page', async ({ productDetailPage }) => {
      await test.step('Navigate to invalid product slug', async () => {
        await productDetailPage.goto('invalid-product-slug-12345');
      });

      await test.step('Verify 404 Not Found message is displayed', async () => {
        await expect(productDetailPage.notFoundMessage).toBeVisible();
      });
    });
  });
});

