# Testing Strategy

## Test pyramid

| Level               | Tool       | Count | What it proves                                                                                     |
| ------------------- | ---------- | ----- | -------------------------------------------------------------------------------------------------- |
| Unit (domain)       | Vitest     | 57    | Business rules: calculation, validation, workflow transitions, listing/aggregation, store behavior |
| E2E (user journeys) | Playwright | 54    | The UI wires those rules into real user-visible behavior, across roles and viewports               |

Business rules are proven once, fast, at the unit level (the app's domain
layer is pure TypeScript, written test-first). Playwright specs assert
user-visible behavior and integration — they re-verify the math only through
the **independent oracle** (see `docs/test-data-strategy.md`), never by
trusting the app's own output.

## Tag taxonomy

| Tag              | Meaning                                                                                          | When it runs                           |
| ---------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `@smoke`         | Critical-path gate: login, create, calculate, full approval lifecycle, dashboard, mobile journey | Every CI run (`npm run test:smoke`)    |
| `@regression`    | Full behavioral coverage                                                                         | Full suite runs                        |
| `@workflow`      | Multi-step, multi-actor business processes                                                       | Subset selection                       |
| `@validation`    | Input and business-rule validation                                                               | Subset selection                       |
| `@network`       | Mocked API behavior: failures, latency, conflicts, payload contracts                             | Subset selection                       |
| `@accessibility` | Keyboard operability + ARIA semantics                                                            | Subset selection                       |
| `@visual`        | Screenshot baselines for three stable seeded views                                               | Manual (`--grep @visual`) or scheduled |
| `@mobile`        | Responsive coverage — routed to the `mobile-chrome` project                                      | Mobile project only                    |

Selection examples:

```bash
npm run test:smoke                                  # @smoke across projects
npx playwright test --grep @network                 # one dimension
npx playwright test --grep "@workflow|@validation"  # union
npx playwright test --project=mobile-chrome         # by project
```

## Isolation rules

1. Every test seeds its own data (`seedScenarios`) — no test reads state
   another test wrote.
2. Every test gets a fresh browser context (Playwright default) — storage
   never leaks.
3. Auth is reused via storage state, but the login _flow_ has its own specs.
4. Multi-actor flows switch users inside one context (shared app data) via
   the `switchUser` helper — deliberate, not accidental sharing.

## What is deliberately not tested with Playwright

- Pure calculation edge cases (unit-tested; e2e asserts one representative
  path per rule).
- Visual pixel diffs for non-seeded (dynamic) pages — baseline stability requires deterministic seeds, which only stable views have.
- The mock API server itself (stateless by design).

## Local debugging

```bash
npm run test:ui --prefix e2e        # Playwright UI mode
npm run test:headed --prefix e2e    # watch the browser
npm run report --prefix e2e         # HTML report of the last run
```

## Visual baselines

Three screenshot tests in `visual.spec.ts` cover stable seeded views: dashboard, forecast list, and approved read-only grid. Baselines are committed next to the spec in `visual.spec.ts-snapshots/` and compared on every full run.

To regenerate after an intentional UI change:

```bash
cd e2e
npx playwright test --grep @visual --update-snapshots --project=desktop-chrome
git add tests/workbench/testcases/visual.spec.ts-snapshots/
git commit -m "chore: update visual baselines"
```

**Platform note:** Baselines are rendered by Chromium on the machine that generated them. If CI (Linux) produces different renders than local (macOS), regenerate on Linux using a temporary CI step or `act`.
