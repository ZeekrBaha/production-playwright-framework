# Testing Strategy

## Test pyramid

| Level | Tool | Count | What it proves |
|---|---|---|---|
| Unit (domain) | Vitest | 57 | Business rules: calculation, validation, workflow transitions, listing/aggregation, store behavior |
| E2E (user journeys) | Playwright | 54 | The UI wires those rules into real user-visible behavior, across roles and viewports |

Business rules are proven once, fast, at the unit level (the app's domain
layer is pure TypeScript, written test-first). Playwright specs assert
user-visible behavior and integration — they re-verify the math only through
the **independent oracle** (see `docs/test-data-strategy.md`), never by
trusting the app's own output.

## Tag taxonomy

| Tag | Meaning | When it runs |
|---|---|---|
| `@smoke` | Critical-path gate: login, create, calculate, full approval lifecycle, dashboard, mobile journey | Every CI run (`npm run test:smoke`) |
| `@regression` | Full behavioral coverage | Full suite runs |
| `@workflow` | Multi-step, multi-actor business processes | Subset selection |
| `@validation` | Input and business-rule validation | Subset selection |
| `@network` | Mocked API behavior: failures, latency, conflicts, payload contracts | Subset selection |
| `@accessibility` | Keyboard operability + ARIA semantics | Subset selection |
| `@mobile` | Responsive coverage — routed to the `mobile-chrome` project | Mobile project only |

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
3. Auth is reused via storage state, but the login *flow* has its own specs.
4. Multi-actor flows switch users inside one context (shared app data) via
   the `switchUser` helper — deliberate, not accidental sharing.

## What is deliberately not tested with Playwright

- Pure calculation edge cases (unit-tested; e2e asserts one representative
  path per rule).
- Visual pixel diffs (roadmap — needs a stable baseline strategy first).
- The mock API server itself (stateless by design).

## Local debugging

```bash
npm run test:ui --prefix e2e        # Playwright UI mode
npm run test:headed --prefix e2e    # watch the browser
npm run report --prefix e2e         # HTML report of the last run
```
