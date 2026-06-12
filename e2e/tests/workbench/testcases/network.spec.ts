import { expect, test } from "../../common/fixtures/test-hook";
import { USERS } from "../../common/fixtures/auth";
import { API_ROUTES, captureApi, delayApi, failApi } from "../../common/api/mock-api";
import { asCurrency, buildScenario, expectedGmv } from "../../common/fixtures/data-factory";

test.describe("Network behavior", { tag: ["@network", "@regression"] }, () => {
  test("a failed save shows an error and keeps the user's edits", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Save Failure Plan" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.setCell("units", "2026-01", "999");

    await failApi(page, API_ROUTES.forecastById, 500, "boom");
    await grid.save();

    await expect(grid.banner).toContainText("Save failed — your edits are kept");
    await expect(grid.cell("units", "2026-01")).toHaveValue("999");
    await expect(grid.unsavedIndicator).toBeVisible();
  });

  test("a slow calculation shows a busy state before completing", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Slow Calc Plan" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.setCell("units", "2026-01", "200");

    await delayApi(page, API_ROUTES.action("calculate"), 700);
    await grid.calculateButton.click();

    const busyButton = page.getByRole("button", { name: "Calculating…" });
    await expect(busyButton).toBeVisible();
    await expect(busyButton).toBeDisabled();

    await expect(grid.value("gmv", "2026-01")).toHaveText(asCurrency(expectedGmv(200, 10)));
  });

  test("a failed calculation is reported and leaves values unchanged", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Calc Failure Plan" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.setCell("units", "2026-01", "200");

    await failApi(page, API_ROUTES.action("calculate"), 500, "engine down");
    await grid.calculate();

    await expect(grid.banner).toContainText("Calculation failed — please try again");
    await expect(grid.value("gmv", "2026-01")).toHaveText(asCurrency(expectedGmv(100, 10)));
  });

  test("a server-side name conflict surfaces in the create dialog", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios([]);
    const list = pageFactory.forecastList();
    await list.goto("org-merch");
    await list.createForecastButton.click();

    await failApi(
      page,
      API_ROUTES.forecasts,
      409,
      "A forecast with this name already exists on the server",
    );
    const modal = pageFactory.createForecastModal();
    await modal.create("Conflicting Plan");

    await expect(modal.errorAlert).toHaveText(
      "A forecast with this name already exists on the server",
    );
    await expect(modal.dialog).toBeVisible();
  });

  test("submit sends the expected request payload", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Payload Plan" });
    await seedScenarios([scenario]);

    const requests = await captureApi(page, API_ROUTES.action("submit"));
    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.submitForReview();
    await expect(grid.statusBadge).toHaveText("In review");

    expect(requests).toHaveLength(1);
    expect(requests[0].method()).toBe("POST");
    expect(requests[0].url()).toContain(`/api/forecasts/${scenario.id}/submit`);
    expect(requests[0].postDataJSON()).toEqual({
      scenarioId: scenario.id,
      targetStatus: "IN_REVIEW",
    });
  });
});

test.describe("Network behavior — reviewer", { tag: ["@network", "@regression"] }, () => {
  test.use({ storageState: USERS.reviewer.storageState });

  test("approve sends the expected request payload", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Approve Payload", status: "IN_REVIEW" });
    await seedScenarios([scenario]);

    const requests = await captureApi(page, API_ROUTES.action("approve"));
    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.approve();
    await expect(grid.statusBadge).toHaveText("Approved");

    expect(requests).toHaveLength(1);
    expect(requests[0].postDataJSON()).toEqual({
      scenarioId: scenario.id,
      targetStatus: "APPROVED",
    });
  });
});
