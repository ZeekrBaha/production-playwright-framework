import { expect, test } from "../test-hook";
import {
  asCurrency,
  buildScenario,
  expectedGmv,
  SCENARIO_PRESETS,
} from "../../common/fixtures/data-factory";

const ORG = { id: "org-merch", name: "Merchandising" };

test.describe("Copy forecast", { tag: ["@workflow", "@regression"] }, () => {
  test("copies an approved forecast into a new editable draft with identical values", async ({
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios([
      buildScenario({
        name: "Source Plan",
        status: "APPROVED",
        inputs: SCENARIO_PRESETS.ramping,
      }),
    ]);
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);
    await list.copyForecast("Source Plan");

    const modal = pageFactory.copyForecastModal();
    await expect(modal.nameInput).toHaveValue("Source Plan (copy)");
    await modal.copyButton.click();

    const grid = pageFactory.forecastGrid();
    await expect(grid.heading("Source Plan (copy)")).toBeVisible();
    await expect(grid.statusBadge).toHaveText("Draft");

    const expectedGmvTotal = SCENARIO_PRESETS.ramping.units.reduce(
      (sum, units, i) => sum + expectedGmv(units, SCENARIO_PRESETS.ramping.aur[i]),
      0,
    );
    await expect(grid.total("gmv")).toHaveText(asCurrency(expectedGmvTotal));
    await expect(grid.cell("units", "2026-01")).toBeVisible();
    await expect(grid.activityItems.first()).toContainText("created this copy");
  });

  test("rejects a duplicate copy name", async ({ pageFactory, seedScenarios }) => {
    await seedScenarios([
      buildScenario({ name: "Source Plan" }),
      buildScenario({ name: "Existing Name" }),
    ]);
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);
    await list.copyForecast("Source Plan");

    const modal = pageFactory.copyForecastModal();
    await modal.copyAs("Existing Name");
    await expect(modal.errorAlert).toHaveText("A forecast with this name already exists");
    await expect(modal.dialog).toBeVisible();
  });

  test("the copy clears the source's review comment", async ({ pageFactory, seedScenarios }) => {
    await seedScenarios([
      buildScenario({
        name: "Rework Plan",
        status: "CHANGES_REQUESTED",
        reviewComment: "Returns are too high",
      }),
    ]);
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);
    await list.copyForecast("Rework Plan");
    await pageFactory.copyForecastModal().copyButton.click();

    const grid = pageFactory.forecastGrid();
    await expect(grid.heading("Rework Plan (copy)")).toBeVisible();
    await expect(grid.statusBadge).toHaveText("Draft");
    await expect(grid.reviewCommentBanner).toHaveCount(0);
  });
});
