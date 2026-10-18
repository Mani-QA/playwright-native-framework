import fs from 'fs';
import path from 'path';
import { generateRandomString } from '../utils/helpers';

/**
 * Customer created before the suite and reused as the login for shopping tests.
 * The file is written by global setup and is gitignored with the rest of playwright/.auth.
 */
export interface SignupAccount {
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  userType: 'standard';
}

/** Password that satisfies the signup checklist: 8 characters, an uppercase letter, and a number. */
export const SIGNUP_PASSWORD = 'NewUser1!';

export const SIGNED_UP_USER_FILE = path.join(process.cwd(), 'playwright', '.auth', 'customer.json');

/**
 * Build a unique standard-customer registration that is safe to submit more than once in a run.
 */
export function createSignupAccount(): SignupAccount {
  const token = `${Date.now().toString(36)}${generateRandomString(6)}`.toLowerCase();
  const username = `qa_${token}`.replace(/[^a-z0-9_]/g, '').slice(0, 30);

  return {
    email: `${username}@example.com`,
    phone: '5551234567',
    username,
    password: SIGNUP_PASSWORD,
    confirmPassword: SIGNUP_PASSWORD,
    userType: 'standard',
  };
}

/**
 * Persist the shared customer so later tests can sign in with the same account.
 */
export function saveSignedUpUser(account: SignupAccount): void {
  fs.mkdirSync(path.dirname(SIGNED_UP_USER_FILE), { recursive: true });
  fs.writeFileSync(SIGNED_UP_USER_FILE, JSON.stringify(account, null, 2));
}

/**
 * Read the customer created by global setup.
 * Call this inside a test, not at module load, so collection does not require the file yet.
 */
export function loadSignedUpUser(): SignupAccount {
  if (!fs.existsSync(SIGNED_UP_USER_FILE)) {
    throw new Error(
      'Signed-up customer credentials were not found. Global setup must create the account before tests log in.'
    );
  }

  return JSON.parse(fs.readFileSync(SIGNED_UP_USER_FILE, 'utf-8')) as SignupAccount;
}
