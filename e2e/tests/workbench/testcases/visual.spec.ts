import { expect } from "@playwright/test";
import { test } from "../test-hook";
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
