# Roadmap

Improvements ordered by signal-to-effort, with the reasoning to do (or not
do) each.

## Next

1. **Extract to a standalone GitHub repo.** This folder still contains the
   legacy reference framework (`ibg-testscripts-playwright/`, gitignored).
   Copy `apps/`, `e2e/`, `docs/`, root configs into a clean repo; first
   commit should pass `npm run check`.
2. **Visual smoke (`@visual`).** Screenshot tests for three stable views:
   dashboard with seeded data, forecast list, approved read-only grid.
   Gate: deterministic seeds already exist, so baselines should be stable.
   Keep the set tiny — visual tests are the flakiest asset class.
3. **axe-core accessibility scan.** The current `@accessibility` suite is
   dependency-free (keyboard + ARIA semantics). Adding
   `@axe-core/playwright` on the four main pages catches contrast/landmark
   issues the manual checks don't.

## Later

4. **API-contract project.** A dedicated Playwright project hitting the
   mock API with `request` fixtures (no browser) to pin the endpoint
   contract — useful the day the mock becomes a real backend.
5. **Performance budget.** Assert simple navigation-timing budgets on
   dashboard and grid load; fail on regressions.
6. **Nightly full-regression workflow.** CI currently gates PRs on smoke;
   add a scheduled job running `npm run test:e2e` across both projects
   with the HTML report published to GitHub Pages.
7. **README walkthrough GIF.** Record the demo-script flow; visuals carry
   portfolio reviews.

## Deliberately out of scope

- **Real backend / database** — would trade determinism for realism the
  framework patterns don't need.
- **Cross-browser matrix (WebKit/Firefox)** — trivial to add via projects,
  but doubles CI time for little demonstration value; mention it, don't
  run it.
- **Secrets management** — nothing here is secret by design.
