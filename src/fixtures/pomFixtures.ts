import { test as base } from '@playwright/test';

// Page Objects
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { CatalogPage } from '../pages/CatalogPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { AdminPage } from '../pages/AdminPage';

// Components
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';

/**
 * Type definition for all Page Object fixtures
 */
type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  catalogPage: CatalogPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  ordersPage: OrdersPage;
  orderDetailPage: OrderDetailPage;
  adminPage: AdminPage;
  navBar: NavBar;
  footer: Footer;
};

/**
 * Extended test object with injected Page Objects
 * Use this instead of the standard '@playwright/test' import in test files
 */
export const test = base.extend<PageFixtures>({
  // Page Objects - instantiated per test

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },

  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },

  orderDetailPage: async ({ page }, use) => {
    await use(new OrderDetailPage(page));
  },

  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },

  // Component Objects - instantiated per test

  navBar: async ({ page }, use) => {
    await use(new NavBar(page));
  },

  footer: async ({ page }, use) => {
    await use(new Footer(page));
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';

