/**
 * Utility helper functions for test automation
 */

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random email address
 */
export function generateRandomEmail(domain: string = 'test.com'): string {
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `test.${random}.${timestamp}@${domain}`;
}

/**
 * Generate a random price within a range
 */
export function generateRandomPrice(min: number = 1, max: number = 100): string {
  const price = Math.random() * (max - min) + min;
  return price.toFixed(2);
}

/**
 * Generate a random stock quantity
 */
export function generateRandomStock(min: number = 0, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format price to currency string
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Parse price string to number
 */
export function parsePrice(priceString: string): number {
  return parseFloat(priceString.replace(/[^0-9.]/g, ''));
}

/**
 * Generate a valid test credit card number (using Luhn algorithm)
 */
export function generateTestCardNumber(): string {
  // Use the standard test card number
  return '4242424242424242';
}

/**
 * Generate a future expiry date in MM/YY format
 */
export function generateFutureExpiryDate(monthsAhead: number = 12): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}${year}`;
}

/**
 * Generate a random CVV
 */
export function generateRandomCVV(length: 3 | 4 = 3): string {
  const min = length === 3 ? 100 : 1000;
  const max = length === 3 ? 999 : 9999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Wait for a specified number of milliseconds
 * Note: Use only in rare cases where Playwright's auto-wait doesn't work
 * This is for debugging purposes only
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract order ID from URL
 */
export function extractOrderIdFromUrl(url: string): string | null {
  const match = url.match(/\/orders\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Generate a slug from product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate credit card number using Luhn algorithm
 */
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

