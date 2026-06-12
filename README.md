# Production Playwright Framework

![CI](https://github.com/ZeekrBaha/production-playwright-framework/workflows/CI/badge.svg)

This repository showcases a production-style Playwright automation framework: page objects, fixtures, setup-project authentication, deterministic test data, independent business-rule oracles, smoke/regression tagging, CI-ready commands, and failure artifacts.

The framework is demonstrated against **Forecast Workbench**, a realistic React + TypeScript forecasting application used as the system under test. The app is intentionally local and mock-data driven so the testing architecture can be run anywhere without credentials.

```
├── apps/workbench/        # System under test (Vite + React + TypeScript)
├── e2e/                   # Playwright framework (TypeScript)
├── docs/                  # Framework, strategy, and demo documentation
└── .github/workflows/     # CI pipeline
```

## Why this exists

Most test-automation portfolios point at a public demo site, which can't show
the hard parts: multi-role workflows, deterministic data isolation, network
failure handling, payload contract assertions, or CI artifact strategy. This
project owns both sides — a system under test with real business rules, and a
framework engineered around it — so every framework pattern is demonstrated
against behavior that actually warrants it.

## Framework architecture

```
e2e/
├── playwright.config.ts            projects: setup → desktop-chrome / mobile-chrome
└── tests/
    ├── auth.setup.ts               UI login once per role → storageState
    ├── common/                     framework layer
    │   ├── config/test-env.ts      typed environment (base URL, CI, users)
    │   ├── api/mock-api.ts         network interception: fail / delay / capture
    │   ├── fixtures/test-hook.ts   test.extend: pageFactory + seedScenarios
    │   ├── fixtures/data-factory.ts  builders, named presets, independent oracle
    │   ├── fixtures/roles.ts       multi-actor user switching
    │   └── pages/page-factory.ts   single entry point to all page objects
    └── workbench/                  application layer
        ├── pages/                  one page object per screen/modal (9)
        └── testcases/              15 spec files, 55 tests
```

Deep dives: [framework architecture](docs/framework-architecture.md) ·
[testing strategy](docs/testing-strategy.md) ·
[test data strategy](docs/test-data-strategy.md) ·
[CI and reporting](docs/ci-and-reporting.md) ·
[system under test](docs/system-under-test.md) ·
[demo script](docs/demo-script.md) · [roadmap](docs/roadmap.md)

## The system under test

Forecast Workbench models an enterprise FP&A tool: finance users build
forecast scenarios, edit driver values in a KPI grid
(`GMV = Units × AUR`, `Net Sales = GMV − Returns`), run calculations, and
submit for review; reviewers approve or request changes. It ships with a
dashboard (portfolio KPIs, role-based queues, activity feed), list
search/filter/sort, scenario copy and comparison, an audit trail, and a
stateless mock API that gives tests a real network surface.

Demo accounts (mock data, not secrets): `ines` (inputter), `ravi`
(reviewer), password `demo123`.

> **Security note:** Auth in this SUT is intentionally mock-insecure — credentials
> checked client-side, sessions stored in `localStorage`. This is by design for an
> isolated local demo with fake data. Never use this pattern in a real application.

## Quick start

```bash
npm run install:all                 # installs app + e2e dependencies
npx playwright install chromium     # first time only (run inside e2e/)
npm run check                       # typecheck → unit tests → build → smoke
```

Run the app interactively:

```bash
cd apps/workbench && npm run dev    # http://localhost:5173
```

## Test commands

| Command (repo root)  | What it runs                                   |
| -------------------- | ---------------------------------------------- |
| `npm run check`      | Full local gate: typecheck, unit, build, smoke |
| `npm run typecheck`  | `tsc --noEmit` for app and e2e                 |
| `npm run test:unit`  | 57 Vitest tests on the domain layer            |
| `npm run build`      | Production Vite build                          |
| `npm run test:smoke` | `@smoke` paths on desktop + mobile projects    |
| `npm run test:e2e`   | Full Playwright suite (54 tests, ~7s)          |

Inside `e2e/`: `npm run test:ui` (UI mode), `npm run test:headed`,
`npm run report`, or any tag slice, e.g.
`npx playwright test --grep @network`.

## Framework patterns demonstrated

- **Setup-project authentication** — log in through the real UI once per
  role, persist `storageState`, every spec starts authenticated
- **Per-test data seeding** — each test injects exactly its own scenarios
  before app boot; parallel-safe, order-independent, zero cleanup
- **Independent oracle** — specs recompute expected values with their own
  implementation of the business math; the app never grades its own homework
- **Network interception layer** — simulate 500s, 409 conflicts, latency;
  assert request payloads (submit/approve contracts)
- **Project matrix** — desktop and mobile (Pixel 7) Chrome projects sharing
  specs and page objects
- **Tag taxonomy** — `@smoke` `@regression` `@workflow` `@validation`
  `@network` `@accessibility` `@mobile`
- **Multi-actor flows** — same-context user switching for submit → review →
  approve journeys
- **Robust locators only** — `getByRole` / `getByLabel` / `getByTestId`;
  no sleeps, web-first assertions throughout
- **Failure artifacts** — trace, video, screenshot retained on failure,
  uploaded by CI

## Test coverage map

| Spec                       | Tags              | Covers                                                                 |
| -------------------------- | ----------------- | ---------------------------------------------------------------------- |
| `login.spec.ts`            | regression, smoke | Auth, route guarding, sign-out                                         |
| `dashboard.spec.ts`        | regression, smoke | KPI aggregation, role queues, empty states                             |
| `forecast-list.spec.ts`    | regression        | Search, status filter, sorting, empty filter state                     |
| `create-forecast.spec.ts`  | regression, smoke | CRUD, name validation, role permissions                                |
| `copy-forecast.spec.ts`    | workflow          | Copy semantics: values preserved, DRAFT reset, comment cleared         |
| `grid-calculation.spec.ts` | regression, smoke | Calculation math, totals roll-up, persistence across reload            |
| `validation.spec.ts`       | validation, smoke | Cell rules, negative-Net-Sales save block                              |
| `add-driver.spec.ts`       | regression, smoke | Driver search, add/remove rows, derived math                           |
| `compare.spec.ts`          | regression        | Cross-scenario deltas, target validation, read-only compare            |
| `workflow.spec.ts`         | workflow, smoke   | Full submit → approve lifecycle, request-changes loop, guards          |
| `activity.spec.ts`         | workflow          | Audit events for submit/approve/request-changes                        |
| `network.spec.ts`          | network           | Save failure keeps edits, busy states, 409 conflict, payload contracts |
| `accessibility.spec.ts`    | accessibility     | Keyboard-only login, ARIA names, alert announcements                   |
| `mobile.spec.ts`           | mobile, smoke     | Core journey on a phone viewport                                       |

Plus 57 Vitest unit tests on the pure domain layer (calc, validation,
workflow, listing, dashboard, store) — written test-first.

## CI and reporting

GitHub Actions (`.github/workflows/ci.yml`): install → typecheck → unit
tests → build → Playwright smoke (desktop + mobile) → HTML report uploaded
always, traces/videos on failure. `npm run check` mirrors the pipeline
locally. Details in [docs/ci-and-reporting.md](docs/ci-and-reporting.md).

## Portfolio / interview talking points

1. **Test pyramid in practice** — 57 fast unit tests own the business rules;
   e2e owns user journeys and integration.
2. **Isolation strategy** — per-test seeding via `addInitScript` + per-test
   contexts; why that eliminates flake, ordering bugs, and cleanup code.
3. **Oracle independence** — duplicated business math is a feature, not a
   smell.
4. **Network testing without a backend** — a stateless mock API still gives
   real interception, failure paths, and payload contracts.
5. **Multi-role workflow testing** — same-context user switching to share
   app state across actors.
6. **Suite design** — tags × projects as two orthogonal selection axes.

A 3-minute walkthrough script lives in [docs/demo-script.md](docs/demo-script.md).

## Roadmap

Visual smoke for stable views, axe-core scan, API-contract project, nightly
full-regression workflow, repo extraction. Reasoning and ordering in
[docs/roadmap.md](docs/roadmap.md).

## Note on this folder

This workspace also contains `ibg-testscripts-playwright/` — a legacy
framework kept locally as a pattern reference. It is gitignored and not part
of the project; everything above is self-contained in `apps/`, `e2e/`, and
`docs/`. When publishing, either `git init` here (the `.gitignore` already
excludes the legacy folder) or copy the four tracked paths into a fresh repo.
