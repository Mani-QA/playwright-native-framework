import { test as setup, expect } from '../src/fixtures/pomFixtures';
import { ADMIN_USER, loadSignedUpUser } from '../src/test-data';

const STORAGE_STATE_DIR = 'playwright/.auth';

/**
 * Sign in as the customer created during global setup.
 * Shopping tests still log in themselves; this storage state is the same account.
 */
setup('@p1 authenticate as signed-up customer', async ({ page, loginPage }) => {
  const customer = loadSignedUpUser();

  await setup.step('Sign in with the account created at signup', async () => {
    await loginPage.goto();
    await loginPage.login(customer.username, customer.password);
  });

  await setup.step('Verify login success - redirected to catalog', async () => {
    await expect(page).toHaveURL(/catalog/);
    await expect(page.getByRole('navigation').getByRole('link', { name: new RegExp(customer.username, 'i') })).toBeVisible();
  });

  await setup.step('Save authentication state', async () => {
    await page.context().storageState({ path: `${STORAGE_STATE_DIR}/standard-user.json` });
  });
});

/**
 * Authentication setup for Admin User.
 * Password is `$Admin` plus the current date as DDMMYYYY.
 */
setup('@p1 authenticate as admin user', async ({ page, loginPage, navBar }) => {
  await setup.step('Sign in with admin credentials', async () => {
    await loginPage.goto();
    await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
  });

  await setup.step('Verify login success - redirected to catalog', async () => {
    await expect(page).toHaveURL(/catalog/);
  });

  await setup.step('Verify admin link is visible', async () => {
    await expect(navBar.adminButton).toBeVisible();
  });

  await setup.step('Save authentication state', async () => {
    await page.context().storageState({ path: `${STORAGE_STATE_DIR}/admin-user.json` });
  });
});
