import { expect, test } from "../test-hook";
import {
  asCurrency,
  buildScenario,
  expectedGmv,
  expectedNetSales,
  MONTHS,
} from "../../common/fixtures/data-factory";

const INPUTS = {
  units: [100, 200, 300, 400, 500, 600],
  aur: [10, 10, 10, 10, 10, 10],
  returns: [50, 50, 50, 50, 50, 50],
};

test.describe("Forecast grid calculation", { tag: "@regression" }, () => {
  test(
    "calculates GMV and Net Sales from edited inputs",
    { tag: "@smoke" },
    async ({ pageFactory, seedScenarios }) => {
      const scenario = buildScenario({ name: "Calc Spec", inputs: INPUTS });
      await seedScenarios([scenario]);

      const grid = pageFactory.forecastGrid();
      await grid.goto(scenario.id);
      await expect(grid.heading("Calc Spec")).toBeVisible();

      await grid.setCell("units", "2026-01", "150");
      await grid.setCell("aur", "2026-01", "12.5");
      await expect(grid.unsavedIndicator).toBeVisible();
      await grid.calculate();

      const gmv = expectedGmv(150, 12.5);
      const netSales = expectedNetSales(150, 12.5, 50);
      await expect(grid.value("gmv", "2026-01")).toHaveText(asCurrency(gmv));
      await expect(grid.value("netSales", "2026-01")).toHaveText(asCurrency(netSales));
    },
  );

  test("row totals roll up across all months", async ({ pageFactory, seedScenarios }) => {
    const scenario = buildScenario({ name: "Totals Spec", inputs: INPUTS });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);

    const expectedUnitsTotal = INPUTS.units.reduce((a, b) => a + b, 0);
    const expectedGmvTotal = MONTHS.reduce(
      (sum, _m, i) => sum + expectedGmv(INPUTS.units[i], INPUTS.aur[i]),
      0,
    );
    await expect(grid.total("units")).toHaveText(expectedUnitsTotal.toLocaleString("en-US"));
    await expect(grid.total("gmv")).toHaveText(asCurrency(expectedGmvTotal));
  });

  test(
    "saved values persist across a page reload",
    { tag: "@smoke" },
    async ({ page, pageFactory, seedScenarios }) => {
      const scenario = buildScenario({ name: "Persist Spec", inputs: INPUTS });
      await seedScenarios([scenario]);

      const grid = pageFactory.forecastGrid();
      await grid.goto(scenario.id);
      await grid.setCell("units", "2026-02", "999");
      await grid.calculate();
      await grid.save();
      await expect(grid.banner).toHaveText("Forecast saved");

      await page.reload();
      await expect(grid.cell("units", "2026-02")).toHaveValue("999");
      await expect(grid.value("gmv", "2026-02")).toHaveText(
        asCurrency(expectedGmv(999, INPUTS.aur[1])),
      );
    },
  );
});
