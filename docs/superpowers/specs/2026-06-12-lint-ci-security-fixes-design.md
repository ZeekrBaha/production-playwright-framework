# Design: Lint, CI/CD & Security Fixes

**Date:** 2026-06-12  
**Source:** `docs/reviews/2026-06-12-fable-lint-ci-security-recommendations.md`  
**Approach:** Priority-first — P0 → P1 → P2, one commit per group.

---

## P0 Group — Security + Baseline Packaging

**Goal:** Make the repo safe to be public and carry a credible "production" label.

### 1. Relocate legacy directory

```bash
mv ibg-testscripts-playwright ../_legacy/ibg-testscripts-playwright
```

The directory contains a nested git repo with 14 real auth-token URLs in `.env-cmdrc.json` and an unverified `secrets/` directory. It is gitignored but still inside the repo tree — a zip or `cp -r` of IBG/ would leak it. Moving it out of the tree eliminates that risk. `.gitignore` entries stay as belt-and-braces.

### 2. Add LICENSE

MIT license at repo root, year 2026. Required for a public portfolio repo.

### 3. Add .nvmrc

File at repo root containing `22`. Pins Node version for local dev and CI (CI will switch to `node-version-file: .nvmrc` in P1).

### 4. Add ESLint + Prettier

**Packages (root devDeps):**
- `eslint` (v9, flat config)
- `typescript-eslint`
- `eslint-plugin-playwright`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `prettier`
- `eslint-config-prettier`

**Files:**
- `eslint.config.js` at root — flat config with three scopes:
  1. Shared TypeScript base (`**/*.ts`, `**/*.tsx`) — `typescript-eslint` recommended
  2. `apps/workbench/**` — adds `react-hooks/recommended` + `react-refresh/vite`
  3. `e2e/**` — adds `playwright/recommended`
- `.prettierrc` at root — minimal config (singleQuote, trailingComma, printWidth 100)
- `.prettierignore` at root — excludes `playwright-report/`, `test-results/`, `dist/`, `.auth/`, `node_modules/`

**Scripts added to all three `package.json` files:**
- Root: `lint`, `lint:fix`, `format`, `format:check`, `ci:install`; extend `check` to run `lint` before `typecheck`
- `apps/workbench/package.json`: `lint`, `lint:fix`, `format`, `format:check`
- `e2e/package.json`: `lint`, `lint:fix`, `format`, `format:check`

**`ci:install` script (root):**
```
npm ci --prefix apps/workbench && npm ci --prefix e2e
```

After config is in place, run `lint:fix` once to apply mechanical auto-fixes; commit those alongside the config (same P0 commit).

---

## P1 Group — CI Hardening + Dependency Health + Doc Fixes

**Goal:** Make CI reproducible, hardened, and fully representative; fix known dependency vulnerabilities; bring docs in sync.

### 5. Rewrite .github/workflows/ci.yml

Changes from current state:
- `permissions: contents: read` at workflow level (default token was write-all)
- `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` — stacked pushes cancel superseded runs
- `node-version-file: .nvmrc` replaces hardcoded `node-version: 22`
- `npm run ci:install` replaces `npm run install:all` — enforces lockfiles
- Add lint step: `npm run lint` after typecheck
- Add Playwright browser cache: `actions/cache` on `~/.cache/ms-playwright` keyed on `hashFiles('e2e/package-lock.json')`
- Run full `npm run test:e2e` instead of `npm run test:smoke`
- Add advisory audit: `npm audit --audit-level=high --prefix apps/workbench && npm audit --audit-level=high --prefix e2e` with `continue-on-error: true`
- Pin all four actions to full commit SHAs with tag comments:
  - `actions/checkout@v4`
  - `actions/setup-node@v4`
  - `actions/cache@v4`
  - `actions/upload-artifact@v4`

### 6. Bump workbench dependencies

In `apps/workbench/package.json`:
- `vitest` → `^3` (fixes critical "arbitrary file read/exec via Vitest UI server" CVE)
- `vite` → `^6` (fixes path-traversal moderate vuln)
- `@vitejs/plugin-react` → matching version for Vite 6

Run `npm run test:unit` and `npm run build` after bump to confirm green. Verify `npm audit --audit-level=moderate` → 0 vulnerabilities.

**Constraint:** Do NOT use `npm audit fix --force`. Version bumps are deliberate.

### 7. Add .github/dependabot.yml

Weekly Dependabot PRs for:
- npm at `/apps/workbench`
- npm at `/e2e`
- github-actions at `/`

### 8. Add e2e/.env.example

Documents contract for environment variables:
```
BASE_URL=http://localhost:5173
# Add future variables here
```

### 9. Fix README + add CI badge + mock-auth disclaimer

- Update test counts: 54 → 55 tests, 13 → 15 spec files
- Add CI badge below the title:
  ```
  ![CI](https://github.com/ZeekrBaha/production-playwright-framework/workflows/CI/badge.svg)
  ```
- Add mock-auth disclaimer section (or callout box): localStorage session tokens are intentionally insecure SUT behavior — never copy this pattern to a real application.

---

## P2 Group — Enhancements

**Goal:** Complete the accessibility story, add visual coverage, harden framework conventions.

### 10. axe-core accessibility scan

Install `@axe-core/playwright` as an e2e devDep. Add an axe scan block to `accessibility.spec.ts` (or a new file if cleaner) that runs `checkA11y` on dashboard, forecast list, and forecast grid after seeding. Tag `@accessibility`. Existing keyboard + ARIA tests stay unchanged.

### 11. Visual baseline spec

Add `visual.spec.ts` in `e2e/tests/workbench/testcases/` with `toHaveScreenshot` for three stable seeded views:
- Dashboard with healthy scenario data
- Forecast list (populated)
- Approved read-only grid

Tag `@visual`. Add `playwright-snapshots/` to `.gitignore`. Add a paragraph to `docs/testing-strategy.md` explaining the baseline commit strategy (baselines committed, CI regenerates on mismatch).

### 12. PageFactory lazy memoization

In `e2e/tests/common/pages/page-factory.ts`: cache each page object with a private field pattern:
```typescript
#dashboard?: DashboardPage;
dashboard() { return (this.#dashboard ??= new DashboardPage(this.page)); }
```
No behavior change; eliminates redundant allocations in long multi-step flows.

### 13. Lint rule: forbid ad-hoc page object instantiation

In `eslint.config.js` e2e scope, add a `no-restricted-syntax` rule forbidding `new LoginPage(`, `new DashboardPage(`, etc. outside `common/pages/` and fixtures. Enforces PageFactory as the only page object instantiation path.

### 14. JSON.parse shape validation in store.ts

In `apps/workbench/src/domain/store.ts` `loadData()`: if parsed object from localStorage doesn't have a `scenarios` array, reset to empty seed state rather than throwing or silently corrupting. Written TDD: failing Vitest test first, then minimal fix.

### 15. docs/legacy-ibg-patterns-mapped.md

Mapping table: legacy `ibg-testscripts-playwright` pattern → new-framework equivalent. Examples:
- Old fixture instantiation style → `test.extend` custom fixtures
- Old page object construction → PageFactory
- Old data helpers → data-factory + oracle
- Old network stubs → `mock-api.ts` (`failApi`/`delayApi`/`captureApi`)

Closes the loop on why the legacy folder has no remaining reference value.

---

## Verification (after all three groups)

```bash
# from repo root
npm run ci:install
npm run lint
npx prettier --check .
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
npm audit --audit-level=moderate --prefix apps/workbench  # expect 0
npm audit --audit-level=moderate --prefix e2e              # expect 0
git status --porcelain                                       # no stray files
test -f LICENSE && test -f .nvmrc && test -f e2e/.env.example && echo "hygiene OK"
```

Expected final counts: 58+ Vitest unit tests (one new for store.ts shape guard), 57+ e2e tests.

---

## Constraints

- Never run `npm audit fix --force`
- No production code without a failing test first (TDD rule for store.ts change)
- No new frameworks beyond what the review prescribes
- Legacy dir: move, do not delete (user decision)
