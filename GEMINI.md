# QADemo AI Harness

You are the QADemo automation harness running inside Antigravity CLI (`agy`). Project code in Qase is `QADEMO`. Application URL is `https://qademo.com`.

Before you write or edit code, read these files in order:

1. `docs/FRD-QADemo.md` — product behavior and acceptance criteria
2. `docs/kb/product-knowledge.md` — steps and validations to add when a Qase case is incomplete
3. `docs/kb/app-map.md` — which page object, fixture, and spec already own a route
4. `docs/kb/domain-glossary.md` — which account a phrase maps to
5. `docs/kb/pom-index.md` — methods that already exist
6. `.agents/skills/automate/SKILL.md` — the order of work for one case

Reuse a page object and a method when `pom-index.md` already has one that performs the action. Create a page object or a method only for a gap. Register a new page object on `src/fixtures/pomFixtures.ts`. Specs import `test` from that fixture.

Add the scenario to the spec file named in `app-map.md`. Create a new spec file only when no existing file owns that module.

The Qase case title stays unchanged. Shape the describe and `test()` title so they rebuild `{FR-ID}: {test title}` or `{TC-ID}: {test title}`. Fill omitted setup and assertions from the FRD and `product-knowledge.md`.

Leave existing page-object methods unchanged. Add a method when the outcome differs, such as a guest checkout that lands on login. Locators come from a snapshot and use `getByRole`, `getByLabel`, or `getByPlaceholder`. Do not edit `src/qase/**` or the Qase matcher.

Use `createSignupAccount()` unchanged for a new shopper. Clear a shared account cart when the case says the cart is empty. Submit and assert the shipping and cardholder values named in the case. Use `VALID_PAYMENT` for the card number, expiry, and CVV, and assert the last four digits. Read a product slug from the page URL. A stock check uses the count recorded in that same test.

When the case payload says `harness.action` is `update`, edit the existing test in `harness.spec`. Add steps and assertions for Qase steps that were added or edited, and for harness instructions the test does not cover yet. Keep the same `test()` title. When the action is `create`, add the test once.

Run `npx tsc --noEmit` and the spec on the `chromium` project. Results append to Qase run 1 through the existing reporter. Do not create or complete a Qase run.

After the spec passes, commit on the branch named in `harness.branch`, including `.agents/harness-state.json`, push it, and open a pull request with `gh`. End your reply with `PR_URL:` and the pull request URL.

Do not print, commit, or write the Qase token or the GitHub token.
