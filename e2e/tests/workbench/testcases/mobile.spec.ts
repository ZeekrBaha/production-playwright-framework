import { expect, test } from "../test-hook";
import { buildScenario } from "../../common/fixtures/data-factory";

/**
 * Runs only in the `mobile-chrome` project (Pixel 7 profile);
 * the desktop project filters out @mobile.
 */
test.describe("Mobile smoke", { tag: ["@mobile", "@smoke"] }, () => {
  test("the core journey renders and works on a phone viewport", async ({
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Mobile Plan" });
    await seedScenarios([scenario]);

    await test.step("dashboard renders stat cards", async () => {
      const dashboard = pageFactory.dashboard();
      await dashboard.goto();
      await expect(dashboard.heading).toBeVisible();
      await expect(dashboard.cardValue("card-total")).toHaveText("1");
    });

    await test.step("forecast list shows the seeded forecast", async () => {
      const list = pageFactory.forecastList();
      await list.goto("org-merch");
      await expect(list.rowByName("Mobile Plan")).toBeVisible();
    });

    await test.step("grid opens and cells stay editable", async () => {
      const grid = pageFactory.forecastGrid();
      await grid.goto(scenario.id);
      await expect(grid.heading("Mobile Plan")).toBeVisible();
      await grid.cell("units", "2026-01").scrollIntoViewIfNeeded();
      await expect(grid.cell("units", "2026-01")).toBeEditable();
    });
  });
});
