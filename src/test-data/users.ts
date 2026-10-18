/**
 * Test user credentials for QADemo application
 * Reference: FRD Section 2.2 - Pre-configured Test Accounts
 */

export interface TestUser {
  username: string;
  password: string;
  userType: 'standard' | 'locked' | 'admin';
  description: string;
}

/**
 * Standard user - Regular customer with full access
 */
export const STANDARD_USER: TestUser = {
  username: 'standard_user',
  password: 'standard123',
  userType: 'standard',
  description: 'Regular customer - can browse, cart, checkout, view orders',
};

/**
 * Locked user - Account is blocked and cannot login
 */
export const LOCKED_USER: TestUser = {
  username: 'locked_user',
  password: 'locked123',
  userType: 'locked',
  description: 'Blocked account - login should fail with "Account is locked"',
};

/**
 * Admin password is `$Admin` plus today's date as DDMMYYYY.
 * Example: 18 October 2026 -> `$Admin18102026`
 */
export function getAdminPassword(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `$Admin${day}${month}${year}`;
}

/**
 * Admin user - Has access to admin dashboard
 */
export const ADMIN_USER: TestUser = {
  username: 'admin_user',
  get password() {
    return getAdminPassword();
  },
  userType: 'admin',
  description: 'Administrator - password is $Admin plus the current date as DDMMYYYY',
};

/**
 * All test users for iteration
 */
export const ALL_USERS: TestUser[] = [STANDARD_USER, LOCKED_USER, ADMIN_USER];

/**
 * Invalid credentials for negative testing
 */
export const INVALID_CREDENTIALS = {
  username: 'invalid_user',
  password: 'wrong_password',
};

/**
 * Empty credentials for validation testing
 */
export const EMPTY_CREDENTIALS = {
  username: '',
  password: '',
};

