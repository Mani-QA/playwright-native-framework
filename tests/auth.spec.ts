import { test, expect } from '../src/fixtures/pomFixtures';
import {
  STANDARD_USER,
  LOCKED_USER,
  ADMIN_USER,
  INVALID_CREDENTIALS,
  ERROR_MESSAGES,
  URLS,
  createSignupAccount,
  loadSignedUpUser,
} from '../src/test-data';

test.describe('Authentication Module', () => {
  test.describe('@p1 FR-AUTH-001: Login Form Display', () => {
    test('Login page offers Google sign-in and a username or email form', async ({ loginPage, page }) => {
      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Verify login form elements are displayed', async () => {
        await expect(loginPage.heading).toBeVisible();
        await expect(loginPage.googleButton).toBeVisible();
        await expect(loginPage.passwordDivider).toBeVisible();
        await expect(loginPage.usernameInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
        await expect(loginPage.createAccountLink).toBeVisible();
        await expect(loginPage.backToHomeLink).toBeVisible();
      });

      await test.step('Verify the test-credential quick fill is not shown', async () => {
        await expect(page.getByText('Test Credentials')).toHaveCount(0);
      });

      await test.step('Create Account link opens signup', async () => {
        await loginPage.clickCreateAccount();
        await expect(page).toHaveURL(/signup/);
      });
    });
  });

  test.describe('@p1 FR-AUTH-002: Standard User Login', () => {
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
        await expect(navBar.usernameLink).toContainText(STANDARD_USER.username);
        await expect(navBar.logoutButton).toBeVisible();
      });
    });

    test('Signed-up customer can sign in with username or email', async ({
      loginPage,
      navBar,
      page,
    }) => {
      const customer = loadSignedUpUser();

      await test.step('Sign in with the username created at signup', async () => {
        await loginPage.goto();
        await loginPage.login(customer.username, customer.password);
      });

      await test.step('Verify the signed-up username is shown', async () => {
        await expect(page).toHaveURL(/catalog/);
        await expect(navBar.usernameLink).toContainText(customer.username);
      });

      await test.step('Sign out and sign in again with the same email', async () => {
        await navBar.clickLogout();
        await expect(navBar.signInButton).toBeVisible();
        await loginPage.goto();
        await loginPage.login(customer.email, customer.password);
      });

      await test.step('Verify email login returns to the catalog', async () => {
        await expect(page).toHaveURL(/catalog/);
        await expect(navBar.usernameLink).toContainText(customer.username);
      });
    });
  });

  test.describe('@p2 FR-AUTH-003: Locked User Login Rejection', () => {
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

  test.describe('@p2 FR-AUTH-004: Invalid Credentials Rejection', () => {
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

  test.describe('@p2 FR-AUTH-005: Admin User Login', () => {
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

  test.describe('@p1 FR-AUTH-007: Logout Functionality', () => {
    test('Signed-up customer logout should redirect to home', async ({
      loginPage,
      navBar,
      page,
    }) => {
      const customer = loadSignedUpUser();

      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Login with the signed-up customer', async () => {
        await loginPage.login(customer.username, customer.password);
      });

      await test.step('Verify user is logged in', async () => {
        await expect(navBar.logoutButton).toBeVisible();
      });

      await test.step('Click logout button', async () => {
        await navBar.clickLogout();
      });

      await test.step('Verify user is logged out - Sign In and Create Account are visible', async () => {
        await expect(navBar.signInButton).toBeVisible();
        await expect(navBar.signUpButton).toBeVisible();
      });

      await test.step('Verify redirected to home page', async () => {
        await expect(page).toHaveURL('/');
      });
    });
  });

  test.describe('@p3 FR-AUTH-008: Session Persistence', () => {
    test('Signed-up customer session persists after page refresh', async ({
      loginPage,
      navBar,
      page,
    }) => {
      const customer = loadSignedUpUser();

      await test.step('Navigate to login page', async () => {
        await loginPage.goto();
      });

      await test.step('Login with the signed-up customer', async () => {
        await loginPage.login(customer.username, customer.password);
      });

      await test.step('Verify user is logged in', async () => {
        await expect(navBar.usernameLink).toContainText(customer.username);
      });

      await test.step('Refresh the page', async () => {
        await page.reload();
      });

      await test.step('Verify user remains logged in after refresh', async () => {
        await expect(navBar.usernameLink).toContainText(customer.username);
        await expect(navBar.logoutButton).toBeVisible();
      });
    });
  });

  test.describe('@p3 FR-AUTH-009: Protected Route Redirect', () => {
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

  test.describe('@p1 FR-AUTH-010: Signup Form Display', () => {
    test('Signup page collects email, phone, optional username, and password', async ({
      signupPage,
      page,
    }) => {
      await test.step('Navigate to signup page', async () => {
        await signupPage.goto();
      });

      await test.step('Verify signup form elements are displayed', async () => {
        await expect(signupPage.heading).toBeVisible();
        await expect(signupPage.googleButton).toBeVisible();
        await expect(signupPage.emailDivider).toBeVisible();
        await expect(signupPage.emailInput).toBeVisible();
        await expect(signupPage.phoneInput).toBeVisible();
        await expect(signupPage.usernameInput).toBeVisible();
        await expect(signupPage.passwordInput).toBeVisible();
        await expect(signupPage.confirmPasswordInput).toBeVisible();
        await expect(signupPage.showPasswordButton).toBeVisible();
        await expect(signupPage.showConfirmPasswordButton).toBeVisible();
        await expect(signupPage.createAccountButton).toBeVisible();
        await expect(signupPage.signInLink).toBeVisible();
        await expect(signupPage.backToHomeLink).toBeVisible();
      });

      await test.step('Password checklist appears while a password is entered', async () => {
        await signupPage.passwordInput.fill('a');
        await expect(signupPage.lengthRule).toBeVisible();
        await expect(signupPage.uppercaseRule).toBeVisible();
        await expect(signupPage.numberRule).toBeVisible();
        // Blur the password field so its validation re-render finishes before the next click
        await signupPage.heading.click();
      });

      await test.step('Sign In link opens the login page', async () => {
        await signupPage.clickSignIn();
        await expect(page).toHaveURL(/login/);
      });
    });
  });

  test.describe('@p1 FR-AUTH-011: Successful Signup', () => {
    test('New visitor can create an account and sign in with it', async ({
      signupPage,
      loginPage,
      navBar,
      page,
    }) => {
      const account = createSignupAccount();

      await test.step('Open signup and create a standard account', async () => {
        await signupPage.goto();
        await signupPage.signup(account);
      });

      await test.step('Verify the visitor is signed in and sent to the catalog', async () => {
        await expect(page).toHaveURL(/catalog/);
        await expect(navBar.usernameLink).toContainText(account.username);
        await expect(navBar.logoutButton).toBeVisible();
      });

      await test.step('Sign out, then sign in again with the new username', async () => {
        await navBar.clickLogout();
        await expect(navBar.signInButton).toBeVisible();
        await loginPage.goto();
        await loginPage.login(account.username, account.password);
      });

      await test.step('Verify the same account is signed in', async () => {
        await expect(page).toHaveURL(/catalog/);
        await expect(navBar.usernameLink).toContainText(account.username);
      });
    });

    test('Signup without a username derives one and signs the visitor in', async ({
      signupPage,
      navBar,
      page,
    }) => {
      const account = createSignupAccount();

      await test.step('Create an account and leave username empty', async () => {
        await signupPage.goto();
        await signupPage.signup({
          email: account.email,
          phone: account.phone,
          password: account.password,
          confirmPassword: account.confirmPassword,
        });
      });

      await test.step('Verify the visitor is signed in with a derived username', async () => {
        await expect(page).toHaveURL(/catalog/);
        await expect(navBar.usernameLink).toBeVisible();
        await expect(navBar.usernameLink).not.toHaveText('');
      });
    });
  });

  test.describe('@p2 FR-AUTH-012: Signup Validation and Conflicts', () => {
    test('Missing signup details stay on the page with field errors', async ({ signupPage, page }) => {
      await test.step('Open signup and submit an empty form', async () => {
        await signupPage.goto();
        await signupPage.clickCreateAccount();
      });

      await test.step('Verify required-field errors and that the form was not submitted', async () => {
        await expect(page.getByText(ERROR_MESSAGES.emailRequired)).toBeVisible();
        await expect(page.getByText(ERROR_MESSAGES.phoneRequired)).toBeVisible();
        await expect(page.getByText(ERROR_MESSAGES.passwordRequired)).toBeVisible();
        await expect(page.getByText(ERROR_MESSAGES.confirmPasswordRequired)).toBeVisible();
        await expect(page).toHaveURL(/signup/);
      });
    });

    test('Invalid signup details and a password mismatch stay on the page', async ({
      signupPage,
      page,
    }) => {
      const account = createSignupAccount();

      await test.step('Submit an invalid email, phone, username, and password', async () => {
        await signupPage.goto();
        await signupPage.fillForm({
          email: 'a@b.c',
          phone: '12',
          username: 'ab',
          password: 'noupper1',
          confirmPassword: 'noupper1',
        });
        await signupPage.clickCreateAccount();
      });

      await test.step('Verify field errors are shown', async () => {
        await expect(page.getByText(ERROR_MESSAGES.invalidEmail)).toBeVisible();
        await expect(page.getByText(ERROR_MESSAGES.phoneTooShort)).toBeVisible();
        await expect(page.getByText(ERROR_MESSAGES.usernameTooShort)).toBeVisible();
        await expect(page.getByText(ERROR_MESSAGES.passwordNeedsUppercase)).toBeVisible();
        await expect(page).toHaveURL(/signup/);
      });

      await test.step('Submit a password that does not match the confirmation', async () => {
        await signupPage.fillForm({
          ...account,
          confirmPassword: 'OtherPass1!',
        });
        await signupPage.clickCreateAccount();
      });

      await test.step('Verify the mismatch message and that the visitor stays on signup', async () => {
        await expect(page.getByText(ERROR_MESSAGES.passwordsDoNotMatch)).toBeVisible();
        await expect(page).toHaveURL(/signup/);
      });
    });

    test('Duplicate email and username are rejected', async ({ signupPage, page }) => {
      const customer = loadSignedUpUser();
      const other = createSignupAccount();

      await test.step('Submit the email that already belongs to the shared customer', async () => {
        await signupPage.goto();
        await signupPage.signup({
          email: customer.email,
          phone: other.phone,
          username: other.username,
          password: other.password,
          confirmPassword: other.confirmPassword,
        });
      });

      await test.step('Verify the duplicate email message', async () => {
        await expect(signupPage.errorMessage).toContainText(ERROR_MESSAGES.emailExists);
        await expect(page).toHaveURL(/signup/);
      });

      await test.step('Submit the username that is already taken', async () => {
        await signupPage.fillForm({
          email: other.email,
          phone: other.phone,
          username: customer.username,
          password: other.password,
          confirmPassword: other.confirmPassword,
        });
        await signupPage.clickCreateAccount();
      });

      await test.step('Verify the username conflict message', async () => {
        await expect(signupPage.errorMessage).toContainText(ERROR_MESSAGES.usernameTaken);
        await expect(page).toHaveURL(/signup/);
      });
    });
  });
});
