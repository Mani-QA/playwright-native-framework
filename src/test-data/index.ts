/**
 * Central export file for all test data
 * Import from this file to access all test data in one place
 */

// User test data
export {
  type TestUser,
  STANDARD_USER,
  LOCKED_USER,
  ADMIN_USER,
  getAdminPassword,
  ALL_USERS,
  INVALID_CREDENTIALS,
  EMPTY_CREDENTIALS,
} from './users';

export {
  type SignupAccount,
  SIGNUP_PASSWORD,
  SIGNED_UP_USER_FILE,
  createSignupAccount,
  saveSignedUpUser,
  loadSignedUpUser,
} from './signedUpUser';

// Checkout test data
export {
  type ShippingInfo,
  type PaymentInfo,
  type CheckoutData,
  VALID_SHIPPING,
  VALID_PAYMENT,
  VALID_CHECKOUT_DATA,
  INVALID_CARD_NUMBER,
  EXPIRED_CARD,
  EMPTY_SHIPPING,
  EMPTY_PAYMENT,
  PARTIAL_SHIPPING,
  PARTIAL_PAYMENT,
  ALT_SHIPPING_ADDRESSES,
} from './checkout';

// Application URLs
export const URLS = {
  home: '/',
  login: '/login',
  signup: '/signup',
  catalog: '/catalog',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  admin: '/admin',
} as const;

// Error Messages (from FRD Section 10)
export const ERROR_MESSAGES = {
  invalidCredentials: 'Invalid username or password',
  accountLocked: 'Account is locked',
  emailRequired: 'Email address is required',
  phoneRequired: 'Phone number is required',
  passwordRequired: 'Password is required',
  passwordTooShort: 'Password must be at least 8 characters',
  confirmPasswordRequired: 'Please confirm your password',
  passwordsDoNotMatch: 'Passwords do not match',
  invalidEmail: 'Please enter a valid email address',
  phoneTooShort: 'Phone number must be at least 7 digits',
  usernameTooShort: 'Username must be at least 3 characters',
  passwordNeedsUppercase: 'Password must contain at least one uppercase letter',
  emailExists: 'An account with this email address already exists. Please sign in instead.',
  usernameTaken: 'This username is already taken. Please choose another username.',
  emptyCart: 'Your cart is empty',
  invalidCardNumber: 'Invalid card number. Please check and try again.',
  outOfStock: 'is out of stock',
  notFound: 'Not Found',
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  orderConfirmed: 'Order Confirmed',
  addedToCart: 'In Cart',
  loggedOut: 'Sign In',
} as const;

// Order Statuses
export const ORDER_STATUSES = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
} as const;

