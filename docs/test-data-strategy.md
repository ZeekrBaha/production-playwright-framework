# Test Data Strategy

Deterministic, per-test, oracle-verified. All of it lives in
`e2e/tests/common/fixtures/data-factory.ts`.

## Builders

`buildScenario({ name, status?, inputs?, updatedAt?, reviewComment?, … })`
produces a complete scenario object. Specs state only what matters to them;
everything else gets a stable default. IDs are generated per test run but
referenced through the returned object, never hardcoded.

## Named presets (test states)

Specs reference inputs by _meaning_, not by raw numbers:

| Preset                              | Meaning                                                      |
| ----------------------------------- | ------------------------------------------------------------ |
| `SCENARIO_PRESETS.healthy`          | Passes every business rule (units 100 × AUR 10 − returns 50) |
| `SCENARIO_PRESETS.ramping`          | Month-over-month growth — totals/sorting assertions          |
| `SCENARIO_PRESETS.negativeNetSales` | Returns exceed GMV — Save must be blocked                    |

## Personas

Two mock users with fixed roles (`e2e/tests/common/config/test-env.ts`):
`ines` the inputter, `ravi` the reviewer. The setup project logs each in once
and saves storage state; `switchUser` swaps actors mid-test when a flow
crosses roles. Passwords are mock demo data, not secrets.

## Independent oracle

The factory re-implements the business formulas the app claims to follow:

```
expectedGmv(units, aur)
expectedNetSales(units, aur, returns)
expectedContributionMargin(units, aur, returns, marketingSpend)
asCurrency(value)        // the app's exact display format
```

Grid and dashboard assertions compare the app against these functions, so a
bug in the app's calculation engine cannot silently validate itself. The
duplication between app and test code is intentional — that's what makes it
an oracle.

## Seeding mechanism

The `seedScenarios` fixture writes the test's world into the app's store via
`page.addInitScript` **before** the app boots:

- One-shot per context (guarded by a marker key), so a test that saves and
  reloads keeps its in-test changes.
- Combined with per-test browser contexts, every test owns its universe:
  parallel-safe, order-independent, zero cleanup.

## Determinism rules

1. No randomness in assertions — values come from presets + oracle.
2. No time-dependent assertions — timestamps are fixed in seed data; the
   app's own clock is only used for ordering, which specs assert relatively.
3. The app's built-in seed (used in dev) never leaks into specs that seed
   their own data; specs that rely on it (auth setup) don't assert on its
   contents.
