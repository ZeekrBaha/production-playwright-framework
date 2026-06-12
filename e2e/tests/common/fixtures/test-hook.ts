import { test as base } from "@playwright/test";
import { PageFactory } from "../pages/page-factory";
import type { SeedScenario } from "./data-factory";

interface Fixtures {
  pageFactory: PageFactory;
  /**
   * Replaces the app's data store with exactly the given scenarios before
   * the page loads. Each test owns its data — no shared mutable state.
   * Call BEFORE the first page.goto().
   */
  seedScenarios: (scenarios: SeedScenario[]) => Promise<void>;
}

export const test = base.extend<Fixtures>({
  pageFactory: async ({ page }, use) => {
    await use(new PageFactory(page));
  },

  seedScenarios: async ({ page }, use) => {
    await use(async (scenarios) => {
      await page.addInitScript(
        (data) => {
          // The init script runs on every navigation; the marker makes the
          // injection one-shot so in-test saves survive page reloads.
          if (!window.localStorage.getItem("fw:e2e-seeded")) {
            window.localStorage.setItem("fw:data", JSON.stringify(data));
            window.localStorage.setItem("fw:e2e-seeded", "1");
          }
        },
        { scenarios },
      );
    });
  },
});

export { expect } from "@playwright/test";
