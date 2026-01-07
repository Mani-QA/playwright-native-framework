import { test, expect } from '../src/fixtures/pomFixtures';
import {
  STANDARD_USER,
  LOCKED_USER,
  ADMIN_USER,
  INVALID_CREDENTIALS,
  ERROR_MESSAGES,
  URLS,
} from '../src/test-data';

test.describe('Authentication Module', () => {
  test.describe('FR-AUTH-001: Login Form Display', () => {
    test('Login page displays username and password input fields', async ({ loginPage, page }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Verify login form elements are displayed', async () => {
        await expect(loginPage.usernameInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
        await expect(loginPage.backToHomeLink).toBeVisible();
      });

      await test.step('Verify test credentials section is displayed', async () => {
        await expect(loginPage.testCredentialsSection).toBeVisible();
      });
    });
  });

  test.describe('FR-AUTH-002: Standard User Login', () => {
    test('Login with Standard User - should redirect to catalog', async ({
      loginPage,
      navBar,
      page,
    }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Login with standard user credentials', async () => {
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Verify successful login - redirected to catalog', async () => {
        await expect(page).toHaveURL(/catalog/);
      });

      await test.step('Verify username is displayed in navbar', async () => {
        await expect(navBar.logoutButton).toBeVisible();
      });
    });
  });

  test.describe('FR-AUTH-003: Locked User Login Rejection', () => {
    test('Login with Locked User - should display account locked error', async ({
      loginPage,
      page,
    }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Login with locked user credentials', async () => {
        await loginPage.login(LOCKED_USER.username, LOCKED_USER.password);
      });

      await test.step('Verify login fails with account locked error', async () => {
        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toContainText(ERROR_MESSAGES.accountLocked);
      });

      await test.step('Verify user remains on login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });
  });

  test.describe('FR-AUTH-004: Invalid Credentials Rejection', () => {
    test('Login with invalid credentials - should display error message', async ({
      loginPage,
      page,
    }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Login with invalid credentials', async () => {
        await loginPage.login(INVALID_CREDENTIALS.username, INVALID_CREDENTIALS.password);
      });

      await test.step('Verify login fails with invalid credentials error', async () => {
        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toContainText(ERROR_MESSAGES.invalidCredentials);
      });

      await test.step('Verify user remains on login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });
  });

  test.describe('FR-AUTH-005: Admin User Login', () => {
    test('Login with Admin User - should have access to admin dashboard', async ({
      loginPage,
      navBar,
      page,
    }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Login with admin user credentials', async () => {
        await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
      });

      await test.step('Verify successful login - redirected to catalog', async () => {
        await expect(page).toHaveURL(/catalog/);
      });

      await test.step('Verify Admin button is visible in navbar', async () => {
        await expect(navBar.adminButton).toBeVisible();
      });

      await test.step('Verify admin can access admin page', async () => {
        await navBar.clickAdmin();
        await expect(page).toHaveURL(/admin/);
      });
    });
  });

  test.describe('FR-AUTH-006: Test Credential Quick Fill', () => {
    test('Clicking test credential button fills form', async ({ loginPage }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Click on Standard User test credential', async () => {
        await loginPage.clickStandardUserCredential();
      });

      await test.step('Verify form is populated with standard user credentials', async () => {
        await expect(loginPage.usernameInput).toHaveValue(STANDARD_USER.username);
        await expect(loginPage.passwordInput).toHaveValue(STANDARD_USER.password);
      });
    });
  });

  test.describe('FR-AUTH-007: Logout Functionality', () => {
    test('Login with Standard User - logout should redirect to home', async ({
      loginPage,
      navBar,
      page,
    }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Login with standard user credentials', async () => {
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Verify user is logged in', async () => {
        await expect(navBar.logoutButton).toBeVisible();
      });

      await test.step('Click logout button', async () => {
        await navBar.clickLogout();
      });

      await test.step('Verify user is logged out - Sign In button visible', async () => {
        await expect(navBar.signInButton).toBeVisible();
      });

      await test.step('Verify redirected to home page', async () => {
        await expect(page).toHaveURL('/');
      });
    });
  });

  test.describe('FR-AUTH-008: Session Persistence', () => {
    test('Login with Standard User - session persists after page refresh', async ({
      loginPage,
      navBar,
      page,
    }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Login with standard user credentials', async () => {
        await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
      });

      await test.step('Verify user is logged in', async () => {
        await expect(navBar.logoutButton).toBeVisible();
      });

      await test.step('Refresh the page', async () => {
        await page.reload();
      });

      await test.step('Verify user remains logged in after refresh', async () => {
        await expect(navBar.logoutButton).toBeVisible();
      });
    });
  });

  test.describe('FR-AUTH-009: Protected Route Redirect', () => {
    test('Unauthenticated user redirected to login for checkout', async ({ page }) => {
      await test.step('Navigate directly to checkout page', async () => {
        await page.goto(URLS.checkout);
      });

      await test.step('Verify redirected to login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });

    test('Unauthenticated user redirected to login for orders', async ({ page }) => {
      await test.step('Navigate directly to orders page', async () => {
        await page.goto(URLS.orders);
      });

      await test.step('Verify redirected to login page', async () => {
        await expect(page).toHaveURL(/login/);
      });
    });
  });
});

