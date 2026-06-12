# CI and Reporting

## Pipeline

`.github/workflows/ci.yml` runs on every push to `main` and every PR:

1. `npm run install:all` — app + e2e dependencies (npm cache enabled)
2. `npm run typecheck` — `tsc --noEmit` for both packages
3. `npm run test:unit` — 57 Vitest domain tests
4. `npm run build` — production Vite build
5. `npx playwright install --with-deps chromium`
6. `npm run test:smoke` — tagged critical paths (desktop + mobile projects)
7. Artifact upload:
   - `playwright-report` — always (HTML report)
   - `test-results` — on failure (traces, videos, screenshots)

The smoke suite is the PR gate; the full regression suite
(`npm run test:e2e`) is fast enough (~7s of test time) to run on demand or
nightly without infrastructure changes.

## Reporters

- Local: `list` + HTML (`npm run report` to open)
- CI: `list` + `github` (inline PR annotations) + HTML

## Failure forensics

Every failed test retains:

- **Trace** — replay with `npx playwright show-trace <trace.zip>`: DOM
  snapshots, network, console, every action
- **Video** — full test recording
- **Screenshot** — final failure frame

Retries are CI-only (`retries: 2`) so local failures stay loud while CI
distinguishes flake from breakage (flaky tests are reported as such, not
silently passed).

## One-command local validation

```bash
npm run check   # typecheck → unit tests → build → smoke
```

Mirrors CI exactly, so green locally means green in CI.
