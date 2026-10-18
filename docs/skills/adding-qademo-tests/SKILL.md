---
name: adding-qademo-tests
description: >-
  Adds and updates QADemo Playwright tests in playwright-native-framework,
  publishes those spec tests to the Qase project QADEMO suite "QADemo Automation",
  and reports Playwright results, including failure screenshots, back to that suite.
  Use when creating tests, page objects, signup or login coverage, or when
  pushing spec-file cases or test results to Qase.
---

# Adding QADemo Playwright tests

Follow [docs/playwright-standards.md](../../playwright-standards.md). This skill only records what that guide does not: this app's accounts, locators, and the Qase suite for automated cases.

## Add a test

1. Import `test` and `expect` from `src/fixtures/pomFixtures`. Do not import `test` from `@playwright/test` in a spec.
2. Add the scenario to the existing `tests/<module>.spec.ts`. Create a page object in `src/pages/` and register it on the fixture before the spec uses it. Never construct a page object inside a spec.
3. Wrap the requirement:

```ts
test.describe('@p1 FR-AUTH-001: Login Form Display', () => {
  test('Login page offers Google sign-in and a username or email form', async ({ loginPage, page }) => {
    await test.step('Navigate to login page', async () => {
      await loginPage.goto();
    });
  });
});
```

4. Assertions stay in the spec. Page-object methods perform actions and return `Promise<void>`.
5. Use `getByRole`, `getByLabel`, or `getByPlaceholder`. Do not use CSS classes, XPath, `.first()`, `.nth()`, `waitForTimeout`, or `waitForLoadState('networkidle')`.
6. Tag priority on the `describe`: `@p1`, `@p2`, `@p3`, or `@p4`. The default run is `@p1|@p2|@agent|@API`, so a test that must run without an extra grep needs one of those tags.
7. Run the new spec before publishing it. `globalSetup` creates the shared customer, so a grep that skips setup still has credentials.

Do not automate Google sign-in or sign-up. Do not set `storageState` on the `chromium` project. Guest tests must start signed out.

## Which account

| Flow | Account | How |
|---|---|---|
| Shopping, cart, checkout, orders, navbar when signed in, API customer flow | Shared customer | `loadSignedUpUser()` **inside** the test or step. Never at import time. |
| Seeded standard login only (`FR-AUTH-002` standard-user test) | `STANDARD_USER` | `standard_user` / `standard123` |
| Locked login | `LOCKED_USER` | `locked_user` / `locked123` |
| Admin | `ADMIN_USER` | `admin_user`. Password is ``$Admin`` plus the local date as `DDMMYYYY` (`getAdminPassword()`). |
| Signup UI | A new visitor | `createSignupAccount()`. Do not write `playwright/.auth/customer.json`. |

`SIGNUP_PASSWORD` is `NewUser1!` (8 characters, an uppercase letter, and a number). The cart is one cart per customer, so parallel tests that share the signed-up customer share that cart.

Signup `POST /api/auth/signup` body is `{ email, phone, username, password }`. Login accepts username or email. Omitting username makes the app derive one from the email local part.

## Locator traps

| Control | Locator |
|---|---|
| Login submit | `getByRole('main').getByRole('button', { name: /^Sign in$/i })`. A bare "Sign In" also matches "Sign in with Google". `exact: true` is case-sensitive and misses the accessible name `Sign in`. |
| Navbar guest links | `/^Sign in$/i` and `/^Sign up$/i`, scoped to `navigation`. |
| Footer guest links | Exact `Sign In` and `Create Account`. |
| Username | Link name `/View orders for/i`. Visible text is the username. |
| Admin | Link name `Admin dashboard`. |
| Logout | Button name `Logout` inside `navigation`. |
| Admin dashboard | `getByRole('tab')`: `Overview`, `Products` exact, `Orders` exact. They are not buttons. |
| Signup password | `getByRole('textbox', { name: 'Password', exact: true })` so it does not match Confirm password. |
| Login username | Textbox `Username or email`. |

API failures use `role="alert"`. Field errors are red text under the field, not alerts. The password checklist appears only while a password is entered. After filling a password, click the heading before clicking Sign In or Create account, or the blur re-render drops the click.

Empty signup password says `Password is required`. The 8-character message appears only when a short password is already entered. Use `a@b.c` for an invalid email; the browser blocks `not-an-email` before React. Copy other messages from `ERROR_MESSAGES` in `src/test-data/index.ts`.

A second `signup()` call returns immediately if the alert from the first rejection is still visible. Clear the form, or submit with `fillForm` and `clickCreateAccount`, before asserting the next error.

## Publish spec cases to Qase

Project code `QADEMO`. Two suites:

- **eCommerce** — manual cases from `docs/e2e-test-cases.csv`. Do not add spec cases here.
- **QADemo Automation** — one case per `test()` in `tests/*.spec.ts`, except `tests/seed.spec.ts` and `*.setup.ts`.

Token: repo-root `.env` key `QASEToken`. Send header `Token: <value>` to `https://api.qase.io/v1`. Never print, log, commit, or write the token into source. On create, send `isManual` as the integer `0` and `automation` as `2`. `isManual: 1` stores a manual case and resets automation to not automated. The boolean `true` returns HTTP 422.

From the repo root:

```bash
node playwright-native-framework/docs/skills/adding-qademo-tests/scripts/push-spec-cases.mjs
```

The script creates the suite if needed and skips a case whose title is already in that suite. Titles are `{FR-ID}: {test title}`. Renaming a test leaves the old Qase case in place; update that case instead of publishing a second one. A dry run that does not call Qase:

```bash
node playwright-native-framework/docs/skills/adding-qademo-tests/scripts/push-spec-cases.mjs --dry-run
```

Mapping used by the script: priority `@p1` high, `@p2` medium, `@p3` and `@p4` low; type Functional; layer E2E, or API for `api.spec.ts`; automated; behavior negative only for rejection, access-denied, validation, and not-found requirements. Steps come from `test.step()` titles.

## Report results

A Playwright run with a Qase token posts each result into the existing test run [QADEMO run 1](https://app.qase.io/run/QADEMO/dashboard/1). It does not create or complete a run. The default command runs `@p1` and `@p2` only. Each result is matched to the case titled `{FR-ID}: {test title}`. Global setup downloads that map from the suite. The `qaseCase` fixture calls `qase.id()` for a match. Seed, setup, and any test whose title is not in the suite are executed but not sent. CI shards all write to run 1.

Keep the Qase title identical to the requirement id plus the `test()` title. Publish a new spec with the push script before expecting its result to appear. Failure screenshots come from Playwright's `screenshot: 'only-on-failure'` setting and are uploaded with the result. Do not log the token. CI reads `secrets.QASE_API_TOKEN`.
