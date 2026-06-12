# Forecast Workbench — System Under Test Design

Date: 2026-06-11
Status: Approved (autonomous run per task brief)

## Goal

Build a realistic frontend system-under-test (SUT) plus a clean, maintainable
Playwright automation framework around it, reusing the architecture patterns of
the existing test framework in this repo. The result must be fully runnable
locally with mock data and no secrets.

## Repo layout

```
IBG/
├── apps/workbench/   # SUT: Vite + React + TypeScript forecasting app
├── e2e/              # Playwright framework (TypeScript)
├── docs/specs/       # this document
└── README.md         # project overview, run instructions
```

`ibg-testscripts-playwright/` (the legacy framework) is left untouched and will
be removed by the repo owner later. Nothing new depends on it; its _patterns_
(custom test-hook fixture, PageFactory, setup projects with storageState,
JSON test data, tagged tests) are re-implemented cleanly in `e2e/`.

## The app: Forecast Workbench

A financial forecasting tool. Finance users ("inputters") build forecast
scenarios for an organisation, edit driver values in a KPI grid, run
calculations, and submit for review. Reviewers approve or request changes.

### Domain model

- **Organisation** — business unit owning forecasts (seeded: 3 orgs).
- **Driver** — a metric row in the grid. `input` (editable) or `calculated`.
- **Scenario** — a named forecast for one org over 6 months (2026-01..2026-06):
  `id, orgId, name, type (SANDBOX|BUDGET), status, visibleDrivers, values, reviewComment, createdBy`.

### Calculation rules (pure engine, unit-tested)

```
GMV                 = Units × AUR            (per month)
Net Sales           = GMV − Returns
Contribution Margin = Net Sales − Marketing Spend
Total column        = sum of months          (per driver row)
```

### Validation rules

- Units: integer ≥ 0
- AUR: number > 0
- Returns / Marketing Spend: number ≥ 0
- Net Sales must not be negative in any month — blocks Save
- Scenario name: required, unique per org
- Review "request changes" requires a comment

### Workflow state machine

```
DRAFT ──submit──▶ IN_REVIEW ──approve──▶ APPROVED (read-only)
                      │
                      └──request changes──▶ CHANGES_REQUESTED ──submit──▶ IN_REVIEW
```

### Roles & permissions (mock auth)

| User | Role     | Can                                                  |
| ---- | -------- | ---------------------------------------------------- |
| ines | inputter | create/edit/delete DRAFT & CHANGES_REQUESTED, submit |
| ravi | reviewer | open IN_REVIEW read-only, approve / request changes  |

Password for all mock users: `demo123` (mock data, documented, not a secret).
Session stored in `localStorage` (`fw:session`); app data in `fw:data`,
seeded deterministically on first load.

### Pages / routes

- `/login` — mock login form
- `/orgs` — organisation selection (cards)
- `/orgs/:orgId` — forecast list: status badges, create / rename / delete / submit / review entry
- `/forecasts/:id` — KPI grid: editable inputs, Calculate, Save, Add Drivers modal, workflow actions

## E2E framework design

```
e2e/
├── playwright.config.ts        # webServer boots the app; projects: setup → workbench
├── package.json / tsconfig.json
├── .auth/                      # storageState files (gitignored)
└── tests/
    ├── common/
    │   ├── fixtures/test-hook.ts      # test.extend: pageFactory + seeded data fixture
    │   ├── fixtures/data-factory.ts   # deterministic scenario builders
    │   └── pages/page-factory.ts      # entry to all page objects
    ├── workbench/
    │   ├── pages/                     # login, org-selection, forecast-list, forecast-grid,
    │   │   …                          # create-forecast.modal, add-driver.modal
    │   ├── testdata/*.json
    │   └── testcases/*.spec.ts
    └── auth.setup.ts                  # logs in inputter + reviewer, saves storage states
```

Key decisions:

- **webServer** in config starts Vite dev server; `reuseExistingServer` locally.
- **Setup project** mirrors legacy `ui-setup`: logs in via UI once per role,
  saves `storageState` — specs start authenticated.
- **Isolation**: each test seeds its own scenario through `page.addInitScript`
  (data-factory output written into `fw:data` before app load). No shared
  mutable state between tests; fresh browser context per test = fresh storage.
- **Locators**: `getByRole` / `getByLabel` / `getByTestId` only.
- **No sleeps**: web-first assertions only.
- **Tags**: `@smoke` on the critical paths; `npm run test:smoke` greps them.

## Test coverage

1. login.spec — invalid creds error; valid login lands on org selection
2. create-forecast.spec — create (DRAFT badge), required name, duplicate name, delete
3. grid-calculation.spec — edit Units → Calculate → GMV/Net Sales correct; totals; Save persists across reload
4. validation.spec — bad inputs rejected; negative Net Sales blocks Save
5. add-driver.spec — search drivers, add Marketing Spend + Contribution Margin rows
6. workflow.spec — submit → reviewer approves → read-only; request changes → comment surfaces, editable again

Plus Vitest unit tests for `calc.ts` and `validation.ts` (TDD: engine written
test-first).

## Out of scope (YAGNI)

Real backend, network mocking layer, allocation methods, snapshots, saved
views, Excel add-in, i18n, visual regression.
