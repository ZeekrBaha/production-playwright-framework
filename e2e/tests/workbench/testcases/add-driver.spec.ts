import { expect, test } from "../test-hook";
import {
  asCurrency,
  buildScenario,
  expectedContributionMargin,
} from "../../common/fixtures/data-factory";

test.describe("Add drivers", { tag: "@regression" }, () => {
  test("search narrows the driver catalog", async ({ pageFactory, seedScenarios }) => {
    const scenario = buildScenario({ name: "Driver Search Spec" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.addDriversButton.click();

    const modal = pageFactory.addDriverModal();
    await modal.search("spend");
    await expect(modal.driverCheckbox("Marketing Spend")).toBeVisible();
    await expect(modal.driverCheckbox("Units")).toHaveCount(0);

    await modal.search("no such driver");
    await expect(modal.noResults).toBeVisible();
  });

  test(
    "added drivers appear in the grid and feed the calculation",
    { tag: "@smoke" },
    async ({ pageFactory, seedScenarios }) => {
      const scenario = buildScenario({ name: "Driver Add Spec" });
      await seedScenarios([scenario]);

      const grid = pageFactory.forecastGrid();
      await grid.goto(scenario.id);
      await expect(grid.driverRow("marketingSpend")).toHaveCount(0);

      await grid.addDriversButton.click();
      const modal = pageFactory.addDriverModal();
      await modal.selectDriver("Marketing Spend");
      await modal.selectDriver("Contribution Margin");
      await modal.apply();

      await expect(grid.driverRow("marketingSpend")).toBeVisible();
      await expect(grid.driverRow("contributionMargin")).toBeVisible();

      // default seed: units=100, aur=10, returns=50 → Net Sales 950
      await grid.setCell("marketingSpend", "2026-01", "300");
      await grid.calculate();
      await expect(grid.value("contributionMargin", "2026-01")).toHaveText(
        asCurrency(expectedContributionMargin(100, 10, 50, 300)),
      );
    },
  );

  test("removing a driver hides its row", async ({ pageFactory, seedScenarios }) => {
    const scenario = buildScenario({ name: "Driver Remove Spec" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await expect(grid.driverRow("returns")).toBeVisible();

    await grid.addDriversButton.click();
    const modal = pageFactory.addDriverModal();
    await modal.driverCheckbox("Returns").uncheck();
    await modal.apply();

    await expect(grid.driverRow("returns")).toHaveCount(0);
  });
});
