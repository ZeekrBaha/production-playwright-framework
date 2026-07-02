import { expect, test } from "../test-hook";
import { USERS } from "../../common/fixtures/auth";
import { buildScenario } from "../../common/fixtures/data-factory";

const ORG = { id: "org-merch", name: "Merchandising" };

test.describe("Create forecast", { tag: "@regression" }, () => {
  test(
    "creates a draft forecast and shows it in the list",
    { tag: "@smoke" },
    async ({ pageFactory, seedScenarios }) => {
      await seedScenarios([]);
      const list = pageFactory.forecastList();
      await list.goto(ORG.id);
      await expect(list.emptyState).toBeVisible();

      await list.createForecastButton.click();
      await pageFactory.createForecastModal().create("FY26 Stretch Plan", "Budget");

      const grid = pageFactory.forecastGrid();
      await expect(grid.heading("FY26 Stretch Plan")).toBeVisible();
      await expect(grid.statusBadge).toHaveText("Draft");

      await list.goto(ORG.id);
      await expect(list.rowByName("FY26 Stretch Plan")).toBeVisible();
      await expect(list.statusBadgeFor("FY26 Stretch Plan")).toHaveText("Draft");
    },
  );

  test("rejects an empty forecast name", async ({ pageFactory, seedScenarios }) => {
    await seedScenarios([]);
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);
    await list.createForecastButton.click();

    const modal = pageFactory.createForecastModal();
    await modal.createButton.click();
    await expect(modal.errorAlert).toHaveText("Forecast name is required");
    await expect(modal.dialog).toBeVisible();
  });

  test("rejects a duplicate forecast name (case-insensitive)", async ({
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios([buildScenario({ name: "FY26 Baseline" })]);
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);
    await list.createForecastButton.click();

    const modal = pageFactory.createForecastModal();
    await modal.create("fy26 baseline");
    await expect(modal.errorAlert).toHaveText("A forecast with this name already exists");
  });

  test("deletes a draft forecast after confirmation", async ({ pageFactory, seedScenarios }) => {
    await seedScenarios([buildScenario({ name: "Disposable Draft" })]);
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);
    await expect(list.rowByName("Disposable Draft")).toBeVisible();

    await list.deleteForecast("Disposable Draft");
    await expect(list.rowByName("Disposable Draft")).toHaveCount(0);
  });

  test("approved forecasts cannot be deleted", async ({ pageFactory, seedScenarios }) => {
    await seedScenarios([buildScenario({ name: "Locked Plan", status: "APPROVED" })]);
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);
    await expect(list.rowByName("Locked Plan")).toBeVisible();
    await expect(list.rowByName("Locked Plan").getByRole("button", { name: "Delete" })).toHaveCount(
      0,
    );
  });
});

test.describe("Create forecast — reviewer permissions", { tag: "@regression" }, () => {
  test.use({ storageState: USERS.reviewer.storageState });

  test("reviewers cannot create forecasts", async ({ pageFactory, seedScenarios }) => {
    await seedScenarios([buildScenario({ name: "Someone's Draft" })]);
    const list = pageFactory.forecastList();
    await list.goto(ORG.id);

    await expect(list.heading(ORG.name)).toBeVisible();
    await expect(list.createForecastButton).toHaveCount(0);
  });
});
