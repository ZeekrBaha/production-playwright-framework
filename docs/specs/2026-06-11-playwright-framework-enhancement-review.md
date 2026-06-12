# Playwright Framework Enhancement Review

Date: 2026-06-11
Path reviewed: `/Users/baha/Desktop/llm-ai-projects/IBG`

## Executive summary

Claude built a good **system under test**: `Forecast Workbench`, a Vite + React + TypeScript financial forecasting app with meaningful business rules and a clean Playwright suite around it.

However, the work is currently more of a **demo-sized Playwright framework inspired by IBG** than a true production-grade Playwright framework extraction. The SUT is useful, but the repository positioning should shift: the main product is the **Playwright automation framework**, and the Forecast Workbench app is only the local deterministic SUT used to prove the framework.

Recommended positioning:

> A production-style Playwright automation framework demonstrated against a realistic Forecast Workbench system under test.

## What was built

### New local SUT

Path: `apps/workbench/`

Stack:

- Vite
- React
- TypeScript
- localStorage-backed mock data
- mock auth
- Vitest domain tests

Main pages:

- Login
- Organisation selection
- Forecast list
- Forecast grid

Business behavior:

- Forecast scenario CRUD
- inputter/reviewer roles
- editable driver grid
- derived KPI calculations
- save validation
- submit/approve/request-changes workflow

Core domain files:

- `apps/workbench/src/domain/calc.ts`
- `apps/workbench/src/domain/validation.ts`
- `apps/workbench/src/domain/workflow.ts`
- `apps/workbench/src/domain/store.ts`

### New Playwright framework

Path: `e2e/`

Current framework elements:

- `playwright.config.ts` with webServer
- setup project for UI login
- saved storage state per role
- Page Object Model
- PageFactory
- `test.extend` custom fixture
- deterministic data factory
- per-test localStorage seeding
- independent calculation oracle
- smoke tagging
- robust locators using role/label/test id

Important files:

- `e2e/playwright.config.ts`
- `e2e/tests/auth.setup.ts`
- `e2e/tests/common/fixtures/test-hook.ts`
- `e2e/tests/common/fixtures/data-factory.ts`
- `e2e/tests/common/pages/page-factory.ts`
- `e2e/tests/workbench/pages/*.ts`
- `e2e/tests/workbench/testcases/*.spec.ts`

## Validation performed

Commands run read-only / low-impact:

```bash
cd /Users/baha/Desktop/llm-ai-projects/IBG/apps/workbench
npm run typecheck
```

Result: passed.

```bash
cd /Users/baha/Desktop/llm-ai-projects/IBG/e2e
npm run typecheck
```

Result: passed.

```bash
cd /Users/baha/Desktop/llm-ai-projects/IBG/e2e
npx playwright test --list
```

Result: 27 Playwright tests in 7 files.

Existing `e2e/test-results/.last-run.json` reported:

```json
{
  "status": "passed",
  "failedTests": []
}
```

Full e2e execution was not rerun during this review to avoid modifying reports/test-results.

## What is good

### 1. The SUT is meaningful

The app is not a toy counter/todo. Forecasting gives real workflows:

- calculation rules
- grid editing
- validation
- state transitions
- role permissions
- reviewer feedback loop

This is a good SUT for Playwright because it creates test scenarios that resemble enterprise business applications.

### 2. Domain logic is separated

The business rules live in a pure domain layer and have unit tests. This is a good test-pyramid story:

- fast unit tests for formulas and state machine rules
- e2e tests for user-visible flows

### 3. Page object structure is clean

The new framework has a readable Page Object Model and PageFactory. Specs read as business flows instead of raw selector scripts.

### 4. Auth setup pattern is good

The setup project logs in via UI and stores role-specific storage states. This mirrors production Playwright practice.

### 5. Test data isolation is good

The `seedScenarios` fixture seeds localStorage per test before page load. This gives deterministic isolated tests without cleanup.

### 6. Independent oracle is strong

The test data factory recomputes expected values separately from the app. This prevents tests from simply trusting the app's implementation.

## What is weak or missing

### 1. The framework is too small compared to the original IBG framework

The original `ibg-testscripts-playwright` framework contains production-style features not yet represented in the new `e2e/` framework:

- multiple FE/BE projects
- API utilities
- global setup/teardown
- environment matrix
- tag-based execution across workstreams
- secret/storage-state management
- reporting integrations
- CI/Looper integration
- Excel/API/domain-specific helper layers
- larger test data strategy

The new framework borrows the cleanest concepts, but it does not yet demonstrate the full production-grade depth.

### 2. The project is positioned around the SUT, not the framework

Current README title:

> Forecast Workbench — App + Playwright Automation Framework

This makes the app sound primary. The user's portfolio goal is the opposite: the Playwright framework is the main asset, and the app is just the test target.

Better framing:

> Production-Ready Playwright Framework — Forecast Workbench SUT

### 3. Repo boundary is messy

The current folder mixes:

- new portfolio project
- legacy enterprise IBG repo
- generated dist
- node_modules
- Playwright reports
- auth storage state

The root `/Users/baha/Desktop/llm-ai-projects/IBG` is not itself a clean Git repo. The legacy `ibg-testscripts-playwright` folder is a separate dirty git repo with many modified files.

This should not be published as-is.

### 4. Missing CI

A QA automation portfolio project needs CI. Current project lacks a GitHub Actions workflow proving:

- app typecheck
- app unit tests
- app build
- e2e typecheck
- Playwright smoke tests
- report artifact upload

### 5. Missing API/network layer

Because the app is localStorage-only, the framework does not yet showcase:

- `page.route`
- API mocking
- backend failure simulation
- request/response assertions
- contract-style fixture strategy

A production Playwright framework should include this.

### 6. Missing visual/a11y/mobile dimensions

Current framework is desktop-only and functional-only. Recommended additions:

- mobile project
- visual smoke or screenshot comparison
- accessibility smoke checks
- responsive tests

### 7. Missing framework documentation depth

Current docs explain the app and basic framework structure, but need deeper framework-first documentation:

- framework architecture
- test strategy
- locator strategy
- data isolation strategy
- auth strategy
- CI strategy
- environment strategy
- reporting strategy
- comparison to legacy IBG patterns

## Recommended repo/folder name

Because the portfolio goal is Playwright framework first, not SUT first, avoid naming the repo only after Forecast Workbench.

Best options:

1. `production-playwright-framework`
   - clearest signal
   - searchable
   - framework-first

2. `playwright-enterprise-framework`
   - emphasizes enterprise patterns
   - slightly more ambitious sounding

3. `playwright-framework-forecast-sut`
   - explicit that Forecast Workbench is the SUT
   - good technical accuracy

4. `forecast-workbench-playwright-framework`
   - balances app + framework
   - useful if you want the forecasting domain visible

5. `enterprise-playwright-sut-framework`
   - abstract but accurate

Recommended final name:

`production-playwright-framework`

Recommended README title:

# Production-Ready Playwright Framework

Subtitle:

> Enterprise-style Playwright automation framework demonstrated against a realistic Forecast Workbench system under test.

Recommended GitHub description:

> Production-style Playwright test automation framework with Page Objects, fixtures, storage-state auth, deterministic test data, CI-ready smoke/regression suites, and a realistic Forecast Workbench SUT.

## Recommended clean repo structure

Create a new standalone folder/repo instead of publishing the whole current `IBG` folder:

```text
production-playwright-framework/
├── apps/
│   └── forecast-workbench/          # local SUT only
├── e2e/
│   ├── playwright.config.ts
│   └── tests/
│       ├── common/
│       └── forecast-workbench/
├── docs/
│   ├── framework-architecture.md
│   ├── testing-strategy.md
│   ├── ci-strategy.md
│   └── sut-business-rules.md
├── .github/
│   └── workflows/
│       └── playwright.yml
├── README.md
├── package.json
└── .gitignore
```

Do not include:

- `ibg-testscripts-playwright/`
- `node_modules/`
- `dist/`
- `playwright-report/`
- `test-results/`
- `.auth/`
- real/enterprise secret files

## Improvement backlog

### P0 — make it GitHub-ready

1. Extract into a clean standalone repo/folder named `production-playwright-framework`.
2. Add root `.gitignore`.
3. Add root `package.json` orchestration scripts.
4. Add GitHub Actions CI.
5. Rewrite README framework-first.
6. Add screenshots/GIF or at least documented demo flow.

### P1 — make it production-grade

1. Add API mocking layer using Playwright `page.route` or MSW.
2. Add backend error/timeout tests.
3. Add mobile Playwright project.
4. Add accessibility smoke checks.
5. Add visual smoke checks.
6. Add richer tagging strategy: `@smoke`, `@regression`, `@workflow`, `@validation`, `@readonly`, `@api-mock`.
7. Add report artifact upload in CI.
8. Add environment config strategy: local/ci/staging style config with no secrets.

### P2 — make it portfolio-polished

1. Add architecture diagrams.
2. Add comparison table vs legacy IBG framework patterns.
3. Add `docs/demo-script.md` for interviews.
4. Add `CHANGELOG.md`, `LICENSE`, and `CONTRIBUTING.md`.
5. Add dashboard page with summary cards/charts.
6. Add forecast search/filter/sort.
7. Add reviewer queue and audit/activity log.

## README rewrite direction

The README should not lead with “Forecast Workbench app.” It should lead with the framework.

Suggested README outline:

```markdown
# Production-Ready Playwright Framework

Enterprise-style Playwright automation framework demonstrated against a realistic Forecast Workbench system under test.

## Why this project exists

This repo showcases how I design scalable QA automation frameworks: page objects, fixtures, storage-state auth, deterministic test data, independent oracles, CI-ready smoke suites, and business-flow coverage.

## What is included

- Playwright framework
- Forecast Workbench SUT
- Unit-tested business logic
- E2E tests
- CI pipeline

## Framework architecture

## System under test

## Test strategy

## Running locally

## CI

## Portfolio talking points
```

## Final assessment

Claude built a solid base. The SUT is good. The Playwright framework is clean. But the next job should shift the project from **app demo** to **framework portfolio product**.

The strongest next step is to extract this into a clean repo named `production-playwright-framework`, rewrite README/docs framework-first, add CI, and extend the framework with API mocking, mobile/a11y/visual coverage, and richer reporting.
