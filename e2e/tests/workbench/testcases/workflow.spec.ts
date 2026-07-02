import { expect, test } from "../test-hook";
import { USERS } from "../../common/fixtures/auth";
import { buildScenario } from "../../common/fixtures/data-factory";
import { switchUser } from "../roles";

test.describe("Approval workflow", { tag: ["@workflow", "@regression"] }, () => {
  test(
    "full lifecycle: submit → approve → read-only",
    { tag: "@smoke" },
    async ({ page, pageFactory, seedScenarios }) => {
      const scenario = buildScenario({ name: "Lifecycle Spec" });
      await seedScenarios([scenario]);
      const grid = pageFactory.forecastGrid();

      await test.step("inputter submits the draft for review", async () => {
        await grid.goto(scenario.id);
        await expect(grid.statusBadge).toHaveText("Draft");
        await grid.submitForReview();
        await expect(grid.statusBadge).toHaveText("In review");
        await expect(grid.banner).toHaveText("Forecast submitted for review");
      });

      await test.step("submitted forecast is read-only for the inputter", async () => {
        await expect(grid.cell("units", "2026-01")).toHaveCount(0);
        await expect(grid.value("units", "2026-01")).toBeVisible();
        await expect(grid.saveButton).toHaveCount(0);
        await expect(grid.submitButton).toHaveCount(0);
      });

      await test.step("reviewer approves the forecast", async () => {
        await switchUser(page, pageFactory, USERS.reviewer);
        await grid.goto(scenario.id);
        await expect(grid.approveButton).toBeVisible();
        await grid.approve();
        await expect(grid.statusBadge).toHaveText("Approved");
        await expect(grid.approvedBanner).toBeVisible();
      });

      await test.step("approved forecast stays locked for the inputter", async () => {
        await switchUser(page, pageFactory, USERS.inputter);
        await grid.goto(scenario.id);
        await expect(grid.statusBadge).toHaveText("Approved");
        await expect(grid.cell("units", "2026-01")).toHaveCount(0);
        await expect(grid.submitButton).toHaveCount(0);
      });
    },
  );

  test("request changes returns the forecast to the inputter with the comment", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({
      name: "Change Request Spec",
      status: "IN_REVIEW",
    });
    await seedScenarios([scenario]);
    const grid = pageFactory.forecastGrid();

    await test.step("reviewer requests changes with a comment", async () => {
      await pageFactory.dashboard().goto();
      await switchUser(page, pageFactory, USERS.reviewer);
      await grid.goto(scenario.id);
      await grid.requestChanges("Returns look too high in Q1");
      await expect(grid.statusBadge).toHaveText("Changes requested");
    });

    await test.step("inputter sees the comment and can edit again", async () => {
      await switchUser(page, pageFactory, USERS.inputter);
      await grid.goto(scenario.id);
      await expect(grid.reviewCommentBanner).toContainText("Returns look too high in Q1");
      await expect(grid.cell("units", "2026-01")).toBeVisible();
    });

    await test.step("resubmitting clears the comment", async () => {
      await grid.submitForReview();
      await expect(grid.statusBadge).toHaveText("In review");
      await expect(grid.reviewCommentBanner).toHaveCount(0);
    });
  });
});

test.describe("Approval workflow — reviewer guards", { tag: ["@workflow", "@regression"] }, () => {
  test.use({ storageState: USERS.reviewer.storageState });

  test("request changes requires a comment", async ({ pageFactory, seedScenarios }) => {
    const scenario = buildScenario({
      name: "Comment Guard Spec",
      status: "IN_REVIEW",
    });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.requestChangesButton.click();

    await expect(grid.banner).toHaveText("A comment is required when requesting changes");
    await expect(grid.statusBadge).toHaveText("In review");
  });

  test("reviewer sees the grid read-only with no edit actions", async ({
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({
      name: "Reviewer Readonly Spec",
      status: "IN_REVIEW",
    });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await expect(grid.value("units", "2026-01")).toBeVisible();
    await expect(grid.cell("units", "2026-01")).toHaveCount(0);
    await expect(grid.calculateButton).toHaveCount(0);
    await expect(grid.addDriversButton).toHaveCount(0);
  });
});
