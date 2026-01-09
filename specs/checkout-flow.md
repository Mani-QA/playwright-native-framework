# Checkout Flow Test Plan

## Application Overview

The QADemo e-commerce application provides a complete checkout flow that includes:
- Product selection from catalog
- Shopping cart management
- User authentication (required for checkout)
- Shipping information collection
- Payment processing
- Order confirmation

**Base URL:** https://qademo.com

## Test Scenarios

### 1. Guest Checkout Redirect

**Seed:** tests/seed.spec.ts

#### Steps:
1. Navigate to catalog page (`/catalog`)
2. Wait for product cards to load
3. Click "Add" button on first available product
4. Wait for cart badge to update
5. Navigate to cart page via navbar
6. Click "Proceed to Checkout" button

**Expected Results:**
- User is redirected to login page (`/login`)
- Cart items are preserved (visible in navbar badge)
- "Sign in to continue" message is displayed

---

### 2. Authenticated User Checkout

**Seed:** tests/seed.spec.ts

#### Prerequisites:
- User logged in as `standard_user` / `standard123`

#### Steps:
1. Navigate to catalog page
2. Add a product to cart
3. Navigate to cart via navbar
4. Click "Proceed to Checkout"
5. Fill shipping information:
   - First Name: John
   - Last Name: Doe
   - Address: 123 Test Street
6. Fill payment information:
   - Card Number: 4242424242424242
   - Expiry: 12/26
   - CVV: 123
   - Name on Card: John Doe
7. Click "Place Order" button

**Expected Results:**
- Navigation to order confirmation page (`/orders/{id}`)
- "Order Confirmed!" heading visible
- Order details displayed correctly
- Cart is emptied (badge shows 0)

---

### 3. Empty Cart Checkout Prevention

**Seed:** tests/seed.spec.ts

#### Prerequisites:
- User logged in as `standard_user` / `standard123`
- Cart is empty

#### Steps:
1. Navigate directly to checkout page (`/checkout`)

**Expected Results:**
- "Cart is empty" message displayed
- User cannot proceed with checkout
- Link to continue shopping is visible

---

### 4. Form Validation

**Seed:** tests/seed.spec.ts

#### Prerequisites:
- User logged in with items in cart
- On checkout page

#### Steps:
1. Leave all fields empty
2. Click "Place Order" button

**Expected Results:**
- Validation errors appear for required fields
- Form is not submitted
- User remains on checkout page

---

### 5. Invalid Payment Card

**Seed:** tests/seed.spec.ts

#### Prerequisites:
- User logged in with items in cart
- On checkout page

#### Steps:
1. Fill valid shipping information
2. Enter invalid card number: 1234567890123456
3. Fill other payment fields correctly
4. Click "Place Order"

**Expected Results:**
- Error message for invalid card
- Order is not placed
- User can correct the card number

## Test Data

### Users
| Type | Username | Password |
|------|----------|----------|
| Standard | standard_user | standard123 |
| Locked | locked_user | locked123 |
| Admin | admin_user | admin123 |

### Payment Cards
| Type | Number | Expiry | CVV |
|------|--------|--------|-----|
| Valid | 4242424242424242 | 12/26 | 123 |
| Invalid | 1234567890123456 | 12/26 | 123 |

## Page Objects Used

- `LoginPage` - Authentication
- `CatalogPage` - Product listing
- `CartPage` - Shopping cart
- `CheckoutPage` - Checkout form
- `OrderDetailPage` - Order confirmation
- `NavBar` - Navigation and cart badge
