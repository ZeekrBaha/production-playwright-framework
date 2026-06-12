# Lint, CI/CD & Security Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 17 items from the Fable 5 review: relocate legacy dir, add ESLint+Prettier, harden CI, fix dependency vulnerabilities, add axe-core and visual coverage, and harden framework conventions.

**Architecture:** Three priority-batched commits (P0 → P1 → P2). Each batch verifies independently before the next begins. P0 covers security and baseline packaging; P1 covers CI hardening and dependency health; P2 covers enhancements.

**Tech Stack:** ESLint v9 (flat config), typescript-eslint, eslint-plugin-playwright, Prettier 3, Vitest 3, Vite 6, @axe-core/playwright, GitHub Actions (SHA-pinned), npm (root + apps/workbench + e2e workspaces)

---

## File Map

### Created
- `LICENSE` — MIT 2026
- `.nvmrc` — `22`
- `eslint.config.mjs` — flat ESLint config, 3 scopes: TS base / workbench React / e2e Playwright
- `.prettierrc` — minimal Prettier config
- `.prettierignore` — excludes build + test output
- `.github/dependabot.yml` — weekly npm×2 + github-actions PRs
- `e2e/.env.example` — documents `BASE_URL`
- `e2e/tests/workbench/testcases/visual.spec.ts` — screenshot baseline spec
- `docs/legacy-ibg-patterns-mapped.md` — pattern mapping table

### Modified
- `package.json` (root) — add devDeps, add scripts: `lint`, `lint:fix`, `format`, `format:check`, `ci:install`; update `install:all`; extend `check` to run lint first
- `apps/workbench/package.json` — add scripts; bump `vitest` → `^3`, `vite` → `^6`, `@vitejs/plugin-react` → `^4.4.0`
- `e2e/package.json` — add scripts; add `@axe-core/playwright` devDep
- `.github/workflows/ci.yml` — full rewrite: permissions, concurrency, node-version-file, npm ci, lint step, browser cache, full e2e, advisory audit, SHA-pinned actions
- `README.md` — fix counts (55 tests / 15 files), add CI badge, add mock-auth disclaimer
- `e2e/tests/workbench/testcases/accessibility.spec.ts` — add axe-core scan describe block
- `e2e/tests/common/pages/page-factory.ts` — lazy memoization with private fields
- `eslint.config.mjs` — (P2 addition) `no-restricted-syntax` rule forbidding direct page object construction in specs
- `apps/workbench/src/domain/store.ts` — `Array.isArray()` guard in `loadData()` (TDD)
- `apps/workbench/src/domain/store.test.ts` — new test for shape guard
- `docs/testing-strategy.md` — add `@visual` tag row + visual baseline update instructions

---

## Task 1 — Relocate legacy directory, add LICENSE, add .nvmrc

**Files:**
- Shell: `mv ibg-testscripts-playwright ../_legacy/ibg-testscripts-playwright`
- Create: `LICENSE`
- Create: `.nvmrc`

- [ ] **Step 1: Create the _legacy destination and move the legacy repo**

```bash
mkdir -p /Users/baha/Desktop/llm-ai-projects/_legacy
cd /Users/baha/Desktop/llm-ai-projects/IBG
mv ibg-testscripts-playwright ../_legacy/ibg-testscripts-playwright
```

- [ ] **Step 2: Verify git status is clean**

```bash
git status --short
```

Expected: the moved directory does NOT appear (it was gitignored). Only the spec file and any other working changes should show.

- [ ] **Step 3: Create LICENSE**

File: `LICENSE`
```
MIT License

Copyright (c) 2026 Baha Adatub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Create .nvmrc**

File: `.nvmrc`
```
22
```

No trailing content after `22`. The CI will read this via `node-version-file: .nvmrc`.

---

## Task 2 — Install ESLint + Prettier, write config files

**Files:**
- Create: `eslint.config.mjs`
- Create: `.prettierrc`
- Create: `.prettierignore`
- Root `package.json` devDependencies populated by npm

- [ ] **Step 1: Install all lint/format packages as root devDependencies**

Run from `/Users/baha/Desktop/llm-ai-projects/IBG` (repo root):
```bash
npm install --save-dev \
  eslint \
  typescript-eslint \
  @eslint/js \
  eslint-plugin-playwright \
  eslint-plugin-react-hooks \
  eslint-plugin-react-refresh \
  prettier \
  eslint-config-prettier
```

This creates `node_modules/` and `package-lock.json` at the root. Both are gitignored (`node_modules/` by existing `.gitignore`; `package-lock.json` must be committed — do so in Task 3).

- [ ] **Step 2: Create eslint.config.mjs**

Using `.mjs` (not `.js`) because the root `package.json` lacks `"type": "module"`. ESLint v9 discovers `.mjs` automatically.

File: `eslint.config.mjs`
```js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import playwright from "eslint-plugin-playwright";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/.auth/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  },
  {
    files: ["apps/workbench/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ["e2e/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
    },
  },
);
```

- [ ] **Step 3: Create .prettierrc**

File: `.prettierrc`
```json
{
  "printWidth": 100,
  "trailingComma": "all"
}
```

- [ ] **Step 4: Create .prettierignore**

File: `.prettierignore`
```
node_modules/
dist/
playwright-report/
test-results/
.auth/
*.lock
```

---

## Task 3 — Wire scripts, run auto-fix, commit P0

**Files:**
- Modify: `package.json` (root)
- Modify: `apps/workbench/package.json`
- Modify: `e2e/package.json`

- [ ] **Step 1: Update root package.json scripts section**

Keep the `"devDependencies"` block exactly as `npm install` wrote it. Only update `"scripts"`:

```json
"scripts": {
  "install:all": "npm install && npm install --prefix apps/workbench && npm install --prefix e2e",
  "ci:install": "npm ci && npm ci --prefix apps/workbench && npm ci --prefix e2e",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "npm run typecheck --prefix apps/workbench && npm run typecheck --prefix e2e",
  "test:unit": "npm test --prefix apps/workbench",
  "build": "npm run build --prefix apps/workbench",
  "test:smoke": "npm run test:smoke --prefix e2e",
  "test:e2e": "npm test --prefix e2e",
  "check": "npm run lint && npm run typecheck && npm run test:unit && npm run build && npm run test:smoke"
}
```

- [ ] **Step 2: Add lint/format scripts to apps/workbench/package.json**

Add four scripts to `apps/workbench/package.json`'s `"scripts"` section:
```json
"lint": "eslint src",
"lint:fix": "eslint src --fix",
"format": "prettier --write src",
"format:check": "prettier --check src"
```

Full scripts section after edit:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "eslint src",
  "lint:fix": "eslint src --fix",
  "format": "prettier --write src",
  "format:check": "prettier --check src"
}
```

- [ ] **Step 3: Add lint/format scripts to e2e/package.json**

Add four scripts to `e2e/package.json`'s `"scripts"` section:
```json
"lint": "eslint tests",
"lint:fix": "eslint tests --fix",
"format": "prettier --write tests",
"format:check": "prettier --check tests"
```

Full scripts section after edit:
```json
"scripts": {
  "test": "playwright test",
  "test:headed": "playwright test --headed",
  "test:ui": "playwright test --ui",
  "test:smoke": "playwright test --grep @smoke",
  "report": "playwright show-report",
  "typecheck": "tsc --noEmit",
  "lint": "eslint tests",
  "lint:fix": "eslint tests --fix",
  "format": "prettier --write tests",
  "format:check": "prettier --check tests"
}
```

- [ ] **Step 4: Run lint auto-fix to clear mechanical violations**

```bash
npm run lint:fix
```

Review `git diff` after this. Expect auto-fixes like unused-var suppressions or minor style issues. If `lint:fix` reports errors it couldn't auto-fix, handle them:
- `@typescript-eslint/no-explicit-any` — replace `any` with the correct type or `unknown`
- `@typescript-eslint/no-unused-vars` — prefix the variable name with `_`
- Any Playwright rule violation (e.g. `playwright/no-conditional-in-test`) — follow the error message

- [ ] **Step 5: Run Prettier formatting pass**

```bash
npm run format
```

- [ ] **Step 6: Verify lint and typecheck are clean**

```bash
npm run lint && npm run typecheck
```

Expected: exits 0, no errors.

- [ ] **Step 7: Run unit tests and build to confirm nothing broke**

```bash
npm run test:unit && npm run build
```

Expected: 57 unit tests pass, Vite build succeeds.

- [ ] **Step 8: Commit P0**

```bash
git add \
  LICENSE \
  .nvmrc \
  eslint.config.mjs \
  .prettierrc \
  .prettierignore \
  package.json \
  package-lock.json \
  apps/workbench/package.json \
  e2e/package.json
git commit -m "chore(p0): ESLint+Prettier, LICENSE, .nvmrc, ci:install

- ibg-testscripts-playwright relocated to _legacy/ outside repo tree
- MIT LICENSE added
- .nvmrc: 22
- ESLint v9 flat config (TS base / workbench React / e2e Playwright scopes)
- Prettier with .prettierignore
- lint/lint:fix/format/format:check scripts in all three package.json files
- ci:install script: npm ci for root + both sub-packages
- check script now runs lint before typecheck

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4 — Rewrite CI workflow (P1)

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Look up SHA pins for all four GitHub Actions**

```bash
gh api repos/actions/checkout/git/ref/heads/v4     --jq '.object.sha'
gh api repos/actions/setup-node/git/ref/heads/v4   --jq '.object.sha'
gh api repos/actions/cache/git/ref/heads/v4        --jq '.object.sha'
gh api repos/actions/upload-artifact/git/ref/heads/v4 --jq '.object.sha'
```

Record the four SHAs. Substitute them for `<CHECKOUT_SHA>`, `<SETUP_NODE_SHA>`, `<CACHE_SHA>`, `<UPLOAD_ARTIFACT_SHA>` in the file below.

- [ ] **Step 2: Replace .github/workflows/ci.yml entirely**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Lint, typecheck, unit tests, build, e2e
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@<CHECKOUT_SHA>  # v4

      - uses: actions/setup-node@<SETUP_NODE_SHA>  # v4
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: |
            package-lock.json
            apps/workbench/package-lock.json
            e2e/package-lock.json

      - name: Install dependencies (npm ci)
        run: npm run ci:install

      - name: Lint
        run: npm run lint

      - name: Typecheck (app + e2e)
        run: npm run typecheck

      - name: Unit tests (domain layer)
        run: npm run test:unit

      - name: Build app
        run: npm run build

      - name: Cache Playwright browsers
        uses: actions/cache@<CACHE_SHA>  # v4
        with:
          path: ~/.cache/ms-playwright
          key: pw-${{ runner.os }}-${{ hashFiles('e2e/package-lock.json') }}

      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium
        working-directory: e2e

      - name: Playwright e2e tests (full suite)
        run: npm run test:e2e

      - name: Audit dependencies (advisory)
        run: |
          npm audit --audit-level=high --prefix apps/workbench
          npm audit --audit-level=high --prefix e2e
        continue-on-error: true

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@<UPLOAD_ARTIFACT_SHA>  # v4
        with:
          name: playwright-report
          path: e2e/playwright-report
          retention-days: 14

      - name: Upload test results (traces, screenshots, videos)
        if: failure()
        uses: actions/upload-artifact@<UPLOAD_ARTIFACT_SHA>  # v4
        with:
          name: test-results
          path: e2e/test-results
          retention-days: 14
```

- [ ] **Step 3: Verify the YAML parses**

```bash
python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('YAML OK')"
```

Expected: `YAML OK`.

---

## Task 5 — Bump vitest + vite, add dependabot, .env.example, fix README, commit P1

**Files:**
- Modify: `apps/workbench/package.json`
- Create: `.github/dependabot.yml`
- Create: `e2e/.env.example`
- Modify: `README.md`

- [ ] **Step 1: Confirm target versions**

```bash
npm view vitest@latest version
npm view vite@latest version
npm view @vitejs/plugin-react@latest version
```

Confirm vitest is ≥ 3.x, vite is ≥ 6.x. Use whatever these commands return (latest stable).

- [ ] **Step 2: Bump deps in apps/workbench/package.json devDependencies**

Change these three lines (keep other deps unchanged):
```json
"@vitejs/plugin-react": "^4.4.0",
"vite": "^6.0.0",
"vitest": "^3.0.0"
```

Then install:
```bash
npm install --prefix apps/workbench
```

- [ ] **Step 3: Run unit tests to confirm vitest 3 + vite 6 are compatible**

```bash
npm run test:unit
```

Expected: 57 tests pass. If any fail, check the error message against the vitest v3 migration guide (`npm view vitest@3 repository.url`).

- [ ] **Step 4: Run build to confirm vite 6 is compatible**

```bash
npm run build
```

Expected: Vite build succeeds with no errors or warnings.

- [ ] **Step 5: Verify audit is clean**

```bash
npm audit --audit-level=moderate --prefix apps/workbench
```

Expected: 0 vulnerabilities. If any remain, they are in transitives not addressed by this bump — note them but do not use `--force`.

- [ ] **Step 6: Create .github/dependabot.yml**

File: `.github/dependabot.yml`
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /apps/workbench
    schedule:
      interval: weekly

  - package-ecosystem: npm
    directory: /e2e
    schedule:
      interval: weekly

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

- [ ] **Step 7: Create e2e/.env.example**

File: `e2e/.env.example`
```
# Base URL for the system under test.
# Default matches the Vite dev server; override in CI if the app runs elsewhere.
BASE_URL=http://localhost:5173

# Add future environment variables here.
```

- [ ] **Step 8: Fix README.md**

Three changes to `README.md`:

**a)** Add CI badge on the line immediately after the `# Production Playwright Framework` heading:

```markdown
![CI](https://github.com/ZeekrBaha/production-playwright-framework/workflows/CI/badge.svg)
```

**b)** In the framework architecture code block, change:
```
└── testcases/              13 spec files, 54 tests
```
to:
```
└── testcases/              15 spec files, 55 tests
```

**c)** In the "The system under test" section, add this callout after the roles table:

```markdown
> **Security note:** Auth in this SUT is intentionally mock-insecure — credentials
> checked client-side, sessions stored in `localStorage`. This is by design for an
> isolated local demo with fake data. Never use this pattern in a real application.
```

- [ ] **Step 9: Run full check to confirm P1 is green**

```bash
npm run check
```

Expected: lint → typecheck → 57 unit tests → build → smoke tests all pass.

- [ ] **Step 10: Commit P1**

```bash
git add \
  .github/workflows/ci.yml \
  .github/dependabot.yml \
  apps/workbench/package.json \
  apps/workbench/package-lock.json \
  e2e/.env.example \
  README.md
git commit -m "chore(p1): CI hardening, dep bumps, dependabot, env.example, README

- CI: permissions:read, concurrency cancel-in-progress, node-version-file,
  npm ci (lockfile-enforced), lint step, Playwright browser cache,
  full test:e2e (not smoke only), advisory audit, SHA-pinned actions
- Bump vitest→3, vite→6, @vitejs/plugin-react→4.4; 0 audit findings
- .github/dependabot.yml: npm×2 + github-actions, weekly
- e2e/.env.example: documents BASE_URL
- README: test counts (55/15), CI badge, mock-auth security note

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6 — axe-core accessibility scan (P2, TDD)

**Files:**
- Modify: `e2e/package.json`
- Modify: `e2e/tests/workbench/testcases/accessibility.spec.ts`

- [ ] **Step 1: Add the import to accessibility.spec.ts (test will fail — module not found)**

Add this import at the top of `e2e/tests/workbench/testcases/accessibility.spec.ts`, after the existing imports:

```typescript
import AxeBuilder from "@axe-core/playwright";
```

Then add this describe block at the end of the file, after the last existing describe block:

```typescript
test.describe("Accessibility — axe scan", { tag: ["@accessibility"] }, () => {
  test("dashboard has no axe violations", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios([buildScenario({ name: "Axe Dashboard" })]);
    await pageFactory.dashboard().goto();
    await expect(pageFactory.dashboard().heading).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("forecast list has no axe violations", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios([buildScenario({ name: "Axe List" })]);
    await pageFactory.forecastList().goto("org-merch");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("forecast grid has no axe violations", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Axe Grid" });
    await seedScenarios([scenario]);
    await pageFactory.forecastGrid().goto(scenario.id);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm failure (missing module)**

```bash
cd e2e && npx tsc --noEmit 2>&1 | head -10
```

Expected: TypeScript error — `Cannot find module '@axe-core/playwright'`.

- [ ] **Step 3: Install @axe-core/playwright**

```bash
npm install --save-dev @axe-core/playwright --prefix e2e
```

- [ ] **Step 4: Run typecheck to confirm the import resolves**

```bash
npm run typecheck --prefix e2e
```

Expected: clean.

- [ ] **Step 5: Run the axe tests and confirm they pass**

```bash
cd e2e && npx playwright test accessibility.spec.ts --project=desktop-chrome
```

Expected: all accessibility tests pass (existing 4 + 3 new axe tests = 7 total). If an axe violation appears, the error message names the element, rule ID, and impact level. Fix the SUT violation before committing.

---

## Task 7 — Visual baseline spec (P2)

**Files:**
- Create: `e2e/tests/workbench/testcases/visual.spec.ts`
- Modify: `docs/testing-strategy.md`

- [ ] **Step 1: Create visual.spec.ts**

File: `e2e/tests/workbench/testcases/visual.spec.ts`
```typescript
import { expect } from "@playwright/test";
import { test } from "../../common/fixtures/test-hook";
import { buildScenario } from "../../common/fixtures/data-factory";

test.describe("Visual baselines", { tag: ["@visual"] }, () => {
  test("dashboard matches baseline", async ({ page, pageFactory, seedScenarios }) => {
    await seedScenarios([buildScenario({ name: "Visual Seed" })]);
    await pageFactory.dashboard().goto();
    await expect(pageFactory.dashboard().heading).toBeVisible();
    await expect(page).toHaveScreenshot("dashboard.png", { maxDiffPixels: 100 });
  });

  test("forecast list matches baseline", async ({ page, pageFactory, seedScenarios }) => {
    await seedScenarios([buildScenario({ name: "Visual List" })]);
    await pageFactory.forecastList().goto("org-merch");
    await expect(page).toHaveScreenshot("forecast-list.png", { maxDiffPixels: 100 });
  });

  test("approved grid (read-only) matches baseline", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Visual Grid", status: "APPROVED" });
    await seedScenarios([scenario]);
    await pageFactory.forecastGrid().goto(scenario.id);
    await expect(page).toHaveScreenshot("forecast-grid-approved.png", { maxDiffPixels: 100 });
  });
});
```

- [ ] **Step 2: Generate baselines with --update-snapshots**

```bash
cd e2e && npx playwright test visual.spec.ts --project=desktop-chrome --update-snapshots
```

Playwright writes `.png` files to a `visual.spec.ts-snapshots/` directory next to the spec. Inspect each generated image to confirm it looks correct before committing.

- [ ] **Step 3: Verify tests pass against the generated baselines**

```bash
cd e2e && npx playwright test visual.spec.ts --project=desktop-chrome
```

Expected: 3 tests pass with no diff.

- [ ] **Step 4: Update docs/testing-strategy.md**

**a)** In the tag taxonomy table, add a row:
```markdown
| `@visual` | Screenshot baselines for three stable seeded views | Manual (`--grep @visual`) or scheduled |
```

**b)** In "What is deliberately not tested with Playwright", remove the line:
```
- Visual pixel diffs (roadmap — needs a stable baseline strategy first).
```
and replace with:
```
- Visual pixel diffs for non-seeded (dynamic) pages — baseline stability requires deterministic seeds, which only stable views have.
```

**c)** Add a new section at the end of the file:

```markdown
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
```

---

## Task 8 — PageFactory lazy memoization + lint rule (P2)

**Files:**
- Modify: `e2e/tests/common/pages/page-factory.ts`
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Replace page-factory.ts with memoized version**

File: `e2e/tests/common/pages/page-factory.ts`
```typescript
import { Page } from "@playwright/test";
import { AddDriverModal } from "../../workbench/pages/add-driver.modal";
import { CompareModal } from "../../workbench/pages/compare.modal";
import { CopyForecastModal } from "../../workbench/pages/copy-forecast.modal";
import { CreateForecastModal } from "../../workbench/pages/create-forecast.modal";
import { DashboardPage } from "../../workbench/pages/dashboard.page";
import { ForecastGridPage } from "../../workbench/pages/forecast-grid.page";
import { ForecastListPage } from "../../workbench/pages/forecast-list.page";
import { LoginPage } from "../../workbench/pages/login.page";
import { OrgSelectionPage } from "../../workbench/pages/org-selection.page";

export class PageFactory {
  readonly page: Page;
  #login?: LoginPage;
  #dashboard?: DashboardPage;
  #orgSelection?: OrgSelectionPage;
  #forecastList?: ForecastListPage;
  #forecastGrid?: ForecastGridPage;
  #createForecastModal?: CreateForecastModal;
  #addDriverModal?: AddDriverModal;
  #copyForecastModal?: CopyForecastModal;
  #compareModal?: CompareModal;

  constructor(page: Page) {
    this.page = page;
  }

  login(): LoginPage {
    return (this.#login ??= new LoginPage(this.page));
  }

  dashboard(): DashboardPage {
    return (this.#dashboard ??= new DashboardPage(this.page));
  }

  orgSelection(): OrgSelectionPage {
    return (this.#orgSelection ??= new OrgSelectionPage(this.page));
  }

  forecastList(): ForecastListPage {
    return (this.#forecastList ??= new ForecastListPage(this.page));
  }

  forecastGrid(): ForecastGridPage {
    return (this.#forecastGrid ??= new ForecastGridPage(this.page));
  }

  createForecastModal(): CreateForecastModal {
    return (this.#createForecastModal ??= new CreateForecastModal(this.page));
  }

  addDriverModal(): AddDriverModal {
    return (this.#addDriverModal ??= new AddDriverModal(this.page));
  }

  copyForecastModal(): CopyForecastModal {
    return (this.#copyForecastModal ??= new CopyForecastModal(this.page));
  }

  compareModal(): CompareModal {
    return (this.#compareModal ??= new CompareModal(this.page));
  }
}
```

- [ ] **Step 2: Run e2e typecheck to confirm private fields compile**

```bash
npm run typecheck --prefix e2e
```

Expected: clean. Private class fields (`#name`) require `"target": "ES2022"` or later in `e2e/tsconfig.json`. If you get an error about private fields, open `e2e/tsconfig.json` and confirm `"target"` is `"ES2022"` or higher. If it's lower, change it.

- [ ] **Step 3: Add no-restricted-syntax rule to eslint.config.mjs**

Append this config block inside the `tseslint.config(...)` call in `eslint.config.mjs`, after the existing e2e block:

```js
  // Specs must use pageFactory, not construct page objects directly.
  {
    files: [
      "e2e/tests/workbench/testcases/**/*.ts",
      "e2e/tests/auth.setup.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name=/Page$|Modal$/]",
          message:
            "Instantiate page objects via pageFactory, not directly. Use the pageFactory fixture.",
        },
      ],
    },
  },
```

- [ ] **Step 4: Run lint to confirm rule passes on current codebase**

```bash
npm run lint
```

Expected: 0 errors. All existing specs use `pageFactory.*()`, so no violations exist. If any violation fires, the spec is constructing a page object directly — replace it with the `pageFactory` accessor.

---

## Task 9 — store.ts shape validation (P2, TDD)

**Files:**
- Modify: `apps/workbench/src/domain/store.test.ts`
- Modify: `apps/workbench/src/domain/store.ts`

**Background:** `loadData()` currently uses `parsed.scenarios ?? []`. If `parsed.scenarios` is a truthy non-array (e.g., the string `"corrupted"`), `??` passes it through, yielding a corrupt `AppData`. The fix replaces `??` with `Array.isArray()` guards.

- [ ] **Step 1: Write the failing test**

In `apps/workbench/src/domain/store.test.ts`, add this test inside the existing `describe("loadData", ...)` block:

```typescript
it("falls back to empty arrays when stored values are not arrays", () => {
  localStorage.setItem(
    "fw:data",
    JSON.stringify({ scenarios: "corrupted", activities: null }),
  );
  const data = loadData();
  expect(Array.isArray(data.scenarios)).toBe(true);
  expect(Array.isArray(data.activities)).toBe(true);
});
```

- [ ] **Step 2: Run only the store test to confirm it fails**

```bash
npm test --prefix apps/workbench -- --reporter=verbose store.test.ts
```

Expected: `FAIL — expect(received).toBe(expected): Expected: true, Received: false` because `"corrupted" ?? []` returns `"corrupted"`.

- [ ] **Step 3: Fix loadData() in store.ts**

Replace the try block in `loadData()`:

```typescript
export function loadData(): AppData {
  const raw = localStorage.getItem(DATA_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      return {
        scenarios: Array.isArray(parsed.scenarios) ? parsed.scenarios : [],
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      };
    } catch {
      // fall through to reseed on corrupt JSON
    }
  }
  const data = seedAppData();
  saveData(data);
  return data;
}
```

- [ ] **Step 4: Run store tests to confirm the new test passes**

```bash
npm test --prefix apps/workbench -- --reporter=verbose store.test.ts
```

Expected: all store tests pass.

- [ ] **Step 5: Run full unit suite to confirm no regressions**

```bash
npm run test:unit
```

Expected: 58 tests pass (57 + 1 new).

---

## Task 10 — Legacy patterns doc, full verification, commit P2, push

**Files:**
- Create: `docs/legacy-ibg-patterns-mapped.md`

- [ ] **Step 1: Create docs/legacy-ibg-patterns-mapped.md**

File: `docs/legacy-ibg-patterns-mapped.md`
```markdown
# Legacy IBG Patterns → New Framework Equivalents

Maps patterns from the legacy `ibg-testscripts-playwright` framework (relocated to
`_legacy/`, not tracked) to their equivalents in this framework.

| Legacy pattern | New-framework equivalent |
|---|---|
| Custom base test class with setup/teardown methods | `test.extend` custom fixtures in `tests/common/fixtures/test-hook.ts` — typed, composable, no inheritance |
| Page object constructed ad-hoc in specs (`new LoginPage(page)`) | `pageFactory` fixture → `PageFactory` — single entry point, lazy-cached, never instantiated in specs |
| Shared `beforeEach` that logs in for every test | Setup-project storageState (`auth.setup.ts`) — login once per role, state reused via file |
| Shared data seeded once in `beforeAll` or via a script | `seedScenarios([...])` fixture — per-test `addInitScript`, no shared state, no cleanup code |
| Hard-coded waits (`page.waitForTimeout(n)`) | Web-first assertions only — `toBeVisible`, `toHaveText`, `toBeEnabled`; zero `waitForTimeout` in suite |
| Test data defined in test body or shared fixture | `buildScenario()` + independent oracle (`expectedGmv()`, `expectedNetSales()`) in `data-factory.ts` |
| Network stubs via a separate mock server process | `mock-api.ts` route interception — `failApi` / `delayApi` / `captureApi` over a real Vite HTTP surface |
| Single browser project | Project matrix: `setup` → `desktop-chrome` + `mobile-chrome` (Pixel 7), tag-driven routing |
| Manual re-runs for flaky tests | `retries: 2` in CI only; per-test isolation eliminates shared-state flake at the root |
| HTML report generated post-run manually | CI artifact upload (always) + failure artifacts (traces, videos, screenshots) on failure |

The legacy directory has been relocated to `../_legacy/ibg-testscripts-playwright` outside
the IBG tree. Its patterns informed the architecture decisions above.
```

- [ ] **Step 2: Run the full verification block**

```bash
cd /Users/baha/Desktop/llm-ai-projects/IBG

npm run ci:install
npm run lint
npx prettier --check .
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
npm audit --audit-level=moderate --prefix apps/workbench
npm audit --audit-level=moderate --prefix e2e
git status --porcelain
test -f LICENSE && test -f .nvmrc && test -f e2e/.env.example && echo "hygiene OK"
```

Expected results:
- `ci:install`: all three packages install from lockfiles, no errors
- `lint`: 0 errors
- `prettier --check`: 0 formatting violations
- `typecheck`: clean (both packages)
- `test:unit`: **58 tests pass** (57 original + 1 store shape guard)
- `build`: Vite build succeeds
- `test:e2e`: **55+ tests pass** (existing 55 + 3 axe + 3 visual = 61 if all P2 specs run)
- `npm audit` (workbench): 0 vulnerabilities
- `npm audit` (e2e): 0 vulnerabilities
- `git status`: no unexpected untracked or modified files
- `hygiene OK` printed

- [ ] **Step 3: Stage and commit P2**

```bash
git add \
  e2e/package.json \
  e2e/package-lock.json \
  e2e/tests/workbench/testcases/accessibility.spec.ts \
  e2e/tests/workbench/testcases/visual.spec.ts \
  e2e/tests/workbench/testcases/ \
  e2e/tests/common/pages/page-factory.ts \
  eslint.config.mjs \
  apps/workbench/src/domain/store.ts \
  apps/workbench/src/domain/store.test.ts \
  docs/testing-strategy.md \
  docs/legacy-ibg-patterns-mapped.md

git commit -m "feat(p2): axe-core, visual baselines, PageFactory memo, store shape guard

- @axe-core/playwright: scan dashboard, list, grid; tag @accessibility
- visual.spec.ts: toHaveScreenshot baselines for 3 seeded views; tag @visual
- PageFactory: private field memoization (??= pattern)
- eslint.config.mjs: no-restricted-syntax blocks direct page object construction
- store.ts: Array.isArray() guard in loadData() — TDD, +1 unit test (58 total)
- docs/legacy-ibg-patterns-mapped.md: pattern mapping table
- docs/testing-strategy.md: @visual tag, visual baseline update instructions

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 4: Push and confirm CI passes**

```bash
git push origin feature/playwright-framework-and-sut
```

Then poll the CI run:
```bash
gh run list --repo ZeekrBaha/production-playwright-framework --limit 3
```

Expected: a new run starts and passes all steps (lint → typecheck → unit tests → build → full e2e → advisory audit).
