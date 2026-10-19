---
name: automate
description: Turn one Qase QADEMO case into a Playwright spec, reusing page objects, filling gaps from the FRD, verifying on Chromium, and opening a GitHub pull request.
---

# Automate one Qase case

The case payload is `playwright/.cache/harness/case-<id>.json`. Run the stages in order.

## 1. Read the case and the product

Read the payload's `title`, `preconditions`, `priority`, and `steps` (`action`, `expected_result`). Read `docs/FRD-QADemo.md` and `docs/kb/product-knowledge.md`. List the steps the case omitted and the assertions the FRD still requires. Keep the case title.

If a step only has a shared-step hash, call Qase MCP `qase_get` with `entity: "shared_step"`, `code: "QADEMO"`, and that hash, then inline those steps.

## 2. Reuse page objects and methods

Read `docs/kb/pom-index.md` and `docs/kb/app-map.md`.

- Use the fixture that already owns the route.
- Call an existing method when it performs the action.
- Leave an existing method's waited URL, locator, and clicked control as they are. A guest who should land on login gets a new method. The spec asserts that URL.
- Add a method on that class only when no method does the action. The method returns `Promise<void>` and contains no `expect()`.
- Create `src/pages/<Feature>Page.ts` only when the route has no class. Register it on `src/fixtures/pomFixtures.ts`.
- Discover a new locator with Playwright MCP `browser_snapshot` on `https://qademo.com`. Use `getByRole`, then `getByLabel`, then `getByPlaceholder`.
- One locator names one action. An "In Cart" control stays separate from "Remove from cart".
- Do not edit `src/qase/**` or `qaseCaseId` in `src/fixtures/pomFixtures.ts`. The matcher already accepts `FR-` and `TC-` ids. The case map keeps QADemo Automation titles ahead of the eCommerce suite.

## 3. Write the spec

Add the test to the spec file in `app-map.md`. Import `{ test, expect }` from `../src/fixtures/pomFixtures`.

- Describe tag: `@p1`, `@p2`, or `@p3` from Qase priority 1, 2, or 3.
- When the title is `FR-XXX-000: <test title>` or `TC-E2E-000: <test title>`, the describe contains that id and the `test()` title is the text after the colon.
- The payload `harness.action` is `create` or `update`. For `update`, edit the test in `harness.spec`. Add a `test.step` and `expect` for each entry in `harness.changes.added`. Remove steps listed in `harness.changes.removed` only when the case no longer contains them. Keep steps that still match.
- Do not add a second `test()` with the same title.
- Each Qase action is a `test.step`. The values submitted in that step are the values named in its title.
- Each expected result, plus every gap-fill check from `product-knowledge.md`, is a web-first `expect()` in the spec. Use `expect(page).toHaveURL`. Do not add `expect(page.url())` for a URL the previous assertion already settled.
- A new shopper comes from `createSignupAccount()` with its generated email, phone, and username. Call `loadSignedUpUser()` inside the test only for the shared customer.
- When the case names `standard_user` or the shared customer and says the cart is empty, open the cart and clear it before adding the product. That account is shared, so a leftover line would make the quantity assertion wrong.
- When the case names a shopper, address, or cardholder, pass those strings to the page object and assert them on the order. Use `VALID_PAYMENT` for the card number and CVV. Use the case expiry when it is a future `MM/YY`; otherwise use `VALID_PAYMENT.expiryDate`.
- After an order, assert the payment text contains the last four digits and the main content does not contain the full card number. Do not assert that the letters `CVV` are absent.
- Open a product through its heading, then read the slug from `page.url()`. Do not call `getAttribute`.
- An in-cart control shows the quantity this test added, such as `In Cart (1)`.
- A stock check records the count on that product page, purchases the case quantity, reloads that same product, and asserts the difference. Do not copy a stock number out of the case text.
- Submit through the page-object method. Do not click a heading to move focus.

## 4. Verify

1. `npx tsc --noEmit`
2. `npx playwright test <spec> --project=chromium --grep "<test title>"`
3. On failure, snapshot the page, fix the locator or assertion, and retry up to 3 times.
4. Do not call Qase run-create or run-complete tools. The Playwright reporter appends the result to run 1 when a token is present.
5. After a pass, set that same case's automation to `2` with `qase_case_upsert` if Qase MCP is connected. Do not change the title.

## 5. Pull request

1. `npm run index:pom`
2. Branch `harness.branch` from the current HEAD.
3. Commit the spec, page objects, fixture, `docs/kb/pom-index.md`, and `.agents/harness-state.json`. The snapshot file is already updated. Do not revert it. Message: `feat(tests): automate Qase case QADEMO-<id>` for create, or `test: update QADEMO-<id> from the latest Qase steps` for update.
4. `git push -u origin HEAD`
5. If `gh pr list --head <harness.branch> --state open` already shows a pull request, use that URL. Otherwise `gh pr create` with title `feat(e2e): Automate QADEMO-<id> - <case title>` and a body that links `https://app.qase.io/case/QADEMO-<id>` and `https://app.qase.io/run/QADEMO/dashboard/1`.
6. Reply with a final line `PR_URL: <url>`.
