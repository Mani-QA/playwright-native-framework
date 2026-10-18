import fs from 'fs';
import { test as base, type TestInfo } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';
import { QASE_CASE_MAP_PATH } from '../qase/sync-case-map';

// Page Objects
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
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
  qaseCase: void;
  loginPage: LoginPage;
  signupPage: SignupPage;
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
let caseMap: Record<string, number> | undefined;

function qaseCaseId(testInfo: TestInfo): number | undefined {
  caseMap ??= fs.existsSync(QASE_CASE_MAP_PATH)
    ? (JSON.parse(fs.readFileSync(QASE_CASE_MAP_PATH, 'utf8')) as Record<string, number>)
    : {};

  const requirement = [...testInfo.titlePath]
    .reverse()
    .map((part) => part.match(/FR-[A-Z]+-\d+/)?.[0])
    .find((value): value is string => Boolean(value));

  if (!requirement) return undefined;
  return caseMap[`${requirement}: ${testInfo.title}`];
}

export const test = base.extend<PageFixtures>({
  // Link a spec to its Qase case. Seed, setup, and unmapped tests still run, but are not reported.
  qaseCase: [
    async ({}, use, testInfo) => {
      const caseId = qaseCaseId(testInfo);
      if (caseId) qase.id(caseId);
      else qase.ignore();
      await use();
    },
    { auto: true },
  ],

  // Page Objects - instantiated per test

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
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

