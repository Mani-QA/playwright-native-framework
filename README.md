# QADemo Playwright Automation Framework

A production-ready Playwright native automation framework for the [QADemo](https://qademo.com) e-commerce application. It is written in TypeScript and uses the Page Object Model with fixtures.

The suite covers signup and login, shopping, admin, the REST API, and the store's [WebMCP](https://playwright.dev/docs/api/class-webmcp) tools. Playwright results, including failure screenshots, are published to the existing [Qase run](https://app.qase.io/run/QADEMO/dashboard/1).

## Table of Contents

- [Why This Framework?](#why-this-framework)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
  - [Page Object Model (POM)](#page-object-model-pom)
  - [Custom Fixtures](#custom-fixtures)
  - [Locator Strategy](#locator-strategy)
  - [Test Steps](#test-steps)
- [Accounts and Test Data](#accounts-and-test-data)
- [Running Tests](#running-tests)
- [Qase Test Management](#qase-test-management)
- [WebMCP Tests](#webmcp-tests)
- [CI/CD Integration](#cicd-integration)
- [Playwright Test Agents](#playwright-test-agents)
- [Best Practices](#best-practices)
- [AI Harness](#ai-harness)
- [Troubleshooting](#troubleshooting)

---

## Why This Framework?

This framework was built following strict automation standards to ensure:

| Principle | Implementation |
|-----------|----------------|
| **Maintainability** | Page Object Model separates test logic from page interactions |
| **Reliability** | Web-first assertions with auto-retry; no flaky `waitForTimeout()` |
| **Readability** | `test.step()` blocks create meaningful test reports |
| **Scalability** | Fixture-based dependency injection for clean test composition |
| **Shared customer** | Global setup signs up one shopper that cart, checkout, orders, and API tests reuse |
| **Qase** | Spec cases live in QADemo Automation and results stack on one run |
| **WebMCP** | Chromium calls the store tools the page registers for agents |
| **CI/CD Ready** | Four GitHub Actions shards, one HTML report, and a Qase link |

### What Makes This Different?

❌ **Anti-patterns we avoid:**
- No manual `page.waitForTimeout(5000)` – causes flaky tests
- No `page.waitForLoadState('networkidle')` – unreliable in modern SPAs
- No fragile CSS selectors (`.btn-primary`) or XPaths (`//div/span[2]`)
- No `new PageObject(page)` in tests – fixtures handle instantiation

✅ **Best practices we follow:**
- User-facing locators (`getByRole`, `getByLabel`, `getByPlaceholder`)
- Web-first assertions that auto-retry (`expect(locator).toBeVisible()`)
- Page Objects injected via fixtures for clean test code
- `test.step()` for better test organization and reporting

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Test Specs                               │
│  (auth.spec.ts, cart.spec.ts, checkout.spec.ts, etc.)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Custom Fixtures                             │
│  (pomFixtures.ts - Dependency Injection Layer)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Page Objects & Components                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  LoginPage  │  │ CatalogPage │  │  CartPage   │  ...        │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   NavBar    │  │   Footer    │  (Shared Components)          │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Test Data                                   │
│  (signed-up customer, seeded users, checkout data)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Global setup and Qase                              │
│  Create the shared customer, then download the Qase case map   │
└─────────────────────────────────────────────────────────────────┘
```

Global setup runs before any project. It creates the shared customer, then downloads the Qase case map when a token is present. Each spec imports `test` from `pomFixtures`, which links the test to that case. WebMCP tests call `page.webmcp` on the same Chromium browser the rest of the suite uses.

---

## Project Structure

```
playwright-native-framework/
├── src/
│   ├── components/          # Reusable UI components (NavBar, Footer)
│   │   ├── NavBar.ts
│   │   └── Footer.ts
│   │
│   ├── fixtures/            # Custom Playwright fixtures
│   │   └── pomFixtures.ts   # Page objects and the Qase case link
│   │
│   ├── pages/               # Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── SignupPage.ts
│   │   ├── HomePage.ts
│   │   ├── CatalogPage.ts
│   │   ├── ProductDetailPage.ts
│   │   ├── CartPage.ts
│   │   ├── CheckoutPage.ts
│   │   ├── OrdersPage.ts
│   │   ├── OrderDetailPage.ts
│   │   └── AdminPage.ts
│   │
│   ├── qase/                # Token loading and the case-id map
│   │   ├── token.ts
│   │   └── sync-case-map.ts
│   │
│   ├── test-data/           # Test data and fixtures
│   │   ├── users.ts         # Seeded login accounts
│   │   ├── signedUpUser.ts  # Shared customer created at startup
│   │   ├── checkout.ts      # Checkout form data
│   │   └── index.ts         # Barrel export
│   │
│   └── utils/               # Helper utilities
│       ├── helpers.ts
│       └── webmcp.ts        # Store WebMCP tool calls
│
├── tests/                   # Test specifications
│   ├── auth.setup.ts        # Customer and admin sign-in
│   ├── auth.spec.ts         # Login and signup tests
│   ├── catalog.spec.ts      # Product catalog tests
│   ├── cart.spec.ts         # Shopping cart tests
│   ├── checkout.spec.ts     # Checkout flow tests
│   ├── orders.spec.ts       # Order management tests
│   ├── admin.spec.ts        # Admin dashboard tests
│   ├── navigation.spec.ts   # Navigation and layout tests
│   ├── api.spec.ts          # REST API tests
│   ├── webmcp.spec.ts       # WebMCP store-tool tests
│   └── seed.spec.ts         # Agent exploration seed
│
├── docs/
│   └── skills/adding-qademo-tests/   # How to add a spec and publish it to Qase
├── global-setup.ts          # Shared customer and Qase case map
├── playwright.config.ts     # Projects, reporters, WebMCP launch flag
├── eslint.config.mjs        # ESLint flat config
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 22.13 or newer. GitHub Actions installs Node.js 24.
- npm

Playwright 1.64 runs on Node.js 20 or newer. ESLint 10 needs Node.js 20.19, 22.13, or 24 and above, so 22.13 is the practical local minimum.

### Installation

```bash
git clone https://github.com/Mani-QA/playwright-native-framework.git
cd playwright-native-framework

npm install
npx playwright install chromium
```

To publish results locally, add `QASEToken` to a `.env` file in this directory or in the parent directory. The token is read at startup and is never printed. See [Qase Test Management](#qase-test-management).

### Quick Start

```bash
# Run all tests
npm test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# View HTML report
npm run report
```

---

## Core Concepts

### Page Object Model (POM)

Each page in the application has a corresponding Page Object class that encapsulates:

1. **Locators** - Element selectors defined as class properties
2. **Actions** - Methods that perform user interactions
3. **Getters** - Methods that retrieve element state or data

**Example: LoginPage.ts**

```typescript
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // User-facing locators for reliability
    this.usernameInput = page.getByRole('textbox', { name: 'Username or email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
    this.signInButton = page.getByRole('main').getByRole('button', { name: /^Sign in$/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
```

**Key Design Decisions:**

| Decision | Rationale |
|----------|-----------|
| Locators as `readonly` properties | Defined once in constructor, reused everywhere |
| Methods return `Promise<void>` | Actions don't contain assertions (assertions in specs) |
| `goto()` method per page | Standard navigation pattern |

### Custom Fixtures

Instead of manually instantiating Page Objects in tests, we use Playwright's fixture system for **dependency injection**:

**Why Fixtures?**

```typescript
// ❌ BAD: Manual instantiation in tests
test('login test', async ({ page }) => {
  const loginPage = new LoginPage(page);  // Repeated in every test
  const homePage = new HomePage(page);
  // ...
});

// ✅ GOOD: Fixture injection
test('login test', async ({ loginPage, homePage }) => {
  // Page Objects are automatically instantiated and available
});
```

**How it works (`pomFixtures.ts`):**

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type PageFixtures = {
  loginPage: LoginPage;
  // ... other page objects
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
```

**Benefits:**
- Cleaner test code
- Consistent Page Object instantiation
- Automatic cleanup
- TypeScript type safety

### Locator Strategy

We follow a strict priority order for locators:

| Priority | Locator Type | Example | When to Use |
|----------|-------------|---------|-------------|
| 1️⃣ | Role-based | `getByRole('button', { name: 'Submit' })` | Buttons, links, headings, inputs |
| 2️⃣ | Label-based | `getByLabel('Email')` | Form inputs with labels |
| 3️⃣ | Placeholder | `getByPlaceholder('Search...')` | Inputs with placeholder text |
| 4️⃣ | Text content | `getByText('Welcome')` | Static text elements |
| 5️⃣ | Test ID | `getByTestId('submit-btn')` | When semantic locators fail |

**Forbidden Locators:**
- ❌ CSS classes: `.btn-primary`, `.form-control`
- ❌ XPath: `//div[@class='container']/span[2]`
- ❌ Generic IDs: `#submit-button`
- ❌ `.first()` or `.nth(0)` to suppress strict mode – fix the locator instead

### Test Steps

All tests use `test.step()` to create readable, organized test reports:

```typescript
test('complete checkout flow', async ({ catalogPage, cartPage, checkoutPage }) => {
  await test.step('Add product to cart', async () => {
    await catalogPage.goto();
    await catalogPage.addToCart('Wireless Headphones');
  });

  await test.step('Navigate to checkout', async () => {
    await cartPage.goto();
    await cartPage.clickProceedToCheckout();
  });

  await test.step('Complete payment', async () => {
    await checkoutPage.fillCheckoutForm(shippingData, paymentData);
    await checkoutPage.clickPlaceOrder();
  });

  await test.step('Verify order confirmation', async () => {
    await expect(page).toHaveURL(/orders\/\d+/);
  });
});
```

**Benefits:**
- Visual test organization in HTML reports
- Clear failure identification
- Self-documenting tests

---

## Accounts and Test Data

Call `loadSignedUpUser()` inside a test or step. Reading it at import time fails, because global setup has not written the file yet.

| Flow | Account | How to use it |
|---|---|---|
| Cart, checkout, orders, signed-in navigation, API shopper flow | Shared customer | `loadSignedUpUser()` |
| Seeded username login (`FR-AUTH-002`) | `standard_user` / `standard123` | `STANDARD_USER` |
| Locked login | `locked_user` / `locked123` | `LOCKED_USER` |
| Admin | `admin_user` | `ADMIN_USER`. Password is `$Admin` plus the local date as `DDMMYYYY` |
| Signup form | A new visitor | `createSignupAccount()`. This does not replace `customer.json` |
| WebMCP shopping tools | A new visitor | `createSignupAccount()` inside the WebMCP spec |

Global setup sends `POST /api/auth/signup` with email, phone, username, and password, then saves the account to `playwright/.auth/customer.json`. That file is gitignored. The signup password is `NewUser1!` (8 characters, an uppercase letter, and a number). Login accepts the username or the email.

The signup specs register their own visitors so they can exercise the form. Google sign-in is on the login page and is left for a person to complete.

One customer has one cart. Parallel tests that sign in as the shared customer share that cart. WebMCP tests that add items or place orders create their own account for that reason.

Checkout data lives in `src/test-data/checkout.ts`. The published test card is `4242424242424242`. WebMCP order calls build an expiry that stays in the future. The UI checkout tests use `VALID_PAYMENT` from that file.

```typescript
export const VALID_SHIPPING = {
  firstName: 'John',
  lastName: 'Doe',
  address: '123 Test Street, Test City, TC 12345',
};

export const VALID_PAYMENT = {
  cardNumber: '4242424242424242',
  expiryDate: '12/26',
  cvv: '123',
  cardholderName: 'John Doe',
};
```

---

## Running Tests

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run `@p1`, `@p2`, `@agent`, and `@API` tests |
| `npm run test:all` | Run `@p1` through `@p4` |
| `npm run test:p1` / `test:p2` / `test:p1p2` | Run one priority, or p1 and p2 together |
| `npm run test:p3` / `test:p4` | Run the lower-priority specs |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:debug` | Debug with the inspector |
| `npm run test:auth` | Authentication and signup specs |
| `npm run test:catalog` | Catalog specs |
| `npm run test:cart` | Cart specs |
| `npm run test:checkout` | Checkout specs |
| `npm run test:orders` | Order specs |
| `npm run test:admin` | Admin specs |
| `npm run test:api` | REST API specs |
| `npm test -- tests/webmcp.spec.ts` | WebMCP specs |
| `npm run report` | Open the HTML report |
| `npm run lint` | Run ESLint |
| `npm run codegen` | Launch Playwright codegen against qademo.com |

`npm test` uses the grep in `playwright.config.ts`: `/@p1|@p2|@agent|@API/`. A CLI `--grep` replaces that filter. API tests are tagged `@API` and `@p1` or `@p2`, so they are included in the default run. `@p3` and `@p4` stay out of `npm test` and out of the GitHub Actions shards.

### Browser Selection

The active project is Chromium. Firefox, WebKit, and the mobile projects are present in `playwright.config.ts` as comments. Chromium launches with `--enable-features=WebMCP` so the store tools are visible to `page.webmcp`.

```bash
npm test -- --project=chromium
```

### Filtering Tests

```bash
# Run by test title
npm test -- --grep "login"

# Run by file
npm test -- tests/auth.spec.ts

# Run specific test
npm test -- --grep "should redirect to catalog"

# Run by tag
npm test -- --grep "@p1"      # Priority 1 tests only
npm test -- --grep "@API"     # API tests only
```

### API Testing 🚀

`tests/api.spec.ts` drives the QADemo REST API with Playwright's `request` context. The shopper flow signs in as the shared customer. The admin flow signs in as `admin_user`. The file runs in serial mode so the token, cart session, and order id carry from one test to the next.

#### Test Coverage

**Standard User Flow (@API @p1):**
1. ✅ Login as Standard User and save access token
2. ✅ Check availability of Product 1
3. ✅ Add Product 1 to Cart
4. ✅ Increase quantity to 2
5. ✅ Place Order
6. ✅ Check availability after order (stock reduced by 2)
7. ✅ Check Order Status

**Admin Operations (@API @p2):**
8. ✅ Login as Admin User
9. ✅ Update Order status to processing
10. ✅ Update Product 1 stock to 100
11. ✅ Verify stock is updated to 100

#### Key Features

- ✅ **Bearer Token Authentication** - Uses JWT tokens (NOT Base64 Basic Auth)
- ✅ **Serial Execution** - Tests run sequentially to maintain shared state
- ✅ **Comprehensive Validations** - HTTP status, response structure, business logic
- ✅ **State Management** - Shared tokens, session ID, order ID across tests
- ✅ **CI/CD Ready** - Auto-included in default test runs

#### API Endpoints Tested

**Authentication:** `POST /api/auth/login`  
**Public:** `GET /api/products/id/:id`  
**Cart:** `POST /api/cart/items`, `PATCH /api/cart/items/:id`, `GET /api/cart`  
**Orders:** `POST /api/orders`, `GET /api/orders/:id`  
**Admin:** `PATCH /api/admin/orders/:id/status`, `PATCH /api/admin/products/:id/stock`, `GET /api/admin/products`

#### Running API Tests

```bash
# Run all API tests (11 tests, ~14 seconds)
npm run test:api

# Run with @API tag
npm test -- --grep="@API"

# Run by priority
npm test -- --grep="@API.*@p1"  # Standard user flow (7 tests)
npm test -- --grep="@API.*@p2"  # Admin operations (4 tests)

# View report
npm run report
```

#### Test Structure Example

```typescript
test.describe.configure({ mode: 'serial' });

test.describe('API Testing - E2E Order Flow', () => {
  const baseURL = 'https://qademo.com/api';
  let standardUserToken: string;
  let sessionId: string;
  let orderId: number;

  test.beforeAll(() => {
    sessionId = randomUUID();
  });

  test('Login as Standard User', async ({ request }) => {
    await test.step('Login with the signed-up customer', async () => {
      const customer = loadSignedUpUser();
      const loginResponse = await request.post(`${baseURL}/auth/login`, {
        data: {
          username: customer.username,
          password: customer.password,
        },
      });
      
      expect(loginResponse.ok()).toBeTruthy();
      expect(loginResponse.status()).toBe(200);
      
      const responseBody = await loginResponse.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveProperty('accessToken');
      
      standardUserToken = responseBody.data.accessToken;
    });
  });
  
  test('Place Order', async ({ request }) => {
    await test.step('Create order with cart items', async () => {
      const orderResponse = await request.post(`${baseURL}/orders`, {
        headers: {
          'Authorization': `Bearer ${standardUserToken}`,
          'X-Session-ID': sessionId,
          'Content-Type': 'application/json',
        },
        data: {
          shipping: { /* ... */ },
          payment: { /* ... */ }
        },
      });
      
      expect(orderResponse.status()).toBe(201);
      const responseBody = await orderResponse.json();
      orderId = responseBody.data.id;
    });
  });
});
```

#### Validation Examples

```typescript
// Login validation
expect(loginResponse.ok()).toBeTruthy();
expect(loginResponse.status()).toBe(200);
expect(responseBody.data.user.userType).toBe('standard');

// Product availability
expect(responseBody.data.stock).toBeGreaterThanOrEqual(0);
expect(responseBody.data).toHaveProperty('isActive');

// Order creation
expect(orderResponse.status()).toBe(201);
expect(responseBody.data.status).toBe('pending');
expect(responseBody.data).toHaveProperty('id');

// Admin operations
expect(updateStatusResponse.ok()).toBeTruthy();
expect(responseBody.data.status).toBe('processing');
```

#### Important Notes

- **Shopper:** The standard-user API flow signs in as the shared customer from global setup
- **Admin:** Admin API calls sign in as `admin_user` with the date-based password
- **Authentication:** Tests use JWT Bearer tokens from the login API
- **Session Management:** Unique UUID session ID per test run for cart operations
- **Stock Updates:** May be asynchronous; the admin API provides the stock value the tests assert
- **Serial Mode:** The file runs in serial mode so the token, session, and order id stay in order
- **Test Data:** Uses Product ID 1 and test card 4242424242424242

#### Example run

A full API file looks like this when the shared customer and admin login both succeed:

```
✓ Login as Standard User and save access token (1.0s)
✓ Check availability of Product 1 (71ms)
✓ Add Product 1 to Cart (1.5s)
✓ Increase quantity to 2 (971ms)
✓ Place Order (1.7s)
✓ Check availability after order (1.1s)
✓ Check Order Status (636ms)
✓ Login as Admin User (654ms)
✓ Update Order status to processing (1.0s)
✓ Update Product stock to 100 (526ms)
✓ Verify stock is updated (1.3s)
```

---

## Qase Test Management

Results go to the Qase project **QADEMO**, [run 1](https://app.qase.io/run/QADEMO/dashboard/1). A local run and every GitHub Actions shard add results to that same run. The reporter is configured with `complete: false`, so a pipeline does not open a new run and does not close run 1.

### Suites

| Suite | What it holds |
|---|---|
| eCommerce | Manual cases from `docs/e2e-test-cases.csv` |
| QADemo Automation | One automated case for each `test()` in `tests/*.spec.ts`, except `seed.spec.ts` and `*.setup.ts` |

### How a result finds its case

The case title is `{FR-ID}: {test title}`. The requirement id comes from the nearest `test.describe` title, for example `@p1 FR-MCP-001: Registered store tools`.

Global setup downloads those titles into `playwright/.cache/qase-case-map.json`. The `qaseCase` fixture then calls `qase.id()` for a match. Seed tests, setup tests, and any title that is not in the suite still run. Their results are omitted from the run.

Failed tests upload the Playwright screenshot. `screenshot: 'only-on-failure'` and the reporter's `uploadAttachments` setting do that work.

### Token

Put the token in one of these places:

| Location | Name |
|---|---|
| `.env` in this directory, or the parent directory | `QASEToken` |
| Environment variable | `QASE_TESTOPS_API_TOKEN` or `QASE_API_TOKEN` |
| GitHub Actions secret | `QASE_API_TOKEN` |

The request header is `Token`, sent to `https://api.qase.io/v1`. Do not commit the token, print it, or write it into a spec.

### Publishing a new spec

After you add a test, publish its case before you expect a result in run 1:

```bash
node docs/skills/adding-qademo-tests/scripts/push-spec-cases.mjs
```

A dry run parses the specs and does not call Qase:

```bash
node docs/skills/adding-qademo-tests/scripts/push-spec-cases.mjs --dry-run
```

The script creates the QADemo Automation suite when it is missing and skips a title that is already there. New cases are automated (`automation: 2`, `isManual: 0`). Renaming a test leaves the old case in place, so update that case instead of publishing a second one.

`docs/skills/adding-qademo-tests/SKILL.md` is the guide for adding a spec, choosing an account, and publishing the case.

### What you see in GitHub Actions

The test shards upload the results while Playwright is running. The **Publish results to Qase** job then adds a summary link and a clickable environment URL to the same run, so a viewer can open the report from the workflow graph.

---

## WebMCP Tests

QADemo registers store tools on `document.modelContext` so an agent can search, sign in, change the cart, and place an order without clicking the page. Playwright 1.64 exposes those tools as [`page.webmcp`](https://playwright.dev/docs/api/class-webmcp).

Chromium needs the launch flag `--enable-features=WebMCP`. The Chromium project sets that flag. Without it, `page.webmcp.tools()` throws.

`tests/webmcp.spec.ts` checks that the tools are present and that a real shopper flow works through them:

| Case | Check |
|---|---|
| FR-MCP-001 | The store tools are registered, with read-only and consequential hints |
| FR-MCP-002 | Search and load Wireless Headphones |
| FR-MCP-003 | Create an account, add the headphones, place an order, and open the order page |
| FR-MCP-004 | Invalid sign-in, invalid signup, and a guest order list are rejected |
| FR-MCP-005 | Change a quantity, clear the cart, and refuse an empty checkout |
| FR-MCP-006 | `open_page` opens the catalog and the product page in the browser |
| FR-MCP-007 | An unknown tool name is rejected |

A tool that rejects the input returns `{ ok: false, error: { code, message } }`. An unknown name throws, because Playwright never reaches an `execute` function. Shopping tools create a fresh visitor with `createSignupAccount()` so they do not change the shared customer's cart.

```bash
npm test -- tests/webmcp.spec.ts --project=chromium
```

`src/utils/webmcp.ts` wraps `page.webmcp.callTool` and reads the order id from a successful `place_order` result.

---

## CI/CD Integration

### GitHub Actions

`.github/workflows/playwright.yml` runs on push and pull request to `main` or `master`, every day at 06:00 UTC, and on manual dispatch. A push or pull request that only changes Markdown files does not start it. It installs Node.js 24 and runs four Chromium shards:

```bash
npx playwright test --project=chromium --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

Each shard receives `QASE_TESTOPS_RUN_ID=1` and `QASE_TESTOPS_RUN_COMPLETE=false`, so all four shards write into [run 1](https://app.qase.io/run/QADEMO/dashboard/1). The secret name is `QASE_API_TOKEN`.

| Job | What it does |
|---|---|
| Shard 1–4 | Installs dependencies, caches Chromium, runs one quarter of the default grep, uploads a blob report |
| Publish results to Qase | Adds a workflow summary and an environment link to run 1 |
| Merge Playwright Reports | Merges the four blob reports into one HTML report |
| Deploy Report to GitHub Pages | Publishes that HTML report on pushes that are not pull requests |

Actions use the Node.js 24 releases: `checkout` v7, `setup-node` v7, `cache` v6, `upload-artifact` v7, `download-artifact` v8, `configure-pages` v6, `upload-pages-artifact` v5, and `deploy-pages` v5.

### GitHub Pages test reports

After a push to `main` or `master`, the deploy job publishes the merged HTML report. The report includes pass and fail details, screenshots, traces, and video from failed tests.

1. Open repository **Settings** → **Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or `master`.

The deployed URL is the environment link on the **Deploy Report to GitHub Pages** job. Setup notes are in [docs/github-pages-setup.md](docs/github-pages-setup.md).

### Authentication during a run

Global setup creates the shared customer and writes `playwright/.auth/customer.json`. Cart, checkout, order, signed-in navigation, and the API shopper tests call `loadSignedUpUser()` and sign in themselves.

`auth.setup.ts` also signs in as that customer and as `admin_user`, then saves storage state under `playwright/.auth/`. The Chromium project does not load that storage state, so a guest test starts signed out. The admin password is `$Admin` plus the runner's local date as `DDMMYYYY`. GitHub-hosted Ubuntu uses UTC.

---

## AI Harness

The AI Harness reads a Qase case, fills missing steps from the product requirements, reuses the current page objects, adds the spec, runs it, and opens a pull request. Setup, secrets, and the GitHub Actions workflow are in [docs/ai-harness-getting-started.md](docs/ai-harness-getting-started.md).

```bash
npm run harness -- --case 91 --dry-run
```

## Playwright Test Agents

This framework integrates with [Playwright Test Agents](https://playwright.dev/docs/test-agents), AI-powered tools that help with test planning, generation, and automatic repair.

### What Are Test Agents?

| Agent | Purpose | Output |
|-------|---------|--------|
| **Planner** | Explores app and creates test plans | Markdown specs in `specs/` |
| **Generator** | Converts specs to executable tests | Test files in `tests/` |
| **Healer** | Automatically fixes failing tests | Updated test code |

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  🎭 Planner     │───▶│  🎭 Generator   │───▶│  🎭 Healer      │
│                 │    │                 │    │                 │
│ Explore app     │    │ Create tests    │    │ Fix failures    │
│ Create specs    │    │ from specs      │    │ Auto-repair     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
   specs/*.md            tests/*.spec.ts       Fixed tests
```

### Setup

Agent definitions are located in `.github/agents/`:
- `playwright-test-planner.agent.md`
- `playwright-test-generator.agent.md`
- `playwright-test-healer.agent.md`

MCP configuration is in `.vscode/mcp.json`.

### Using Agents in Cursor

#### 1. Planner Agent

Create test plans by exploring the application:

```
@planner Create a test plan for the user registration flow
```

Include the seed test for context:
```
@planner Using tests/seed.spec.ts as reference, create a plan for admin dashboard tests
```

Output: Markdown file in `specs/` directory

#### 2. Generator Agent

Generate executable tests from specs:

```
@generator Create tests from specs/checkout-flow.md
```

The generator will:
- Use your existing fixtures from `pomFixtures.ts`
- Follow your locator strategy (getByRole, getByLabel, etc.)
- Apply `test.step()` for organization

#### 3. Healer Agent

Automatically fix failing tests:

```
@healer Fix the failing test in tests/cart.spec.ts
```

The healer will:
- Analyze the failure
- Inspect current UI elements
- Update locators or add waits
- Re-run until passing

### Directory Structure

```
specs/                           # Test plans (human-readable)
├── README.md                    # Spec format documentation
└── checkout-flow.md             # Example test plan

tests/
├── seed.spec.ts                 # Seed test for agent exploration
└── *.spec.ts                    # Generated and existing tests

.github/agents/                  # Agent definitions
├── playwright-test-planner.agent.md
├── playwright-test-generator.agent.md
└── playwright-test-healer.agent.md
```

### Seed Test

The `tests/seed.spec.ts` file provides the base environment for agents:

```typescript
import { test, expect } from '../src/fixtures/pomFixtures';

test.describe('Seed Tests for Agent Exploration', () => {
  test('seed - authenticated exploration', async ({
    loginPage, catalogPage, cartPage, navBar,
  }) => {
    // Demonstrates fixtures, POM pattern, and common flows
    // Agents use this as a reference for generated tests
  });
});
```

### Agent Commands

| Command | Description |
|---------|-------------|
| `npm run agent:init` | Regenerate agent definitions |
| `npm run agent:seed` | Run seed tests |
| `npm run agent:mcp` | Start MCP server manually |

### Best Practices for Agents

1. **Keep seed tests up-to-date** - Agents reference seed tests for patterns
2. **Write detailed specs** - More detail = better generated tests
3. **Review generated tests** - Always verify before committing
4. **Use healer incrementally** - Fix one test at a time

---

## Best Practices

### DO ✅

```typescript
// Use web-first assertions (auto-retry)
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Welcome');

// Use user-facing locators
page.getByRole('button', { name: 'Submit' });
page.getByLabel('Email Address');

// Wait for specific elements
await element.waitFor({ state: 'visible' });

// Use test.step() for organization
await test.step('Fill login form', async () => { ... });
```

### DON'T ❌

```typescript
// Avoid arbitrary waits
await page.waitForTimeout(5000);  // NEVER DO THIS

// Avoid networkidle
await page.waitForLoadState('networkidle');  // Flaky

// Avoid fragile selectors
page.locator('.btn-primary');  // May break on style changes
page.locator('//div/span[2]');  // Brittle XPath

// Avoid suppressing strict mode
page.locator('button').first();  // Fix the locator instead
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `strict mode violation` | Locator matches multiple elements | Make the locator more specific with a role, name, or scope |
| `Timeout waiting for element` | Element not loaded | Wait for the element with `waitFor()` |
| `Navigation timeout` | Slow page load | Increase `navigationTimeout` in the config |
| `Element not visible` | Element hidden or off-screen | Scroll to the element or check the visibility condition |
| Admin setup stays on `/login` | The admin password uses the machine's local date | On a runner, that date is UTC. Locally it follows your timezone |
| `No WebMCP tool` or `tools()` throws | Chromium was launched without the WebMCP flag | Run the `chromium` project. Its launch args include `--enable-features=WebMCP` |
| A new spec is missing from Qase | The case title is not in QADemo Automation yet | Run the push script, then run the spec again |
| Qase has no result for a passing test | The token is missing, or the title does not match `{FR-ID}: {test title}` | Set `QASEToken` and keep the describe id plus the `test()` title unchanged |

### Debugging Tips

1. **Use UI Mode**: `npm run test:ui` for interactive debugging
2. **Use Debug Mode**: `npm run test:debug` for step-by-step execution
3. **Check Screenshots**: Failed tests save screenshots in `test-results/`
4. **View Traces**: Enable traces in config and view with `npx playwright show-trace`
5. **Use Codegen**: `npm run codegen` to generate locators interactively

### Viewing Reports

```bash
# Generate and open HTML report
npm run report
```

The report shows:
- Test pass/fail status
- Test steps with timing
- Screenshots on failure
- Video recordings (if enabled)
- Trace viewer links

---

## Contributing

1. Follow the coding standards in `docs/playwright-standards.md`
2. Use the locator priority guide in `docs/playwright-guide.md`
3. All tests must use `test.step()` for readability
4. Page Objects must not contain assertions
5. Run `npm run lint` before committing

---

## License

ISC

---

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright WebMCP](https://playwright.dev/docs/api/class-webmcp)
- [Qase API](https://developers.qase.io/reference/introduction-to-the-qase-api)
- [QADemo Automation run](https://app.qase.io/run/QADEMO/dashboard/1)
- [QADemo Application](https://qademo.com)

