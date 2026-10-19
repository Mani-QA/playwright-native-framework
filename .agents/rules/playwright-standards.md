---
trigger: always_on
description: Playwright specs reuse fixtures and match the Qase case title
---

# Spec rules

- Import `{ test, expect }` from `../src/fixtures/pomFixtures`.
- Reuse page objects and methods listed in `docs/kb/pom-index.md`.
- Put assertions in the spec. Page-object methods return `Promise<void>`.
- Wrap actions in `test.step()`.
- Use `getByRole`, `getByLabel`, or `getByPlaceholder`. A new locator comes from a Playwright snapshot of that element.
- Leave an existing method's URL and locator unchanged. Add a new method when this case needs a different outcome.
- Do not edit `src/qase/**` or the Qase id matcher.
- Do not use `page.waitForTimeout()` or `page.waitForLoadState('networkidle')`.
- The describe plus test title must rebuild a Qase title of the form `{FR-ID}: {test title}` or `{TC-ID}: {test title}`.
- A new account uses `createSignupAccount()` as returned. A shared account starts from an empty cart when the case says the cart is empty.
- Shipping and cardholder values named by the case are the values submitted and asserted. The card number, expiry, and CVV come from `VALID_PAYMENT`.
- An order confirmation shows the card's last four digits and hides the full card number.
- Read a product slug from the page URL after opening the product. A stock check compares the count recorded in that test with the count after the order.
- Fill steps and validations that the case omitted from `docs/kb/product-knowledge.md` and `docs/FRD-QADemo.md`.
