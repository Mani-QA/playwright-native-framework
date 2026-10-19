# Product knowledge for gap filling

Read `docs/FRD-QADemo.md` before writing a spec. A Qase case is often shorter than the requirement. Add the missing setup and the validations below when the case touches that area. Keep the Qase title unchanged, and put the extra checks in additional `test.step()` blocks.

## Always

- Import `test` and `expect` from `src/fixtures/pomFixtures`.
- Reuse the page object and method already listed in `docs/kb/pom-index.md`. Add a method only when none of the existing methods perform that action. Leave an existing method's URL and locator unchanged.
- A new shopper uses `createSignupAccount()` as returned. When the case names shipping or a cardholder, submit and assert those values. The card number, expiry, and CVV come from `VALID_PAYMENT`. The order page shows that card's last four digits and hides the full number.
- A shared account whose case says the cart is empty is cleared before the first add. A stock check reloads the same product and compares it with the count recorded in that test.
- Assert with web-first matchers. Do not use `waitForTimeout` or `networkidle`.
- Tag the describe `@p1`, `@p2`, or `@p3` from the Qase priority (`1` high, `2` medium, `3` low).
- Field errors are text under the field. API failures use `role="alert"`.

## Authentication

A login case that only says "sign in" still needs:

1. Open `/login`.
2. Submit with the username or email and the password.
3. Assert the URL is `/catalog`, or the protected page that sent the shopper to login.
4. Assert the navbar shows the username (`/View orders for/i`).

Rejection cases stay on `/login` and show the alert text from the FRD: `Account is locked` or `Invalid username or password`.

Logout clears the session, lands on `/`, and shows navbar Sign in and Sign up.

A guest who opens `/checkout` or `/orders` is sent to `/login`. After a successful login, the original path is restored.

Signup requires a valid email, a phone number of at least 7 digits, and password `NewUser1!` (8 characters, one uppercase letter, one number). Confirm password must match. Success redirects to `/catalog` and shows the username. Duplicate email and duplicate username stay on `/signup` with the FRD messages. Empty fields show the required-field messages and do not navigate.

## Catalog and product

The home page shows a level-1 heading and a Shop Now or Browse Products link. The catalog heading is Product Catalog, and in-stock products can be added. An unknown slug shows a not-found state. Out-of-stock products cannot be added. After a successful add, the cart entry for that product is visible.

## Cart

An empty cart shows an empty state. A cart with a line shows the product name, quantity, and total. Increase and decrease change that quantity. Quantity does not go below 1 via the minus control. Remove deletes that line. Clear removes every line. Proceed to checkout requires a signed-in shopper and a non-empty cart. A guest is sent to login. An empty cart does not reach payment.

## Checkout

Required shipping fields are first name, last name, and address. The card number must pass the Luhn check. The published card is `4242424242424242`. Expiry is `MM/YY` in the future. CVV is 3 or 4 digits. Cardholder name is required. Empty or invalid payment stays on checkout and shows the field error. A valid submit creates an order and opens `/orders/<id>` with the order number, items, total, and shipping name.

## Orders

The orders list requires a signed-in shopper and shows the order just placed, including status and total. Opening a row shows the same id, items, and payment last four when the page renders them. Another shopper's id, or an unknown id, shows not found.

## Admin

A standard customer does not see Admin dashboard and cannot stay on `/admin`. An admin sees that link and the tabs Overview, Products, and Orders. Overview shows counts. Products lists inventory. Orders lists history. Stock and status changes assert the new value is visible.

## Navigation

The logo returns home. Products opens `/catalog`. The cart icon opens `/cart` and shows a count after an add. Guests see Sign in and Sign up. A signed-in shopper sees the username and Logout.

## WebMCP

Customer tools are registered on every page: `search_products`, `get_product`, `get_cart`, `add_to_cart`, `set_cart_quantity`, `clear_cart`, `get_session`, `sign_in`, `sign_out`, `create_account`, `list_orders`, `get_order`, `place_order`, `open_page`. A rejected tool returns `{ ok: false, error.code }`. An unknown tool name throws. `open_page` must also change the browser URL. `place_order` needs a signed-in shopper and a non-empty cart. Admin tools `get_store_stats`, `update_stock`, and `update_order_status` exist only for an admin session.

## API

Shopper calls use the shared customer's JWT from `POST /api/auth/login`. Admin calls use `admin_user`. Assert HTTP status, `success`, and the business field named in the case (token, stock, order id, or status).
