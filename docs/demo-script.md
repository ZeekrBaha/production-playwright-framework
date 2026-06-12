# Demo Script (~3 minutes)

A talk track for presenting this project live — interview, portfolio review,
or recorded walkthrough. Have two terminals ready: one for the app, one for
tests.

## Setup (before you start talking)

```bash
npm run install:all
cd apps/workbench && npm run dev    # http://localhost:5173
```

## 1. The system under test (45s)

1. Log in as `ines` / `demo123` → **dashboard**: stat cards, my queue,
   recent activity.
2. Open **Organisations → Merchandising** → forecast list: search, status
   filter, sort.
3. Open **FY26 Working Plan** → the KPI grid. Edit a Units cell, hit
   **Calculate** — GMV and Net Sales recompute (Units × AUR − Returns).
4. Set Returns absurdly high, **Save** → blocked with the offending month
   named. _"Business rules live in a pure domain layer — unit-tested
   separately from the UI."_

## 2. The workflow (45s)

5. Fix the value, **Save**, **Submit for review** → status flips to
   _In review_, grid locks, activity trail records it.
6. Sign out, log in as `ravi` / `demo123` → dashboard shows the **review
   queue**. Open the forecast → read-only + review panel.
7. **Request changes** with a comment → back as `ines`, the comment banner
   shows and the grid is editable again. _"Multi-role, stateful workflow —
   exactly what's painful to test by hand."_

## 3. The framework (60s)

```bash
cd e2e && npm test
```

8. While it runs (~7s for 54 tests): _"Setup project logs in once per role
   and saves storage state. Every test seeds its own data through an init
   script — no shared state, no cleanup, fully parallel."_
9. Show `tests/workbench/testcases/workflow.spec.ts` — the exact flow just
   demoed, as a spec with `test.step`s.
10. Show `network.spec.ts` — _"The app does real HTTP round trips to a
    stateless mock API, so I can intercept: this test kills the save with a
    500 and proves edits survive; this one asserts the submit payload."_
11. Show `data-factory.ts` — _"Assertions check against an independent
    oracle that re-implements the business math — the app can't grade its
    own homework."_

## 4. CI and wrap-up (30s)

12. Show `.github/workflows/ci.yml` and `npm run check`. _"Typecheck, 57
    unit tests, build, then tagged smoke across desktop and mobile Chrome
    projects; HTML report and traces upload as artifacts."_
13. Close on the tag taxonomy in `docs/testing-strategy.md`: smoke /
    regression / workflow / validation / network / accessibility / mobile.

## Likely questions

- **Why localStorage + stateless API?** Determinism and zero infra; the
  network layer still exercises real interception patterns.
- **Why re-implement formulas in tests?** Oracle independence — a shared
  library would let one bug pass both sides.
- **How would this scale to a real backend?** Swap `seedScenarios` for an
  API/DB seeding fixture; the page objects, projects, tags, and CI shape
  are unchanged.
