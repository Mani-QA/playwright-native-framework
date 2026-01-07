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
│   └── navigation.spec.ts   # Navigation/layout tests
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

### Storage State Authentication

The framework uses Playwright's storage state feature to avoid logging in for every test:

1. `auth.setup.ts` runs first and saves authenticated sessions
2. Other tests reuse the saved session via `storageState`

This dramatically speeds up test execution.

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

