# QADemo Playwright Automation Framework

A production-ready, enterprise-grade Playwright automation framework for the [QADemo](https://qademo.com) e-commerce application. Built with TypeScript, this framework demonstrates modern test automation best practices using the Page Object Model (POM) pattern with dependency injection via custom fixtures.

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
- [Test Data Management](#test-data-management)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Playwright Test Agents](#playwright-test-agents)
- [Best Practices](#best-practices)
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
| **Cross-browser** | Multi-browser support (Chromium, Firefox, WebKit, Mobile) |
| **CI/CD Ready** | GitHub Actions workflows with sharding support |

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
│  (users.ts, checkout.ts - Centralized Test Data)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
playwright/
├── src/
│   ├── components/          # Reusable UI components (NavBar, Footer)
│   │   ├── NavBar.ts
│   │   └── Footer.ts
│   │
│   ├── fixtures/            # Custom Playwright fixtures
│   │   └── pomFixtures.ts   # Page Object injection
│   │
│   ├── pages/               # Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── HomePage.ts
│   │   ├── CatalogPage.ts
│   │   ├── ProductDetailPage.ts
│   │   ├── CartPage.ts
│   │   ├── CheckoutPage.ts
│   │   ├── OrdersPage.ts
│   │   ├── OrderDetailPage.ts
│   │   └── AdminPage.ts
│   │
│   ├── test-data/           # Test data and fixtures
│   │   ├── users.ts         # User credentials
│   │   ├── checkout.ts      # Checkout form data
│   │   └── index.ts         # Barrel export
│   │
│   └── utils/               # Helper utilities
│       └── helpers.ts
│
├── tests/                   # Test specifications
│   ├── auth.setup.ts        # Authentication setup (storage state)
│   ├── auth.spec.ts         # Authentication tests
│   ├── catalog.spec.ts      # Product catalog tests
│   ├── cart.spec.ts         # Shopping cart tests
│   ├── checkout.spec.ts     # Checkout flow tests
│   ├── orders.spec.ts       # Order management tests
│   ├── admin.spec.ts        # Admin dashboard tests
│   ├── navigation.spec.ts   # Navigation/layout tests
│   └── api.spec.ts          # REST API tests
│
├── playwright.config.ts     # Playwright configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/playwright-native-framework.git
cd playwright-native-framework

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

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
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('main').getByRole('button', { name: 'Sign In' });
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

## Test Data Management

### User Credentials (`src/test-data/users.ts`)

```typescript
export const STANDARD_USER = {
  username: 'standard_user',
  password: 'standard123',
  displayName: 'standard_user',
};

export const ADMIN_USER = {
  username: 'admin_user',
  password: 'admin123',
  displayName: 'admin_user',
};

export const LOCKED_USER = {
  username: 'locked_user',
  password: 'locked123',
};
```

### Checkout Data (`src/test-data/checkout.ts`)

```typescript
export const VALID_CHECKOUT_DATA = {
  shipping: {
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main Street, City, ST 12345',
  },
  payment: {
    cardNumber: '4242424242424242',  // Test card
    expiryDate: '12/28',
    cvv: '123',
    cardholderName: 'John Doe',
  },
};
```

---

## Running Tests

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests headlessly |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run test:headed` | Run with visible browser |
| `npm run test:debug` | Debug mode with inspector |
| `npm run test:auth` | Run authentication tests only |
| `npm run test:catalog` | Run catalog tests only |
| `npm run test:cart` | Run cart tests only |
| `npm run test:checkout` | Run checkout tests only |
| `npm run test:orders` | Run order tests only |
| `npm run test:admin` | Run admin tests only |
| `npm run test:api` | Run API tests only |
| `npm run report` | Open HTML test report |
| `npm run codegen` | Launch Playwright codegen |

### Browser Selection

```bash
# Single browser
npm test -- --project=chromium
npm test -- --project=firefox
npm test -- --project=webkit

# Mobile devices
npm test -- --project="Mobile Chrome"
npm test -- --project="Mobile Safari"
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

The framework includes comprehensive REST API testing capabilities using Playwright's native `request` context. All 11 API tests validate the complete E2E order flow and admin operations with 100% pass rate.

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
    await test.step('Login with standard user credentials', async () => {
      const loginResponse = await request.post(`${baseURL}/auth/login`, {
        data: {
          username: STANDARD_USER.username,
          password: STANDARD_USER.password,
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

- **Authentication:** Tests use JWT Bearer tokens from login API (not hardcoded credentials)
- **Session Management:** Unique UUID session ID per test run for cart operations
- **Stock Updates:** May be asynchronous; admin API provides real-time data
- **Serial Mode:** Required for maintaining shared state (tokens, order ID)
- **Test Data:** Uses Product ID 1, test card 4242424242424242

#### Test Results

Latest execution: **11 passed (12-14s) • 100% pass rate**

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

## CI/CD Integration

### GitHub Actions

The framework includes two workflow configurations:

#### Basic Workflow (`.github/workflows/playwright.yml`)

Runs all tests on a single runner:

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

#### Sharded Workflow (`.github/workflows/playwright-sharded.yml`)

Runs tests in parallel across multiple runners for faster feedback:

```yaml
jobs:
  test:
    strategy:
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

### GitHub Pages Test Reports 📊

Test reports are automatically published to GitHub Pages after every push to `main`/`master` branch.

**Live Report URL:**
```
https://<username>.github.io/<repository-name>/
```

**Features:**
- ✅ Interactive HTML report with pass/fail details
- ✅ Screenshots on test failures
- ✅ Trace viewer for debugging
- ✅ Filtering and search capabilities

**Setup Required:**
1. Go to repository **Settings** → **Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main`/`master` to trigger deployment

See [docs/github-pages-setup.md](docs/github-pages-setup.md) for detailed setup instructions.

### Storage State Authentication

The framework uses Playwright's storage state feature to avoid logging in for every test:

1. `auth.setup.ts` runs first and saves authenticated sessions
2. Other tests reuse the saved session via `storageState`

This dramatically speeds up test execution.

---

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
| `strict mode violation` | Locator matches multiple elements | Make locator more specific (add role, name, or scope) |
| `Timeout waiting for element` | Element not loaded | Wait for page content with `waitFor()` |
| `Navigation timeout` | Slow page load | Increase `navigationTimeout` in config |
| `Element not visible` | Element hidden or off-screen | Scroll to element or check visibility conditions |

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
- [QADemo Application](https://qademo.com)

