# Playwright Native Framework: AI Coding Standards & Best Practices

This document outlines the architecture, folder structure, and specific "Rules of Engagement" for building a scalable Playwright framework using AI IDEs like Cursor.

---

## 1. Recommended Folder Structure

This structure separates concerns (Page Objects, Data, Tests) and utilizes Playwright's fixture system for dependency injection.

```
my-automation-framework/
├── .github/workflows/       # CI/CD pipelines (GitHub Actions, etc.)
├── tests/                   # Spec files (*.spec.ts)
├── src/
│   ├── pages/               # Page Object Models (POM) classes
│   ├── fixtures/            # Custom Fixtures (Dependency Injection)
│   ├── utils/               # Helper functions (API helpers, Date generators)
│   └── test-data/           # JSON/CSV static data files
├── playwright.config.ts     # Main Playwright Configuration
├── .cursorrules             # AI Context Rules (Place in root)
├── .eslintrc.js             # Linting rules
└── package.json
```

---

## 2. Coding Standards & Guidelines

This project follows strict coding guidelines to ensure stability, readability, and ease of maintenance. All contributors (and AI assistants) must adhere to these rules.

### Core Principles

- **Framework:** Use the Playwright Native Runner. Do not use Cucumber or Gherkin syntax.
- **Language:** Write all code in TypeScript using Strict Mode.
- **Architecture:** Use the Page Object Model (POM) pattern, injected strictly via Test Fixtures.
- **Assertions:** Always use Playwright's "Web-First" assertions (e.g., `toBeVisible()`) which handle auto-retrying.

### A. Locator Strategy

To ensure tests are resilient to layout changes, use locators in the following priority order:

| Priority | Type | Examples |
|----------|------|----------|
| **Priority 1** | User-Facing | `getByRole`, `getByLabel`, `getByPlaceholder` |
| **Priority 2** | Text | `getByText` (use only if semantic roles are missing) |
| **Priority 3** | Test IDs | `getByTestId` (use only as a last resort) |

**Forbidden:** Avoid brittle selectors like specific CSS classes (e.g., `.btn-primary`), XPaths (e.g., `//div/span[2]`), or dynamic IDs (e.g., `#custom-id-123`).

**Strict Mode Compliance:** Never chain `.first()` or `.nth(0)` to silence multiple-element errors. Instead, make the locator more specific.

### B. Page Object Model (POM) Rules

- **Instantiation:** Never manually instantiate Page Objects in test files (e.g., `const login = new LoginPage(page)` is forbidden). Always use Fixtures.
- **Separation of Concerns:** Page Object methods should perform actions (clicks, fills) and return `Promise<void>`. They should not contain assertions. Assertions belong in the spec file to validate the state.

### C. Synchronization & Waiting

- **No Hard Waits:** The use of `page.waitForTimeout(5000)` is strictly forbidden.
- **Avoid Network Idle:** Do not use `page.waitForLoadState('networkidle')` as it is notoriously flaky.
- **Best Practice:** Rely on auto-waiting assertions (e.g., `await expect(locator).toBeVisible()`).

### D. Reporting & Readability

- **Steps:** Wrap logical blocks of actions (Setup, Action, Verification) inside `test.step()` blocks.
- **Naming:** Use meaningful step names to ensure the HTML report reads like a manual test case.

---

## 3. Reference Implementation

### Example: Page Object (`src/pages/LoginPage.ts`)

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username');
    this.loginButton = page.getByRole('button', { name: 'Log in' });
  }

  async login(user: string, pass: string) {
    await this.usernameInput.fill(user);
    // ... fill password
    await this.loginButton.click();
  }
}
```

### Example: Custom Fixture (`src/fixtures/pomFixtures.ts`)

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type Pages = {
  loginPage: LoginPage;
  // add other pages here
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
```

### Example: Test File (`tests/auth.spec.ts`)

```typescript
import { test, expect } from '../src/fixtures/pomFixtures';

test('User can login successfully', async ({ loginPage, page }) => {
  await test.step('Navigate to login', async () => {
    await page.goto('/login');
  });

  await test.step('Perform login', async () => {
    await loginPage.login('admin', 'password');
  });

  await test.step('Verify Dashboard', async () => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
```

---

## 4. Detailed Rationale

### Why Native Fixtures?

Instead of manually creating `new LoginPage(page)` in every test file, we use Playwright's `test.extend`.

- **Benefit:** Reduces boilerplate code.
- **Benefit:** If the `LoginPage` constructor changes, you only update the fixture file, not 500 test files.
- **Benefit:** It handles teardown automatically.

### Why `test.step()`?

Since we are avoiding Cucumber, we need a way to make reports readable for non-technical users.

- `test.step` creates a nested, collapsible view in the Playwright HTML report.
- It clearly separates "Setup", "Action", and "Verification" logic in the logs.

### Why "Web-First" Assertions?

**Bad:**

```typescript
expect(await locator.isVisible()).toBe(true)
```

This is bad because it checks the state once and fails immediately if the element is rendering.

**Good:**

```typescript
await expect(locator).toBeVisible()
```

This automatically retries until the timeout (default 5s) is reached, making tests resistant to minor network lags.
