import { expect, test } from "../../common/fixtures/test-hook";
import { buildScenario } from "../../common/fixtures/data-factory";

test.describe("Grid input validation", { tag: ["@validation", "@regression"] }, () => {
  test("rejects negative units with an inline cell error", async ({
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Validation Spec" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.setCell("units", "2026-01", "-5");
    await grid.calculate();

    await expect(grid.cellError("units", "2026-01")).toHaveText("Units cannot be negative");
    await expect(grid.cell("units", "2026-01")).toHaveAttribute("aria-invalid", "true");
    await expect(grid.banner).toContainText("Fix the highlighted cells");
  });

  test("rejects fractional units — must be a whole number", async ({
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Validation Spec" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.setCell("units", "2026-03", "10.5");
    await grid.calculate();

    await expect(grid.cellError("units", "2026-03")).toHaveText("Units must be a whole number");
  });

  test("rejects zero AUR", async ({ pageFactory, seedScenarios }) => {
    const scenario = buildScenario({ name: "Validation Spec" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.setCell("aur", "2026-01", "0");
    await grid.calculate();

    await expect(grid.cellError("aur", "2026-01")).toHaveText("AUR must be greater than 0");
  });

  test("rejects non-numeric input", async ({ pageFactory, seedScenarios }) => {
    const scenario = buildScenario({ name: "Validation Spec" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.setCell("returns", "2026-04", "lots");
    await grid.calculate();

    await expect(grid.cellError("returns", "2026-04")).toHaveText("Returns must be a number");
  });

  test(
    "blocks saving when Net Sales would go negative",
    { tag: "@smoke" },
    async ({ pageFactory, seedScenarios }) => {
      const scenario = buildScenario({ name: "Negative Net Sales Spec" });
      await seedScenarios([scenario]);

      const grid = pageFactory.forecastGrid();
      await grid.goto(scenario.id);
      // units=100 × aur=10 → GMV 1000; returns 5000 → Net Sales −4000
      await grid.setCell("returns", "2026-01", "5000");
      await grid.save();

      await expect(grid.banner).toContainText("Net Sales is negative in Jan 26");
      await expect(grid.statusBadge).toHaveText("Draft");
    },
  );
});
