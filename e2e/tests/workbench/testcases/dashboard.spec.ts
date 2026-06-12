import { expect, test } from "../../common/fixtures/test-hook";
import { USERS } from "../../common/fixtures/auth";
import {
  asCurrency,
  buildScenario,
  expectedGmv,
  expectedNetSales,
  SCENARIO_PRESETS,
  type ScenarioInputs,
} from "../../common/fixtures/data-factory";

function gmvTotal(inputs: ScenarioInputs): number {
  return inputs.units.reduce((sum, units, i) => sum + expectedGmv(units, inputs.aur[i]), 0);
}

function netSalesTotal(inputs: ScenarioInputs): number {
  return inputs.units.reduce(
    (sum, units, i) => sum + expectedNetSales(units, inputs.aur[i], inputs.returns[i]),
    0,
  );
}

test.describe("Dashboard", { tag: "@regression" }, () => {
  test(
    "stat cards aggregate the seeded portfolio",
    { tag: "@smoke" },
    async ({ pageFactory, seedScenarios }) => {
      await seedScenarios([
        buildScenario({ name: "Healthy Plan", inputs: SCENARIO_PRESETS.healthy }),
        buildScenario({
          name: "Ramping Plan",
          status: "IN_REVIEW",
          inputs: SCENARIO_PRESETS.ramping,
        }),
      ]);

      const dashboard = pageFactory.dashboard();
      await dashboard.goto();

      await expect(dashboard.cardValue("card-total")).toHaveText("2");
      await expect(dashboard.cardValue("card-draft")).toHaveText("1");
      await expect(dashboard.cardValue("card-in-review")).toHaveText("1");
      await expect(dashboard.cardValue("card-approved")).toHaveText("0");

      const expectedGmvSum =
        gmvTotal(SCENARIO_PRESETS.healthy) + gmvTotal(SCENARIO_PRESETS.ramping);
      const expectedNetSum =
        netSalesTotal(SCENARIO_PRESETS.healthy) + netSalesTotal(SCENARIO_PRESETS.ramping);
      await expect(dashboard.cardValue("card-gmv")).toHaveText(asCurrency(expectedGmvSum));
      await expect(dashboard.cardValue("card-net-sales")).toHaveText(asCurrency(expectedNetSum));
    },
  );

  test("shows an empty state when no forecasts exist", async ({ pageFactory, seedScenarios }) => {
    await seedScenarios([]);
    const dashboard = pageFactory.dashboard();
    await dashboard.goto();

    await expect(dashboard.emptyState).toBeVisible();
    await expect(dashboard.queueEmpty).toBeVisible();
  });

  test("inputter queue lists drafts and change requests only", async ({
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios([
      buildScenario({ name: "Open Draft" }),
      buildScenario({ name: "Needs Rework", status: "CHANGES_REQUESTED" }),
      buildScenario({ name: "Done Deal", status: "APPROVED" }),
    ]);
    const dashboard = pageFactory.dashboard();
    await dashboard.goto();

    await expect(dashboard.queueHeading("My queue")).toBeVisible();
    await expect(dashboard.queueItems).toHaveCount(2);
    await expect(dashboard.queueItems.filter({ hasText: "Open Draft" })).toBeVisible();
    await expect(dashboard.queueItems.filter({ hasText: "Needs Rework" })).toBeVisible();
  });
});

test.describe("Dashboard — reviewer", { tag: "@regression" }, () => {
  test.use({ storageState: USERS.reviewer.storageState });

  test("reviewer sees a review queue with in-review forecasts", async ({
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios([
      buildScenario({ name: "Waiting on Review", status: "IN_REVIEW" }),
      buildScenario({ name: "Still Drafting" }),
    ]);
    const dashboard = pageFactory.dashboard();
    await dashboard.goto();

    await expect(dashboard.queueHeading("Review queue")).toBeVisible();
    await expect(dashboard.queueItems).toHaveCount(1);
    await expect(dashboard.queueItems.first()).toContainText("Waiting on Review");
  });
});
