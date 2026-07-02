import { expect, test } from "../test-hook";
import {
  asCurrency,
  buildScenario,
  expectedGmv,
  SCENARIO_PRESETS,
  type ScenarioInputs,
} from "../../common/fixtures/data-factory";

function gmvTotal(inputs: ScenarioInputs): number {
  return inputs.units.reduce((sum, units, i) => sum + expectedGmv(units, inputs.aur[i]), 0);
}

test.describe("Scenario comparison", { tag: "@regression" }, () => {
  test("shows full-year totals and deltas against another forecast", async ({
    pageFactory,
    seedScenarios,
  }) => {
    const planA = buildScenario({
      name: "Plan A",
      inputs: SCENARIO_PRESETS.healthy,
    });
    const planB = buildScenario({
      name: "Plan B",
      inputs: SCENARIO_PRESETS.ramping,
    });
    await seedScenarios([planA, planB]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(planA.id);
    await grid.compareButton.click();

    const modal = pageFactory.compareModal();
    await modal.compareWith("Plan B");

    const thisGmv = gmvTotal(SCENARIO_PRESETS.healthy);
    const otherGmv = gmvTotal(SCENARIO_PRESETS.ramping);
    await expect(modal.thisTotal("gmv")).toHaveText(asCurrency(thisGmv));
    await expect(modal.otherTotal("gmv")).toHaveText(asCurrency(otherGmv));
    await expect(modal.delta("gmv")).toHaveText(asCurrency(thisGmv - otherGmv));
  });

  test("requires picking a comparison target", async ({ pageFactory, seedScenarios }) => {
    const planA = buildScenario({ name: "Plan A" });
    await seedScenarios([planA, buildScenario({ name: "Plan B" })]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(planA.id);
    await grid.compareButton.click();

    const modal = pageFactory.compareModal();
    await modal.compareButton.click();
    await expect(modal.errorAlert).toHaveText("Select a forecast to compare");
  });

  test("approved forecasts can be compared read-only", async ({ pageFactory, seedScenarios }) => {
    const approved = buildScenario({ name: "Locked Plan", status: "APPROVED" });
    await seedScenarios([approved, buildScenario({ name: "Open Plan" })]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(approved.id);
    await expect(grid.approvedBanner).toBeVisible();
    await grid.compareButton.click();

    const modal = pageFactory.compareModal();
    await modal.compareWith("Open Plan");
    await expect(modal.delta("gmv")).toBeVisible();
  });
});
