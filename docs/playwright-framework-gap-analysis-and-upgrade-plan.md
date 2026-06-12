# Playwright Framework Gap Analysis and Upgrade Plan

Date: 2026-06-12
Folder reviewed: `/Users/baha/Desktop/llm-ai-projects/IBG`

## Executive summary

The current work in `IBG` successfully created a meaningful frontend system under test: `Forecast Workbench`. It has real business logic, deterministic mock data, role-based workflows, and a clean Playwright suite.

However, the current implementation is still closer to a **clean demo Playwright framework** than a **production-ready Playwright automation framework portfolio project**.

The strongest value of this project should not be the forecast app itself. The app is only the system under test. The real product should be the framework: architecture, fixtures, isolation, test data strategy, reporting, CI, maintainability, and reusable automation patterns.

Recommended positioning:

> A production-ready Playwright automation framework demonstrated against a realistic Forecast Workbench system under test.

---

## What was built well

### 1. Meaningful system under test

The app is not a toy todo/counter app. It models enterprise forecasting workflows:

- mock login
- organization selection
- forecast creation/deletion
- editable forecast grid
- business calculation rules
- validation rules
- submit/review/approve workflow
- inputter vs reviewer roles

This gives Playwright real business behavior to validate.

### 2. Good domain separation

Business rules live in a pure domain layer:

- `apps/workbench/src/domain/calc.ts`
- `apps/workbench/src/domain/validation.ts`
- `apps/workbench/src/domain/workflow.ts`
- `apps/workbench/src/domain/store.ts`

This is good because fast unit tests can prove core rules, while Playwright tests can focus on user-visible integration behavior.

### 3. Clean initial Playwright structure

The new framework in `e2e/` uses good patterns:

- Playwright config with `webServer`
- setup project for auth
- storage state per role
- Page Object Model
- `PageFactory`
- custom fixture via `test.extend`
- deterministic data factory
- per-test localStorage seeding
- independent expected-value oracle
- smoke tagging
- robust locator style: `getByRole`, `getByLabel`, `getByTestId`
- no obvious arbitrary sleeps

Important files:

- `e2e/playwright.config.ts`
- `e2e/tests/auth.setup.ts`
- `e2e/tests/common/fixtures/test-hook.ts`
- `e2e/tests/common/fixtures/data-factory.ts`
- `e2e/tests/common/pages/page-factory.ts`
- `e2e/tests/workbench/pages/*.ts`
- `e2e/tests/workbench/testcases/*.spec.ts`

### 4. Independent calculation oracle

The test data factory recomputes expected GMV / Net Sales / Contribution Margin separately from the app code. This is a strong QA automation pattern because tests are not simply trusting the implementation under test.

### 5. Typecheck passed

Validated commands:

```bash
cd /Users/baha/Desktop/llm-ai-projects/IBG/apps/workbench
npm run typecheck
```

Result: `tsc --noEmit` passed.

```bash
cd /Users/baha/Desktop/llm-ai-projects/IBG/e2e
npm run typecheck
```

Result: `tsc --noEmit` passed.

Playwright test inventory:

```bash
cd /Users/baha/Desktop/llm-ai-projects/IBG/e2e
npx playwright test --list
```

Result: 27 tests in 7 files.

---

## Main gap

The current project does not yet fully extract or showcase the value of the original production IBG Playwright framework in:

`/Users/baha/Desktop/llm-ai-projects/IBG/ibg-testscripts-playwright`

The original framework contains broader enterprise patterns:

- multiple Playwright projects
- backend and frontend test separation
- API utilities
- environment-based execution
- global setup and teardown
- secrets/storage-state strategy
- reporting integrations
- CI/Looper config
- Excel/API/domain-specific helpers
- workstream-based folder structure
- large test data strategy
- data setup and cleanup utilities
- page factories per domain
- fixtures per app area

The new `e2e/` framework borrows some patterns, but it is still small:

- one SUT
- one functional project
- no API mocking layer
- no contract/API tests
- no visual/accessibility layer
- no CI workflow
- no reporting artifacts beyond default Playwright HTML
- no environment matrix
- no framework architecture documentation beyond README
- no root-level monorepo commands

So the upgrade goal should be:

> Turn this from a working Playwright demo into a reusable production-grade automation framework, with Forecast Workbench serving only as the system under test.

---

## Recommended repository identity

The project should be named around the framework, not the SUT.

Best repo/folder name options:

1. `production-playwright-framework`
2. `playwright-enterprise-framework`
3. `playwright-qa-automation-framework`
4. `playwright-framework-forecast-sut`
5. `forecast-workbench-playwright-framework`
6. `enterprise-playwright-sut-framework`
7. `playwright-test-architecture-lab`
8. `production-ready-playwright-framework`

Recommended name:

```text
production-playwright-framework
```

Why:

- clear and searchable
- framework-first
- not tied too strongly to forecasting
- good GitHub/portfolio positioning

Recommended subtitle:

```text
A production-style Playwright automation framework demonstrated against a realistic Forecast Workbench system under test.
```

If the user wants the SUT domain in the name, use:

```text
forecast-workbench-playwright-framework
```

---

## Recommended clean repo structure

Do not publish the current `/IBG` folder as-is. It mixes new work with the original large enterprise framework and generated artifacts.

Create a clean standalone repo:

```text
/Users/baha/Desktop/llm-ai-projects/production-playwright-framework
```

Suggested structure:

```text
production-playwright-framework/
├── README.md
├── package.json
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   └── forecast-workbench/
│       ├── package.json
│       ├── src/
│       └── vite.config.ts
├── e2e/
│   ├── package.json
│   ├── playwright.config.ts
│   └── tests/
│       ├── common/
│       │   ├── fixtures/
│       │   ├── pages/
│       │   ├── api/
│       │   ├── data/
│       │   └── utils/
│       └── forecast-workbench/
│           ├── pages/
│           ├── testcases/
│           └── testdata/
├── docs/
│   ├── framework-architecture.md
│   ├── testing-strategy.md
│   ├── test-data-strategy.md
│   ├── ci-and-reporting.md
│   ├── sut-design.md
│   └── demo-script.md
└── assets/
    ├── screenshots/
    └── demo.gif
```

---

## What to improve next

### P0 — repo hygiene and positioning

1. Extract the clean project into its own repo/folder.
2. Add root `.gitignore`:

```gitignore
node_modules/
dist/
playwright-report/
test-results/
.auth/
.env
.DS_Store
```

3. Add root package scripts:

```json
{
  "scripts": {
    "install:all": "npm install --prefix apps/forecast-workbench && npm install --prefix e2e",
    "typecheck": "npm run typecheck --prefix apps/forecast-workbench && npm run typecheck --prefix e2e",
    "test:unit": "npm test --prefix apps/forecast-workbench",
    "test:e2e": "npm test --prefix e2e",
    "test:smoke": "npm run test:smoke --prefix e2e",
    "build": "npm run build --prefix apps/forecast-workbench",
    "check": "npm run typecheck && npm run test:unit && npm run build && npm run test:smoke"
  }
}
```

4. Add GitHub Actions CI.
5. Update README so the project is framework-first.

### P1 — production-grade Playwright framework features

Add framework capabilities that demonstrate senior QA/test architecture:

#### 1. Environment/config layer

Add typed config for:

- base URL
- user roles
- test tags
- CI vs local behavior
- browser/project matrix
- mock API mode

Suggested file:

```text
e2e/tests/common/config/test-env.ts
```

#### 2. API mocking layer

Add a mock backend / network interception layer:

- `page.route` handlers
- fixtures for success/error/timeout responses
- request assertions
- network failure simulation

Suggested files:

```text
e2e/tests/common/api/mock-api.ts
e2e/tests/common/api/routes.ts
e2e/tests/common/api/scenario-service.mock.ts
```

This is important because a production Playwright framework should test UI behavior under backend failure modes.

#### 3. Test data management layer

Current `data-factory.ts` is good, but should become a more formal test data framework:

- builders
- named personas
- named organizations
- scenario templates
- state transition helpers
- reset/seeding helpers
- independent calculation oracle

Suggested structure:

```text
e2e/tests/common/data/builders/
e2e/tests/common/data/personas.ts
e2e/tests/common/data/scenario-templates.ts
e2e/tests/common/data/oracles/forecast-oracle.ts
```

#### 4. Reporting and artifacts

Add:

- HTML report
- trace/video/screenshot retain-on-failure
- CI artifact upload
- optional JUnit reporter
- README section showing how to inspect failures

#### 5. Project matrix

Add Playwright projects:

- `setup`
- `desktop-chrome`
- `mobile-chrome`
- `api-contract`
- maybe `visual-smoke`

#### 6. Accessibility checks

Add lightweight accessibility smoke tests using either:

- `@axe-core/playwright`, or
- explicit ARIA/keyboard tests if avoiding dependency bloat

#### 7. Visual/responsive checks

Add screenshot or viewport-based tests:

- dashboard renders cleanly at desktop/mobile
- grid remains usable
- modal layouts are stable

#### 8. Framework docs

Add:

- `docs/framework-architecture.md`
- `docs/testing-strategy.md`
- `docs/test-data-strategy.md`
- `docs/ci-and-reporting.md`
- `docs/demo-script.md`

### P2 — make the SUT richer so the framework can shine

The app is currently good enough, but the framework would look stronger if the SUT had more test-worthy behavior:

- dashboard summary cards
- forecast search/filter/sort
- reviewer queue
- scenario comparison
- copy forecast workflow
- loading states
- error states from mocked API
- audit/activity timeline
- saved views or filters
- chart/trend visualization

Recommended next SUT features:

1. Dashboard page with summary cards and reviewer queue.
2. Forecast list search/filter/sort.
3. Mock API layer instead of localStorage-only persistence.
4. Error/timeout states driven by Playwright route mocks.
5. Mobile smoke flow.

---

## README repositioning

Current README starts with the app:

> Forecast Workbench — App + Playwright Automation Framework

Better framework-first title:

```markdown
# Production Playwright Framework

A production-style Playwright automation framework demonstrated against a realistic Forecast Workbench system under test.
```

Recommended README sections:

1. What this project is
2. Why it exists
3. Framework architecture
4. System under test overview
5. Quick start
6. Test commands
7. Framework patterns demonstrated
8. Test coverage map
9. CI and reporting
10. Screenshots/demo GIF
11. Portfolio/interview talking points
12. Roadmap

Suggested opening:

```markdown
# Production Playwright Framework

This repository showcases a production-style Playwright automation framework: page objects, fixtures, setup-project authentication, deterministic test data, independent business-rule oracles, smoke/regression tagging, CI-ready commands, and failure artifacts.

The framework is demonstrated against Forecast Workbench, a realistic React + TypeScript forecasting application used as the system under test. The app is intentionally local and mock-data driven so the testing architecture can be run anywhere without credentials.
```

---

## Required validation commands after upgrade

Run and report real output:

```bash
npm run install:all
npm run typecheck
npm run test:unit
npm run build
npm run test:smoke
npm run test:e2e
```

Also confirm:

```bash
npx playwright test --list
```

Expected proof points:

- unit tests pass
- typecheck passes
- build passes
- smoke tests pass
- full Playwright suite passes
- CI workflow exists
- reports/artifacts configured

---

## Bottom line

The system under test is good. The app has enough domain behavior to support meaningful tests.

The missing work is to make the project unmistakably about the **Playwright framework**:

- clean repo extraction
- framework-first README/name
- CI
- richer environment/config layer
- API mocking/network layer
- reporting artifacts
- mobile/accessibility/visual coverage
- documentation of testing strategy

Once these are added, the project can be positioned as a strong portfolio piece for senior QA automation / Playwright framework architecture roles.
