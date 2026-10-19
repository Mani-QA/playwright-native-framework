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

The Qase case title stays unchanged. Shape the describe and `test()` title so they rebuild `{FR-ID}: {test title}` when the case title contains an FR id. Fill omitted setup and assertions from the FRD and `product-knowledge.md`.

Run `npx tsc --noEmit` and the new spec on the `chromium` project. Results append to Qase run 1 through the existing reporter. Do not create or complete a Qase run.

After the spec passes, commit on `automate/qase-<id>`, push it, and open a pull request with `gh`. End your reply with `PR_URL:` and the pull request URL.

Do not print, commit, or write the Qase token or the GitHub token.
