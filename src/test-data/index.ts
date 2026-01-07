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
  ALL_USERS,
  INVALID_CREDENTIALS,
  EMPTY_CREDENTIALS,
} from './users';

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

