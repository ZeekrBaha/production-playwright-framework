import { expect, test } from "../../common/fixtures/test-hook";
import { buildScenario } from "../../common/fixtures/data-factory";

const ORG = { id: "org-merch", name: "Merchandising" };

function seedSet() {
  return [
    buildScenario({
      name: "Alpha Plan",
      status: "DRAFT",
      updatedAt: "2026-06-03T00:00:00.000Z",
    }),
    buildScenario({
      name: "beta budget",
      status: "APPROVED",
      updatedAt: "2026-06-01T00:00:00.000Z",
    }),
    buildScenario({
      name: "Gamma Push",
      status: "IN_REVIEW",
      updatedAt: "2026-06-02T00:00:00.000Z",
    }),
  ];
}

test.describe("Forecast list filters", { tag: "@regression" }, () => {
  test("search matches names case-insensitively", async ({
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios(seedSet());
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);

    await list.searchInput.fill("BETA");
    await expect(list.rows).toHaveCount(1);
    await expect(list.rowByName("beta budget")).toBeVisible();
  });

  test("status filter narrows the list", async ({
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios(seedSet());
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);

    await list.statusFilter.selectOption("IN_REVIEW");
    await expect(list.rows).toHaveCount(1);
    await expect(list.rowByName("Gamma Push")).toBeVisible();
  });

  test("sorting by most recently updated reorders rows", async ({
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios(seedSet());
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);

    await expect(list.rows.getByRole("link")).toHaveText([
      "Alpha Plan",
      "beta budget",
      "Gamma Push",
    ]);

    await list.sortSelect.selectOption("updated");
    await expect(list.rows.getByRole("link")).toHaveText([
      "Alpha Plan",
      "Gamma Push",
      "beta budget",
    ]);
  });

  test("shows an empty state when no forecast matches the filters", async ({
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios(seedSet());
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);

    await list.searchInput.fill("delta");
    await expect(list.noResults).toBeVisible();
    await expect(list.rows).toHaveCount(0);
  });
});
