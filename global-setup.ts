import { request, type FullConfig } from '@playwright/test';
import { syncQaseCaseMap } from './src/qase/sync-case-map';
import { createSignupAccount, saveSignedUpUser } from './src/test-data/signedUpUser';

/**
 * Create one standard customer before any project starts.
 * Shopping, checkout, order, and API tests sign in with this account.
 * The signup spec covers the registration page itself with its own visitors.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'https://qademo.com';
  const account = createSignupAccount();
  const api = await request.newContext({ baseURL });

  try {
    const response = await api.post('/api/auth/signup', {
      data: {
        email: account.email,
        phone: account.phone,
        username: account.username,
        password: account.password,
      },
    });

    if (!response.ok()) {
      throw new Error(`Could not create the shared customer (${response.status()}): ${await response.text()}`);
    }

    const body = await response.json();
    const username = body?.data?.user?.username;
    if (typeof username === 'string' && username.length > 0) {
      account.username = username;
    }

    saveSignedUpUser(account);
  } finally {
    await api.dispose();
    await syncQaseCaseMap();
  }
}
