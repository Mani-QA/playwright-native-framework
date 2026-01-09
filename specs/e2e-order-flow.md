# End-to-End Order Flow Test Plan

## Application Overview

This test plan covers the complete user journey in the QADemo e-commerce application, from initial login through successful order placement. The flow encompasses:

- User authentication
- Product browsing and selection
- Shopping cart management
- Checkout process
- Order confirmation and verification

**Base URL:** https://qademo.com

## User Personas

| Persona | Username | Password | Description |
|---------|----------|----------|-------------|
| Standard User | standard_user | standard123 | Regular customer with full access |
| Admin User | admin_user | admin123 | Administrator with order management access |

## Test Scenarios

### 1. Complete Purchase Flow - Standard User

**Seed:** tests/seed.spec.ts
**Priority:** P1 (Critical Path)
**Tags:** @e2e @p1

#### Preconditions:
- User is not logged in
- Cart is empty

#### Steps:

**Phase 1: Authentication**
1. Navigate to home page (`/`)
2. Click "Sign In" button in navigation bar
3. Verify redirect to login page (`/login`)
4. Enter username: `standard_user`
5. Enter password: `standard123`
6. Click "Sign In" button
7. Verify redirect to catalog page (`/catalog`)
8. Verify "Logout" button is visible in navigation
9. Verify username is displayed in navigation

**Phase 2: Product Selection**
10. Wait for product cards to load on catalog page
11. Verify at least one product is displayed
12. Click "Add" button on first available product
13. Wait for button to change to "In Cart"
14. Verify cart badge in navigation shows "1"
15. Click on a product card to view details
16. Verify product detail page loads with product information
17. Click "Add to Cart" button on product detail page
18. Verify cart badge updates to "2"

**Phase 3: Cart Review**
19. Click cart icon in navigation bar
20. Verify navigation to cart page (`/cart`)
21. Verify 2 items are displayed in cart
22. Verify each item shows:
    - Product name
    - Product price
    - Quantity selector
    - Remove button
23. Verify cart total is calculated correctly
24. Verify "Proceed to Checkout" button is visible and enabled

**Phase 4: Checkout**
25. Click "Proceed to Checkout" button
26. Verify navigation to checkout page (`/checkout`)
27. Verify checkout form is displayed with shipping and payment sections

**Phase 5: Shipping Information**
28. Fill First Name: `John`
29. Fill Last Name: `Doe`
30. Fill Address: `123 Main Street, City, ST 12345`
31. Verify shipping section shows no validation errors

**Phase 6: Payment Information**
32. Fill Card Number: `4242424242424242`
33. Fill Expiry Date: `12/26`
34. Fill CVV: `123`
35. Fill Cardholder Name: `John Doe`
36. Verify payment section shows no validation errors
37. Verify "Place Order" button is visible and enabled

**Phase 7: Order Confirmation**
38. Click "Place Order" button
39. Wait for navigation to order confirmation page (`/orders/{orderId}`)
40. Verify "Order Confirmed!" or similar success heading is displayed
41. Verify order ID is displayed
42. Verify order details match cart contents
43. Verify order total matches checkout total

**Phase 8: Post-Order Verification**
44. Navigate to cart via navbar
45. Verify cart is empty (badge shows 0 or no badge)
46. Navigate to orders page via navbar or user menu
47. Verify newly placed order appears in order history

**Expected Results:**
- User successfully logs in and sees catalog
- Products can be added to cart from both catalog and product detail pages
- Cart accurately reflects added items with correct totals
- Checkout form accepts valid shipping and payment information
- Order is successfully placed and confirmed
- Order appears in user's order history
- Cart is cleared after successful order

---

### 2. Multi-Product Purchase with Quantity Changes

**Seed:** tests/seed.spec.ts
**Priority:** P1
**Tags:** @e2e @p1

#### Preconditions:
- User logged in as `standard_user`
- Cart is empty

#### Steps:

**Phase 1: Add Multiple Products**
1. Navigate to catalog page
2. Add first product to cart
3. Add second product to cart
4. Add third product to cart
5. Verify cart badge shows "3"

**Phase 2: Modify Cart Quantities**
6. Navigate to cart page
7. Increase quantity of first product to 2
8. Verify cart total updates
9. Decrease quantity of second product (if > 1) or remove it
10. Verify cart updates accordingly
11. Verify final cart count and total are correct

**Phase 3: Complete Checkout**
12. Proceed to checkout
13. Fill valid shipping information
14. Fill valid payment information
15. Place order
16. Verify order confirmation with correct items and quantities

**Expected Results:**
- Multiple products can be added to cart
- Quantity modifications update totals correctly
- Order reflects final cart state after modifications

---

### 3. Resume Interrupted Checkout

**Seed:** tests/seed.spec.ts
**Priority:** P2
**Tags:** @e2e @p2

#### Preconditions:
- User logged in as `standard_user`
- Products in cart

#### Steps:

1. Navigate to checkout page with items in cart
2. Fill partial shipping information (First Name, Last Name only)
3. Navigate away to catalog page (simulate interruption)
4. Add another product to cart
5. Return to checkout via cart page
6. Verify previously entered shipping information is retained OR form is reset
7. Complete remaining checkout fields
8. Place order successfully

**Expected Results:**
- Cart contents persist during checkout interruption
- User can return and complete checkout
- New items added during interruption are included in order

---

### 4. Order Verification from Order History

**Seed:** tests/seed.spec.ts
**Priority:** P2
**Tags:** @e2e @p2

#### Preconditions:
- User logged in as `standard_user`
- At least one previous order exists

#### Steps:

1. Navigate to orders page (`/orders`)
2. Verify orders list is displayed
3. Click on most recent order
4. Verify order detail page loads (`/orders/{orderId}`)
5. Verify order shows:
    - Order ID
    - Order date
    - Order status
    - Item list with names, quantities, prices
    - Shipping information
    - Order total
6. Navigate back to orders list
7. Verify all orders are still listed

**Expected Results:**
- Order history displays all user orders
- Individual order details are accessible and accurate
- Navigation between orders list and details works correctly

---

### 5. Admin Order Verification

**Seed:** tests/seed.spec.ts
**Priority:** P2
**Tags:** @e2e @p2 @admin

#### Preconditions:
- Standard user has placed an order (from scenario 1)
- Admin user credentials available

#### Steps:

**Phase 1: Admin Login**
1. Log out if currently logged in
2. Log in as `admin_user` / `admin123`
3. Verify admin navigation link is visible

**Phase 2: Verify Order in Admin Dashboard**
4. Navigate to admin dashboard (`/admin`)
5. Click on "Orders" tab
6. Verify orders list is displayed
7. Search or filter for the order placed by standard user
8. Verify order appears with correct:
    - Order ID
    - Customer username
    - Order total
    - Order status

**Expected Results:**
- Admin can access order management
- Orders from all users are visible to admin
- Order details match what customer sees

---

### 6. Edge Case: Session Persistence Across Pages

**Seed:** tests/seed.spec.ts
**Priority:** P2
**Tags:** @e2e @p2

#### Steps:

1. Log in as `standard_user`
2. Add product to cart
3. Navigate to catalog page
4. Navigate to product detail page
5. Navigate to cart page
6. Navigate to orders page
7. Navigate back to catalog page
8. Verify user is still logged in at each step
9. Verify cart badge shows correct count at each step
10. Complete checkout
11. Verify order is placed successfully

**Expected Results:**
- Session persists across all page navigations
- Cart state is maintained throughout navigation
- Checkout completes successfully after multiple navigations

---

## Test Data

### Shipping Information
```
First Name: John
Last Name: Doe
Address: 123 Main Street, City, ST 12345
```

### Payment Information
```
Card Number: 4242424242424242 (Test Visa)
Expiry: 12/26
CVV: 123
Cardholder: John Doe
```

## Page Objects Used

| Page Object | File | Usage |
|-------------|------|-------|
| LoginPage | src/pages/LoginPage.ts | Authentication |
| HomePage | src/pages/HomePage.ts | Landing page |
| CatalogPage | src/pages/CatalogPage.ts | Product listing |
| ProductDetailPage | src/pages/ProductDetailPage.ts | Single product view |
| CartPage | src/pages/CartPage.ts | Shopping cart |
| CheckoutPage | src/pages/CheckoutPage.ts | Checkout form |
| OrdersPage | src/pages/OrdersPage.ts | Order history |
| OrderDetailPage | src/pages/OrderDetailPage.ts | Single order view |
| AdminPage | src/pages/AdminPage.ts | Admin dashboard |
| NavBar | src/components/NavBar.ts | Navigation component |

## Fixtures Required

```typescript
import { test, expect } from '../src/fixtures/pomFixtures';
import { STANDARD_USER, ADMIN_USER } from '../src/test-data';
import { VALID_SHIPPING, VALID_PAYMENT } from '../src/test-data/checkout';
```

## Assertions Checklist

| Assertion | Type | Description |
|-----------|------|-------------|
| URL verification | `toHaveURL()` | Confirm navigation to correct pages |
| Element visibility | `toBeVisible()` | Verify key elements are displayed |
| Cart badge count | `toContainText()` | Verify cart item count |
| Form validation | `toHaveValue()` | Verify form field values |
| Order confirmation | `toContainText()` | Verify success message |
| Button state | `toBeEnabled()` | Verify buttons are actionable |

## Notes

- All tests should use `test.step()` for clear reporting
- Avoid `waitForTimeout()` - use web-first assertions
- Use `getByRole()` and `getByLabel()` for locators
- Cart state may be cleared on page reload (client-side state)
- Use NavBar navigation instead of direct `goto()` when preserving cart state
