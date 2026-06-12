# Legacy IBG Patterns → New Framework Equivalents

Maps patterns from the legacy `ibg-testscripts-playwright` framework (relocated to
`_legacy/`, not tracked) to their equivalents in this framework.

| Legacy pattern                                                  | New-framework equivalent                                                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Custom base test class with setup/teardown methods              | `test.extend` custom fixtures in `tests/common/fixtures/test-hook.ts` — typed, composable, no inheritance |
| Page object constructed ad-hoc in specs (`new LoginPage(page)`) | `pageFactory` fixture → `PageFactory` — single entry point, lazy-cached, never instantiated in specs      |
| Shared `beforeEach` that logs in for every test                 | Setup-project storageState (`auth.setup.ts`) — login once per role, state reused via file                 |
| Shared data seeded once in `beforeAll` or via a script          | `seedScenarios([...])` fixture — per-test `addInitScript`, no shared state, no cleanup code               |
| Hard-coded waits (`page.waitForTimeout(n)`)                     | Web-first assertions only — `toBeVisible`, `toHaveText`, `toBeEnabled`; zero `waitForTimeout` in suite    |
| Test data defined in test body or shared fixture                | `buildScenario()` + independent oracle (`expectedGmv()`, `expectedNetSales()`) in `data-factory.ts`       |
| Network stubs via a separate mock server process                | `mock-api.ts` route interception — `failApi` / `delayApi` / `captureApi` over a real Vite HTTP surface    |
| Single browser project                                          | Project matrix: `setup` → `desktop-chrome` + `mobile-chrome` (Pixel 7), tag-driven routing                |
| Manual re-runs for flaky tests                                  | `retries: 2` in CI only; per-test isolation eliminates shared-state flake at the root                     |
| HTML report generated post-run manually                         | CI artifact upload (always) + failure artifacts (traces, videos, screenshots) on failure                  |

The legacy directory has been relocated to `../_legacy/ibg-testscripts-playwright` outside
the IBG tree. Its patterns informed the architecture decisions above.
