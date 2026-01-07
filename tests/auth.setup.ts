import { test as setup, expect } from '@playwright/test';
import { STANDARD_USER, ADMIN_USER } from '../src/test-data';

const STORAGE_STATE_DIR = 'playwright/.auth';

/**
 * Authentication setup for Standard User
 * Creates a storage state file that can be used by tests requiring standard user authentication
 */
setup('authenticate as standard user', async ({ page }) => {
  await setup.step('Navigate to login page', async () => {
    await page.goto('/login');
  });

  await setup.step('Fill login credentials for standard user', async () => {
    await page.getByLabel('Username').fill(STANDARD_USER.username);
    await page.getByLabel('Password').fill(STANDARD_USER.password);
  });

  await setup.step('Click Sign In button', async () => {
    // Use the form's submit button (in main content area), not the navbar button
    await page.getByRole('main').getByRole('button', { name: 'Sign In' }).click();
  });

  await setup.step('Verify login success - redirected to catalog', async () => {
    await expect(page).toHaveURL(/catalog/);
  });

  await setup.step('Save authentication state', async () => {
    await page.context().storageState({ path: `${STORAGE_STATE_DIR}/standard-user.json` });
  });
});

/**
 * Authentication setup for Admin User
 * Creates a storage state file that can be used by tests requiring admin user authentication
 */
setup('authenticate as admin user', async ({ page }) => {
  await setup.step('Navigate to login page', async () => {
    await page.goto('/login');
  });

  await setup.step('Fill login credentials for admin user', async () => {
    await page.getByLabel('Username').fill(ADMIN_USER.username);
    await page.getByLabel('Password').fill(ADMIN_USER.password);
  });

  await setup.step('Click Sign In button', async () => {
    // Use the form's submit button (in main content area), not the navbar button
    await page.getByRole('main').getByRole('button', { name: 'Sign In' }).click();
  });

  await setup.step('Verify login success - redirected to catalog', async () => {
    await expect(page).toHaveURL(/catalog/);
  });

  await setup.step('Verify admin link is visible', async () => {
    // Use exact: true to avoid matching "admin_user" username link
    await expect(page.getByRole('link', { name: 'Admin', exact: true })).toBeVisible();
  });

  await setup.step('Save authentication state', async () => {
    await page.context().storageState({ path: `${STORAGE_STATE_DIR}/admin-user.json` });
  });
});

