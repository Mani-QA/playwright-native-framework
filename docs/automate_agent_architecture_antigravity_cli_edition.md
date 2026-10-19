# Automate: Autonomous Test Automation Agent Architecture
**Engineered on Antigravity CLI (`agy`) + Gemini Models + Model Context Protocol (MCP) + Playwright + Qase**

---

## 1. Executive Summary

**Automate** is an autonomous, headless AI Test Automation Engineer built on Google's **Antigravity CLI (`agy`)** agent harness. It accepts a **Qase** case id, suite id, or plan id in project **QADEMO**, resolves domain terminology against a local **Knowledge Base (KB)**, authenticates and navigates [QADemo](https://qademo.com) via **Playwright MCP** using accessibility tree introspection, and synthesizes production-grade **Page Object Models (POMs)**, reusable utilities, and Playwright `.spec.ts` files.

By running on Antigravity CLI with **Gemini 3.5 Flash** (and automatic fallback to **Gemini 3.5 Pro**), the agent leverages high-speed token processing and automatic prompt-prefix caching across large Playwright accessibility snapshots. Before opening a Pull Request via **GitHub MCP**, the agent runs a self-healing local test verification loop inside Antigravity's terminal sandbox. A passing run posts its result onto the existing [Qase run 1](https://app.qase.io/run/QADEMO/dashboard/1). The agent does not create or complete a Qase run.

---

## 2. System Topology & Architecture

```
+-----------------------------------------------------------------------------------+
|                        AUTOMATE CLI / CI ORCHESTRATOR                             |
|     Input: --case <ID>  OR  --suite <SuiteID>  OR  --plan <PlanID>                |
|   Project: QADEMO                                                                 |
|   Pre-Flight: Refreshes the shared customer and generates the AST POM index      |
|   Model Routing: Runs `agy -p` with gemini-3.5-flash -> Retries on gemini-3.5-pro |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          | Spawns isolated `agy -p` process per case
                                          v
+-----------------------------------------------------------------------------------+
|                      ANTIGRAVITY CLI RUNTIME (`agy` CORE AGENT)                   |
|  - Root Context: GEMINI.md (Global Architecture, POM & Locator Standards)         |
|  - Modular Rules: .agents/rules/playwright-standards.md                           |
|  - Agent Skill: .agents/skills/automate/SKILL.md                                  |
|  - Sandbox Tools: File Read/Edit, Glob, Grep, Sandboxed Terminal (tsc, playwright)|
+------------+----------------------------+----------------------------+------------+
             |                            |                            |
             v                            v                            v
+-------------------------+  +-------------------------+  +-------------------------+
|        Qase MCP         |  |     Playwright MCP      |  |       GitHub MCP        |
|   (@qase/mcp-server)    |  |   (@playwright/mcp)     |  | (server-github / gh CLI)|
+-------------------------+  +-------------------------+  +-------------------------+
| - qase_get case         |  | - browser_navigate      |  | - create_branch         |
| - qase_get shared_step  |  | - browser_snapshot      |  | - create_or_update_file |
| - qql_search by suite   |  | - browser_click / fill  |  | - create_pull_request   |
| - qase_case_upsert      |  | - Uses shared customer  |  | - Links QADEMO-<ID>     |
+-------------------------+  +-------------------------+  +-------------------------+
             ^                            ^                            ^
             |                            |                            |
             +----------------------------+----------------------------+
                                          |
+-----------------------------------------+-----------------------------------------+
|                    LOCAL REPOSITORY & KNOWLEDGE BASE LAYER                        |
|  - /docs/kb/app-map.md          (Routes -> Feature Names & POM mappings)          |
|  - /docs/kb/domain-glossary.md  (Business logic, personas, test data rules)       |
|  - /docs/kb/pom-index.md        (Auto-generated AST index of existing POM classes)|
|  - /src/pages/ & /src/utils/    (Existing Page Objects, Fixtures, Helpers)        |
|  - playwright-qase-reporter     (Appends p1/p2 results to Qase run 1)             |
+-----------------------------------------------------------------------------------+
```

### Architectural Component Matrix

| Layer | Technology Stack | Responsibility |
| :--- | :--- | :--- |
| **Batch Orchestrator** | Node.js CLI (`scripts/automate-cli.ts`) | Fans a Qase suite or plan out into case ids, refreshes the shared customer, updates the POM AST index, and invokes `agy -p` with Flash-to-Pro fallback. |
| **Agent Core** | Antigravity CLI (`agy`) | Native Go binary executing reasoning loops, reading repository state, invoking MCP tools, editing TypeScript files, and running local verification. |
| **Governance & Skills** | `GEMINI.md` + `.agents/skills/` | Defines always-on architectural guardrails and packages the 6-stage automation pipeline into a reusable skill. |
| **Test Case Ingestion** | Qase MCP (`@qase/mcp-server`) | Loads a case from project `QADEMO`, including preconditions and classic steps (`action`, `expected_result`), and inlines shared steps. |
| **Domain Context** | Markdown KB (`/docs/kb/`) | Translates business terms in Qase steps into concrete URLs, personas, and existing helper functions. |
| **Live Introspection** | Playwright MCP (`@playwright/mcp`) | Drives a live browser in **Snapshot Mode** (accessibility tree YAML) to discover resilient locators. |
| **Test Framework** | Playwright TypeScript | Hosts Page Objects (`/src/pages`), fixtures (`/src/fixtures/pomFixtures.ts`), utilities (`/src/utils`), and specs (`/tests`). |
| **Result Publishing** | `playwright-qase-reporter` | Posts each mapped result, including a failure screenshot, to [run 1](https://app.qase.io/run/QADEMO/dashboard/1). |
| **Version Control** | GitHub MCP / `gh` CLI | Pushes verified branches (`automate/qase-<ID>`) and opens Pull Requests that link the Qase case. |

Qase already holds two suites in this project:

| Suite | Role |
| :--- | :--- |
| eCommerce | Manual cases imported from `docs/e2e-test-cases.csv` |
| QADemo Automation | One automated case per `test()` in `tests/*.spec.ts`, except seed and setup |

---

## 3. End-to-End Execution Pipeline

### Phase 1: Pre-Flight & Ingestion
1. **Input Resolution:** The orchestrator receives `--case <ID>`, `--suite <SuiteID>`, or `--plan <PlanID>`. Project code is `QADEMO`. For a suite or plan, the orchestrator collects the child case ids and queues an isolated `agy -p` run per case.
2. **AST POM Indexing:** The pre-flight script parses `src/pages/**/*.ts` and `src/utils/**/*.ts` and writes `docs/kb/pom-index.md`.
3. **Qase Case Parsing:** Antigravity calls `qase_get` with `entity: "case"`, `code: "QADEMO"`, the case id, and `fields: ["*"]`. It keeps:
   - Title, description, preconditions, and suite
   - Classic steps, each with `action` and `expected_result`
   - Priority (`1` high, `2` medium, `3` low) and the `automation` value
   - Shared-step hashes. Each hash is loaded with `qase_get` (`entity: "shared_step"`) and inlined in order

The case title is the contract with the reporter. Leave it unchanged. A title shaped `FR-AUTH-001: Login page offers Google sign-in and a username or email form` must be reproduced by a describe that contains `FR-AUTH-001` and a `test()` whose title is the text after the colon.

### Phase 2: Knowledge Base Resolution & Credential Handling
1. **Domain Lookup:** The agent reads `docs/kb/domain-glossary.md` and `docs/kb/app-map.md` and maps each step to a route and a persona.
2. **Credentials stay out of the prompt.** The agent reads persona names from the glossary. Passwords stay in `.env` and in `playwright/.auth/customer.json`, which global setup writes. The sandbox denies `cat .env*` and `cat .auth/*`.
3. **Who signs in:**
   - Shopping, cart, checkout, orders, and the API shopper flow use the shared customer from `loadSignedUpUser()`, called inside the test.
   - Signup and WebMCP shopping flows call `createSignupAccount()` and do not overwrite `customer.json`.
   - `standard_user` / `standard123` is only for the seeded login test.
   - `locked_user` / `locked123` is only for the locked-login test.
   - Admin is `admin_user`. The password is `$Admin` plus the local date as `DDMMYYYY`.
   - Google sign-in stays manual.

Playwright MCP may launch with a storage state prepared by `tests/auth.setup.ts` so exploration starts signed in. Generated specs follow the framework rule: the Chromium project does not apply `storageState`, and each test signs in itself. Guest tests start signed out.

### Phase 3: Live Browser Exploration & Locator Discovery
1. **Interactive Navigation:** The agent uses Playwright MCP tools (`browser_navigate`, `browser_click`, `browser_fill`, `browser_select_option`) to walk the Qase steps on `https://qademo.com`.
2. **Accessibility Tree Introspection:** After every navigation or dialog, the agent calls `browser_snapshot`.
3. **Locator Extraction:** From the YAML snapshot, the agent takes locators in this order:
   - `page.getByRole(role, { name })`
   - `page.getByLabel(text)`
   - `page.getByPlaceholder(text)`
   - `page.getByTestId(id)` only when no semantic locator exists

Login submit is `getByRole('main').getByRole('button', { name: /^Sign in$/i })`. The username field is the textbox `Username or email`.

### Phase 4: Code Synthesis (POMs, Utils, Fixtures, Specs)
1. **Reuse-First Evaluation:** The agent compares the visited routes with `docs/kb/pom-index.md`.
   - An existing Page Object gains only the missing `readonly` locators and action methods.
   - A missing Page Object is created in `src/pages/<Feature>Page.ts` and registered on `src/fixtures/pomFixtures.ts`.
2. **Spec Generation:** The agent adds the scenario to the existing `tests/<module>.spec.ts` when that module already owns the flow. A new module gets `tests/<module>.spec.ts`.
   - Import `{ test, expect }` from `../src/fixtures/pomFixtures`.
   - The describe carries the priority tag from the Qase priority (`@p1`, `@p2`, or `@p3`) and the `FR-...` id when the case title has one.
   - The `test()` title is the remainder of the Qase title, so global setup's case map resolves `{FR-ID}: {test title}` and the `qaseCase` fixture calls `qase.id()`.
   - Each Qase step becomes `await test.step('<action>', ...)`.
   - Every `expected_result` becomes an `expect()` in the spec. Page-object methods return `Promise<void>` and contain no assertions.
3. **Case status:** After the spec passes, the agent calls `qase_case_upsert` on the same id with `automation: "2"`. The title, suite, and steps stay as they were. `2` means automated. The agent does not create a second case for the same title.

### Phase 5: Self-Healing Verification Loop
1. **Static Analysis:** `npx tsc --noEmit`.
2. **Live Test Execution:** `npx playwright test <spec> --project=chromium --reporter=list`. The config grep is `/@p1|@p2|@agent|@API/`. A new `@p3` or `@p4` test needs an explicit `--grep` that includes its tag, or it will be filtered out.
3. **Result upload:** When `QASEToken` or `QASE_API_TOKEN` is present, `playwright-qase-reporter` appends the result to run id `1` and uploads a failure screenshot. `QASE_TESTOPS_RUN_COMPLETE` stays `false`. The agent does not call `qase_ci_report`, `qase_run_upsert`, or `qase_run_complete`.
4. **Repair:** On failure, the agent reads the error, takes another `browser_snapshot`, patches the Page Object or spec, and retries up to 3 times.

### Phase 6: Git Push & Pull Request Creation
1. **Index Refresh & Branching:** `npm run index:pom`, then branch `automate/qase-<ID>`.
2. **Staging & Commit:** Stage `src/pages/`, `src/utils/`, `src/fixtures/`, `tests/`, and `docs/kb/pom-index.md`.
3. **PR Creation:** `gh pr create` (or GitHub MCP) with:
   - Link to the case: `https://app.qase.io/case/QADEMO-<ID>`
   - Link to the run that received the local result: `https://app.qase.io/run/QADEMO/dashboard/1`
   - Table of reused and new Page Objects
   - Local Playwright output

---

## 4. Repository Structure (Antigravity Standard)

```text
playwright-native-framework/
├── .agents/
│   ├── mcp_config.json              # Qase, Playwright, and GitHub MCP servers
│   ├── rules/
│   │   └── playwright-standards.md  # Spec formatting and Qase title rules
│   └── skills/
│       └── automate/
│           └── SKILL.md             # 6-stage Automate skill
├── playwright/.auth/
│   └── customer.json                # Shared customer written by global setup
├── docs/
│   ├── kb/
│   │   ├── app-map.md               # Route-to-PageObject map
│   │   ├── domain-glossary.md       # Personas and business terms
│   │   └── pom-index.md             # Generated AST summary of existing POMs
│   └── skills/adding-qademo-tests/  # Existing guide for specs and Qase cases
├── scripts/
│   ├── generate-pom-index.ts        # Indexes Page Objects into docs/kb/pom-index.md
│   └── automate-cli.ts              # Outer CLI: suite/plan fan-out and agy -p
├── src/
│   ├── fixtures/
│   │   └── pomFixtures.ts           # Page objects plus the Qase case-id fixture
│   ├── pages/
│   ├── qase/
│   │   ├── token.ts                 # Reads QASEToken / QASE_API_TOKEN, never logs it
│   │   └── sync-case-map.ts         # Downloads QADemo Automation titles before workers start
│   └── utils/
├── tests/
│   ├── auth.setup.ts
│   └── *.spec.ts
├── GEMINI.md                        # Loaded automatically by `agy`
├── global-setup.ts                  # Shared customer, then the Qase case map
├── playwright.config.ts             # Chromium, WebMCP flag, reporter pinned to run 1
└── package.json
```

---

## 5. Antigravity Configuration Blueprints

### 5.1 `.agents/mcp_config.json` (Workspace MCP Configuration)

Antigravity CLI discovers `.agents/mcp_config.json` at the workspace root and connects these servers on startup. The Qase server is [`@qase/mcp-server`](https://github.com/qase-tms/qase-mcp-server). It reads `QASE_API_TOKEN` and sends it as the Qase `Token` header. Put the token in the environment that launches `agy`. The same value may live in `.env` as `QASEToken` for Playwright. Do not commit it.

Tool reference: [Qase MCP tools](https://github.com/qase-tms/qase-mcp-server/blob/main/docs/tools.md).

```json
{
  "mcpServers": {
    "qase": {
      "command": "npx",
      "args": ["-y", "@qase/mcp-server"],
      "env": {
        "QASE_API_TOKEN": "${QASE_API_TOKEN}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--browser",
        "chromium",
        "--headless",
        "--storage-state",
        "./playwright/.auth/customer.json"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### 5.2 `~/.gemini/antigravity-cli/settings.json` (Headless Permissions & Sandbox Policy)

Unconfigured MCP servers and shell commands stay in `Ask` mode, which blocks an unattended run. This policy allows the three MCP servers and the verification commands, and it keeps the terminal sandbox on.

```json
{
  "enableTerminalSandbox": true,
  "terminalSandboxNetwork": true,
  "permissions": {
    "allow": [
      "mcp(qase/*)",
      "mcp(playwright/*)",
      "mcp(github/*)",
      "terminal(npx tsc --noEmit)",
      "terminal(npx playwright test*)",
      "terminal(npm run index:pom)",
      "terminal(git checkout -b automate/*)",
      "terminal(git status*)",
      "terminal(git add src/* tests/* docs/kb/pom-index.md)",
      "terminal(git commit -m *)",
      "terminal(git push -u origin automate/*)",
      "terminal(gh pr create*)"
    ],
    "deny": [
      "terminal(cat .env*)",
      "terminal(cat playwright/.auth/*)",
      "terminal(git push --force*)",
      "terminal(git push origin main*)",
      "terminal(git push origin master*)",
      "terminal(rm -rf *)"
    ]
  }
}
```

The allow list has no `qase_ci_report` or run-complete command. Results reach Qase through the Playwright reporter during `npx playwright test`.

---

## 6. Agent Governance, Rules & Skill Definitions

### 6.1 `GEMINI.md` (Root-Level Master Instructions)

Antigravity CLI loads `GEMINI.md` from the repository root as an always-active system instruction.

```markdown
# Automate Agent — Master Repository Architecture & Standards

You are **Automate**, an autonomous Playwright TypeScript Test Automation Engineer running inside the Antigravity CLI (`agy`) harness. Qase project code is `QADEMO`. Every file you create or modify follows the rules below.

## 1. Mandatory Pre-Coding Discovery
- Read `docs/kb/pom-index.md`, `docs/kb/app-map.md`, and `docs/kb/domain-glossary.md` before writing code.
- Reuse the Page Object already mapped to a route in `src/pages/`.
- Inspect the live page with `browser_snapshot` before writing a locator.

## 2. Locator Priority Hierarchy
1. **Role & Accessible Name**: `this.page.getByRole('button', { name: /^Sign in$/i })`
2. **Form Labels**: `this.page.getByRole('textbox', { name: 'Username or email' })`
3. **Placeholder / Text**: `this.page.getByPlaceholder('Search...')`
4. **Test ID**: `this.page.getByTestId('order-status')`
5. **CSS / XPath**: Last resort, scoped to a parent semantic locator.

## 3. Page Object Model (POM) Design Rules
- Page Objects live in `src/pages/<FeatureName>Page.ts`.
- Locators are `readonly` properties set in the constructor.
- Action methods return `Promise<void>`.
- Assertions live in the spec.
- Register a new Page Object on `src/fixtures/pomFixtures.ts`.

## 4. Qase Title Contract
- The Qase case title stays unchanged.
- When the title is `FR-XXX-000: <test title>`, the describe includes `FR-XXX-000` and the `test()` title is `<test title>`.
- Import `test` from `src/fixtures/pomFixtures` so the `qaseCase` fixture can call `qase.id()`.
- After a green run, set that case's `automation` to `2` with `qase_case_upsert`. Do not create a duplicate case.
- Do not create or complete a Qase run. Run 1 already receives results.

## 5. Test Data
- Call `loadSignedUpUser()` inside the test, never at import time.
- Call `createSignupAccount()` for signup UI tests and for WebMCP flows that change a cart.
- During live exploration, suffix created usernames with a timestamp so the later `npx playwright test` run can create its own data.
```

### 6.2 `.agents/rules/playwright-standards.md` (Modular Rule File)

```markdown
---
trigger: always_on
description: Enforces Playwright test.step structure, web-first assertions, fixture imports, and the Qase title contract
---

# Spec File Standards
- Import `{ test, expect }` from `../src/fixtures/pomFixtures`.
- Put `@p1`, `@p2`, `@p3`, or `@p4` on the describe. Copy the priority from the Qase case (`1` high, `2` medium, `3` low).
- Wrap each Qase step action in `await test.step('...', async () => { ... })`.
- Assert each Qase `expected_result` in the spec with a web-first assertion.
- The describe plus `test()` title must rebuild the Qase case title `{FR-ID}: {test title}` when the case title has an FR id.
- Do not use `page.waitForTimeout()` or `page.waitForLoadState('networkidle')`.
```

### 6.3 `.agents/skills/automate/SKILL.md` (Packaged Agent Skill)

```markdown
---
name: automate
description: Fetch a Qase case from project QADEMO, explore QADemo via Playwright MCP, generate a POM and spec, verify locally against run 1, and open a GitHub PR.
---

# Automate Skill Execution Protocol

When triggered with a Qase case id in project QADEMO, run these stages in order.

### Stage 1: Fetch the Qase case
1. Call `qase_get` with `entity: "case"`, `code: "QADEMO"`, the case id, and `fields: ["*"]`.
2. Record the title, preconditions, suite id, priority, automation value, and classic steps (`action`, `expected_result`).
3. When a step contains `shared_step_hash`, call `qase_get` with `entity: "shared_step"` and that hash, then inline those steps.
4. Write a numbered checklist of actions and expected results. Do not rename the case.

### Stage 2: Consult the knowledge base and existing POMs
1. Read `docs/kb/app-map.md`, `docs/kb/domain-glossary.md`, and `docs/kb/pom-index.md`.
2. Map preconditions and steps to an entry URL, a Page Object in `src/pages/`, and a helper in `src/utils/`.

### Stage 3: Walk the application with Playwright MCP
1. Open the starting URL with `browser_navigate`.
2. When the storage state is signed out and the case needs a shopper, follow the persona in `docs/kb/domain-glossary.md`.
3. Perform each Qase step with Playwright MCP tools. Use a timestamped username when the step creates an account.
4. On each page change, call `browser_snapshot` and record the role and accessible name of every element the spec will use.
5. Call `browser_close` when the steps have been observed.

### Stage 4: Generate code
1. Extend the existing Page Object, or add `src/pages/<Feature>Page.ts` and register it on `pomFixtures.ts`.
2. Add the spec under `tests/`, importing `test` and `expect` from `pomFixtures`.
3. Map each Qase step to `test.step()` and each expected result to `expect()`.
4. Shape the describe and `test()` title so they match the Qase title used by the case map.

### Stage 5: Verify locally
1. Run `npx tsc --noEmit` and fix type errors.
2. Run `npx playwright test` for the new spec with `--project=chromium`. Include a `--grep` when the new tag is `@p3` or `@p4`.
3. On failure, read the log, snapshot the page again, patch, and retry up to 3 times.
4. Leave run creation alone. A token in the environment makes the reporter append the pass or fail to Qase run 1.
5. On success, call `qase_case_upsert` for the same id with `automation: "2"`.

### Stage 6: Branch, commit, and open a pull request
1. Run `npm run index:pom`.
2. Create branch `automate/qase-<ID>`.
3. Commit `feat(tests): automate Qase case QADEMO-<ID>`.
4. Open a pull request titled `feat(e2e): Automate QADEMO-<ID> - <case title>` whose body links `https://app.qase.io/case/QADEMO-<ID>` and `https://app.qase.io/run/QADEMO/dashboard/1`.
```

---

## 7. Core Framework & Orchestration Code

### 7.1 Knowledge Base Templates (`/docs/kb/`)

#### `docs/kb/app-map.md`
```markdown
# Application Route & Page Object Map

| Feature Area | URL Pattern | Page Object Class | Fixture Name |
| :--- | :--- | :--- | :--- |
| Login | `/login` | `src/pages/LoginPage.ts` | `loginPage` |
| Signup | `/signup` | `src/pages/SignupPage.ts` | `signupPage` |
| Catalog | `/catalog` | `src/pages/CatalogPage.ts` | `catalogPage` |
| Product | `/products/:slug` | `src/pages/ProductDetailPage.ts` | `productDetailPage` |
| Cart | `/cart` | `src/pages/CartPage.ts` | `cartPage` |
| Checkout | `/checkout` | `src/pages/CheckoutPage.ts` | `checkoutPage` |
| Orders | `/orders` | `src/pages/OrdersPage.ts` | `ordersPage` |
| Order detail | `/orders/:id` | `src/pages/OrderDetailPage.ts` | `orderDetailPage` |
| Admin | `/admin` | `src/pages/AdminPage.ts` | `adminPage` |
```

#### `docs/kb/domain-glossary.md`
```markdown
# Domain Glossary & Test Conventions

## Personas
- **Shared customer** ("shopper", "signed-up customer"): Created by global setup. Specs call `loadSignedUpUser()` inside the test and sign in through `loginPage`.
- **New visitor**: `createSignupAccount()`. Used by signup specs and by WebMCP tests that mutate a cart. Does not replace `customer.json`.
- **Seeded standard user**: `standard_user` / `standard123`. Only the seeded login test.
- **Locked user**: `locked_user` / `locked123`.
- **Admin**: `admin_user`. Password is `$Admin` plus the local date as `DDMMYYYY`.

## Qase
- Project code: `QADEMO`.
- Case URL: `https://app.qase.io/case/QADEMO-<id>`.
- Automated results append to run 1: `https://app.qase.io/run/QADEMO/dashboard/1`.
- A case title `FR-ORD-002: Signed-up customer - orders page displays order history after placing order` requires describe text that contains `FR-ORD-002` and a test title equal to the text after `: `.

## Business terms
- **"Place order"**: Checkout with `VALID_SHIPPING` and card `4242424242424242`.
- **"Sign in"**: Username or email plus password. The submit control is the main-content button whose name matches `/^Sign in$/i`.
```

### 7.2 Automated AST POM Indexer (`scripts/generate-pom-index.ts`)

Scans `src/pages/` with the TypeScript compiler API and writes `docs/kb/pom-index.md`, so `agy` can see existing classes, locators, and methods without reading every file.

```typescript
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const PAGES_DIR = path.resolve(__dirname, '../src/pages');
const OUTPUT_FILE = path.resolve(__dirname, '../docs/kb/pom-index.md');

function generatePomIndex(): void {
  const files = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith('.ts'));
  const lines: string[] = [
    '# Auto-Generated Page Object Model (POM) Index',
    '> DO NOT EDIT MANUALLY. Generated via `npm run index:pom`.',
    '',
  ];

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const sourceText = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);

    sourceFile.forEachChild((node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;

      lines.push(`## \`${node.name.text}\` (\`src/pages/${file}\`)`);
      const locators: string[] = [];
      const methods: string[] = [];

      node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member) && member.name) {
          locators.push(`\`${member.name.getText(sourceFile)}\``);
        }
        if (ts.isMethodDeclaration(member) && member.name) {
          const params = member.parameters
            .map((param) => `${param.name.getText(sourceFile)}: ${param.type ? param.type.getText(sourceFile) : 'unknown'}`)
            .join(', ');
          methods.push(`- \`${member.name.getText(sourceFile)}(${params})\``);
        }
      });

      lines.push(`- **Locators**: ${locators.join(', ') || 'None'}`);
      lines.push('- **Methods**:');
      lines.push(...(methods.length ? methods : ['  - None']));
      lines.push('');
    });
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf-8');
  console.log(`Updated POM index at ${OUTPUT_FILE}`);
}

generatePomIndex();
```

### 7.3 Outer CLI Batch Orchestrator (`scripts/automate-cli.ts`)

Resolves one Qase case, every case in a suite, or every case on a plan. It then runs pre-flight setup and invokes headless `agy -p`, falling back from Flash to Pro when the first pass fails.

List endpoints:

- One case: `GET https://api.qase.io/v1/case/QADEMO/{id}`
- Suite: `GET https://api.qase.io/v1/case/QADEMO?suite_id={id}&limit=100&offset={n}`
- Plan: `GET https://api.qase.io/v1/plan/QADEMO/{id}` and read `result.cases`

The header is `Token: <QASE_API_TOKEN>`. The orchestrator never prints the token.

```typescript
import { spawnSync } from 'child_process';
import { parseArgs } from 'util';

const API = 'https://api.qase.io/v1';
const PROJECT = 'QADEMO';

interface QaseListResponse {
  result?: {
    entities?: Array<{ id: number }>;
    cases?: Array<number | { case_id?: number; id?: number }>;
  };
}

interface AgyJsonResponse {
  conversation_id: string;
  response: string;
  stats?: {
    input_tokens: number;
    output_tokens: number;
    cached_tokens?: number;
  };
}

async function qaseGet(token: string, pathname: string): Promise<QaseListResponse> {
  const response = await fetch(`${API}${pathname}`, {
    headers: { Token: token, Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Qase ${pathname} failed with HTTP ${response.status}`);
  }
  return (await response.json()) as QaseListResponse;
}

async function fetchCaseIdsFromSuite(token: string, suiteId: string): Promise<number[]> {
  const ids: number[] = [];
  let offset = 0;
  for (;;) {
    const payload = await qaseGet(token, `/case/${PROJECT}?suite_id=${suiteId}&limit=100&offset=${offset}`);
    const entities = payload.result?.entities ?? [];
    ids.push(...entities.map((item) => item.id));
    if (entities.length < 100) break;
    offset += 100;
  }
  return ids;
}

async function fetchCaseIdsFromPlan(token: string, planId: string): Promise<number[]> {
  const payload = await qaseGet(token, `/plan/${PROJECT}/${planId}`);
  return (payload.result?.cases ?? []).map((item) => (typeof item === 'number' ? item : item.case_id ?? item.id ?? 0)).filter((id) => id > 0);
}

function runCommand(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function invokeAntigravityAgent(caseId: number, model: string): boolean {
  console.log(`[Automate] Running agy headless for QADEMO-${caseId} using model: ${model}...`);
  const prompt = `Use the automate skill to implement, verify, and raise a PR for Qase case ${caseId} in project QADEMO. Keep the case title unchanged and append results to run 1.`;

  const result = spawnSync(
    'agy',
    ['-p', prompt, '--model', model, '--output-format', 'json'],
    { encoding: 'utf-8', env: process.env, maxBuffer: 50 * 1024 * 1024 }
  );

  if (result.status !== 0) {
    console.warn(`[Automate] Model ${model} failed on QADEMO-${caseId}.`);
    return false;
  }

  try {
    const parsed = JSON.parse(result.stdout) as AgyJsonResponse;
    console.log(`[Automate] Completed QADEMO-${caseId} (Session: ${parsed.conversation_id})`);
    if (parsed.stats) {
      console.log(
        `[Telemetry] Tokens - In: ${parsed.stats.input_tokens}, Cached: ${parsed.stats.cached_tokens ?? 0}, Out: ${parsed.stats.output_tokens}`
      );
    }
  } catch {
    console.log(result.stdout);
  }

  return true;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      case: { type: 'string' },
      suite: { type: 'string' },
      plan: { type: 'string' },
    },
  });

  const token = process.env.QASE_API_TOKEN || process.env.QASE_TESTOPS_API_TOKEN;
  if (!token) {
    console.error('Set QASE_API_TOKEN. The same secret may be stored as QASEToken in .env for Playwright.');
    process.exit(1);
  }

  let caseIds: number[] = [];
  if (values.case) {
    caseIds = [Number(values.case)];
  } else if (values.suite) {
    console.log(`Fetching cases from QADEMO suite ${values.suite}...`);
    caseIds = await fetchCaseIdsFromSuite(token, values.suite);
  } else if (values.plan) {
    console.log(`Fetching cases from QADEMO plan ${values.plan}...`);
    caseIds = await fetchCaseIdsFromPlan(token, values.plan);
  } else {
    console.error('Usage: automate-cli --case <ID> | --suite <SuiteID> | --plan <PlanID>');
    process.exit(1);
  }

  console.log('Running pre-flight customer setup and POM indexer...');
  runCommand('npx', ['playwright', 'test', 'tests/auth.setup.ts', '--project=setup']);
  runCommand('npm', ['run', 'index:pom']);

  for (const caseId of caseIds) {
    console.log(`\n========================================`);
    console.log(`Starting Automate Agent for QADEMO-${caseId}`);
    console.log(`========================================\n`);

    const flashSuccess = invokeAntigravityAgent(caseId, 'gemini-3.5-flash');
    if (flashSuccess) continue;

    console.log(`[Fallback] Resetting the working tree and escalating QADEMO-${caseId} to gemini-3.5-pro...`);
    spawnSync('git', ['reset', '--hard', 'HEAD'], { stdio: 'inherit' });
    spawnSync('git', ['clean', '-fd'], { stdio: 'inherit' });

    const proSuccess = invokeAntigravityAgent(caseId, 'gemini-3.5-pro');
    if (!proSuccess) {
      console.error(`[Fatal] QADEMO-${caseId} failed on both Flash and Pro.`);
      process.exit(1);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Automate failed.');
  process.exit(1);
});
```

---

## 8. Security, Cost Optimization & Resilience

1. **Prompt prefix caching.** `GEMINI.md`, `.agents/rules/playwright-standards.md`, and `docs/kb/*.md` stay at the front of the prompt across tool calls, so Antigravity can reuse Gemini's context cache during long `browser_snapshot` loops.
2. **Flash first, Pro on failure.** Ordinary UI flows run on `gemini-3.5-flash`. When local verification fails, `automate-cli.ts` resets the working tree and reruns that case on `gemini-3.5-pro`.
3. **Terminal sandbox.** `"enableTerminalSandbox": true` confines `npx playwright test` and `npx tsc` to the workspace. The deny list blocks reading `.env` and `playwright/.auth/`.
4. **One Qase run.** Shards and local verifies all append to run 1. The reporter is configured with `complete: false`, so a pipeline does not close that run or open another one.
5. **Token handling.** `QASE_API_TOKEN` is the MCP credential. Playwright also accepts `QASE_TESTOPS_API_TOKEN` and a `QASEToken` line in `.env`. None of these values are written into specs, logs, or the pull request body.
