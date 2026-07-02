import { expect, test } from "../test-hook";
import { USERS } from "../../common/fixtures/auth";
import { buildScenario } from "../../common/fixtures/data-factory";

test.describe("Activity trail", { tag: ["@workflow", "@regression"] }, () => {
  test("submitting records save and submit events", async ({ pageFactory, seedScenarios }) => {
    const scenario = buildScenario({ name: "Audited Plan" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.submitForReview();
    await expect(grid.statusBadge).toHaveText("In review");

    await expect(grid.activityItems.first()).toContainText("ines submitted for review");
    await expect(grid.activityItems.filter({ hasText: "saved changes" })).toHaveCount(1);
  });
});

test.describe("Activity trail — reviewer events", { tag: ["@workflow", "@regression"] }, () => {
  test.use({ storageState: USERS.reviewer.storageState });

  test("approval records a reviewer event", async ({ pageFactory, seedScenarios }) => {
    const scenario = buildScenario({ name: "Approval Audit", status: "IN_REVIEW" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.approve();

    await expect(grid.activityItems.first()).toContainText("ravi approved the forecast");
  });

  test("requesting changes stores the comment on the event", async ({
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Comment Audit", status: "IN_REVIEW" });
    await seedScenarios([scenario]);

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await grid.requestChanges("Trim the returns assumption");

    await expect(grid.activityItems.first()).toContainText("requested changes");
    await expect(grid.activityItems.first()).toContainText("Trim the returns assumption");
  });
});
