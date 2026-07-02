import { expect, test } from "../test-hook";
import { NO_AUTH, USERS } from "../../common/fixtures/auth";
import { buildScenario } from "../../common/fixtures/data-factory";
import AxeBuilder from "@axe-core/playwright";

/**
 * Dependency-free accessibility smoke: keyboard operability and
 * ARIA semantics (labels, dialog names, alert roles) on key flows.
 */
test.describe("Accessibility — login", { tag: ["@accessibility", "@regression"] }, () => {
  test.use({ storageState: NO_AUTH });

  test("login form is labelled and fully keyboard operable", async ({ page, pageFactory }) => {
    const loginPage = pageFactory.login();
    await loginPage.goto();

    // Labels resolve to controls.
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    // Keyboard-only path: type, Tab, type, Enter.
    await loginPage.usernameInput.focus();
    await page.keyboard.type(USERS.inputter.username);
    await page.keyboard.press("Tab");
    await expect(loginPage.passwordInput).toBeFocused();
    await page.keyboard.type(USERS.inputter.password);
    await page.keyboard.press("Enter");

    await expect(pageFactory.dashboard().heading).toBeVisible();
  });

  test("a failed login is announced via role=alert", async ({ pageFactory }) => {
    const loginPage = pageFactory.login();
    await loginPage.goto();
    await loginPage.login("ines", "nope");
    await expect(loginPage.errorAlert).toHaveText("Invalid username or password");
  });
});

test.describe("Accessibility — app semantics", { tag: ["@accessibility", "@regression"] }, () => {
  test("create dialog exposes a name and announces validation errors", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    await seedScenarios([]);
    const list = pageFactory.forecastList();
    await list.goto("org-merch");
    await list.createForecastButton.click();

    const modal = pageFactory.createForecastModal();
    await expect(page.getByRole("dialog", { name: "Create forecast" })).toBeVisible();

    await modal.createButton.click();
    await expect(modal.errorAlert).toBeVisible();
  });

  test("the forecast table and grid expose accessible names", async ({
    page,
    pageFactory,
    seedScenarios,
  }) => {
    const scenario = buildScenario({ name: "Semantics Plan" });
    await seedScenarios([scenario]);

    const list = pageFactory.forecastList();
    await list.goto("org-merch");
    await expect(page.getByRole("table", { name: "Forecasts" })).toBeVisible();

    const grid = pageFactory.forecastGrid();
    await grid.goto(scenario.id);
    await expect(page.getByRole("table", { name: "Forecast grid" })).toBeVisible();
    await expect(page.getByLabel("Units Jan 26")).toBeVisible();
  });
});

test.describe("Accessibility — axe scan", { tag: ["@accessibility"] }, () => {
  test("dashboard has no axe violations", async ({ page, pageFactory, seedScenarios }) => {
    await seedScenarios([buildScenario({ name: "Axe Dashboard" })]);
    await pageFactory.dashboard().goto();
    await expect(pageFactory.dashboard().heading).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("forecast list has no axe violations", async ({ page, pageFactory, seedScenarios }) => {
    await seedScenarios([buildScenario({ name: "Axe List" })]);
    await pageFactory.forecastList().goto("org-merch");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("forecast grid has no axe violations", async ({ page, pageFactory, seedScenarios }) => {
    const scenario = buildScenario({ name: "Axe Grid" });
    await seedScenarios([scenario]);
    await pageFactory.forecastGrid().goto(scenario.id);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
