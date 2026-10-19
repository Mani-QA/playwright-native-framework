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
- Add a method on that class only when no method does the action. The method returns `Promise<void>` and contains no `expect()`.
- Create `src/pages/<Feature>Page.ts` only when the route has no class. Register it on `src/fixtures/pomFixtures.ts`.
- Discover a new locator with Playwright MCP `browser_snapshot` on `https://qademo.com`. Prefer `getByRole`, then `getByLabel`, then `getByPlaceholder`.

## 3. Write the spec

Add the test to the spec file in `app-map.md`. Import `{ test, expect }` from `../src/fixtures/pomFixtures`.

- Describe tag: `@p1`, `@p2`, or `@p3` from Qase priority 1, 2, or 3.
- When the title is `FR-XXX-000: <test title>`, the describe contains `FR-XXX-000` and the `test()` title is `<test title>`.
- Each Qase action is a `test.step`.
- Each expected result, plus every gap-fill check from `product-knowledge.md`, is an `expect()` in the spec.
- Sign in with the persona from `domain-glossary.md`. Call `loadSignedUpUser()` inside the test.

## 4. Verify

1. `npx tsc --noEmit`
2. `npx playwright test <spec> --project=chromium --grep "<test title>"`
3. On failure, snapshot the page, fix the locator or assertion, and retry up to 3 times.
4. Do not call Qase run-create or run-complete tools. The Playwright reporter appends the result to run 1 when a token is present.
5. After a pass, set that same case's automation to `2` with `qase_case_upsert` if Qase MCP is connected. Do not change the title.

## 5. Pull request

1. `npm run index:pom`
2. Branch `automate/qase-<id>` from the current HEAD.
3. Commit the spec, page objects, fixture, and `docs/kb/pom-index.md` with message `feat(tests): automate Qase case QADEMO-<id>`.
4. `git push -u origin HEAD`
5. `gh pr create` with title `feat(e2e): Automate QADEMO-<id> - <case title>` and a body that links `https://app.qase.io/case/QADEMO-<id>` and `https://app.qase.io/run/QADEMO/dashboard/1`.
6. Reply with a final line `PR_URL: <url>`.
