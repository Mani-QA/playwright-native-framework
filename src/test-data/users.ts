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
 * Admin user - Has access to admin dashboard
 */
export const ADMIN_USER: TestUser = {
  username: 'admin_user',
  password: 'admin123',
  userType: 'admin',
  description: 'Administrator - all standard permissions plus admin dashboard',
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

