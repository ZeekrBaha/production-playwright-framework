# System Under Test: Forecast Workbench

A realistic React + TypeScript forecasting application built specifically to
exercise the Playwright framework. Local, mock-data driven, zero credentials.

## Why a custom SUT

Public demo sites are unstable, rate-limited, and can't demonstrate
multi-role workflows, network failure handling, or deterministic data
seeding. Forecast Workbench is shaped like a real enterprise FP&A tool —
stateful workflows, editable grids, calculation rules, role-based
permissions — so the tests have something worth testing.

## Architecture

```
apps/workbench/src/
├── domain/        pure business logic (unit-tested, no React imports)
│   ├── calc.ts          GMV / Net Sales / Contribution Margin engine
│   ├── validation.ts    cell rules + save-blocking business rules
│   ├── workflow.ts      DRAFT → IN_REVIEW → APPROVED state machine
│   ├── listing.ts       search / filter / sort
│   ├── dashboard.ts     portfolio aggregation + role queues
│   ├── store.ts         localStorage repository + activity log
│   └── seed.ts          deterministic demo data
├── api/client.ts  HTTP client — real fetch round trips to the mock API
├── pages/         Login, Dashboard, OrgSelection, ForecastList, ForecastGrid
└── components/    modals (Create, Copy, Compare, AddDriver), badges
```

The mock API (a Vite middleware, `vite.config.ts`) is **stateless**: it
acknowledges commands while the client owns state — an offline-first shape.
That gives Playwright a real network surface to intercept (failures, delays,
conflicts, payload capture) while keeping the whole system deterministic
and runnable anywhere.

## Business rules

- `GMV = Units × AUR` · `Net Sales = GMV − Returns` ·
  `Contribution Margin = Net Sales − Marketing Spend`
- Units: integer ≥ 0 · AUR > 0 · currency drivers ≥ 0
- Negative Net Sales in any month blocks Save, naming the month
- Scenario names: required, ≤ 60 chars, unique per organisation
- Workflow: `DRAFT → IN_REVIEW → APPROVED | CHANGES_REQUESTED → IN_REVIEW`
- Approved forecasts are read-only; request-changes requires a comment
- Copying preserves values/drivers, resets to DRAFT, clears review comments
- Every meaningful action writes an activity event (audit trail)

## Roles

| User   | Role     | Permissions                                      |
| ------ | -------- | ------------------------------------------------ |
| `ines` | inputter | create / edit / copy / delete drafts, submit     |
| `ravi` | reviewer | open reviews read-only, approve, request changes |

Password for both demo accounts: `demo123` (mock data, not a secret).

## Running it standalone

```bash
cd apps/workbench
npm install
npm run dev     # http://localhost:5173
```
