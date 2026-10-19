---
trigger: always_on
description: Playwright specs reuse fixtures and match the Qase case title
---

# Spec rules

- Import `{ test, expect }` from `../src/fixtures/pomFixtures`.
- Reuse page objects and methods listed in `docs/kb/pom-index.md`.
- Put assertions in the spec. Page-object methods return `Promise<void>`.
- Wrap actions in `test.step()`.
- Use `getByRole`, `getByLabel`, or `getByPlaceholder`.
- Do not use `page.waitForTimeout()` or `page.waitForLoadState('networkidle')`.
- The describe plus test title must rebuild a Qase title of the form `{FR-ID}: {test title}`.
- Fill steps and validations that the case omitted from `docs/kb/product-knowledge.md` and `docs/FRD-QADemo.md`.
