# Framework Architecture

This document describes the Playwright automation framework in `e2e/` — its
layers, the contracts between them, and why each piece exists.

## Layered design

```
playwright.config.ts          runtime topology: projects, webServer, artifacts
└── tests/
    ├── auth.setup.ts         setup project: UI login per role → storageState
    ├── common/               ── framework layer (SUT-agnostic patterns) ──
    │   ├── config/test-env.ts        typed environment (base URL, CI, users)
    │   ├── api/mock-api.ts           network interception helpers
    │   ├── fixtures/test-hook.ts     test.extend: pageFactory, seedScenarios
    │   ├── fixtures/data-factory.ts  builders, presets, independent oracle
    │   ├── fixtures/roles.ts         multi-actor user switching
    │   ├── fixtures/auth.ts          role access (re-exports test-env users)
    │   └── pages/page-factory.ts     single entry point to page objects
    └── workbench/            ── application layer (SUT-specific) ──
        ├── pages/                    one page object per screen/modal
        └── testcases/                spec files, tag-routed into suites
```

Dependency rule: specs depend on page objects and fixtures; page objects
depend only on Playwright; fixtures depend on config. Nothing in `common/`
imports from `workbench/` except the page factory, which is the composition
point.

## Project graph

```
setup ──▶ desktop-chrome   (all specs except @mobile)
   └────▶ mobile-chrome    (@mobile specs, Pixel 7 profile)
```

- `setup` logs in through the real UI once per role and saves storage state
  to `.auth/*.json` (gitignored). Every functional spec starts authenticated;
  the login flow itself is covered by dedicated specs that opt out via an
  empty storage state.
- `desktop-chrome` is the default functional suite.
- `mobile-chrome` reuses the same specs/page objects on a phone profile —
  proof the locator strategy is resolution-independent.

## Fixtures (test.extend)

| Fixture | Purpose |
|---|---|
| `pageFactory` | Lazily constructs page objects bound to the test's page |
| `seedScenarios` | Injects exactly the scenarios a test needs into the app's store before page load (one-shot `addInitScript`, so in-test saves survive reloads) |

Per-test browser contexts + per-test seeded data = no shared mutable state,
no cleanup phase, no ordering constraints. Any test can run alone or in
parallel with any other.

## Network layer

The SUT performs a real HTTP round trip for every mutation and applies the
change client-side only after the server accepts it. `common/api/mock-api.ts`
exploits that contract:

- `failApi(page, pattern, status, message)` — simulate 5xx / 409 conflicts
- `delayApi(page, pattern, ms)` — exercise loading/busy states
- `captureApi(page, pattern)` — record requests for payload/contract assertions
- `API_ROUTES` — the route patterns in one place

## Page objects

- Locators are `readonly` fields built from `getByRole` / `getByLabel` /
  `getByTestId` only. No CSS chains, no XPath.
- Methods express user intent (`submitForReview()`, `copyAs(name)`), not
  DOM mechanics.
- The `PageFactory` is the only way specs obtain page objects, which keeps
  construction uniform and makes cross-cutting changes one-line.

## Waiting strategy

No sleeps anywhere. All synchronization is via web-first assertions
(`toHaveText`, `toBeVisible`, `toHaveCount`) which retry until the expect
timeout. Busy states are asserted through role/name changes
("Calculating…", disabled), not timing.

## Tags route tests into suites

See `docs/testing-strategy.md`. Tags are declared on `test.describe`/`test`
options and selected with `--grep`; projects additionally partition on
`@mobile`.

## Failure debugging

Every failure retains a trace, video, and screenshot
(`retain-on-failure`). Locally: `npm run report` opens the HTML report;
`npx playwright show-trace <trace.zip>` replays the failure. CI uploads the
same artifacts (see `docs/ci-and-reporting.md`).
