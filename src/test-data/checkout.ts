/**
 * Test data for checkout functionality
 * Reference: FRD Section 6 - Checkout Module
 */

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  address: string;
}

export interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export interface CheckoutData {
  shipping: ShippingInfo;
  payment: PaymentInfo;
}

/**
 * Valid test shipping information
 */
export const VALID_SHIPPING: ShippingInfo = {
  firstName: 'John',
  lastName: 'Doe',
  address: '123 Test Street, Test City, TC 12345',
};

/**
 * Valid test credit card (Stripe test card number)
 * Card Number: 4242 4242 4242 4242
 */
export const VALID_PAYMENT: PaymentInfo = {
  cardNumber: '4242424242424242',
  expiryDate: '1226',
  cvv: '123',
  cardholderName: 'John Doe',
};

/**
 * Complete valid checkout data
 */
export const VALID_CHECKOUT_DATA: CheckoutData = {
  shipping: VALID_SHIPPING,
  payment: VALID_PAYMENT,
};

/**
 * Invalid credit card number (fails Luhn validation)
 */
export const INVALID_CARD_NUMBER: PaymentInfo = {
  cardNumber: '1234567890123456',
  expiryDate: '1226',
  cvv: '123',
  cardholderName: 'John Doe',
};

/**
 * Expired credit card
 */
export const EXPIRED_CARD: PaymentInfo = {
  cardNumber: '4242424242424242',
  expiryDate: '0120', // January 2020 - expired
  cvv: '123',
  cardholderName: 'John Doe',
};

/**
 * Empty shipping info for validation testing
 */
export const EMPTY_SHIPPING: ShippingInfo = {
  firstName: '',
  lastName: '',
  address: '',
};

/**
 * Empty payment info for validation testing
 */
export const EMPTY_PAYMENT: PaymentInfo = {
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardholderName: '',
};

/**
 * Partial shipping info (missing fields)
 */
export const PARTIAL_SHIPPING: ShippingInfo = {
  firstName: 'John',
  lastName: '',
  address: '',
};

/**
 * Partial payment info (missing fields)
 */
export const PARTIAL_PAYMENT: PaymentInfo = {
  cardNumber: '4242424242424242',
  expiryDate: '',
  cvv: '',
  cardholderName: '',
};

/**
 * Alternative valid shipping addresses for variety
 */
export const ALT_SHIPPING_ADDRESSES: ShippingInfo[] = [
  {
    firstName: 'Jane',
    lastName: 'Smith',
    address: '456 Commerce Ave, Business District, BD 67890',
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    address: '789 Market Street, Suite 100, Downtown, DT 11111',
  },
];

